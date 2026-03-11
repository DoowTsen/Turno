package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type AfterSaleHandler struct {
	service *service.AfterSaleService
}

func NewAfterSaleHandler(service *service.AfterSaleService) *AfterSaleHandler {
	return &AfterSaleHandler{service: service}
}

func (h *AfterSaleHandler) Create(c *gin.Context) {
	orderID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	var input service.CreateAfterSaleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.Create(orderID, middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "AFTER_SALE_CREATE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AfterSaleHandler) DetailByOrder(c *gin.Context) {
	orderID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	item, err := h.service.GetByOrder(orderID, middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusNotFound, "AFTER_SALE_NOT_FOUND", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *AfterSaleHandler) ListMine(c *gin.Context) {
	items, err := h.service.ListMine(middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "MY_AFTER_SALES_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *AfterSaleHandler) SellerRespond(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid after-sale id")
		return
	}
	var input service.RespondAfterSaleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.SellerRespond(id, middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "AFTER_SALE_SELLER_RESPONSE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}
