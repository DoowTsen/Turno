package service

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type AdminService struct {
	db *gorm.DB
}

type AdminOverview struct {
	TotalUsers       int64 `json:"totalUsers"`
	ActiveUsers      int64 `json:"activeUsers"`
	SuspendedUsers   int64 `json:"suspendedUsers"`
	TotalProducts    int64 `json:"totalProducts"`
	ActiveProducts   int64 `json:"activeProducts"`
	RejectedProducts int64 `json:"rejectedProducts"`
	ArchivedProducts int64 `json:"archivedProducts"`
	SoldProducts     int64 `json:"soldProducts"`
	TotalOrders      int64 `json:"totalOrders"`
	CompletedOrders  int64 `json:"completedOrders"`
	PendingShipments int64 `json:"pendingShipments"`
	TotalReviews     int64 `json:"totalReviews"`
	OpenAfterSales   int64 `json:"openAfterSales"`
}

type AdminUserItem struct {
	ID                uint64    `json:"id"`
	Email             *string   `json:"email,omitempty"`
	Nickname          string    `json:"nickname"`
	PreferredLanguage string    `json:"preferredLanguage"`
	Role              string    `json:"role"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"createdAt"`
}

type AdminProductItem struct {
	ID             uint64    `json:"id"`
	Title          string    `json:"title"`
	SellerID       uint64    `json:"sellerId"`
	SellerNickname string    `json:"sellerNickname"`
	CategoryID     uint64    `json:"categoryId"`
	Price          int64     `json:"price"`
	Currency       string    `json:"currency"`
	Status         string    `json:"status"`
	FavoriteCount  int64     `json:"favoriteCount"`
	CreatedAt      time.Time `json:"createdAt"`
}

type AdminOrderItem struct {
	ID              uint64    `json:"id"`
	OrderNo         string    `json:"orderNo"`
	ProductID       uint64    `json:"productId"`
	ProductTitle    string    `json:"productTitle"`
	BuyerID         uint64    `json:"buyerId"`
	BuyerNickname   string    `json:"buyerNickname"`
	SellerID        uint64    `json:"sellerId"`
	SellerNickname  string    `json:"sellerNickname"`
	TotalAmount     int64     `json:"totalAmount"`
	ShippingFee     int64     `json:"shippingFee"`
	Currency        string    `json:"currency"`
	Status          string    `json:"status"`
	ReceiverRegion  string    `json:"receiverRegion"`
	ReceiverAddress string    `json:"receiverAddress"`
	Carrier         *string   `json:"carrier,omitempty"`
	TrackingNo      *string   `json:"trackingNo,omitempty"`
	AfterSaleStatus *string   `json:"afterSaleStatus,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
}

type AdminOrderAfterSaleItem struct {
	ID              uint64             `json:"id"`
	Type            string             `json:"type"`
	Status          string             `json:"status"`
	Reason          string             `json:"reason"`
	RequestedAmount int64              `json:"requestedAmount"`
	Currency        string             `json:"currency"`
	ResolutionNote  *string            `json:"resolutionNote,omitempty"`
	Logs            []AfterSaleLogItem `json:"logs,omitempty" gorm:"-"`
	UpdatedAt       time.Time          `json:"updatedAt"`
}

type AdminOrderDetail struct {
	ID              uint64                    `json:"id"`
	OrderNo         string                    `json:"orderNo"`
	Status          string                    `json:"status"`
	TotalAmount     int64                     `json:"totalAmount"`
	ShippingFee     int64                     `json:"shippingFee"`
	Currency        string                    `json:"currency"`
	CreatedAt       time.Time                 `json:"createdAt"`
	UpdatedAt       time.Time                 `json:"updatedAt"`
	ProductID       uint64                    `json:"productId"`
	ProductTitle    string                    `json:"productTitle"`
	ProductStatus   string                    `json:"productStatus"`
	ProductImageURL *string                   `json:"productImageUrl,omitempty"`
	BuyerID         uint64                    `json:"buyerId"`
	BuyerNickname   string                    `json:"buyerNickname"`
	BuyerEmail      *string                   `json:"buyerEmail,omitempty"`
	BuyerStatus     string                    `json:"buyerStatus"`
	SellerID        uint64                    `json:"sellerId"`
	SellerNickname  string                    `json:"sellerNickname"`
	SellerEmail     *string                   `json:"sellerEmail,omitempty"`
	SellerStatus    string                    `json:"sellerStatus"`
	ReceiverName    string                    `json:"receiverName"`
	ReceiverPhone   string                    `json:"receiverPhone"`
	ReceiverRegion  string                    `json:"receiverRegion"`
	ReceiverAddress string                    `json:"receiverAddress"`
	Carrier         *string                   `json:"carrier,omitempty"`
	TrackingNo      *string                   `json:"trackingNo,omitempty"`
	ShipmentStatus  *string                   `json:"shipmentStatus,omitempty"`
	AfterSales      []AdminOrderAfterSaleItem `json:"afterSales"`
}

type AdminAfterSaleItem struct {
	ID              uint64             `json:"id"`
	OrderID         uint64             `json:"orderId"`
	OrderNo         string             `json:"orderNo"`
	ProductID       uint64             `json:"productId"`
	ProductTitle    string             `json:"productTitle"`
	BuyerID         uint64             `json:"buyerId"`
	BuyerNickname   string             `json:"buyerNickname"`
	SellerID        uint64             `json:"sellerId"`
	SellerNickname  string             `json:"sellerNickname"`
	Type            string             `json:"type"`
	Status          string             `json:"status"`
	Reason          string             `json:"reason"`
	Detail          *string            `json:"detail,omitempty"`
	RequestedAmount int64              `json:"requestedAmount"`
	Currency        string             `json:"currency"`
	ResolutionNote  *string            `json:"resolutionNote,omitempty"`
	Logs            []AfterSaleLogItem `json:"logs,omitempty" gorm:"-"`
	CreatedAt       time.Time          `json:"createdAt"`
	UpdatedAt       time.Time          `json:"updatedAt"`
}

type AdminCategoryItem struct {
	ID        uint64    `json:"id"`
	ParentID  *uint64   `json:"parentId,omitempty"`
	Slug      string    `json:"slug"`
	Status    string    `json:"status"`
	SortOrder int       `json:"sortOrder"`
	NameZhCN  string    `json:"nameZhCN"`
	NameEnUS  string    `json:"nameEnUS"`
	CreatedAt time.Time `json:"createdAt"`
}

type AdminCategoryUpdateInput struct {
	Status    string `json:"status"`
	SortOrder int    `json:"sortOrder"`
	NameZhCN  string `json:"nameZhCN"`
	NameEnUS  string `json:"nameEnUS"`
}

type AdminAfterSaleUpdateInput struct {
	Status         string `json:"status"`
	ResolutionNote string `json:"resolutionNote"`
}

type AdminTrendPoint struct {
	Date            string `json:"date"`
	NewUsers        int64  `json:"newUsers"`
	NewProducts     int64  `json:"newProducts"`
	CreatedOrders   int64  `json:"createdOrders"`
	CompletedOrders int64  `json:"completedOrders"`
	GMV             int64  `json:"gmv"`
	NewAfterSales   int64  `json:"newAfterSales"`
}

type AdminTrends struct {
	Days                 int               `json:"days"`
	Points               []AdminTrendPoint `json:"points"`
	LastPeriodUsers      int64             `json:"lastPeriodUsers"`
	LastPeriodProducts   int64             `json:"lastPeriodProducts"`
	LastPeriodOrders     int64             `json:"lastPeriodOrders"`
	LastPeriodCompleted  int64             `json:"lastPeriodCompleted"`
	LastPeriodGMV        int64             `json:"lastPeriodGMV"`
	LastPeriodAfterSales int64             `json:"lastPeriodAfterSales"`
	CompletionRate       float64           `json:"completionRate"`
}

type AdminAlertItem struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Level       string `json:"level"`
	Metric      int64  `json:"metric"`
	ActionLabel string `json:"actionLabel"`
	TargetTab   string `json:"targetTab"`
}

type AdminRiskOrderItem struct {
	OrderID         uint64    `json:"orderId"`
	OrderNo         string    `json:"orderNo"`
	ProductTitle    string    `json:"productTitle"`
	SellerNickname  string    `json:"sellerNickname"`
	Status          string    `json:"status"`
	AfterSaleStatus *string   `json:"afterSaleStatus,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
	RiskReason      string    `json:"riskReason"`
}

type AdminRiskSellerItem struct {
	SellerID         uint64 `json:"sellerId"`
	SellerNickname   string `json:"sellerNickname"`
	DelayedShipments int64  `json:"delayedShipments"`
	OpenAfterSales   int64  `json:"openAfterSales"`
	RejectedProducts int64  `json:"rejectedProducts"`
	RiskScore        int64  `json:"riskScore"`
	RiskReason       string `json:"riskReason"`
}

type AdminRiskBuyerItem struct {
	BuyerID         uint64 `json:"buyerId"`
	BuyerNickname   string `json:"buyerNickname"`
	CancelledOrders int64  `json:"cancelledOrders"`
	OpenAfterSales  int64  `json:"openAfterSales"`
	RiskScore       int64  `json:"riskScore"`
	RiskReason      string `json:"riskReason"`
}

type AdminAlerts struct {
	Items       []AdminAlertItem      `json:"items"`
	RiskOrders  []AdminRiskOrderItem  `json:"riskOrders"`
	RiskSellers []AdminRiskSellerItem `json:"riskSellers"`
	RiskBuyers  []AdminRiskBuyerItem  `json:"riskBuyers"`
}

type AdminAuditLogItem struct {
	ID            uint64    `json:"id"`
	ActorID       uint64    `json:"actorId"`
	ActorNickname string    `json:"actorNickname"`
	Action        string    `json:"action"`
	TargetType    string    `json:"targetType"`
	TargetID      uint64    `json:"targetId"`
	TargetLabel   *string   `json:"targetLabel,omitempty"`
	Detail        string    `json:"detail"`
	CreatedAt     time.Time `json:"createdAt"`
}

type AdminNotificationTemplateItem struct {
	ID              uint64    `json:"id"`
	Name            string    `json:"name"`
	Type            string    `json:"type"`
	TitleTemplate   string    `json:"titleTemplate"`
	ContentTemplate string    `json:"contentTemplate"`
	DefaultLink     *string   `json:"defaultLink,omitempty"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type AdminNotificationTemplateInput struct {
	Name            string  `json:"name"`
	Type            string  `json:"type"`
	TitleTemplate   string  `json:"titleTemplate"`
	ContentTemplate string  `json:"contentTemplate"`
	DefaultLink     *string `json:"defaultLink"`
	Status          string  `json:"status"`
}

type AdminNotificationSendInput struct {
	TemplateID *uint64  `json:"templateId"`
	Title      *string  `json:"title"`
	Content    *string  `json:"content"`
	Link       *string  `json:"link"`
	TargetType string   `json:"targetType"`
	TargetRole *string  `json:"targetRole"`
	UserIDs    []uint64 `json:"userIds"`
}

type AdminNotificationSendResult struct {
	TemplateID     *uint64   `json:"templateId,omitempty"`
	TargetType     string    `json:"targetType"`
	TargetRole     *string   `json:"targetRole,omitempty"`
	RecipientCount int64     `json:"recipientCount"`
	DeliveredAt    time.Time `json:"deliveredAt"`
}

type AdminBatchFailureItem struct {
	ID     uint64 `json:"id"`
	Reason string `json:"reason"`
}

type AdminHomeBannerItem struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Link     string `json:"link"`
	Tone     string `json:"tone"`
}

type AdminHomeConfig struct {
	HeroBadge             string                `json:"heroBadge"`
	HeroTitle             string                `json:"heroTitle"`
	HeroDescription       string                `json:"heroDescription"`
	PrimaryCtaText        string                `json:"primaryCtaText"`
	PrimaryCtaLink        string                `json:"primaryCtaLink"`
	SecondaryCtaText      string                `json:"secondaryCtaText"`
	SecondaryCtaLink      string                `json:"secondaryCtaLink"`
	FeaturedProductIDs    []uint64              `json:"featuredProductIds"`
	FeaturedCategorySlugs []string              `json:"featuredCategorySlugs"`
	Banners               []AdminHomeBannerItem `json:"banners"`
}

type AdminActionTemplateBinding struct {
	ActionKey     string   `json:"actionKey"`
	TemplateID    *uint64  `json:"templateId,omitempty"`
	TemplateName  *string  `json:"templateName,omitempty"`
	FallbackNames []string `json:"fallbackNames"`
}

type actionTemplateBindingStoreItem struct {
	TemplateID    *uint64  `json:"templateId,omitempty"`
	FallbackNames []string `json:"fallbackNames"`
}

type AdminUserListQuery struct {
	Keyword string
	Role    string
	Status  string
}

type AdminProductListQuery struct {
	Keyword    string
	Status     string
	CategoryID *uint64
	SellerID   *uint64
	MinPrice   *int64
	MaxPrice   *int64
}

type AdminOrderListQuery struct {
	Keyword         string
	Status          string
	MinAmount       *int64
	MaxAmount       *int64
	StartDate       *time.Time
	EndDate         *time.Time
	HasAfterSale    *bool
	DelayedShipment *bool
}

type AdminAfterSaleListQuery struct {
	Status string
	Type   string
}

type AdminBatchStatusInput struct {
	IDs    []uint64 `json:"ids"`
	Status string   `json:"status"`
}

type AdminBatchAfterSaleInput struct {
	IDs            []uint64 `json:"ids"`
	Status         string   `json:"status"`
	ResolutionNote string   `json:"resolutionNote"`
}

type AdminBatchResult struct {
	UpdatedCount int64                   `json:"updatedCount"`
	SucceededIDs []uint64                `json:"succeededIds,omitempty"`
	FailedItems  []AdminBatchFailureItem `json:"failedItems,omitempty"`
}

const (
	homePageConfigKey         = "home_page_config"
	actionTemplateBindingsKey = "action_notification_bindings"
)

func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{db: db}
}

func (s *AdminService) logAction(actorID uint64, action, targetType string, targetID uint64, targetLabel, detail string) error {
	if actorID == 0 {
		return nil
	}
	entry := &model.AdminAuditLog{
		ActorID:    actorID,
		Action:     action,
		TargetType: targetType,
		TargetID:   targetID,
		Detail:     detail,
	}
	if strings.TrimSpace(targetLabel) != "" {
		label := strings.TrimSpace(targetLabel)
		entry.TargetLabel = &label
	}
	return s.db.Create(entry).Error
}

func (s *AdminService) ListNotificationTemplates(status string) ([]AdminNotificationTemplateItem, error) {
	query := s.db.Model(&model.NotificationTemplate{})
	if strings.TrimSpace(status) != "" {
		query = query.Where("status = ?", strings.TrimSpace(status))
	}
	var items []AdminNotificationTemplateItem
	if err := query.Order("status asc, updated_at desc, id desc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func uniqueUint64(values []uint64) []uint64 {
	seen := make(map[uint64]struct{}, len(values))
	result := make([]uint64, 0, len(values))
	for _, value := range values {
		if value == 0 {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func defaultAdminHomeConfig() AdminHomeConfig {
	return AdminHomeConfig{
		HeroBadge:             "Curated by Turno Ops",
		HeroTitle:             "让好东西流转，让二手交易更安心。",
		HeroDescription:       "用更清晰的担保交易、精选推荐和履约体验，把二手商品做成真正值得逛的数字货架。",
		PrimaryCtaText:        "逛逛商品广场",
		PrimaryCtaLink:        "/products",
		SecondaryCtaText:      "立即发布闲置",
		SecondaryCtaLink:      "/publish",
		FeaturedProductIDs:    []uint64{3008, 3003, 3004, 3005},
		FeaturedCategorySlugs: []string{"phones-digital", "computers-office", "gaming-toys"},
		Banners: []AdminHomeBannerItem{
			{ID: "ops-1", Title: "春季转卖激励计划", Subtitle: "精选数码与办公设备正在加速流转，优先推荐高成色商品。", Link: "/products", Tone: "cyan"},
			{ID: "ops-2", Title: "优先履约卖家榜", Subtitle: "发货快、评价高、售后少的卖家会得到首页更多曝光。", Link: "/me/orders/sell", Tone: "violet"},
			{ID: "ops-3", Title: "平台担保升级", Subtitle: "发货、售后、通知中心已联通，买卖双方都能看到更完整的处理进度。", Link: "/me/notifications", Tone: "emerald"},
		},
	}
}

func defaultActionTemplateBindings() map[string]actionTemplateBindingStoreItem {
	return map[string]actionTemplateBindingStoreItem{
		"user.status.updated":       {FallbackNames: []string{"账号状态变更通知"}},
		"product.status.updated":    {FallbackNames: []string{"商品状态更新通知"}},
		"after_sale.status.updated": {FallbackNames: []string{"售后状态更新通知", "售后协商提示"}},
	}
}

func (s *AdminService) loadPlatformConfig(key string, target any) error {
	var row model.PlatformConfig
	err := s.db.Where("`key` = ?", key).First(&row).Error
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(row.Value), target)
}

func (s *AdminService) savePlatformConfig(actorID uint64, key string, payload any) error {
	encoded, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	var row model.PlatformConfig
	findErr := s.db.Where("`key` = ?", key).First(&row).Error
	if findErr != nil {
		if !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return findErr
		}
		row.Key = key
	}
	row.Value = string(encoded)
	if actorID > 0 {
		row.UpdatedBy = &actorID
	}
	if row.ID == 0 {
		return s.db.Create(&row).Error
	}
	return s.db.Save(&row).Error
}

func (s *AdminService) GetHomeConfig() (*AdminHomeConfig, error) {
	config := defaultAdminHomeConfig()
	err := s.loadPlatformConfig(homePageConfigKey, &config)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &config, nil
		}
		return nil, err
	}
	return &config, nil
}

func (s *AdminService) SaveHomeConfig(actorID uint64, input AdminHomeConfig) (*AdminHomeConfig, error) {
	if strings.TrimSpace(input.HeroTitle) == "" {
		return nil, errors.New("hero title is required")
	}
	if strings.TrimSpace(input.PrimaryCtaText) == "" || strings.TrimSpace(input.PrimaryCtaLink) == "" {
		return nil, errors.New("primary CTA is required")
	}
	if err := s.savePlatformConfig(actorID, homePageConfigKey, input); err != nil {
		return nil, err
	}
	if err := s.logAction(actorID, "home_config.updated", "platform_config", 0, "home_page_config", "更新首页运营配置"); err != nil {
		return nil, err
	}
	return &input, nil
}

func (s *AdminService) ListActionTemplateBindings() ([]AdminActionTemplateBinding, error) {
	store := defaultActionTemplateBindings()
	err := s.loadPlatformConfig(actionTemplateBindingsKey, &store)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	keys := make([]string, 0, len(store))
	for key := range store {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	items := make([]AdminActionTemplateBinding, 0, len(keys))
	for _, key := range keys {
		item := AdminActionTemplateBinding{ActionKey: key, TemplateID: store[key].TemplateID, FallbackNames: store[key].FallbackNames}
		if store[key].TemplateID != nil {
			var template model.NotificationTemplate
			if err := s.db.Select("id, name").First(&template, *store[key].TemplateID).Error; err == nil {
				name := template.Name
				item.TemplateName = &name
			}
		}
		items = append(items, item)
	}
	return items, nil
}

func (s *AdminService) SaveActionTemplateBindings(actorID uint64, input []AdminActionTemplateBinding) ([]AdminActionTemplateBinding, error) {
	store := defaultActionTemplateBindings()
	for _, item := range input {
		key := strings.TrimSpace(item.ActionKey)
		if key == "" {
			continue
		}
		entry := actionTemplateBindingStoreItem{TemplateID: item.TemplateID, FallbackNames: item.FallbackNames}
		if len(entry.FallbackNames) == 0 {
			entry.FallbackNames = store[key].FallbackNames
		}
		store[key] = entry
	}
	if err := s.savePlatformConfig(actorID, actionTemplateBindingsKey, store); err != nil {
		return nil, err
	}
	if err := s.logAction(actorID, "notification_binding.updated", "platform_config", 0, "action_notification_bindings", "更新后台动作联动通知模板"); err != nil {
		return nil, err
	}
	return s.ListActionTemplateBindings()
}

func (s *AdminService) notificationTemplateCandidates(actionKey string, fallback []string) []string {
	store := defaultActionTemplateBindings()
	if err := s.loadPlatformConfig(actionTemplateBindingsKey, &store); err == nil || errors.Is(err, gorm.ErrRecordNotFound) {
		if binding, ok := store[actionKey]; ok {
			candidates := make([]string, 0, len(binding.FallbackNames)+len(fallback)+1)
			if binding.TemplateID != nil {
				var template model.NotificationTemplate
				if err := s.db.Select("id, name, status").First(&template, *binding.TemplateID).Error; err == nil && template.Status == "active" {
					candidates = append(candidates, template.Name)
				}
			}
			candidates = append(candidates, binding.FallbackNames...)
			candidates = append(candidates, fallback...)
			return candidates
		}
	}
	return fallback
}

func renderAdminNotificationTemplate(source string, variables map[string]string) string {
	replacements := make([]string, 0, len(variables)*2)
	for key, value := range variables {
		replacements = append(replacements, "{{"+key+"}}", value)
	}
	if len(replacements) == 0 {
		return source
	}
	return strings.NewReplacer(replacements...).Replace(source)
}

func (s *AdminService) findNotificationTemplateByNames(names ...string) (*model.NotificationTemplate, error) {
	for _, name := range names {
		trimmed := strings.TrimSpace(name)
		if trimmed == "" {
			continue
		}
		var template model.NotificationTemplate
		err := s.db.Where("name = ?", trimmed).First(&template).Error
		if err == nil {
			return &template, nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}
	return nil, nil
}

func (s *AdminService) deliverTemplatedNotification(userIDs []uint64, templateNames []string, fallbackType, fallbackTitle, fallbackContent string, fallbackLink *string, variables map[string]string) error {
	recipients := uniqueUint64(userIDs)
	if len(recipients) == 0 {
		return nil
	}
	template, err := s.findNotificationTemplateByNames(templateNames...)
	if err != nil {
		return err
	}
	notificationType := fallbackType
	title := fallbackTitle
	content := fallbackContent
	link := fallbackLink
	if template != nil && template.Status == "active" {
		if strings.TrimSpace(template.Type) != "" {
			notificationType = strings.TrimSpace(template.Type)
		}
		title = template.TitleTemplate
		content = template.ContentTemplate
		link = template.DefaultLink
	}
	title = strings.TrimSpace(renderAdminNotificationTemplate(title, variables))
	content = strings.TrimSpace(renderAdminNotificationTemplate(content, variables))
	if link != nil {
		renderedLink := strings.TrimSpace(renderAdminNotificationTemplate(*link, variables))
		if renderedLink == "" {
			link = nil
		} else {
			link = &renderedLink
		}
	}
	if title == "" || content == "" {
		return nil
	}
	now := time.Now()
	items := make([]model.Notification, 0, len(recipients))
	for _, userID := range recipients {
		items = append(items, model.Notification{UserID: userID, Type: notificationType, Title: title, Content: content, Link: link, CreatedAt: now, UpdatedAt: now})
	}
	return s.db.Create(&items).Error
}

func (s *AdminService) SaveNotificationTemplate(actorID uint64, templateID *uint64, input AdminNotificationTemplateInput) (*AdminNotificationTemplateItem, error) {
	name := strings.TrimSpace(input.Name)
	notificationType := strings.TrimSpace(input.Type)
	titleTemplate := strings.TrimSpace(input.TitleTemplate)
	contentTemplate := strings.TrimSpace(input.ContentTemplate)
	status := strings.TrimSpace(input.Status)
	if name == "" || notificationType == "" || titleTemplate == "" || contentTemplate == "" || status == "" {
		return nil, errors.New("template fields are required")
	}
	var row model.NotificationTemplate
	action := "notification_template.created"
	if templateID != nil && *templateID > 0 {
		if err := s.db.First(&row, *templateID).Error; err != nil {
			return nil, err
		}
		action = "notification_template.updated"
	}
	row.Name = name
	row.Type = notificationType
	row.TitleTemplate = titleTemplate
	row.ContentTemplate = contentTemplate
	row.DefaultLink = normalizeOptionalString(input.DefaultLink)
	row.Status = status
	if row.ID == 0 {
		if err := s.db.Create(&row).Error; err != nil {
			return nil, err
		}
	} else {
		if err := s.db.Save(&row).Error; err != nil {
			return nil, err
		}
	}
	if err := s.logAction(actorID, action, "notification_template", row.ID, row.Name, fmt.Sprintf("保存通知模板，状态=%s，类型=%s", row.Status, row.Type)); err != nil {
		return nil, err
	}
	return &AdminNotificationTemplateItem{
		ID: row.ID, Name: row.Name, Type: row.Type, TitleTemplate: row.TitleTemplate, ContentTemplate: row.ContentTemplate,
		DefaultLink: row.DefaultLink, Status: row.Status, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func (s *AdminService) resolveNotificationRecipients(input AdminNotificationSendInput) ([]uint64, error) {
	query := s.db.Model(&model.User{}).Where("status = ?", "active")
	switch strings.TrimSpace(input.TargetType) {
	case "all_users":
		query = query.Where("role = ?", "user")
	case "management":
		query = query.Where("role IN ?", []string{"admin", "super_admin", "operator", "customer_service", "auditor"})
	case "role":
		if input.TargetRole == nil || strings.TrimSpace(*input.TargetRole) == "" {
			return nil, errors.New("targetRole is required")
		}
		query = query.Where("role = ?", strings.TrimSpace(*input.TargetRole))
	case "user_ids":
		if len(input.UserIDs) == 0 {
			return nil, errors.New("userIds is required")
		}
		query = query.Where("id IN ?", input.UserIDs)
	default:
		return nil, errors.New("unsupported targetType")
	}
	var userIDs []uint64
	if err := query.Pluck("id", &userIDs).Error; err != nil {
		return nil, err
	}
	if len(userIDs) == 0 {
		return nil, errors.New("no recipients found")
	}
	return userIDs, nil
}

func (s *AdminService) SendNotification(actorID uint64, input AdminNotificationSendInput) (*AdminNotificationSendResult, error) {
	var template model.NotificationTemplate
	if input.TemplateID != nil && *input.TemplateID > 0 {
		if err := s.db.First(&template, *input.TemplateID).Error; err != nil {
			return nil, err
		}
		if template.Status != "active" {
			return nil, errors.New("template is not active")
		}
	}
	notificationType := template.Type
	title := strings.TrimSpace(template.TitleTemplate)
	content := strings.TrimSpace(template.ContentTemplate)
	link := template.DefaultLink
	if input.Title != nil && strings.TrimSpace(*input.Title) != "" {
		title = strings.TrimSpace(*input.Title)
	}
	if input.Content != nil && strings.TrimSpace(*input.Content) != "" {
		content = strings.TrimSpace(*input.Content)
	}
	if input.Link != nil {
		link = normalizeOptionalString(input.Link)
	}
	if notificationType == "" {
		notificationType = "system"
	}
	if title == "" || content == "" {
		return nil, errors.New("title and content are required")
	}
	recipientIDs, err := s.resolveNotificationRecipients(input)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	items := make([]model.Notification, 0, len(recipientIDs))
	for _, userID := range recipientIDs {
		items = append(items, model.Notification{UserID: userID, Type: notificationType, Title: title, Content: content, Link: link, CreatedAt: now, UpdatedAt: now})
	}
	if err := s.db.Create(&items).Error; err != nil {
		return nil, err
	}
	targetLabel := title
	if template.ID > 0 {
		targetLabel = template.Name
	}
	detail := fmt.Sprintf("发送运营通知，范围=%s，触达=%d", input.TargetType, len(recipientIDs))
	if input.TargetRole != nil && strings.TrimSpace(*input.TargetRole) != "" {
		detail += "，角色=" + strings.TrimSpace(*input.TargetRole)
	}
	if err := s.logAction(actorID, "notification.broadcast.sent", "notification_template", template.ID, targetLabel, detail); err != nil {
		return nil, err
	}
	return &AdminNotificationSendResult{TemplateID: input.TemplateID, TargetType: input.TargetType, TargetRole: normalizeOptionalString(input.TargetRole), RecipientCount: int64(len(recipientIDs)), DeliveredAt: now}, nil
}

func (s *AdminService) ListAuditLogs(keyword, action string) ([]AdminAuditLogItem, error) {
	query := s.db.Table("admin_audit_logs").Joins("LEFT JOIN users actor ON actor.id = admin_audit_logs.actor_id")
	if strings.TrimSpace(keyword) != "" {
		kw := "%" + strings.TrimSpace(keyword) + "%"
		query = query.Where("actor.nickname LIKE ? OR admin_audit_logs.detail LIKE ? OR admin_audit_logs.target_label LIKE ?", kw, kw, kw)
	}
	if strings.TrimSpace(action) != "" {
		query = query.Where("admin_audit_logs.action = ?", strings.TrimSpace(action))
	}
	items := make([]AdminAuditLogItem, 0)
	if err := query.
		Select("admin_audit_logs.id, admin_audit_logs.actor_id, actor.nickname AS actor_nickname, admin_audit_logs.action, admin_audit_logs.target_type, admin_audit_logs.target_id, admin_audit_logs.target_label, admin_audit_logs.detail, admin_audit_logs.created_at").
		Order("admin_audit_logs.created_at desc").
		Limit(100).
		Scan(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *AdminService) Overview() (*AdminOverview, error) {
	overview := &AdminOverview{}
	queries := []struct {
		model  any
		where  string
		args   []any
		target *int64
	}{
		{model.User{}, "", nil, &overview.TotalUsers},
		{model.User{}, "status = ?", []any{"active"}, &overview.ActiveUsers},
		{model.User{}, "status = ?", []any{"suspended"}, &overview.SuspendedUsers},
		{model.Product{}, "", nil, &overview.TotalProducts},
		{model.Product{}, "status = ?", []any{"active"}, &overview.ActiveProducts},
		{model.Product{}, "status = ?", []any{"rejected"}, &overview.RejectedProducts},
		{model.Product{}, "status = ?", []any{"archived"}, &overview.ArchivedProducts},
		{model.Product{}, "status = ?", []any{"sold"}, &overview.SoldProducts},
		{model.Order{}, "", nil, &overview.TotalOrders},
		{model.Order{}, "status = ?", []any{"completed"}, &overview.CompletedOrders},
		{model.Order{}, "status = ?", []any{"paid"}, &overview.PendingShipments},
		{model.Review{}, "", nil, &overview.TotalReviews},
		{model.AfterSale{}, "status IN ?", []any{[]string{"open", "processing"}}, &overview.OpenAfterSales},
	}

	for _, query := range queries {
		dbQuery := s.db.Model(query.model)
		if query.where != "" {
			dbQuery = dbQuery.Where(query.where, query.args...)
		}
		if err := dbQuery.Count(query.target).Error; err != nil {
			return nil, err
		}
	}

	return overview, nil
}

func (s *AdminService) Trends(days int) (*AdminTrends, error) {
	if days <= 0 {
		days = 7
	}
	if days > 30 {
		days = 30
	}

	start := time.Now().In(time.Local).Truncate(24*time.Hour).AddDate(0, 0, -(days - 1))
	points := make([]AdminTrendPoint, 0, days)
	pointMap := make(map[string]*AdminTrendPoint, days)
	for index := 0; index < days; index++ {
		day := start.AddDate(0, 0, index).Format("2006-01-02")
		point := AdminTrendPoint{Date: day}
		points = append(points, point)
		pointMap[day] = &points[len(points)-1]
	}

	type countRow struct {
		Day   string `gorm:"column:day"`
		Count int64  `gorm:"column:count"`
	}
	type sumRow struct {
		Day string `gorm:"column:day"`
		Sum int64  `gorm:"column:sum"`
	}

	applyCount := func(rows []countRow, setter func(point *AdminTrendPoint, value int64)) {
		for _, row := range rows {
			if point, ok := pointMap[row.Day]; ok {
				setter(point, row.Count)
			}
		}
	}

	var userRows []countRow
	if err := s.db.Model(&model.User{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count").
		Where("created_at >= ?", start).
		Group("DATE_FORMAT(created_at, '%Y-%m-%d')").
		Order("day asc").
		Scan(&userRows).Error; err != nil {
		return nil, err
	}
	applyCount(userRows, func(point *AdminTrendPoint, value int64) { point.NewUsers = value })

	var productRows []countRow
	if err := s.db.Model(&model.Product{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count").
		Where("created_at >= ?", start).
		Group("DATE_FORMAT(created_at, '%Y-%m-%d')").
		Order("day asc").
		Scan(&productRows).Error; err != nil {
		return nil, err
	}
	applyCount(productRows, func(point *AdminTrendPoint, value int64) { point.NewProducts = value })

	var orderRows []countRow
	if err := s.db.Model(&model.Order{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count").
		Where("created_at >= ?", start).
		Group("DATE_FORMAT(created_at, '%Y-%m-%d')").
		Order("day asc").
		Scan(&orderRows).Error; err != nil {
		return nil, err
	}
	applyCount(orderRows, func(point *AdminTrendPoint, value int64) { point.CreatedOrders = value })

	var completedRows []countRow
	if err := s.db.Model(&model.Order{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count").
		Where("created_at >= ? AND status = ?", start, "completed").
		Group("DATE_FORMAT(created_at, '%Y-%m-%d')").
		Order("day asc").
		Scan(&completedRows).Error; err != nil {
		return nil, err
	}
	applyCount(completedRows, func(point *AdminTrendPoint, value int64) { point.CompletedOrders = value })

	var gmvRows []sumRow
	if err := s.db.Model(&model.Order{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COALESCE(SUM(total_amount), 0) AS sum").
		Where("created_at >= ? AND status IN ?", start, []string{"paid", "shipped", "completed"}).
		Group("DATE_FORMAT(created_at, '%Y-%m-%d')").
		Order("day asc").
		Scan(&gmvRows).Error; err != nil {
		return nil, err
	}
	for _, row := range gmvRows {
		if point, ok := pointMap[row.Day]; ok {
			point.GMV = row.Sum
		}
	}

	var afterSaleRows []countRow
	if err := s.db.Model(&model.AfterSale{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count").
		Where("created_at >= ?", start).
		Group("DATE_FORMAT(created_at, '%Y-%m-%d')").
		Order("day asc").
		Scan(&afterSaleRows).Error; err != nil {
		return nil, err
	}
	applyCount(afterSaleRows, func(point *AdminTrendPoint, value int64) { point.NewAfterSales = value })

	trends := &AdminTrends{Days: days, Points: points}
	for _, point := range points {
		trends.LastPeriodUsers += point.NewUsers
		trends.LastPeriodProducts += point.NewProducts
		trends.LastPeriodOrders += point.CreatedOrders
		trends.LastPeriodCompleted += point.CompletedOrders
		trends.LastPeriodGMV += point.GMV
		trends.LastPeriodAfterSales += point.NewAfterSales
	}
	if trends.LastPeriodOrders > 0 {
		trends.CompletionRate = float64(trends.LastPeriodCompleted) / float64(trends.LastPeriodOrders) * 100
	}

	return trends, nil
}

func (s *AdminService) Alerts() (*AdminAlerts, error) {
	overview, err := s.Overview()
	if err != nil {
		return nil, err
	}

	delayThreshold := time.Now().Add(-2 * time.Hour)
	var rows []struct {
		OrderID         uint64
		OrderNo         string
		ProductTitle    string
		SellerNickname  string
		Status          string
		AfterSaleStatus *string
		CreatedAt       time.Time
	}
	if err := s.db.Table("orders").
		Joins("LEFT JOIN products ON products.id = orders.product_id").
		Joins("LEFT JOIN users seller ON seller.id = orders.seller_id").
		Joins("LEFT JOIN after_sales ON after_sales.order_id = orders.id AND after_sales.status IN ?", []string{"open", "processing"}).
		Where("(orders.status = ? AND orders.created_at <= ?) OR after_sales.status IN ?", "paid", delayThreshold, []string{"open", "processing"}).
		Select("orders.id AS order_id, orders.order_no, products.title AS product_title, seller.nickname AS seller_nickname, orders.status, after_sales.status AS after_sale_status, orders.created_at").
		Order("orders.created_at asc").
		Limit(5).
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	riskOrders := make([]AdminRiskOrderItem, 0, len(rows))
	for _, row := range rows {
		reason := "交易中订单需要重点关注"
		delayed := row.Status == "paid" && row.CreatedAt.Before(delayThreshold)
		hasAfterSale := row.AfterSaleStatus != nil && (*row.AfterSaleStatus == "open" || *row.AfterSaleStatus == "processing")
		switch {
		case delayed && hasAfterSale:
			reason = "已付款超 2 小时未发货，且订单关联售后处理中"
		case delayed:
			reason = "已付款超 2 小时未发货，建议优先催促卖家履约"
		case hasAfterSale:
			reason = "订单已进入售后协商阶段，建议客服重点跟踪"
		}
		riskOrders = append(riskOrders, AdminRiskOrderItem{
			OrderID:         row.OrderID,
			OrderNo:         row.OrderNo,
			ProductTitle:    row.ProductTitle,
			SellerNickname:  row.SellerNickname,
			Status:          row.Status,
			AfterSaleStatus: row.AfterSaleStatus,
			CreatedAt:       row.CreatedAt,
			RiskReason:      reason,
		})
	}

	riskSellers, err := s.buildRiskSellers(delayThreshold)
	if err != nil {
		return nil, err
	}
	riskBuyers, err := s.buildRiskBuyers()
	if err != nil {
		return nil, err
	}

	items := []AdminAlertItem{
		{
			Key:         "pending-shipments",
			Title:       "待发货积压",
			Description: "已付款但尚未录入物流的订单需要尽快推进，避免影响履约评分。",
			Level:       levelByMetric(overview.PendingShipments, 4, 2),
			Metric:      overview.PendingShipments,
			ActionLabel: "查看订单",
			TargetTab:   "orders",
		},
		{
			Key:         "after-sales-open",
			Title:       "售后处理中",
			Description: "买卖双方正在协商或等待平台介入的工单，建议优先关注描述不符类争议。",
			Level:       levelByMetric(overview.OpenAfterSales, 3, 1),
			Metric:      overview.OpenAfterSales,
			ActionLabel: "查看工单",
			TargetTab:   "afterSales",
		},
		{
			Key:         "rejected-products",
			Title:       "待复核商品",
			Description: "已驳回商品可能需要卖家补充资料后重新审核，避免影响上新节奏。",
			Level:       levelByMetric(overview.RejectedProducts, 3, 1),
			Metric:      overview.RejectedProducts,
			ActionLabel: "查看商品",
			TargetTab:   "products",
		},
		{
			Key:         "risk-orders",
			Title:       "风险订单",
			Description: "这些订单要么发货滞后，要么已进入售后阶段，适合运营和客服重点关注。",
			Level:       levelByMetric(int64(len(riskOrders)), 3, 1),
			Metric:      int64(len(riskOrders)),
			ActionLabel: "重点处理",
			TargetTab:   "orders",
		},
	}

	return &AdminAlerts{Items: items, RiskOrders: riskOrders, RiskSellers: riskSellers, RiskBuyers: riskBuyers}, nil
}

func (s *AdminService) buildRiskSellers(delayThreshold time.Time) ([]AdminRiskSellerItem, error) {
	type metricRow struct {
		UserID uint64 `gorm:"column:user_id"`
		Count  int64  `gorm:"column:count"`
	}
	var delayedRows []metricRow
	if err := s.db.Table("orders").Select("seller_id AS user_id, COUNT(*) AS count").Where("status = ? AND created_at <= ?", "paid", delayThreshold).Group("seller_id").Scan(&delayedRows).Error; err != nil {
		return nil, err
	}
	var afterSaleRows []metricRow
	if err := s.db.Table("after_sales").Select("seller_id AS user_id, COUNT(*) AS count").Where("status IN ?", []string{"open", "processing"}).Group("seller_id").Scan(&afterSaleRows).Error; err != nil {
		return nil, err
	}
	var rejectedRows []metricRow
	if err := s.db.Table("products").Select("seller_id AS user_id, COUNT(*) AS count").Where("status = ?", "rejected").Group("seller_id").Scan(&rejectedRows).Error; err != nil {
		return nil, err
	}
	delayedMap := map[uint64]int64{}
	afterSaleMap := map[uint64]int64{}
	rejectedMap := map[uint64]int64{}
	userIDs := map[uint64]struct{}{}
	for _, row := range delayedRows {
		delayedMap[row.UserID] = row.Count
		userIDs[row.UserID] = struct{}{}
	}
	for _, row := range afterSaleRows {
		afterSaleMap[row.UserID] = row.Count
		userIDs[row.UserID] = struct{}{}
	}
	for _, row := range rejectedRows {
		rejectedMap[row.UserID] = row.Count
		userIDs[row.UserID] = struct{}{}
	}
	ids := make([]uint64, 0, len(userIDs))
	for id := range userIDs {
		ids = append(ids, id)
	}
	if len(ids) == 0 {
		return []AdminRiskSellerItem{}, nil
	}
	var users []model.User
	if err := s.db.Select("id, nickname").Where("id IN ?", ids).Find(&users).Error; err != nil {
		return nil, err
	}
	userMap := map[uint64]string{}
	for _, user := range users {
		userMap[user.ID] = user.Nickname
	}
	items := make([]AdminRiskSellerItem, 0, len(ids))
	for _, id := range ids {
		delayed := delayedMap[id]
		openAfterSales := afterSaleMap[id]
		rejected := rejectedMap[id]
		score := delayed*3 + openAfterSales*2 + rejected
		if score <= 0 {
			continue
		}
		reason := "需要关注履约与内容质量"
		switch {
		case delayed >= openAfterSales && delayed >= rejected:
			reason = "待发货订单偏多，建议优先催促卖家履约"
		case openAfterSales >= delayed && openAfterSales >= rejected:
			reason = "售后纠纷较多，建议重点跟进交易沟通与描述一致性"
		default:
			reason = "商品驳回数量偏多，建议复核描述与类目发布质量"
		}
		items = append(items, AdminRiskSellerItem{SellerID: id, SellerNickname: userMap[id], DelayedShipments: delayed, OpenAfterSales: openAfterSales, RejectedProducts: rejected, RiskScore: score, RiskReason: reason})
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].RiskScore == items[j].RiskScore {
			return items[i].SellerID < items[j].SellerID
		}
		return items[i].RiskScore > items[j].RiskScore
	})
	if len(items) > 5 {
		items = items[:5]
	}
	return items, nil
}

func (s *AdminService) buildRiskBuyers() ([]AdminRiskBuyerItem, error) {
	type metricRow struct {
		UserID uint64 `gorm:"column:user_id"`
		Count  int64  `gorm:"column:count"`
	}
	var cancelledRows []metricRow
	if err := s.db.Table("orders").Select("buyer_id AS user_id, COUNT(*) AS count").Where("status = ?", "cancelled").Group("buyer_id").Scan(&cancelledRows).Error; err != nil {
		return nil, err
	}
	var afterSaleRows []metricRow
	if err := s.db.Table("after_sales").Select("buyer_id AS user_id, COUNT(*) AS count").Where("status IN ?", []string{"open", "processing"}).Group("buyer_id").Scan(&afterSaleRows).Error; err != nil {
		return nil, err
	}
	cancelledMap := map[uint64]int64{}
	afterSaleMap := map[uint64]int64{}
	userIDs := map[uint64]struct{}{}
	for _, row := range cancelledRows {
		cancelledMap[row.UserID] = row.Count
		userIDs[row.UserID] = struct{}{}
	}
	for _, row := range afterSaleRows {
		afterSaleMap[row.UserID] = row.Count
		userIDs[row.UserID] = struct{}{}
	}
	ids := make([]uint64, 0, len(userIDs))
	for id := range userIDs {
		ids = append(ids, id)
	}
	if len(ids) == 0 {
		return []AdminRiskBuyerItem{}, nil
	}
	var users []model.User
	if err := s.db.Select("id, nickname").Where("id IN ?", ids).Find(&users).Error; err != nil {
		return nil, err
	}
	userMap := map[uint64]string{}
	for _, user := range users {
		userMap[user.ID] = user.Nickname
	}
	items := make([]AdminRiskBuyerItem, 0, len(ids))
	for _, id := range ids {
		cancelled := cancelledMap[id]
		openAfterSales := afterSaleMap[id]
		score := cancelled*2 + openAfterSales*2
		if score <= 0 {
			continue
		}
		reason := "交易行为整体需要持续观察"
		if openAfterSales >= cancelled {
			reason = "售后申请频率较高，建议复核争议是否集中在特定品类"
		} else {
			reason = "取消订单偏多，建议确认下单意图和支付完成度"
		}
		items = append(items, AdminRiskBuyerItem{BuyerID: id, BuyerNickname: userMap[id], CancelledOrders: cancelled, OpenAfterSales: openAfterSales, RiskScore: score, RiskReason: reason})
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].RiskScore == items[j].RiskScore {
			return items[i].BuyerID < items[j].BuyerID
		}
		return items[i].RiskScore > items[j].RiskScore
	})
	if len(items) > 5 {
		items = items[:5]
	}
	return items, nil
}

func writeCSV(rows [][]string) ([]byte, error) {
	buffer := &bytes.Buffer{}
	buffer.Write([]byte{0xEF, 0xBB, 0xBF})
	writer := csv.NewWriter(buffer)
	for _, row := range rows {
		if err := writer.Write(row); err != nil {
			return nil, err
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}
	return buffer.Bytes(), nil
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func timeValue(value time.Time) string {
	if value.IsZero() {
		return ""
	}
	return value.Format("2006-01-02 15:04:05")
}

func (s *AdminService) ExportOrdersCSV(query AdminOrderListQuery) ([]byte, error) {
	items, err := s.ListOrders(query)
	if err != nil {
		return nil, err
	}
	rows := [][]string{{"订单ID", "订单号", "商品ID", "商品标题", "买家", "卖家", "订单金额(分)", "运费(分)", "币种", "订单状态", "收货区域", "收货地址", "物流公司", "物流单号", "售后状态", "创建时间"}}
	for _, item := range items {
		rows = append(rows, []string{
			strconv.FormatUint(item.ID, 10),
			item.OrderNo,
			strconv.FormatUint(item.ProductID, 10),
			item.ProductTitle,
			item.BuyerNickname,
			item.SellerNickname,
			strconv.FormatInt(item.TotalAmount, 10),
			strconv.FormatInt(item.ShippingFee, 10),
			item.Currency,
			item.Status,
			item.ReceiverRegion,
			item.ReceiverAddress,
			stringValue(item.Carrier),
			stringValue(item.TrackingNo),
			stringValue(item.AfterSaleStatus),
			timeValue(item.CreatedAt),
		})
	}
	return writeCSV(rows)
}

func (s *AdminService) ExportAfterSalesCSV(query AdminAfterSaleListQuery) ([]byte, error) {
	items, err := s.ListAfterSales(query)
	if err != nil {
		return nil, err
	}
	rows := [][]string{{"工单ID", "订单ID", "订单号", "商品ID", "商品标题", "买家", "卖家", "售后类型", "售后状态", "原因", "详情", "申请金额(分)", "币种", "处理备注", "创建时间", "更新时间"}}
	for _, item := range items {
		rows = append(rows, []string{
			strconv.FormatUint(item.ID, 10),
			strconv.FormatUint(item.OrderID, 10),
			item.OrderNo,
			strconv.FormatUint(item.ProductID, 10),
			item.ProductTitle,
			item.BuyerNickname,
			item.SellerNickname,
			item.Type,
			item.Status,
			item.Reason,
			stringValue(item.Detail),
			strconv.FormatInt(item.RequestedAmount, 10),
			item.Currency,
			stringValue(item.ResolutionNote),
			timeValue(item.CreatedAt),
			timeValue(item.UpdatedAt),
		})
	}
	return writeCSV(rows)
}

func levelByMetric(value int64, highThreshold, mediumThreshold int64) string {
	switch {
	case value >= highThreshold:
		return "high"
	case value >= mediumThreshold:
		return "medium"
	default:
		return "low"
	}
}

func (s *AdminService) ListUsers(queryInput AdminUserListQuery) ([]AdminUserItem, error) {
	query := s.db.Model(&model.User{})
	if strings.TrimSpace(queryInput.Keyword) != "" {
		kw := "%" + strings.TrimSpace(queryInput.Keyword) + "%"
		query = query.Where("nickname LIKE ? OR email LIKE ?", kw, kw)
	}
	if strings.TrimSpace(queryInput.Role) != "" {
		query = query.Where("role = ?", strings.TrimSpace(queryInput.Role))
	}
	if strings.TrimSpace(queryInput.Status) != "" {
		query = query.Where("status = ?", strings.TrimSpace(queryInput.Status))
	}
	var items []AdminUserItem
	if err := query.Select("id, email, nickname, preferred_language, role, status, created_at").Order("created_at desc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *AdminService) UpdateUserStatus(actorID, userID uint64, status string) (*model.User, error) {
	status = strings.TrimSpace(status)
	if status == "" {
		return nil, errors.New("status is required")
	}
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	user.Status = status
	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}
	link := "/me/settings"
	_ = s.deliverTemplatedNotification(
		[]uint64{user.ID},
		s.notificationTemplateCandidates("user.status.updated", []string{"账号状态变更通知"}),
		"system",
		"账号状态已更新",
		"你的 Turno 账号状态已更新为 {{status_text}}，如有疑问请联系平台客服。",
		&link,
		map[string]string{"user_nickname": user.Nickname, "status": user.Status, "status_text": user.Status},
	)
	if err := s.logAction(actorID, "user.status.updated", "user", user.ID, user.Nickname, fmt.Sprintf("将用户状态更新为 %s", user.Status)); err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AdminService) BatchUpdateUserStatus(actorID uint64, input AdminBatchStatusInput) (*AdminBatchResult, error) {
	ids := uniqueUint64(input.IDs)
	if len(ids) == 0 {
		return nil, errors.New("ids is required")
	}
	result := &AdminBatchResult{}
	for _, id := range ids {
		if _, err := s.UpdateUserStatus(actorID, id, input.Status); err != nil {
			result.FailedItems = append(result.FailedItems, AdminBatchFailureItem{ID: id, Reason: err.Error()})
			continue
		}
		result.UpdatedCount++
		result.SucceededIDs = append(result.SucceededIDs, id)
	}
	return result, nil
}

func (s *AdminService) ListProducts(queryInput AdminProductListQuery) ([]AdminProductItem, error) {
	query := s.db.Table("products").Joins("LEFT JOIN users ON users.id = products.seller_id")
	if strings.TrimSpace(queryInput.Keyword) != "" {
		kw := "%" + strings.TrimSpace(queryInput.Keyword) + "%"
		query = query.Where("products.title LIKE ? OR users.nickname LIKE ?", kw, kw)
	}
	if strings.TrimSpace(queryInput.Status) != "" {
		query = query.Where("products.status = ?", strings.TrimSpace(queryInput.Status))
	}
	if queryInput.CategoryID != nil {
		query = query.Where("products.category_id = ?", *queryInput.CategoryID)
	}
	if queryInput.SellerID != nil {
		query = query.Where("products.seller_id = ?", *queryInput.SellerID)
	}
	if queryInput.MinPrice != nil {
		query = query.Where("products.price >= ?", *queryInput.MinPrice)
	}
	if queryInput.MaxPrice != nil {
		query = query.Where("products.price <= ?", *queryInput.MaxPrice)
	}
	var items []AdminProductItem
	if err := query.
		Select("products.id, products.title, products.seller_id, users.nickname AS seller_nickname, products.category_id, products.price, products.currency, products.status, products.favorite_count, products.created_at").
		Order("products.created_at desc").
		Scan(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *AdminService) UpdateProductStatus(actorID, productID uint64, status string) (*model.Product, error) {
	status = strings.TrimSpace(status)
	if status == "" {
		return nil, errors.New("status is required")
	}
	var product model.Product
	if err := s.db.First(&product, productID).Error; err != nil {
		return nil, err
	}
	product.Status = status
	if err := s.db.Save(&product).Error; err != nil {
		return nil, err
	}
	var seller model.User
	if err := s.db.Select("id, nickname").First(&seller, product.SellerID).Error; err == nil {
		link := fmt.Sprintf("/products/%d", product.ID)
		fallbackTitle := "商品状态已更新"
		fallbackContent := "你的商品《{{product_title}}》状态已更新为 {{status_text}}。"
		templates := []string{"商品状态更新通知"}
		switch product.Status {
		case "active":
			fallbackTitle = "你的商品已通过审核"
			fallbackContent = "商品《{{product_title}}》已恢复在售，可继续等待买家咨询和下单。"
			templates = []string{"商品审核通过通知", "商品状态更新通知"}
		case "rejected":
			fallbackTitle = "你的商品审核未通过"
			fallbackContent = "商品《{{product_title}}》已被平台驳回，请检查描述、图片或类目后重新提交。"
			templates = []string{"商品审核驳回通知", "商品状态更新通知"}
		case "archived":
			fallbackTitle = "你的商品已被归档"
			fallbackContent = "商品《{{product_title}}》已从公开货架移除，如需恢复请联系平台运营。"
			templates = []string{"商品归档通知", "商品状态更新通知"}
		}
		_ = s.deliverTemplatedNotification([]uint64{seller.ID}, s.notificationTemplateCandidates("product.status.updated", templates), "system", fallbackTitle, fallbackContent, &link, map[string]string{"product_title": product.Title, "product_id": strconv.FormatUint(product.ID, 10), "status": product.Status, "status_text": product.Status, "seller_nickname": seller.Nickname})
	}
	if err := s.logAction(actorID, "product.status.updated", "product", product.ID, product.Title, fmt.Sprintf("将商品状态更新为 %s", product.Status)); err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *AdminService) BatchUpdateProductStatus(actorID uint64, input AdminBatchStatusInput) (*AdminBatchResult, error) {
	ids := uniqueUint64(input.IDs)
	if len(ids) == 0 {
		return nil, errors.New("ids is required")
	}
	result := &AdminBatchResult{}
	for _, id := range ids {
		if _, err := s.UpdateProductStatus(actorID, id, input.Status); err != nil {
			result.FailedItems = append(result.FailedItems, AdminBatchFailureItem{ID: id, Reason: err.Error()})
			continue
		}
		result.UpdatedCount++
		result.SucceededIDs = append(result.SucceededIDs, id)
	}
	return result, nil
}

func (s *AdminService) ListOrders(queryInput AdminOrderListQuery) ([]AdminOrderItem, error) {
	query := s.db.Table("orders").
		Joins("LEFT JOIN users buyer ON buyer.id = orders.buyer_id").
		Joins("LEFT JOIN users seller ON seller.id = orders.seller_id").
		Joins("LEFT JOIN products ON products.id = orders.product_id").
		Joins("LEFT JOIN shipments ON shipments.order_id = orders.id")
	if strings.TrimSpace(queryInput.Keyword) != "" {
		kw := "%" + strings.TrimSpace(queryInput.Keyword) + "%"
		query = query.Where("orders.order_no LIKE ? OR buyer.nickname LIKE ? OR seller.nickname LIKE ? OR products.title LIKE ?", kw, kw, kw, kw)
	}
	if strings.TrimSpace(queryInput.Status) != "" {
		query = query.Where("orders.status = ?", strings.TrimSpace(queryInput.Status))
	}
	if queryInput.MinAmount != nil {
		query = query.Where("orders.total_amount >= ?", *queryInput.MinAmount)
	}
	if queryInput.MaxAmount != nil {
		query = query.Where("orders.total_amount <= ?", *queryInput.MaxAmount)
	}
	if queryInput.StartDate != nil {
		query = query.Where("orders.created_at >= ?", *queryInput.StartDate)
	}
	if queryInput.EndDate != nil {
		query = query.Where("orders.created_at <= ?", *queryInput.EndDate)
	}
	if queryInput.HasAfterSale != nil {
		if *queryInput.HasAfterSale {
			query = query.Where("EXISTS (SELECT 1 FROM after_sales WHERE after_sales.order_id = orders.id)")
		} else {
			query = query.Where("NOT EXISTS (SELECT 1 FROM after_sales WHERE after_sales.order_id = orders.id)")
		}
	}
	if queryInput.DelayedShipment != nil && *queryInput.DelayedShipment {
		delayedThreshold := time.Now().Add(-2 * time.Hour)
		query = query.Where("orders.status = ? AND orders.created_at <= ?", "paid", delayedThreshold)
	}
	var items []AdminOrderItem
	if err := query.
		Select("orders.id, orders.order_no, orders.product_id, products.title AS product_title, orders.buyer_id, buyer.nickname AS buyer_nickname, orders.seller_id, seller.nickname AS seller_nickname, orders.total_amount, orders.shipping_fee, orders.currency, orders.status, orders.receiver_region, orders.receiver_address, shipments.carrier, shipments.tracking_no, (SELECT status FROM after_sales WHERE after_sales.order_id = orders.id ORDER BY updated_at DESC, id DESC LIMIT 1) AS after_sale_status, orders.created_at").
		Order("orders.created_at desc").
		Scan(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *AdminService) OrderDetail(orderID uint64) (*AdminOrderDetail, error) {
	var row struct {
		ID              uint64
		OrderNo         string
		Status          string
		TotalAmount     int64
		ShippingFee     int64
		Currency        string
		CreatedAt       time.Time
		UpdatedAt       time.Time
		ProductID       uint64
		ProductTitle    string
		ProductStatus   string
		ProductImageURL *string
		BuyerID         uint64
		BuyerNickname   string
		BuyerEmail      *string
		BuyerStatus     string
		SellerID        uint64
		SellerNickname  string
		SellerEmail     *string
		SellerStatus    string
		ReceiverName    string
		ReceiverPhone   string
		ReceiverRegion  string
		ReceiverAddress string
		Carrier         *string
		TrackingNo      *string
		ShipmentStatus  *string
	}

	err := s.db.Table("orders").
		Joins("LEFT JOIN products ON products.id = orders.product_id").
		Joins("LEFT JOIN product_images ON product_images.product_id = products.id AND product_images.sort_order = 0").
		Joins("LEFT JOIN users buyer ON buyer.id = orders.buyer_id").
		Joins("LEFT JOIN users seller ON seller.id = orders.seller_id").
		Joins("LEFT JOIN shipments ON shipments.order_id = orders.id").
		Select("orders.id, orders.order_no, orders.status, orders.total_amount, orders.shipping_fee, orders.currency, orders.created_at, orders.updated_at, orders.product_id, products.title AS product_title, products.status AS product_status, product_images.url AS product_image_url, orders.buyer_id, buyer.nickname AS buyer_nickname, buyer.email AS buyer_email, buyer.status AS buyer_status, orders.seller_id, seller.nickname AS seller_nickname, seller.email AS seller_email, seller.status AS seller_status, orders.receiver_name, orders.receiver_phone, orders.receiver_region, orders.receiver_address, shipments.carrier, shipments.tracking_no, shipments.status AS shipment_status").
		Where("orders.id = ?", orderID).
		Take(&row).Error
	if err != nil {
		return nil, err
	}

	var afterSales []AdminOrderAfterSaleItem
	if err := s.db.Table("after_sales").
		Select("id, type, status, reason, requested_amount, currency, resolution_note, updated_at").
		Where("order_id = ?", orderID).
		Order("updated_at desc").
		Scan(&afterSales).Error; err != nil {
		return nil, err
	}
	logsByAfterSaleID, err := s.listAfterSaleLogsMap(adminOrderAfterSaleIDs(afterSales))
	if err != nil {
		return nil, err
	}
	for index := range afterSales {
		afterSales[index].Logs = logsByAfterSaleID[afterSales[index].ID]
	}

	return &AdminOrderDetail{
		ID:              row.ID,
		OrderNo:         row.OrderNo,
		Status:          row.Status,
		TotalAmount:     row.TotalAmount,
		ShippingFee:     row.ShippingFee,
		Currency:        row.Currency,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
		ProductID:       row.ProductID,
		ProductTitle:    row.ProductTitle,
		ProductStatus:   row.ProductStatus,
		ProductImageURL: row.ProductImageURL,
		BuyerID:         row.BuyerID,
		BuyerNickname:   row.BuyerNickname,
		BuyerEmail:      row.BuyerEmail,
		BuyerStatus:     row.BuyerStatus,
		SellerID:        row.SellerID,
		SellerNickname:  row.SellerNickname,
		SellerEmail:     row.SellerEmail,
		SellerStatus:    row.SellerStatus,
		ReceiverName:    row.ReceiverName,
		ReceiverPhone:   row.ReceiverPhone,
		ReceiverRegion:  row.ReceiverRegion,
		ReceiverAddress: row.ReceiverAddress,
		Carrier:         row.Carrier,
		TrackingNo:      row.TrackingNo,
		ShipmentStatus:  row.ShipmentStatus,
		AfterSales:      afterSales,
	}, nil
}

func (s *AdminService) ListAfterSales(queryInput AdminAfterSaleListQuery) ([]AdminAfterSaleItem, error) {
	query := s.db.Table("after_sales").
		Joins("LEFT JOIN orders ON orders.id = after_sales.order_id").
		Joins("LEFT JOIN products ON products.id = after_sales.product_id").
		Joins("LEFT JOIN users buyer ON buyer.id = after_sales.buyer_id").
		Joins("LEFT JOIN users seller ON seller.id = after_sales.seller_id")
	if strings.TrimSpace(queryInput.Status) != "" {
		query = query.Where("after_sales.status = ?", strings.TrimSpace(queryInput.Status))
	}
	if strings.TrimSpace(queryInput.Type) != "" {
		query = query.Where("after_sales.type = ?", strings.TrimSpace(queryInput.Type))
	}
	var items []AdminAfterSaleItem
	if err := query.
		Select("after_sales.id, after_sales.order_id, orders.order_no, after_sales.product_id, products.title AS product_title, after_sales.buyer_id, buyer.nickname AS buyer_nickname, after_sales.seller_id, seller.nickname AS seller_nickname, after_sales.type, after_sales.status, after_sales.reason, after_sales.detail, after_sales.requested_amount, after_sales.currency, after_sales.resolution_note, after_sales.created_at, after_sales.updated_at").
		Order("after_sales.created_at desc").
		Scan(&items).Error; err != nil {
		return nil, err
	}
	logsByAfterSaleID, err := s.listAfterSaleLogsMap(adminAfterSaleIDs(items))
	if err != nil {
		return nil, err
	}
	for index := range items {
		items[index].Logs = logsByAfterSaleID[items[index].ID]
	}
	return items, nil
}

func (s *AdminService) UpdateAfterSaleStatus(actorID, afterSaleID uint64, input AdminAfterSaleUpdateInput) (*AdminAfterSaleItem, error) {
	if strings.TrimSpace(input.Status) == "" {
		return nil, errors.New("status is required")
	}
	var afterSale model.AfterSale
	if err := s.db.First(&afterSale, afterSaleID).Error; err != nil {
		return nil, err
	}
	status := strings.TrimSpace(input.Status)
	resolutionNote := strings.TrimSpace(input.ResolutionNote)
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		afterSale.Status = status
		if resolutionNote != "" {
			note := resolutionNote
			afterSale.ResolutionNote = &note
		}
		if err := tx.Save(&afterSale).Error; err != nil {
			return err
		}
		logNote := resolutionNote
		if logNote == "" {
			logNote = fmt.Sprintf("平台将工单状态更新为%s", afterSale.Status)
		}
		statusValue := afterSale.Status
		adminActorID := actorID
		return createAfterSaleLog(tx, afterSale.ID, &adminActorID, "admin", "admin_status_update", &statusValue, logNote)
	}); err != nil {
		return nil, err
	}
	var order model.Order
	if err := s.db.First(&order, afterSale.OrderID).Error; err == nil {
		link := fmt.Sprintf("/me/orders/%d", order.ID)
		variables := map[string]string{"order_no": order.OrderNo, "order_id": strconv.FormatUint(order.ID, 10), "status": afterSale.Status, "status_text": afterSale.Status, "reason": afterSale.Reason}
		_ = s.deliverTemplatedNotification([]uint64{afterSale.BuyerID, afterSale.SellerID}, s.notificationTemplateCandidates("after_sale.status.updated", []string{"售后状态更新通知", "售后协商提示"}), "after_sale", "售后处理进度已更新", "订单 {{order_no}} 的售后工单已更新为 {{status_text}}，请及时查看最新处理说明。", &link, variables)
	}
	if err := s.logAction(actorID, "after_sale.status.updated", "after_sale", afterSale.ID, afterSale.Reason, fmt.Sprintf("将售后状态更新为 %s", afterSale.Status)); err != nil {
		return nil, err
	}
	items, err := s.ListAfterSales(AdminAfterSaleListQuery{})
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		if item.ID == afterSaleID {
			return &item, nil
		}
	}
	return nil, gorm.ErrRecordNotFound
}

func adminAfterSaleIDs(items []AdminAfterSaleItem) []uint64 {
	ids := make([]uint64, 0, len(items))
	for _, item := range items {
		ids = append(ids, item.ID)
	}
	return ids
}

func adminOrderAfterSaleIDs(items []AdminOrderAfterSaleItem) []uint64 {
	ids := make([]uint64, 0, len(items))
	for _, item := range items {
		ids = append(ids, item.ID)
	}
	return ids
}

func (s *AdminService) listAfterSaleLogsMap(afterSaleIDs []uint64) (map[uint64][]AfterSaleLogItem, error) {
	ids := uniqueUint64(afterSaleIDs)
	result := make(map[uint64][]AfterSaleLogItem, len(ids))
	if len(ids) == 0 {
		return result, nil
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
		Where("after_sale_logs.after_sale_id IN ?", ids).
		Order("after_sale_logs.created_at asc, after_sale_logs.id asc").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		label := actorLabelByRole(row.ActorRole)
		if row.Nickname != nil && strings.TrimSpace(*row.Nickname) != "" {
			label = *row.Nickname
		}
		result[row.AfterSaleID] = append(result[row.AfterSaleID], AfterSaleLogItem{
			ID: row.ID, AfterSaleID: row.AfterSaleID, ActorID: row.ActorID, ActorRole: row.ActorRole,
			ActorLabel: label, Action: row.Action, Status: row.Status, Note: row.Note, CreatedAt: row.CreatedAt,
		})
	}
	return result, nil
}

func (s *AdminService) BatchUpdateAfterSaleStatus(actorID uint64, input AdminBatchAfterSaleInput) (*AdminBatchResult, error) {
	ids := uniqueUint64(input.IDs)
	if len(ids) == 0 {
		return nil, errors.New("ids is required")
	}
	result := &AdminBatchResult{}
	for _, id := range ids {
		if _, err := s.UpdateAfterSaleStatus(actorID, id, AdminAfterSaleUpdateInput{Status: input.Status, ResolutionNote: input.ResolutionNote}); err != nil {
			result.FailedItems = append(result.FailedItems, AdminBatchFailureItem{ID: id, Reason: err.Error()})
			continue
		}
		result.UpdatedCount++
		result.SucceededIDs = append(result.SucceededIDs, id)
	}
	return result, nil
}

func (s *AdminService) ListCategories() ([]AdminCategoryItem, error) {
	var categories []model.Category
	if err := s.db.Preload("I18n").Order("sort_order asc, id asc").Find(&categories).Error; err != nil {
		return nil, err
	}
	items := make([]AdminCategoryItem, 0, len(categories))
	for _, category := range categories {
		item := AdminCategoryItem{ID: category.ID, ParentID: category.ParentID, Slug: category.Slug, Status: category.Status, SortOrder: category.SortOrder, CreatedAt: category.CreatedAt}
		for _, translation := range category.I18n {
			switch translation.Language {
			case "zh-CN":
				item.NameZhCN = translation.Name
			case "en-US":
				item.NameEnUS = translation.Name
			}
		}
		items = append(items, item)
	}
	return items, nil
}

func (s *AdminService) UpdateCategory(actorID, categoryID uint64, input AdminCategoryUpdateInput) (*AdminCategoryItem, error) {
	var category model.Category
	if err := s.db.Preload("I18n").First(&category, categoryID).Error; err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.Status) == "" {
		return nil, errors.New("status is required")
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		category.Status = strings.TrimSpace(input.Status)
		category.SortOrder = input.SortOrder
		if err := tx.Save(&category).Error; err != nil {
			return err
		}
		translations := map[string]string{"zh-CN": strings.TrimSpace(input.NameZhCN), "en-US": strings.TrimSpace(input.NameEnUS)}
		for language, name := range translations {
			if name == "" {
				continue
			}
			var row model.CategoryI18n
			err := tx.Where("category_id = ? AND language = ?", category.ID, language).First(&row).Error
			if err != nil {
				if !errors.Is(err, gorm.ErrRecordNotFound) {
					return err
				}
				row = model.CategoryI18n{CategoryID: category.ID, Language: language, Name: name}
				if err := tx.Create(&row).Error; err != nil {
					return err
				}
				continue
			}
			row.Name = name
			if err := tx.Save(&row).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}
	if err := s.logAction(actorID, "category.updated", "category", category.ID, category.Slug, fmt.Sprintf("更新分类文案与状态为 %s", category.Status)); err != nil {
		return nil, err
	}
	items, err := s.ListCategories()
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		if item.ID == categoryID {
			return &item, nil
		}
	}
	return nil, gorm.ErrRecordNotFound
}
