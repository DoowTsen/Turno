package handler

import (
	"github.com/gin-gonic/gin"

	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type CategoryHandler struct {
	service *service.CategoryService
}

func NewCategoryHandler(service *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) Tree(c *gin.Context) {
	language := c.GetHeader("Accept-Language")
	if language == "" {
		language = "zh-CN"
	}
	items, err := h.service.Tree(language)
	if err != nil {
		response.Error(c, 500, "CATEGORY_TREE_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}
