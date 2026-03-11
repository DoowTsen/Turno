package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type ProductHandler struct {
	service *service.ProductService
}

func NewProductHandler(service *service.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

func (h *ProductHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	categoryID, _ := strconv.ParseUint(c.DefaultQuery("categoryId", "0"), 10, 64)
	items, total, err := h.service.List(service.ProductListInput{
		Keyword:    c.Query("keyword"),
		CategoryID: categoryID,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PRODUCT_LIST_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"items": items, "total": total, "page": page, "pageSize": pageSize})
}

func (h *ProductHandler) Detail(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	item, err := h.service.Detail(id)
	if err != nil {
		response.Error(c, http.StatusNotFound, "PRODUCT_NOT_FOUND", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var input service.ProductUpsertInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.Create(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CREATE_PRODUCT_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	var input service.ProductUpsertInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.Update(id, middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "UPDATE_PRODUCT_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *ProductHandler) ChangeStatus(c *gin.Context) {
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
	item, err := h.service.ChangeStatus(id, middleware.CurrentUserID(c), body.Status)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CHANGE_STATUS_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *ProductHandler) MyProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	items, total, err := h.service.List(service.ProductListInput{
		Page:     page,
		PageSize: pageSize,
		SellerID: middleware.CurrentUserID(c),
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "MY_PRODUCTS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"items": items, "total": total, "page": page, "pageSize": pageSize})
}
