package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type OrderHandler struct {
	service *service.OrderService
}

func NewOrderHandler(service *service.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

func (h *OrderHandler) Create(c *gin.Context) {
	var input service.CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	order, err := h.service.Create(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CREATE_ORDER_FAILED", err.Error())
		return
	}
	response.Success(c, order)
}

func (h *OrderHandler) Detail(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	order, err := h.service.Detail(id, middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusNotFound, "ORDER_NOT_FOUND", err.Error())
		return
	}
	response.Success(c, order)
}

func (h *OrderHandler) ListByBuyer(c *gin.Context) {
	items, err := h.service.ListByBuyer(middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "BUY_ORDERS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *OrderHandler) ListBySeller(c *gin.Context) {
	items, err := h.service.ListBySeller(middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SELL_ORDERS_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *OrderHandler) Cancel(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	order, err := h.service.Cancel(id, middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CANCEL_ORDER_FAILED", err.Error())
		return
	}
	response.Success(c, order)
}

func (h *OrderHandler) Ship(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	var input service.ShipOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	order, err := h.service.Ship(id, middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "SHIP_ORDER_FAILED", err.Error())
		return
	}
	response.Success(c, order)
}

func (h *OrderHandler) ConfirmReceipt(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	order, err := h.service.ConfirmReceipt(id, middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CONFIRM_RECEIPT_FAILED", err.Error())
		return
	}
	response.Success(c, order)
}

