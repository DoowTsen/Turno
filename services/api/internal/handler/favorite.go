package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type FavoriteHandler struct {
	service *service.FavoriteService
}

func NewFavoriteHandler(service *service.FavoriteService) *FavoriteHandler {
	return &FavoriteHandler{service: service}
}

func (h *FavoriteHandler) List(c *gin.Context) {
	items, err := h.service.List(middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "FAVORITE_LIST_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *FavoriteHandler) Add(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	if err := h.service.Add(middleware.CurrentUserID(c), id); err != nil {
		response.Error(c, http.StatusBadRequest, "FAVORITE_ADD_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func (h *FavoriteHandler) Remove(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	if err := h.service.Remove(middleware.CurrentUserID(c), id); err != nil {
		response.Error(c, http.StatusBadRequest, "FAVORITE_REMOVE_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
