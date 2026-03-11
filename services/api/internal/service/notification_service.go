package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type NotificationService struct {
	db *gorm.DB
}

type NotificationItem struct {
	ID        uint64     `json:"id"`
	UserID    uint64     `json:"userId"`
	Type      string     `json:"type"`
	Title     string     `json:"title"`
	Content   string     `json:"content"`
	Link      *string    `json:"link,omitempty"`
	IsRead    bool       `json:"isRead"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

type NotificationSummary struct {
	UnreadCount int64 `json:"unreadCount"`
}

func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{db: db}
}

func (s *NotificationService) ListMine(userID uint64, unreadOnly bool) ([]NotificationItem, error) {
	query := s.db.Model(&model.Notification{}).Where("user_id = ?", userID)
	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}
	var items []NotificationItem
	if err := query.Select("id, user_id, type, title, content, link, is_read, read_at, created_at").Order("created_at desc").Limit(100).Scan(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *NotificationService) Summary(userID uint64) (*NotificationSummary, error) {
	var count int64
	if err := s.db.Model(&model.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&count).Error; err != nil {
		return nil, err
	}
	return &NotificationSummary{UnreadCount: count}, nil
}

func (s *NotificationService) MarkRead(notificationID, userID uint64) (*NotificationItem, error) {
	var notification model.Notification
	if err := s.db.Where("id = ? AND user_id = ?", notificationID, userID).First(&notification).Error; err != nil {
		return nil, err
	}
	if !notification.IsRead {
		now := time.Now()
		notification.IsRead = true
		notification.ReadAt = &now
		if err := s.db.Save(&notification).Error; err != nil {
			return nil, err
		}
	}
	return &NotificationItem{ID: notification.ID, UserID: notification.UserID, Type: notification.Type, Title: notification.Title, Content: notification.Content, Link: notification.Link, IsRead: notification.IsRead, ReadAt: notification.ReadAt, CreatedAt: notification.CreatedAt}, nil
}

func (s *NotificationService) MarkAllRead(userID uint64) error {
	now := time.Now()
	return s.db.Model(&model.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Updates(map[string]any{"is_read": true, "read_at": now}).Error
}

func createNotification(db *gorm.DB, userID uint64, notificationType, title, content string, link *string) error {
	if userID == 0 {
		return errors.New("user id is required")
	}
	if strings.TrimSpace(notificationType) == "" || strings.TrimSpace(title) == "" || strings.TrimSpace(content) == "" {
		return errors.New("notification payload is incomplete")
	}
	item := &model.Notification{
		UserID:  userID,
		Type:    strings.TrimSpace(notificationType),
		Title:   strings.TrimSpace(title),
		Content: strings.TrimSpace(content),
		Link:    link,
	}
	return db.Create(item).Error
}
