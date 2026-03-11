package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type ReviewHandler struct {
	service *service.ReviewService
}

func NewReviewHandler(service *service.ReviewService) *ReviewHandler {
	return &ReviewHandler{service: service}
}

func (h *ReviewHandler) ListByProduct(c *gin.Context) {
	productID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	items, err := h.service.ListByProduct(productID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "REVIEW_LIST_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *ReviewHandler) Create(c *gin.Context) {
	orderID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}

	var input service.CreateReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	item, err := h.service.Create(orderID, middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "REVIEW_CREATE_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *ReviewHandler) HasReviewed(c *gin.Context) {
	orderID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	flag, err := h.service.HasReviewed(orderID, middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "REVIEW_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"reviewed": flag})
}
