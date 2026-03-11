package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type ReviewService struct {
	db *gorm.DB
}

type CreateReviewInput struct {
	Score   int    `json:"score"`
	Content string `json:"content"`
}

type ReviewItem struct {
	ID               uint64    `json:"id"`
	OrderID          uint64    `json:"orderId"`
	ProductID        uint64    `json:"productId"`
	ReviewerID       uint64    `json:"reviewerId"`
	RevieweeID       uint64    `json:"revieweeId"`
	Role             string    `json:"role"`
	Score            int       `json:"score"`
	Content          *string   `json:"content,omitempty"`
	ReviewerNickname string    `json:"reviewerNickname"`
	CreatedAt        time.Time `json:"createdAt"`
}

func NewReviewService(db *gorm.DB) *ReviewService {
	return &ReviewService{db: db}
}

func (s *ReviewService) ListByProduct(productID uint64) ([]ReviewItem, error) {
	var rows []struct {
		ID               uint64
		OrderID          uint64
		ProductID        uint64
		ReviewerID       uint64
		RevieweeID       uint64
		Role             string
		Score            int
		Content          *string
		ReviewerNickname string
		CreatedAt        time.Time
	}

	err := s.db.Table("reviews").
		Select("reviews.id, reviews.order_id, reviews.product_id, reviews.reviewer_id, reviews.reviewee_id, reviews.role, reviews.score, reviews.content, reviews.created_at, users.nickname AS reviewer_nickname").
		Joins("JOIN users ON users.id = reviews.reviewer_id").
		Where("reviews.product_id = ?", productID).
		Order("reviews.created_at desc").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	items := make([]ReviewItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, ReviewItem{
			ID:               row.ID,
			OrderID:          row.OrderID,
			ProductID:        row.ProductID,
			ReviewerID:       row.ReviewerID,
			RevieweeID:       row.RevieweeID,
			Role:             row.Role,
			Score:            row.Score,
			Content:          row.Content,
			ReviewerNickname: row.ReviewerNickname,
			CreatedAt:        row.CreatedAt,
		})
	}
	return items, nil
}

func (s *ReviewService) Create(orderID, reviewerID uint64, input CreateReviewInput) (*ReviewItem, error) {
	if input.Score < 1 || input.Score > 5 {
		return nil, errors.New("score must be between 1 and 5")
	}

	var order model.Order
	if err := s.db.First(&order, orderID).Error; err != nil {
		return nil, err
	}
	if order.BuyerID != reviewerID {
		return nil, errors.New("only buyer can review this order")
	}
	if order.Status != "completed" {
		return nil, errors.New("order is not completed")
	}

	var exists int64
	if err := s.db.Model(&model.Review{}).Where("order_id = ? AND reviewer_id = ?", orderID, reviewerID).Count(&exists).Error; err != nil {
		return nil, err
	}
	if exists > 0 {
		return nil, errors.New("review already submitted")
	}

	content := strings.TrimSpace(input.Content)
	var contentPtr *string
	if content != "" {
		contentPtr = &content
	}

	review := &model.Review{
		OrderID:    order.ID,
		ProductID:  order.ProductID,
		ReviewerID: reviewerID,
		RevieweeID: order.SellerID,
		Role:       "buyer",
		Score:      input.Score,
		Content:    contentPtr,
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(review).Error; err != nil {
			return err
		}
		link := "/me/orders/sell"
		message := "买家已完成订单评价"
		if contentPtr != nil && *contentPtr != "" {
			message = "买家给出了新的评价：" + *contentPtr
		}
		return createNotification(tx, order.SellerID, "review", "你收到一条新的交易评价", message, &link)
	}); err != nil {
		return nil, err
	}

	items, err := s.ListByProduct(order.ProductID)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		if item.ID == review.ID {
			return &item, nil
		}
	}

	return &ReviewItem{
		ID:               review.ID,
		OrderID:          review.OrderID,
		ProductID:        review.ProductID,
		ReviewerID:       review.ReviewerID,
		RevieweeID:       review.RevieweeID,
		Role:             review.Role,
		Score:            review.Score,
		Content:          review.Content,
		ReviewerNickname: "",
		CreatedAt:        review.CreatedAt,
	}, nil
}

func (s *ReviewService) HasReviewed(orderID, reviewerID uint64) (bool, error) {
	var count int64
	if err := s.db.Model(&model.Review{}).Where("order_id = ? AND reviewer_id = ?", orderID, reviewerID).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
