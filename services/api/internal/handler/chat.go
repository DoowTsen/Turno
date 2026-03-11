package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type ChatHandler struct {
	service *service.ChatService
}

func NewChatHandler(service *service.ChatService) *ChatHandler {
	return &ChatHandler{service: service}
}

func (h *ChatHandler) StartConversation(c *gin.Context) {
	productID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	item, err := h.service.StartConversationByProduct(productID, middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CHAT_START_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}

func (h *ChatHandler) ListConversations(c *gin.Context) {
	items, err := h.service.ListConversations(middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "CHAT_LIST_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *ChatHandler) ListMessages(c *gin.Context) {
	conversationID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid conversation id")
		return
	}
	items, err := h.service.ListMessages(conversationID, middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CHAT_MESSAGE_LIST_FAILED", err.Error())
		return
	}
	response.Success(c, items)
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	conversationID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid conversation id")
		return
	}
	var input service.SendMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	item, err := h.service.SendMessage(conversationID, middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CHAT_SEND_FAILED", err.Error())
		return
	}
	response.Success(c, item)
}
