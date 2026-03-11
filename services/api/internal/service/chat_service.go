package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type ChatService struct {
	db *gorm.DB
}

type ConversationItem struct {
	ID            uint64     `json:"id"`
	ProductID     uint64     `json:"productId"`
	ProductTitle  string     `json:"productTitle"`
	BuyerID       uint64     `json:"buyerId"`
	SellerID      uint64     `json:"sellerId"`
	PeerID        uint64     `json:"peerId"`
	PeerNickname  string     `json:"peerNickname"`
	LastMessage   *string    `json:"lastMessage,omitempty"`
	LastMessageAt *time.Time `json:"lastMessageAt,omitempty"`
	UnreadCount   int64      `json:"unreadCount"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

type MessageItem struct {
	ID             uint64    `json:"id"`
	ConversationID uint64    `json:"conversationId"`
	SenderID       uint64    `json:"senderId"`
	SenderNickname string    `json:"senderNickname"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"createdAt"`
}

type SendMessageInput struct {
	Content string `json:"content"`
}

func NewChatService(db *gorm.DB) *ChatService {
	return &ChatService{db: db}
}

func (s *ChatService) StartConversationByProduct(productID, userID uint64) (*ConversationItem, error) {
	var product model.Product
	if err := s.db.First(&product, productID).Error; err != nil {
		return nil, err
	}
	if product.SellerID == userID {
		return nil, errors.New("cannot chat with yourself")
	}

	var conversation model.Conversation
	err := s.db.Where("product_id = ? AND buyer_id = ? AND seller_id = ?", product.ID, userID, product.SellerID).First(&conversation).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		conversation = model.Conversation{
			ProductID: product.ID,
			BuyerID:   userID,
			SellerID:  product.SellerID,
		}
		if err := s.db.Create(&conversation).Error; err != nil {
			return nil, err
		}
	}

	return s.GetConversation(conversation.ID, userID)
}

func (s *ChatService) ListConversations(userID uint64) ([]ConversationItem, error) {
	var conversations []model.Conversation
	if err := s.db.Where("buyer_id = ? OR seller_id = ?", userID, userID).Order("COALESCE(last_message_at, updated_at) desc").Find(&conversations).Error; err != nil {
		return nil, err
	}
	if len(conversations) == 0 {
		return []ConversationItem{}, nil
	}

	productIDs := make([]uint64, 0, len(conversations))
	userIDs := make([]uint64, 0, len(conversations))
	for _, item := range conversations {
		productIDs = append(productIDs, item.ProductID)
		if item.BuyerID == userID {
			userIDs = append(userIDs, item.SellerID)
		} else {
			userIDs = append(userIDs, item.BuyerID)
		}
	}

	var products []model.Product
	if err := s.db.Where("id IN ?", productIDs).Find(&products).Error; err != nil {
		return nil, err
	}
	productMap := map[uint64]model.Product{}
	for _, product := range products {
		productMap[product.ID] = product
	}

	var users []model.User
	if err := s.db.Where("id IN ?", userIDs).Find(&users).Error; err != nil {
		return nil, err
	}
	userMap := map[uint64]model.User{}
	for _, user := range users {
		userMap[user.ID] = user
	}

	items := make([]ConversationItem, 0, len(conversations))
	for _, item := range conversations {
		peerID := item.BuyerID
		if item.BuyerID == userID {
			peerID = item.SellerID
		}
		unreadCount, err := s.countUnreadMessages(item, userID)
		if err != nil {
			return nil, err
		}
		items = append(items, ConversationItem{
			ID:            item.ID,
			ProductID:     item.ProductID,
			ProductTitle:  productMap[item.ProductID].Title,
			BuyerID:       item.BuyerID,
			SellerID:      item.SellerID,
			PeerID:        peerID,
			PeerNickname:  userMap[peerID].Nickname,
			LastMessage:   item.LastMessage,
			LastMessageAt: item.LastMessageAt,
			UnreadCount:   unreadCount,
			UpdatedAt:     item.UpdatedAt,
		})
	}
	return items, nil
}

func (s *ChatService) GetConversation(conversationID, userID uint64) (*ConversationItem, error) {
	var item model.Conversation
	if err := s.db.First(&item, conversationID).Error; err != nil {
		return nil, err
	}
	if item.BuyerID != userID && item.SellerID != userID {
		return nil, errors.New("no permission to view conversation")
	}
	var product model.Product
	if err := s.db.First(&product, item.ProductID).Error; err != nil {
		return nil, err
	}
	peerID := item.BuyerID
	if item.BuyerID == userID {
		peerID = item.SellerID
	}
	var peer model.User
	if err := s.db.First(&peer, peerID).Error; err != nil {
		return nil, err
	}
	unreadCount, err := s.countUnreadMessages(item, userID)
	if err != nil {
		return nil, err
	}
	return &ConversationItem{
		ID:            item.ID,
		ProductID:     item.ProductID,
		ProductTitle:  product.Title,
		BuyerID:       item.BuyerID,
		SellerID:      item.SellerID,
		PeerID:        peerID,
		PeerNickname:  peer.Nickname,
		LastMessage:   item.LastMessage,
		LastMessageAt: item.LastMessageAt,
		UnreadCount:   unreadCount,
		UpdatedAt:     item.UpdatedAt,
	}, nil
}

func (s *ChatService) ListMessages(conversationID, userID uint64) ([]MessageItem, error) {
	conversation, err := s.ensureParticipant(conversationID, userID)
	if err != nil {
		return nil, err
	}

	var messages []model.Message
	if err := s.db.Where("conversation_id = ?", conversationID).Order("created_at asc").Find(&messages).Error; err != nil {
		return nil, err
	}

	if err := s.markConversationRead(conversation, userID, latestMessageTime(messages)); err != nil {
		return nil, err
	}
	if len(messages) == 0 {
		return []MessageItem{}, nil
	}

	userIDs := make([]uint64, 0, len(messages))
	for _, message := range messages {
		userIDs = append(userIDs, message.SenderID)
	}
	var users []model.User
	if err := s.db.Where("id IN ?", userIDs).Find(&users).Error; err != nil {
		return nil, err
	}
	userMap := map[uint64]model.User{}
	for _, user := range users {
		userMap[user.ID] = user
	}

	items := make([]MessageItem, 0, len(messages))
	for _, message := range messages {
		items = append(items, MessageItem{
			ID:             message.ID,
			ConversationID: message.ConversationID,
			SenderID:       message.SenderID,
			SenderNickname: userMap[message.SenderID].Nickname,
			Content:        message.Content,
			CreatedAt:      message.CreatedAt,
		})
	}
	return items, nil
}

func (s *ChatService) SendMessage(conversationID, userID uint64, input SendMessageInput) (*MessageItem, error) {
	if strings.TrimSpace(input.Content) == "" {
		return nil, errors.New("message content is required")
	}
	conversation, err := s.ensureParticipant(conversationID, userID)
	if err != nil {
		return nil, err
	}

	content := strings.TrimSpace(input.Content)
	now := time.Now()
	message := &model.Message{
		ConversationID: conversation.ID,
		SenderID:       userID,
		Content:        content,
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(message).Error; err != nil {
			return err
		}
		updates := map[string]any{
			"last_message":    content,
			"last_message_at": now,
			"updated_at":      now,
		}
		if conversation.BuyerID == userID {
			updates["buyer_last_read_at"] = now
		} else {
			updates["seller_last_read_at"] = now
		}
		if err := tx.Model(&model.Conversation{}).Where("id = ?", conversation.ID).Updates(updates).Error; err != nil {
			return err
		}
		var product model.Product
		if err := tx.First(&product, conversation.ProductID).Error; err != nil {
			return err
		}
		var sender model.User
		if err := tx.First(&sender, userID).Error; err != nil {
			return err
		}
		receiverID := conversation.BuyerID
		if conversation.BuyerID == userID {
			receiverID = conversation.SellerID
		}
		link := "/me/messages"
		return createNotification(tx, receiverID, "message", sender.Nickname+" 发来一条新消息", "商品《"+product.Title+"》收到新消息："+content, &link)
	}); err != nil {
		return nil, err
	}

	var sender model.User
	if err := s.db.First(&sender, userID).Error; err != nil {
		return nil, err
	}
	return &MessageItem{
		ID:             message.ID,
		ConversationID: message.ConversationID,
		SenderID:       message.SenderID,
		SenderNickname: sender.Nickname,
		Content:        message.Content,
		CreatedAt:      message.CreatedAt,
	}, nil
}

func (s *ChatService) ensureParticipant(conversationID, userID uint64) (*model.Conversation, error) {
	var conversation model.Conversation
	if err := s.db.First(&conversation, conversationID).Error; err != nil {
		return nil, err
	}
	if conversation.BuyerID != userID && conversation.SellerID != userID {
		return nil, errors.New("no permission to access conversation")
	}
	return &conversation, nil
}

func (s *ChatService) countUnreadMessages(conversation model.Conversation, userID uint64) (int64, error) {
	query := s.db.Model(&model.Message{}).
		Where("conversation_id = ?", conversation.ID).
		Where("sender_id <> ?", userID)

	lastReadAt := conversation.SellerLastReadAt
	if conversation.BuyerID == userID {
		lastReadAt = conversation.BuyerLastReadAt
	}
	if lastReadAt != nil {
		query = query.Where("created_at > ?", *lastReadAt)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (s *ChatService) markConversationRead(conversation *model.Conversation, userID uint64, readAt *time.Time) error {
	if readAt == nil {
		return nil
	}

	field := "seller_last_read_at"
	if conversation.BuyerID == userID {
		field = "buyer_last_read_at"
	}
	if err := s.db.Model(&model.Conversation{}).Where("id = ?", conversation.ID).Update(field, *readAt).Error; err != nil {
		return err
	}
	if field == "buyer_last_read_at" {
		conversation.BuyerLastReadAt = readAt
	} else {
		conversation.SellerLastReadAt = readAt
	}
	return nil
}

func latestMessageTime(messages []model.Message) *time.Time {
	if len(messages) == 0 {
		return nil
	}
	last := messages[len(messages)-1].CreatedAt
	return &last
}
