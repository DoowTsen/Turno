package service

import (
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

func newAdminServiceTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(
		&model.User{},
		&model.Product{},
		&model.Order{},
		&model.Shipment{},
		&model.AfterSale{},
		&model.AfterSaleLog{},
		&model.Notification{},
		&model.NotificationTemplate{},
		&model.PlatformConfig{},
		&model.AdminAuditLog{},
	); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}
	return db
}

func TestAdminServiceGetHomeConfigFallsBackToDefault(t *testing.T) {
	db := newAdminServiceTestDB(t)
	service := NewAdminService(db)

	config, err := service.GetHomeConfig()
	if err != nil {
		t.Fatalf("GetHomeConfig returned error: %v", err)
	}
	if config == nil {
		t.Fatal("expected config, got nil")
	}
	if config.HeroTitle == "" || len(config.Banners) == 0 {
		t.Fatalf("expected default home config, got %+v", config)
	}
}

func TestAdminServiceSaveHomeConfigPersistsValue(t *testing.T) {
	db := newAdminServiceTestDB(t)
	service := NewAdminService(db)

	input := defaultAdminHomeConfig()
	input.HeroTitle = "运营配置后的首页标题"
	input.PrimaryCtaText = "立即逛逛"

	saved, err := service.SaveHomeConfig(7, input)
	if err != nil {
		t.Fatalf("SaveHomeConfig returned error: %v", err)
	}
	if saved.HeroTitle != input.HeroTitle {
		t.Fatalf("expected hero title %q, got %q", input.HeroTitle, saved.HeroTitle)
	}

	reloaded, err := service.GetHomeConfig()
	if err != nil {
		t.Fatalf("GetHomeConfig after save returned error: %v", err)
	}
	if reloaded.HeroTitle != input.HeroTitle {
		t.Fatalf("expected persisted hero title %q, got %q", input.HeroTitle, reloaded.HeroTitle)
	}

	var count int64
	if err := db.Model(&model.AdminAuditLog{}).Where("action = ?", "home_config.updated").Count(&count).Error; err != nil {
		t.Fatalf("count audit logs: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 audit log, got %d", count)
	}
}

func TestNotificationTemplateCandidatesPreferBoundTemplate(t *testing.T) {
	db := newAdminServiceTestDB(t)
	service := NewAdminService(db)

	template := model.NotificationTemplate{
		Name:            "自定义售后模板",
		Type:            "after_sale",
		TitleTemplate:   "售后状态更新",
		ContentTemplate: "售后状态已变更",
		Status:          "active",
	}
	if err := db.Create(&template).Error; err != nil {
		t.Fatalf("create template: %v", err)
	}

	bindings, err := service.SaveActionTemplateBindings(1, []AdminActionTemplateBinding{{
		ActionKey:     "after_sale.status.updated",
		TemplateID:    &template.ID,
		FallbackNames: []string{"售后状态更新通知"},
	}})
	if err != nil {
		t.Fatalf("SaveActionTemplateBindings returned error: %v", err)
	}
	if len(bindings) == 0 {
		t.Fatal("expected bindings to be saved")
	}

	candidates := service.notificationTemplateCandidates("after_sale.status.updated", []string{"售后状态更新通知"})
	if len(candidates) == 0 || candidates[0] != template.Name {
		t.Fatalf("expected first candidate %q, got %+v", template.Name, candidates)
	}
}

func TestBatchUpdateUserStatusCollectsFailures(t *testing.T) {
	db := newAdminServiceTestDB(t)
	service := NewAdminService(db)

	user := model.User{
		Nickname:          "Turno Tester",
		PasswordHash:      "hash",
		PreferredLanguage: "zh-CN",
		Role:              "user",
		Status:            "active",
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}

	result, err := service.BatchUpdateUserStatus(99, AdminBatchStatusInput{
		IDs:    []uint64{user.ID, 999999},
		Status: "suspended",
	})
	if err != nil {
		t.Fatalf("BatchUpdateUserStatus returned error: %v", err)
	}
	if result.UpdatedCount != 1 {
		t.Fatalf("expected updatedCount 1, got %d", result.UpdatedCount)
	}
	if len(result.SucceededIDs) != 1 || result.SucceededIDs[0] != user.ID {
		t.Fatalf("unexpected succeeded ids: %+v", result.SucceededIDs)
	}
	if len(result.FailedItems) != 1 || result.FailedItems[0].ID != 999999 {
		t.Fatalf("unexpected failed items: %+v", result.FailedItems)
	}

	var reloaded model.User
	if err := db.First(&reloaded, user.ID).Error; err != nil {
		t.Fatalf("reload user: %v", err)
	}
	if reloaded.Status != "suspended" {
		t.Fatalf("expected user status suspended, got %s", reloaded.Status)
	}
}

func TestAdminServiceExportOrdersCSVRespectsFilters(t *testing.T) {
	db := newAdminServiceTestDB(t)
	service := NewAdminService(db)

	buyerEmail := "buyer@test.local"
	sellerEmail := "seller@test.local"
	buyer := model.User{Email: &buyerEmail, PasswordHash: "hash", Nickname: "买家甲", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	seller := model.User{Email: &sellerEmail, PasswordHash: "hash", Nickname: "卖家乙", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	if err := db.Create(&buyer).Error; err != nil {
		t.Fatalf("create buyer: %v", err)
	}
	if err := db.Create(&seller).Error; err != nil {
		t.Fatalf("create seller: %v", err)
	}

	productA := model.Product{SellerID: seller.ID, CategoryID: 1, Title: "MacBook Pro 16", Description: "A", Price: 880000, Currency: "CNY", ConditionLevel: "good", ShippingFee: 1200, Status: "active"}
	productB := model.Product{SellerID: seller.ID, CategoryID: 1, Title: "机械键盘", Description: "B", Price: 12000, Currency: "CNY", ConditionLevel: "good", ShippingFee: 800, Status: "active"}
	if err := db.Create(&productA).Error; err != nil {
		t.Fatalf("create productA: %v", err)
	}
	if err := db.Create(&productB).Error; err != nil {
		t.Fatalf("create productB: %v", err)
	}

	oldPaidAt := time.Now().Add(-3 * time.Hour)
	recentPaidAt := time.Now().Add(-30 * time.Minute)
	orderA := model.Order{OrderNo: "ORD-EXPORT-A", BuyerID: buyer.ID, SellerID: seller.ID, ProductID: productA.ID, TotalAmount: 880000, ShippingFee: 1200, Currency: "CNY", Status: "paid", ReceiverName: "张三", ReceiverPhone: "13800000000", ReceiverRegion: "上海", ReceiverAddress: "测试路 1 号", CreatedAt: oldPaidAt, UpdatedAt: oldPaidAt}
	orderB := model.Order{OrderNo: "ORD-EXPORT-B", BuyerID: buyer.ID, SellerID: seller.ID, ProductID: productB.ID, TotalAmount: 12000, ShippingFee: 800, Currency: "CNY", Status: "completed", ReceiverName: "李四", ReceiverPhone: "13900000000", ReceiverRegion: "北京", ReceiverAddress: "测试路 2 号", CreatedAt: recentPaidAt, UpdatedAt: recentPaidAt}
	if err := db.Create(&orderA).Error; err != nil {
		t.Fatalf("create orderA: %v", err)
	}
	if err := db.Create(&orderB).Error; err != nil {
		t.Fatalf("create orderB: %v", err)
	}

	afterSale := model.AfterSale{OrderID: orderA.ID, BuyerID: buyer.ID, SellerID: seller.ID, ProductID: productA.ID, Type: "refund", Status: "open", Reason: "描述不符", RequestedAmount: 5000, Currency: "CNY"}
	if err := db.Create(&afterSale).Error; err != nil {
		t.Fatalf("create afterSale: %v", err)
	}

	content, err := service.ExportOrdersCSV(AdminOrderListQuery{Keyword: "MacBook", MinAmount: int64Ptr(100000), HasAfterSale: boolPtr(true), DelayedShipment: boolPtr(true)})
	if err != nil {
		t.Fatalf("ExportOrdersCSV returned error: %v", err)
	}
	contentText := string(content)
	if !strings.Contains(contentText, "ORD-EXPORT-A") {
		t.Fatalf("expected export to contain order A, got %s", contentText)
	}
	if strings.Contains(contentText, "ORD-EXPORT-B") {
		t.Fatalf("expected export to exclude order B, got %s", contentText)
	}
}

func TestAdminServiceExportAfterSalesCSVRespectsTypeFilter(t *testing.T) {
	db := newAdminServiceTestDB(t)
	service := NewAdminService(db)

	buyerEmail := "buyer2@test.local"
	sellerEmail := "seller2@test.local"
	buyer := model.User{Email: &buyerEmail, PasswordHash: "hash", Nickname: "买家二号", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	seller := model.User{Email: &sellerEmail, PasswordHash: "hash", Nickname: "卖家二号", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	if err := db.Create(&buyer).Error; err != nil {
		t.Fatalf("create buyer: %v", err)
	}
	if err := db.Create(&seller).Error; err != nil {
		t.Fatalf("create seller: %v", err)
	}
	product := model.Product{SellerID: seller.ID, CategoryID: 1, Title: "iPad mini", Description: "tablet", Price: 300000, Currency: "CNY", ConditionLevel: "good", ShippingFee: 0, Status: "active"}
	if err := db.Create(&product).Error; err != nil {
		t.Fatalf("create product: %v", err)
	}
	order := model.Order{OrderNo: "ORD-AFTER-1", BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, TotalAmount: 300000, ShippingFee: 0, Currency: "CNY", Status: "paid", ReceiverName: "王五", ReceiverPhone: "13700000000", ReceiverRegion: "广州", ReceiverAddress: "测试路 3 号"}
	if err := db.Create(&order).Error; err != nil {
		t.Fatalf("create order: %v", err)
	}
	refund := model.AfterSale{OrderID: order.ID, BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, Type: "refund", Status: "open", Reason: "不想要了", RequestedAmount: 1000, Currency: "CNY"}
	exchange := model.AfterSale{OrderID: order.ID, BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, Type: "exchange", Status: "processing", Reason: "颜色不符", RequestedAmount: 0, Currency: "CNY"}
	if err := db.Create(&refund).Error; err != nil {
		t.Fatalf("create refund: %v", err)
	}
	if err := db.Create(&exchange).Error; err != nil {
		t.Fatalf("create exchange: %v", err)
	}

	content, err := service.ExportAfterSalesCSV(AdminAfterSaleListQuery{Type: "exchange"})
	if err != nil {
		t.Fatalf("ExportAfterSalesCSV returned error: %v", err)
	}
	contentText := string(content)
	if !strings.Contains(contentText, "exchange") {
		t.Fatalf("expected export to contain exchange after-sale, got %s", contentText)
	}
	if strings.Contains(contentText, "refund") {
		t.Fatalf("expected export to exclude refund after-sale, got %s", contentText)
	}
}

func int64Ptr(value int64) *int64 { return &value }
func boolPtr(value bool) *bool    { return &value }
