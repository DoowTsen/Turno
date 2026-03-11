package handler

import (
	"github.com/gin-gonic/gin"

	"turno/services/api/internal/response"
)

func Health(c *gin.Context) {
	response.Success(c, gin.H{
		"service": "turno-api",
		"status":  "ok",
	})
}
