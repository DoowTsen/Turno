package model

import "time"

type User struct {
	ID                uint64    `gorm:"primaryKey" json:"id"`
	Email             *string   `gorm:"size:191;uniqueIndex" json:"email,omitempty"`
	Phone             *string   `gorm:"size:32;uniqueIndex" json:"phone,omitempty"`
	PasswordHash      string    `gorm:"size:255;not null" json:"-"`
	Nickname          string    `gorm:"size:64;not null" json:"nickname"`
	AvatarURL         *string   `gorm:"size:255" json:"avatarUrl,omitempty"`
	PreferredLanguage string    `gorm:"size:16;not null;default:zh-CN" json:"preferredLanguage"`
	Role              string    `gorm:"size:16;not null;default:user" json:"role"`
	Status            string    `gorm:"size:16;not null;default:active" json:"status"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

func (User) TableName() string { return "users" }

type UserAddress struct {
	ID            uint64    `gorm:"primaryKey" json:"id"`
	UserID        uint64    `gorm:"index;not null" json:"userId"`
	ReceiverName  string    `gorm:"size:64;not null" json:"receiverName"`
	ReceiverPhone string    `gorm:"size:32;not null" json:"receiverPhone"`
	Province      string    `gorm:"size:64;not null" json:"province"`
	City          string    `gorm:"size:64;not null" json:"city"`
	District      string    `gorm:"size:64;not null" json:"district"`
	DetailAddress string    `gorm:"size:255;not null" json:"detailAddress"`
	IsDefault     bool      `gorm:"not null;default:false" json:"isDefault"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (UserAddress) TableName() string { return "user_addresses" }

type Category struct {
	ID        uint64         `gorm:"primaryKey" json:"id"`
	ParentID  *uint64        `gorm:"index" json:"parentId,omitempty"`
	Slug      string         `gorm:"size:128;uniqueIndex;not null" json:"slug"`
	SortOrder int            `gorm:"not null;default:0" json:"sortOrder"`
	Status    string         `gorm:"size:16;not null;default:active" json:"status"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	I18n      []CategoryI18n `gorm:"foreignKey:CategoryID" json:"i18n,omitempty"`
}

func (Category) TableName() string { return "categories" }

type CategoryI18n struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	CategoryID uint64    `gorm:"uniqueIndex:uk_category_language;not null" json:"categoryId"`
	Language   string    `gorm:"size:16;uniqueIndex:uk_category_language;not null" json:"language"`
	Name       string    `gorm:"size:128;not null" json:"name"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func (CategoryI18n) TableName() string { return "category_i18n" }

type Product struct {
	ID             uint64         `gorm:"primaryKey" json:"id"`
	SellerID       uint64         `gorm:"index;not null" json:"sellerId"`
	CategoryID     uint64         `gorm:"index;not null" json:"categoryId"`
	Title          string         `gorm:"size:191;not null" json:"title"`
	Description    string         `gorm:"type:text;not null" json:"description"`
	Price          int64          `gorm:"not null" json:"price"`
	Currency       string         `gorm:"size:8;not null;default:CNY" json:"currency"`
	ConditionLevel string         `gorm:"size:32;not null;default:good" json:"conditionLevel"`
	City           *string        `gorm:"size:64" json:"city,omitempty"`
	ShippingFee    int64          `gorm:"not null;default:0" json:"shippingFee"`
	Status         string         `gorm:"size:16;not null;default:active" json:"status"`
	ViewCount      int64          `gorm:"not null;default:0" json:"viewCount"`
	FavoriteCount  int64          `gorm:"not null;default:0" json:"favoriteCount"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	Images         []ProductImage `gorm:"foreignKey:ProductID" json:"images,omitempty"`
}

func (Product) TableName() string { return "products" }

type ProductImage struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	ProductID uint64    `gorm:"index;not null" json:"productId"`
	URL       string    `gorm:"size:255;not null" json:"url"`
	SortOrder int       `gorm:"not null;default:0" json:"sortOrder"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (ProductImage) TableName() string { return "product_images" }

type Favorite struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	UserID    uint64    `gorm:"uniqueIndex:uk_user_product;not null" json:"userId"`
	ProductID uint64    `gorm:"uniqueIndex:uk_user_product;not null" json:"productId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Favorite) TableName() string { return "favorites" }

type Order struct {
	ID              uint64    `gorm:"primaryKey" json:"id"`
	OrderNo         string    `gorm:"size:64;uniqueIndex;not null" json:"orderNo"`
	BuyerID         uint64    `gorm:"index;not null" json:"buyerId"`
	SellerID        uint64    `gorm:"index;not null" json:"sellerId"`
	ProductID       uint64    `gorm:"index;not null" json:"productId"`
	TotalAmount     int64     `gorm:"not null" json:"totalAmount"`
	ShippingFee     int64     `gorm:"not null;default:0" json:"shippingFee"`
	Currency        string    `gorm:"size:8;not null;default:CNY" json:"currency"`
	Status          string    `gorm:"size:32;not null;default:paid" json:"status"`
	ReceiverName    string    `gorm:"size:64;not null" json:"receiverName"`
	ReceiverPhone   string    `gorm:"size:32;not null" json:"receiverPhone"`
	ReceiverRegion  string    `gorm:"size:255;not null" json:"receiverRegion"`
	ReceiverAddress string    `gorm:"size:255;not null" json:"receiverAddress"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	Shipment        *Shipment `gorm:"foreignKey:OrderID" json:"shipment,omitempty"`
}

func (Order) TableName() string { return "orders" }

type Shipment struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	OrderID    uint64    `gorm:"uniqueIndex;not null" json:"orderId"`
	Carrier    string    `gorm:"size:64;not null" json:"carrier"`
	TrackingNo string    `gorm:"size:128;not null" json:"trackingNo"`
	Status     string    `gorm:"size:32;not null;default:shipped" json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func (Shipment) TableName() string { return "shipments" }

type Review struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	OrderID    uint64    `gorm:"index;not null" json:"orderId"`
	ProductID  uint64    `gorm:"index;not null" json:"productId"`
	ReviewerID uint64    `gorm:"not null" json:"reviewerId"`
	RevieweeID uint64    `gorm:"index;not null" json:"revieweeId"`
	Role       string    `gorm:"size:16;not null" json:"role"`
	Score      int       `gorm:"not null" json:"score"`
	Content    *string   `gorm:"size:500" json:"content,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func (Review) TableName() string { return "reviews" }

type Conversation struct {
	ID               uint64     `gorm:"primaryKey" json:"id"`
	ProductID        uint64     `gorm:"uniqueIndex:uk_conversation_product_buyer_seller;not null" json:"productId"`
	BuyerID          uint64     `gorm:"uniqueIndex:uk_conversation_product_buyer_seller;index;not null" json:"buyerId"`
	SellerID         uint64     `gorm:"uniqueIndex:uk_conversation_product_buyer_seller;index;not null" json:"sellerId"`
	LastMessage      *string    `gorm:"size:500" json:"lastMessage,omitempty"`
	LastMessageAt    *time.Time `json:"lastMessageAt,omitempty"`
	BuyerLastReadAt  *time.Time `json:"buyerLastReadAt,omitempty"`
	SellerLastReadAt *time.Time `json:"sellerLastReadAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

func (Conversation) TableName() string { return "conversations" }

type Message struct {
	ID             uint64    `gorm:"primaryKey" json:"id"`
	ConversationID uint64    `gorm:"index;not null" json:"conversationId"`
	SenderID       uint64    `gorm:"index;not null" json:"senderId"`
	Content        string    `gorm:"size:1000;not null" json:"content"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func (Message) TableName() string { return "messages" }

type AfterSale struct {
	ID                 uint64     `gorm:"primaryKey" json:"id"`
	OrderID            uint64     `gorm:"index;not null" json:"orderId"`
	BuyerID            uint64     `gorm:"index;not null" json:"buyerId"`
	SellerID           uint64     `gorm:"index;not null" json:"sellerId"`
	ProductID          uint64     `gorm:"index;not null" json:"productId"`
	Type               string     `gorm:"size:32;not null;default:refund" json:"type"`
	Status             string     `gorm:"size:32;not null;default:open" json:"status"`
	Reason             string     `gorm:"size:255;not null" json:"reason"`
	Detail             *string    `gorm:"size:1000" json:"detail,omitempty"`
	RequestedAmount    int64      `gorm:"not null;default:0" json:"requestedAmount"`
	Currency           string     `gorm:"size:8;not null;default:CNY" json:"currency"`
	SellerResponseNote *string    `gorm:"size:1000" json:"sellerResponseNote,omitempty"`
	SellerRespondedAt  *time.Time `json:"sellerRespondedAt,omitempty"`
	ResolutionNote     *string    `gorm:"size:500" json:"resolutionNote,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

func (AfterSale) TableName() string { return "after_sales" }

type AfterSaleLog struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	AfterSaleID uint64    `gorm:"index;not null" json:"afterSaleId"`
	ActorID     *uint64   `gorm:"index" json:"actorId,omitempty"`
	ActorRole   string    `gorm:"size:32;index;not null" json:"actorRole"`
	Action      string    `gorm:"size:64;index;not null" json:"action"`
	Status      *string   `gorm:"size:32" json:"status,omitempty"`
	Note        string    `gorm:"size:1000;not null" json:"note"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (AfterSaleLog) TableName() string { return "after_sale_logs" }


type Notification struct {
	ID        uint64     `gorm:"primaryKey" json:"id"`
	UserID    uint64     `gorm:"index;not null" json:"userId"`
	Type      string     `gorm:"size:32;index;not null" json:"type"`
	Title     string     `gorm:"size:191;not null" json:"title"`
	Content   string     `gorm:"size:1000;not null" json:"content"`
	Link      *string    `gorm:"size:255" json:"link,omitempty"`
	IsRead    bool       `gorm:"not null;default:false" json:"isRead"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

func (Notification) TableName() string { return "notifications" }

type NotificationTemplate struct {
	ID              uint64    `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"size:128;uniqueIndex;not null" json:"name"`
	Type            string    `gorm:"size:32;index;not null" json:"type"`
	TitleTemplate   string    `gorm:"size:191;not null" json:"titleTemplate"`
	ContentTemplate string    `gorm:"size:1000;not null" json:"contentTemplate"`
	DefaultLink     *string   `gorm:"size:255" json:"defaultLink,omitempty"`
	Status          string    `gorm:"size:16;not null;default:active" json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (NotificationTemplate) TableName() string { return "notification_templates" }

type PlatformConfig struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	Key       string    `gorm:"size:128;uniqueIndex;not null" json:"key"`
	Value     string    `gorm:"type:text;not null" json:"value"`
	UpdatedBy *uint64   `gorm:"index" json:"updatedBy,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (PlatformConfig) TableName() string { return "platform_configs" }

type AdminAuditLog struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	ActorID     uint64    `gorm:"index;not null" json:"actorId"`
	Action      string    `gorm:"size:64;index;not null" json:"action"`
	TargetType  string    `gorm:"size:64;index;not null" json:"targetType"`
	TargetID    uint64    `gorm:"index;not null" json:"targetId"`
	TargetLabel *string   `gorm:"size:191" json:"targetLabel,omitempty"`
	Detail      string    `gorm:"size:1000;not null" json:"detail"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (AdminAuditLog) TableName() string { return "admin_audit_logs" }

