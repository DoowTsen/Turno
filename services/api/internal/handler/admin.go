package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type AdminHandler struct {
	service *service.AdminService
}

func NewAdminHandler(service *service.AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

func parseAdminOrderListQuery(c *gin.Context) (service.AdminOrderListQuery, string, error) {
	minAmount, err := parseOptionalInt64(c.Query("minAmount"))
	if err != nil {
		return service.AdminOrderListQuery{}, "minAmount", err
	}
	maxAmount, err := parseOptionalInt64(c.Query("maxAmount"))
	if err != nil {
		return service.AdminOrderListQuery{}, "maxAmount", err
	}
	startDate, err := parseOptionalDate(c.Query("startDate"), false)
	if err != nil {
		return service.AdminOrderListQuery{}, "startDate", err
	}
	endDate, err := parseOptionalDate(c.Query("endDate"), true)
	if err != nil {
		return service.AdminOrderListQuery{}, "endDate", err
	}
	return service.AdminOrderListQuery{
		Keyword:         c.Query("keyword"),
		Status:          c.Query("status"),
		MinAmount:       minAmount,
		MaxAmount:       maxAmount,
		StartDate:       startDate,
		EndDate:         endDate,
		HasAfterSale:    parseOptionalBool(c.Query("hasAfterSale")),
		DelayedShipment: parseOptionalBool(c.Query("delayedOnly")),
	}, "", nil
}

func parseAdminAfterSaleListQuery(c *gin.Context) service.AdminAfterSaleListQuery {
	return service.AdminAfterSaleListQuery{Status: c.Query("status"), Type: c.Query("type")}
}

func (h *AdminHandler) Overview(c *gin.Context) {
	item, err := h.service.Overview()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_OVERVIEW_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) Trends(c *gin.Context) {
	days := 7
	if value := c.Query("days"); value != "" {
		if parsed, err := parsePositiveInt(value); err == nil {
			days = parsed
		}
	}
	item, err := h.service.Trends(days)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_TRENDS_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) Alerts(c *gin.Context) {
	item, err := h.service.Alerts()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_ALERTS_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) GetHomeConfig(c *gin.Context) {
	item, err := h.service.GetHomeConfig()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "HOME_CONFIG_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) SaveHomeConfig(c *gin.Context) {
	var input service.AdminHomeConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.SaveHomeConfig(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_HOME_CONFIG_SAVE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) ListActionTemplateBindings(c *gin.Context) {
	items, err := h.service.ListActionTemplateBindings()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_ACTION_BINDINGS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) SaveActionTemplateBindings(c *gin.Context) {
	var input []service.AdminActionTemplateBinding
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	items, err := h.service.SaveActionTemplateBindings(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_ACTION_BINDINGS_SAVE_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) ExportOrdersCSV(c *gin.Context) {
	query, invalidField, err := parseAdminOrderListQuery(c)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", fmt.Sprintf("invalid %s", invalidField))
		return
	}
	content, err := h.service.ExportOrdersCSV(query)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_EXPORT_ORDERS_FAILED", err.Error())
		return
	}
	fileName := fmt.Sprintf("turno-orders-%s.csv", time.Now().Format("20060102-150405"))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	c.Data(http.StatusOK, "text/csv; charset=utf-8", content)
}

func (h *AdminHandler) ExportAfterSalesCSV(c *gin.Context) {
	content, err := h.service.ExportAfterSalesCSV(parseAdminAfterSaleListQuery(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_EXPORT_AFTER_SALES_FAILED", err.Error())
		return
	}
	fileName := fmt.Sprintf("turno-after-sales-%s.csv", time.Now().Format("20060102-150405"))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	c.Data(http.StatusOK, "text/csv; charset=utf-8", content)
}

func (h *AdminHandler) ListNotificationTemplates(c *gin.Context) {
	items, err := h.service.ListNotificationTemplates(c.Query("status"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_NOTIFICATION_TEMPLATES_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) CreateNotificationTemplate(c *gin.Context) {
	var input service.AdminNotificationTemplateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.SaveNotificationTemplate(middleware.CurrentUserID(c), nil, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_NOTIFICATION_TEMPLATE_CREATE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) UpdateNotificationTemplate(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid template id")
		return
	}
	var input service.AdminNotificationTemplateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.SaveNotificationTemplate(middleware.CurrentUserID(c), &id, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_NOTIFICATION_TEMPLATE_UPDATE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) SendNotification(c *gin.Context) {
	var input service.AdminNotificationSendInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.SendNotification(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_NOTIFICATION_SEND_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) ListAuditLogs(c *gin.Context) {
	items, err := h.service.ListAuditLogs(c.Query("keyword"), c.Query("action"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_AUDIT_LOGS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	items, err := h.service.ListUsers(service.AdminUserListQuery{Keyword: c.Query("keyword"), Role: c.Query("role"), Status: c.Query("status")})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_USERS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid user id")
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.UpdateUserStatus(middleware.CurrentUserID(c), id, body.Status)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_USER_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) BatchUpdateUserStatus(c *gin.Context) {
	var input service.AdminBatchStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.BatchUpdateUserStatus(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_USER_BATCH_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) ListProducts(c *gin.Context) {
	categoryID, err := parseOptionalUint64(c.Query("categoryId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid categoryId")
		return
	}
	sellerID, err := parseOptionalUint64(c.Query("sellerId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid sellerId")
		return
	}
	minPrice, err := parseOptionalInt64(c.Query("minPrice"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid minPrice")
		return
	}
	maxPrice, err := parseOptionalInt64(c.Query("maxPrice"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid maxPrice")
		return
	}
	items, err := h.service.ListProducts(service.AdminProductListQuery{Keyword: c.Query("keyword"), Status: c.Query("status"), CategoryID: categoryID, SellerID: sellerID, MinPrice: minPrice, MaxPrice: maxPrice})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_PRODUCTS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) UpdateProductStatus(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.UpdateProductStatus(middleware.CurrentUserID(c), id, body.Status)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_PRODUCT_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) BatchUpdateProductStatus(c *gin.Context) {
	var input service.AdminBatchStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.BatchUpdateProductStatus(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_PRODUCT_BATCH_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) ListOrders(c *gin.Context) {
	query, invalidField, err := parseAdminOrderListQuery(c)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", fmt.Sprintf("invalid %s", invalidField))
		return
	}
	items, err := h.service.ListOrders(query)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_ORDERS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) OrderDetail(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	item, err := h.service.OrderDetail(id)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_ORDER_DETAIL_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) ListAfterSales(c *gin.Context) {
	items, err := h.service.ListAfterSales(parseAdminAfterSaleListQuery(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_AFTER_SALES_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) BatchUpdateAfterSaleStatus(c *gin.Context) {
	var input service.AdminBatchAfterSaleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.BatchUpdateAfterSaleStatus(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_AFTER_SALE_BATCH_UPDATE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) UpdateAfterSaleStatus(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid after-sale id")
		return
	}
	var input service.AdminAfterSaleUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.UpdateAfterSaleStatus(middleware.CurrentUserID(c), id, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_AFTER_SALE_UPDATE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AdminHandler) ListCategories(c *gin.Context) {
	items, err := h.service.ListCategories()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ADMIN_CATEGORIES_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid category id")
		return
	}
	var input service.AdminCategoryUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.UpdateCategory(middleware.CurrentUserID(c), id, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ADMIN_CATEGORY_UPDATE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}
