package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"turno/services/api/internal/middleware"
	"turno/services/api/internal/response"
	"turno/services/api/internal/service"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	var input service.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	user, err := h.service.UpdateProfile(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "UPDATE_PROFILE_FAILED", err.Error())
		return
	}
	response.Success(c, user)
}

func (h *UserHandler) UpdateLanguage(c *gin.Context) {
	var input service.UpdateLanguageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	user, err := h.service.UpdateLanguage(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "UPDATE_LANGUAGE_FAILED", err.Error())
		return
	}
	response.Success(c, user)
}

func (h *UserHandler) ListAddresses(c *gin.Context) {
	addresses, err := h.service.ListAddresses(middleware.CurrentUserID(c))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "LIST_ADDRESSES_FAILED", err.Error())
		return
	}
	response.Success(c, addresses)
}

func (h *UserHandler) CreateAddress(c *gin.Context) {
	var input service.AddressUpsertInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	address, err := h.service.CreateAddress(middleware.CurrentUserID(c), input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CREATE_ADDRESS_FAILED", err.Error())
		return
	}
	response.Success(c, address)
}

func (h *UserHandler) UpdateAddress(c *gin.Context) {
	addressID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid address id")
		return
	}
	var input service.AddressUpsertInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	address, err := h.service.UpdateAddress(middleware.CurrentUserID(c), addressID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "UPDATE_ADDRESS_FAILED", err.Error())
		return
	}
	response.Success(c, address)
}

func (h *UserHandler) DeleteAddress(c *gin.Context) {
	addressID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid address id")
		return
	}
	if err := h.service.DeleteAddress(middleware.CurrentUserID(c), addressID); err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, gorm.ErrRecordNotFound) {
			status = http.StatusNotFound
		}
		response.Error(c, status, "DELETE_ADDRESS_FAILED", err.Error())
		return
	}
	response.Success(c, gin.H{"deleted": true})
}

func (h *UserHandler) SetDefaultAddress(c *gin.Context) {
	addressID, err := parseUintParam(c, "id")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid address id")
		return
	}
	address, err := h.service.SetDefaultAddress(middleware.CurrentUserID(c), addressID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "SET_DEFAULT_ADDRESS_FAILED", err.Error())
		return
	}
	response.Success(c, address)
}
