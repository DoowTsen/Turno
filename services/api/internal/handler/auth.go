package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input service.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	user, token, err := h.service.Register(input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "REGISTER_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"user": user, "accessToken": token})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input service.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	user, token, err := h.service.Login(input)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "LOGIN_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"user": user, "accessToken": token})
}

func (h *AuthHandler) Me(c *gin.Context) {
	user, err := h.service.Me(middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusNotFound, "USER_NOT_FOUND", err.Error())
		return
	}
	response.Success(c, user)
}
