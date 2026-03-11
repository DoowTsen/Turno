package service

import (
	"errors"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type AfterSaleService struct {
	db *gorm.DB
}

type CreateAfterSaleInput struct {
	Type            string `json:"type"`
	Reason          string `json:"reason"`
	Detail          string `json:"detail"`
	RequestedAmount int64  `json:"requestedAmount"`
}

type RespondAfterSaleInput struct {
	Status             string `json:"status"`
	SellerResponseNote string `json:"sellerResponseNote"`
}

type AfterSaleItem struct {
	ID                 uint64     `json:"id"`
	OrderID            uint64     `json:"orderId"`
	OrderNo            string     `json:"orderNo"`
	ProductID          uint64     `json:"productId"`
	ProductTitle       string     `json:"productTitle"`
	BuyerID            uint64     `json:"buyerId"`
	BuyerNickname      string     `json:"buyerNickname"`
	SellerID           uint64     `json:"sellerId"`
	SellerNickname     string     `json:"sellerNickname"`
	Type               string     `json:"type"`
	Status             string     `json:"status"`
	Reason             string     `json:"reason"`
	Detail             *string    `json:"detail,omitempty"`
	RequestedAmount    int64      `json:"requestedAmount"`
	Currency           string     `json:"currency"`
	SellerResponseNote *string    `json:"sellerResponseNote,omitempty"`
	SellerRespondedAt  *time.Time `json:"sellerRespondedAt,omitempty"`
	ResolutionNote     *string    `json:"resolutionNote,omitempty"`
	Logs               []AfterSaleLogItem `json:"logs,omitempty"`
	ViewerRole         string     `json:"viewerRole"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type AfterSaleLogItem struct {
	ID          uint64    `json:"id"`
	AfterSaleID uint64    `json:"afterSaleId"`
	ActorID     *uint64   `json:"actorId,omitempty"`
	ActorRole   string    `json:"actorRole"`
	ActorLabel  string    `json:"actorLabel"`
	Action      string    `json:"action"`
	Status      *string   `json:"status,omitempty"`
	Note        string    `json:"note"`
	CreatedAt   time.Time `json:"createdAt"`
}

func NewAfterSaleService(db *gorm.DB) *AfterSaleService {
	return &AfterSaleService{db: db}
}

func createAfterSaleLog(tx *gorm.DB, afterSaleID uint64, actorID *uint64, actorRole, action string, status *string, note string) error {
	trimmedNote := strings.TrimSpace(note)
	if afterSaleID == 0 || strings.TrimSpace(actorRole) == "" || strings.TrimSpace(action) == "" || trimmedNote == "" {
		return errors.New("after-sale log payload is incomplete")
	}
	item := &model.AfterSaleLog{AfterSaleID: afterSaleID, ActorID: actorID, ActorRole: strings.TrimSpace(actorRole), Action: strings.TrimSpace(action), Status: status, Note: trimmedNote}
	return tx.Create(item).Error
}

func actorLabelByRole(role string) string {
	switch role {
	case "buyer":
		return "买家"
	case "seller":
		return "卖家"
	case "admin":
		return "平台"
	case "system":
		return "系统"
	default:
		return role
	}
}

func (s *AfterSaleService) ListLogs(afterSaleID, userID uint64) ([]AfterSaleLogItem, error) {
	var afterSale model.AfterSale
	if err := s.db.First(&afterSale, afterSaleID).Error; err != nil {
		return nil, err
	}
	if afterSale.BuyerID != userID && afterSale.SellerID != userID {
		return nil, errors.New("no permission to view after-sale logs")
	}
	var rows []struct {
		ID          uint64
		AfterSaleID uint64
		ActorID     *uint64
		ActorRole   string
		Action      string
		Status      *string
		Note        string
		CreatedAt   time.Time
		Nickname    *string
	}
	err := s.db.Table("after_sale_logs").
		Joins("LEFT JOIN users ON users.id = after_sale_logs.actor_id").
		Select("after_sale_logs.id, after_sale_logs.after_sale_id, after_sale_logs.actor_id, after_sale_logs.actor_role, after_sale_logs.action, after_sale_logs.status, after_sale_logs.note, after_sale_logs.created_at, users.nickname").
		Where("after_sale_logs.after_sale_id = ?", afterSaleID).
		Order("after_sale_logs.created_at asc, after_sale_logs.id asc").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	items := make([]AfterSaleLogItem, 0, len(rows))
	for _, row := range rows {
		label := actorLabelByRole(row.ActorRole)
		if row.Nickname != nil && strings.TrimSpace(*row.Nickname) != "" {
			label = *row.Nickname
		}
		items = append(items, AfterSaleLogItem{ID: row.ID, AfterSaleID: row.AfterSaleID, ActorID: row.ActorID, ActorRole: row.ActorRole, ActorLabel: label, Action: row.Action, Status: row.Status, Note: row.Note, CreatedAt: row.CreatedAt})
	}
	return items, nil
}

func (s *AfterSaleService) Create(orderID, buyerID uint64, input CreateAfterSaleInput) (*AfterSaleItem, error) {
	var order model.Order
	if err := s.db.First(&order, orderID).Error; err != nil {
		return nil, err
	}
	if order.BuyerID != buyerID {
		return nil, errors.New("only buyer can initiate after-sale request")
	}
	if order.Status != "shipped" && order.Status != "completed" {
		return nil, errors.New("current order does not support after-sale")
	}

	var exists int64
	if err := s.db.Model(&model.AfterSale{}).Where("order_id = ? AND buyer_id = ?", orderID, buyerID).Count(&exists).Error; err != nil {
		return nil, err
	}
	if exists > 0 {
		return nil, errors.New("after-sale request already exists")
	}

	afterSaleType := strings.TrimSpace(input.Type)
	if afterSaleType == "" {
		afterSaleType = "refund"
	}
	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return nil, errors.New("reason is required")
	}
	detail := strings.TrimSpace(input.Detail)
	var detailPtr *string
	if detail != "" {
		detailPtr = &detail
	}
	requestedAmount := input.RequestedAmount
	if requestedAmount <= 0 || requestedAmount > order.TotalAmount {
		requestedAmount = order.TotalAmount
	}

	afterSale := &model.AfterSale{
		OrderID:         order.ID,
		BuyerID:         order.BuyerID,
		SellerID:        order.SellerID,
		ProductID:       order.ProductID,
		Type:            afterSaleType,
		Status:          "open",
		Reason:          reason,
		Detail:          detailPtr,
		RequestedAmount: requestedAmount,
		Currency:        order.Currency,
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(afterSale).Error; err != nil {
			return err
		}
		status := afterSale.Status
		buyerID := afterSale.BuyerID
		logNote := detail
		if logNote == "" {
			logNote = reason
		}
		if err := createAfterSaleLog(tx, afterSale.ID, &buyerID, "buyer", "created", &status, logNote); err != nil {
			return err
		}
		link := "/me/after-sales"
		return createNotification(tx, order.SellerID, "after_sale", "买家发起了售后申请", "订单号 " + order.OrderNo + " 新增一笔" + afterSaleType + "申请，请尽快响应。", &link)
	}); err != nil {
		return nil, err
	}
	return s.GetByOrder(orderID, buyerID)
}

func (s *AfterSaleService) GetByOrder(orderID, userID uint64) (*AfterSaleItem, error) {
	var order model.Order
	if err := s.db.First(&order, orderID).Error; err != nil {
		return nil, err
	}
	if order.BuyerID != userID && order.SellerID != userID {
		return nil, errors.New("no permission to view after-sale request")
	}
	var item AfterSaleItem
	err := s.baseQuery(userID).
		Where("after_sales.order_id = ?", orderID).
		Order("after_sales.created_at desc").
		Take(&item).Error
	if err != nil {
		return nil, err
	}
	logs, err := s.ListLogs(item.ID, userID)
	if err == nil {
		item.Logs = logs
	}
	return &item, nil
}

func (s *AfterSaleService) ListMine(userID uint64) ([]AfterSaleItem, error) {
	var items []AfterSaleItem
	err := s.baseQuery(userID).
		Where("after_sales.buyer_id = ? OR after_sales.seller_id = ?", userID, userID).
		Order("after_sales.updated_at desc").
		Scan(&items).Error
	if err != nil {
		return nil, err
	}
	for index := range items {
		logs, logErr := s.ListLogs(items[index].ID, userID)
		if logErr == nil {
			items[index].Logs = logs
		}
	}
	return items, nil
}

func (s *AfterSaleService) SellerRespond(afterSaleID, sellerID uint64, input RespondAfterSaleInput) (*AfterSaleItem, error) {
	var afterSale model.AfterSale
	if err := s.db.First(&afterSale, afterSaleID).Error; err != nil {
		return nil, err
	}
	if afterSale.SellerID != sellerID {
		return nil, errors.New("only seller can respond this after-sale request")
	}
	if afterSale.Status == "refunded" || afterSale.Status == "closed" || afterSale.Status == "rejected" {
		return nil, errors.New("current after-sale request can no longer be updated by seller")
	}
	responseNote := strings.TrimSpace(input.SellerResponseNote)
	if responseNote == "" {
		return nil, errors.New("seller response note is required")
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = "processing"
	}
	now := time.Now()
	afterSale.Status = status
	afterSale.SellerResponseNote = &responseNote
	afterSale.SellerRespondedAt = &now
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&afterSale).Error; err != nil {
			return err
		}
		statusValue := afterSale.Status
		sellerActorID := afterSale.SellerID
		if err := createAfterSaleLog(tx, afterSale.ID, &sellerActorID, "seller", "seller_response", &statusValue, responseNote); err != nil {
			return err
		}
		link := "/me/after-sales"
		return createNotification(tx, afterSale.BuyerID, "after_sale", "卖家已响应你的售后申请", "售后工单 #"+strconv.FormatUint(afterSale.ID, 10)+" 进入“"+status+"”阶段，请查看最新处理说明。", &link)
	}); err != nil {
		return nil, err
	}
	return s.GetByOrder(afterSale.OrderID, sellerID)
}

func (s *AfterSaleService) baseQuery(userID uint64) *gorm.DB {
	viewerRoleSQL := "CASE WHEN after_sales.buyer_id = ? THEN 'buyer' ELSE 'seller' END AS viewer_role"
	return s.db.Table("after_sales").
		Select("after_sales.id, after_sales.order_id, orders.order_no, after_sales.product_id, products.title AS product_title, after_sales.buyer_id, buyer.nickname AS buyer_nickname, after_sales.seller_id, seller.nickname AS seller_nickname, after_sales.type, after_sales.status, after_sales.reason, after_sales.detail, after_sales.requested_amount, after_sales.currency, after_sales.seller_response_note, after_sales.seller_responded_at, after_sales.resolution_note, after_sales.created_at, after_sales.updated_at, "+viewerRoleSQL, userID).
		Joins("LEFT JOIN orders ON orders.id = after_sales.order_id").
		Joins("LEFT JOIN products ON products.id = after_sales.product_id").
		Joins("LEFT JOIN users buyer ON buyer.id = after_sales.buyer_id").
		Joins("LEFT JOIN users seller ON seller.id = after_sales.seller_id")
}
