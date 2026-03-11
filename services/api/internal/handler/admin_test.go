package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"turno/services/api/internal/auth"
	"turno/services/api/internal/config"
	"turno/services/api/internal/model"
	"turno/services/api/internal/service"
)

type adminRouteTestEnv struct {
	router *gin.Engine
	db     *gorm.DB
	tokens map[string]string
}

type apiResponse[T any] struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

func newAdminRouteTestEnv(t *testing.T) *adminRouteTestEnv {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
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

	roles := []string{"admin", "operator", "customer_service", "auditor", "user"}
	tokens := make(map[string]string, len(roles))
	for index, role := range roles {
		userID := uint64(index + 1)
		email := fmt.Sprintf("%s@turno.test", role)
		user := model.User{
			ID:                userID,
			Email:             &email,
			PasswordHash:      "hash",
			Nickname:          role,
			PreferredLanguage: "zh-CN",
			Role:              role,
			Status:            "active",
		}
		if err := db.Create(&user).Error; err != nil {
			t.Fatalf("create user %s: %v", role, err)
		}
		token, err := auth.GenerateToken("test-secret", userID, role, 72)
		if err != nil {
			t.Fatalf("generate token for %s: %v", role, err)
		}
		tokens[role] = token
	}

	router := NewRouter(Dependencies{
		Config: &config.Config{JWT: config.JWTConfig{Secret: "test-secret", AccessTokenHours: 72}},
		Logger: zap.NewNop(),
		DB:     db,
	})

	return &adminRouteTestEnv{router: router, db: db, tokens: tokens}
}

func performRequest(t *testing.T, router http.Handler, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()

	var requestBody *bytes.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal request body: %v", err)
		}
		requestBody = bytes.NewReader(encoded)
	} else {
		requestBody = bytes.NewReader(nil)
	}

	req := httptest.NewRequest(method, path, requestBody)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	return resp
}

func decodeResponse[T any](t *testing.T, resp *httptest.ResponseRecorder) apiResponse[T] {
	t.Helper()
	var payload apiResponse[T]
	if err := json.Unmarshal(resp.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v, body=%s", err, resp.Body.String())
	}
	return payload
}

func findBindingByAction(items []service.AdminActionTemplateBinding, actionKey string) *service.AdminActionTemplateBinding {
	for index := range items {
		if items[index].ActionKey == actionKey {
			return &items[index]
		}
	}
	return nil
}

func TestAdminRoutesHomeConfigPermissionsAndPersistence(t *testing.T) {
	env := newAdminRouteTestEnv(t)

	publicResp := performRequest(t, env.router, http.MethodGet, "/api/v1/site/home-config", "", nil)
	if publicResp.Code != http.StatusOK {
		t.Fatalf("expected public home config 200, got %d: %s", publicResp.Code, publicResp.Body.String())
	}
	publicPayload := decodeResponse[service.AdminHomeConfig](t, publicResp)
	if publicPayload.Code != "OK" {
		t.Fatalf("expected OK code, got %s", publicPayload.Code)
	}
	if publicPayload.Data.HeroTitle == "" || publicPayload.Data.PrimaryCtaLink == "" {
		t.Fatalf("expected default home config, got %+v", publicPayload.Data)
	}

	updateInput := publicPayload.Data
	updateInput.HeroTitle = "RBAC 测试首页标题"
	updateInput.PrimaryCtaText = "立即前往"
	updateInput.PrimaryCtaLink = "/products"

	forbiddenResp := performRequest(t, env.router, http.MethodPut, "/api/v1/admin/site/home-config", env.tokens["customer_service"], updateInput)
	if forbiddenResp.Code != http.StatusForbidden {
		t.Fatalf("expected customer_service forbidden, got %d: %s", forbiddenResp.Code, forbiddenResp.Body.String())
	}
	forbiddenPayload := decodeResponse[map[string]any](t, forbiddenResp)
	if forbiddenPayload.Code != "FORBIDDEN" {
		t.Fatalf("expected FORBIDDEN code, got %s", forbiddenPayload.Code)
	}

	updateResp := performRequest(t, env.router, http.MethodPut, "/api/v1/admin/site/home-config", env.tokens["operator"], updateInput)
	if updateResp.Code != http.StatusOK {
		t.Fatalf("expected operator update 200, got %d: %s", updateResp.Code, updateResp.Body.String())
	}
	updatePayload := decodeResponse[service.AdminHomeConfig](t, updateResp)
	if updatePayload.Data.HeroTitle != updateInput.HeroTitle {
		t.Fatalf("expected updated hero title %q, got %q", updateInput.HeroTitle, updatePayload.Data.HeroTitle)
	}

	adminResp := performRequest(t, env.router, http.MethodGet, "/api/v1/admin/site/home-config", env.tokens["operator"], nil)
	if adminResp.Code != http.StatusOK {
		t.Fatalf("expected admin home config 200, got %d: %s", adminResp.Code, adminResp.Body.String())
	}
	adminPayload := decodeResponse[service.AdminHomeConfig](t, adminResp)
	if adminPayload.Data.HeroTitle != updateInput.HeroTitle {
		t.Fatalf("expected persisted hero title %q, got %q", updateInput.HeroTitle, adminPayload.Data.HeroTitle)
	}
}

func TestAdminRoutesActionTemplateBindingsPermissionsAndPersistence(t *testing.T) {
	env := newAdminRouteTestEnv(t)

	template := model.NotificationTemplate{
		Name:            "售后升级模板",
		Type:            "after_sale",
		TitleTemplate:   "售后状态升级",
		ContentTemplate: "售后状态已升级，请留意处理",
		Status:          "active",
	}
	if err := env.db.Create(&template).Error; err != nil {
		t.Fatalf("create template: %v", err)
	}

	listResp := performRequest(t, env.router, http.MethodGet, "/api/v1/admin/site/action-template-bindings", env.tokens["auditor"], nil)
	if listResp.Code != http.StatusOK {
		t.Fatalf("expected list bindings 200, got %d: %s", listResp.Code, listResp.Body.String())
	}
	listPayload := decodeResponse[[]service.AdminActionTemplateBinding](t, listResp)
	if len(listPayload.Data) == 0 {
		t.Fatal("expected default bindings")
	}
	if binding := findBindingByAction(listPayload.Data, "after_sale.status.updated"); binding == nil {
		t.Fatalf("expected after_sale.status.updated in bindings, got %+v", listPayload.Data)
	}

	payload := []service.AdminActionTemplateBinding{{
		ActionKey:     "after_sale.status.updated",
		TemplateID:    &template.ID,
		FallbackNames: []string{"售后状态更新通知"},
	}}

	forbiddenResp := performRequest(t, env.router, http.MethodPut, "/api/v1/admin/site/action-template-bindings", env.tokens["auditor"], payload)
	if forbiddenResp.Code != http.StatusForbidden {
		t.Fatalf("expected auditor forbidden, got %d: %s", forbiddenResp.Code, forbiddenResp.Body.String())
	}

	updateResp := performRequest(t, env.router, http.MethodPut, "/api/v1/admin/site/action-template-bindings", env.tokens["customer_service"], payload)
	if updateResp.Code != http.StatusOK {
		t.Fatalf("expected customer_service update 200, got %d: %s", updateResp.Code, updateResp.Body.String())
	}
	updatePayload := decodeResponse[[]service.AdminActionTemplateBinding](t, updateResp)
	updatedBinding := findBindingByAction(updatePayload.Data, "after_sale.status.updated")
	if updatedBinding == nil {
		t.Fatalf("expected updated binding in response, got %+v", updatePayload.Data)
	}
	if updatedBinding.TemplateID == nil || *updatedBinding.TemplateID != template.ID {
		t.Fatalf("expected template id %d, got %+v", template.ID, updatedBinding.TemplateID)
	}
	if updatedBinding.TemplateName == nil || *updatedBinding.TemplateName != template.Name {
		t.Fatalf("expected template name %q, got %+v", template.Name, updatedBinding.TemplateName)
	}

	reloadResp := performRequest(t, env.router, http.MethodGet, "/api/v1/admin/site/action-template-bindings", env.tokens["customer_service"], nil)
	if reloadResp.Code != http.StatusOK {
		t.Fatalf("expected reload bindings 200, got %d: %s", reloadResp.Code, reloadResp.Body.String())
	}
	reloadPayload := decodeResponse[[]service.AdminActionTemplateBinding](t, reloadResp)
	reloadedBinding := findBindingByAction(reloadPayload.Data, "after_sale.status.updated")
	if reloadedBinding == nil || reloadedBinding.TemplateID == nil || *reloadedBinding.TemplateID != template.ID {
		t.Fatalf("expected persisted template binding, got %+v", reloadPayload.Data)
	}
}

func TestAdminRoutesExportOrdersRespectsFilters(t *testing.T) {
	env := newAdminRouteTestEnv(t)

	buyerID := uint64(1001)
	sellerID := uint64(1002)
	buyerEmail := "export-buyer@test.local"
	sellerEmail := "export-seller@test.local"
	buyer := model.User{ID: buyerID, Email: &buyerEmail, PasswordHash: "hash", Nickname: "导出买家", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	seller := model.User{ID: sellerID, Email: &sellerEmail, PasswordHash: "hash", Nickname: "导出卖家", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	if err := env.db.Create(&buyer).Error; err != nil {
		t.Fatalf("create buyer: %v", err)
	}
	if err := env.db.Create(&seller).Error; err != nil {
		t.Fatalf("create seller: %v", err)
	}
	product := model.Product{SellerID: seller.ID, CategoryID: 1, Title: "Export Phone", Description: "phone", Price: 99900, Currency: "CNY", ConditionLevel: "good", ShippingFee: 1200, Status: "active"}
	if err := env.db.Create(&product).Error; err != nil {
		t.Fatalf("create product: %v", err)
	}
	delayedAt := time.Now().Add(-3 * time.Hour)
	recentAt := time.Now().Add(-10 * time.Minute)
	orderA := model.Order{OrderNo: "ROUTE-ORD-A", BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, TotalAmount: 99900, ShippingFee: 1200, Currency: "CNY", Status: "paid", ReceiverName: "张三", ReceiverPhone: "13800000000", ReceiverRegion: "上海", ReceiverAddress: "A", CreatedAt: delayedAt, UpdatedAt: delayedAt}
	orderB := model.Order{OrderNo: "ROUTE-ORD-B", BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, TotalAmount: 99900, ShippingFee: 1200, Currency: "CNY", Status: "paid", ReceiverName: "李四", ReceiverPhone: "13900000000", ReceiverRegion: "北京", ReceiverAddress: "B", CreatedAt: recentAt, UpdatedAt: recentAt}
	if err := env.db.Create(&orderA).Error; err != nil {
		t.Fatalf("create orderA: %v", err)
	}
	if err := env.db.Create(&orderB).Error; err != nil {
		t.Fatalf("create orderB: %v", err)
	}
	afterSale := model.AfterSale{OrderID: orderA.ID, BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, Type: "refund", Status: "open", Reason: "问题件", RequestedAmount: 500, Currency: "CNY"}
	if err := env.db.Create(&afterSale).Error; err != nil {
		t.Fatalf("create afterSale: %v", err)
	}

	resp := performRequest(t, env.router, http.MethodGet, "/api/v1/admin/orders/export?keyword=Export&hasAfterSale=true&delayedOnly=true", env.tokens["admin"], nil)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected export orders 200, got %d: %s", resp.Code, resp.Body.String())
	}
	body := resp.Body.String()
	if !strings.Contains(body, "ROUTE-ORD-A") {
		t.Fatalf("expected filtered export to contain ROUTE-ORD-A, got %s", body)
	}
	if strings.Contains(body, "ROUTE-ORD-B") {
		t.Fatalf("expected filtered export to exclude ROUTE-ORD-B, got %s", body)
	}
}

func TestAdminRoutesExportAfterSalesRespectsTypeFilter(t *testing.T) {
	env := newAdminRouteTestEnv(t)

	buyerID := uint64(1011)
	sellerID := uint64(1012)
	buyerEmail := "after-buyer@test.local"
	sellerEmail := "after-seller@test.local"
	buyer := model.User{ID: buyerID, Email: &buyerEmail, PasswordHash: "hash", Nickname: "售后买家", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	seller := model.User{ID: sellerID, Email: &sellerEmail, PasswordHash: "hash", Nickname: "售后卖家", PreferredLanguage: "zh-CN", Role: "user", Status: "active"}
	if err := env.db.Create(&buyer).Error; err != nil {
		t.Fatalf("create buyer: %v", err)
	}
	if err := env.db.Create(&seller).Error; err != nil {
		t.Fatalf("create seller: %v", err)
	}
	product := model.Product{SellerID: seller.ID, CategoryID: 1, Title: "After Product", Description: "desc", Price: 66600, Currency: "CNY", ConditionLevel: "good", ShippingFee: 0, Status: "active"}
	if err := env.db.Create(&product).Error; err != nil {
		t.Fatalf("create product: %v", err)
	}
	order := model.Order{OrderNo: "ROUTE-AFTER-ORD", BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, TotalAmount: 66600, ShippingFee: 0, Currency: "CNY", Status: "paid", ReceiverName: "王五", ReceiverPhone: "13700000000", ReceiverRegion: "广州", ReceiverAddress: "C"}
	if err := env.db.Create(&order).Error; err != nil {
		t.Fatalf("create order: %v", err)
	}
	refund := model.AfterSale{OrderID: order.ID, BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, Type: "refund", Status: "open", Reason: "退款", RequestedAmount: 1000, Currency: "CNY"}
	exchange := model.AfterSale{OrderID: order.ID, BuyerID: buyer.ID, SellerID: seller.ID, ProductID: product.ID, Type: "exchange", Status: "processing", Reason: "换货", RequestedAmount: 0, Currency: "CNY"}
	if err := env.db.Create(&refund).Error; err != nil {
		t.Fatalf("create refund: %v", err)
	}
	if err := env.db.Create(&exchange).Error; err != nil {
		t.Fatalf("create exchange: %v", err)
	}

	resp := performRequest(t, env.router, http.MethodGet, "/api/v1/admin/after-sales/export?type=exchange", env.tokens["customer_service"], nil)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected export after-sales 200, got %d: %s", resp.Code, resp.Body.String())
	}
	body := resp.Body.String()
	if !strings.Contains(body, "exchange") {
		t.Fatalf("expected filtered export to contain exchange row, got %s", body)
	}
	if strings.Contains(body, "refund") {
		t.Fatalf("expected filtered export to exclude refund row, got %s", body)
	}
}
