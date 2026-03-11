package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type NotificationHandler struct {
	service *service.NotificationService
}

func NewNotificationHandler(service *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) ListMine(c *gin.Context) {
	userID := middleware.CurrentUserID(c)
	items, err := h.service.ListMine(userID, c.Query("unreadOnly") == "true")
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "NOTIFICATIONS_LIST_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *NotificationHandler) Summary(c *gin.Context) {
	userID := middleware.CurrentUserID(c)
	item, err := h.service.Summary(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "NOTIFICATIONS_SUMMARY_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID := middleware.CurrentUserID(c)
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid notification id")
		return
	}
	item, err := h.service.MarkRead(id, userID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "NOTIFICATION_MARK_READ_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := middleware.CurrentUserID(c)
	if err := h.service.MarkAllRead(userID); err != nil {
		response.Error(c, http.StatusInternalServerError, "NOTIFICATION_MARK_ALL_READ_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
