package response

import "github.com/gin-gonic/gin"

type Meta struct {
	RequestID string `json:"requestId,omitempty"`
}

type Payload struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Payload{
		Code:    "OK",
		Message: "success",
		Data:    data,
	})
}

func Error(c *gin.Context, httpStatus int, code string, message string) {
	c.JSON(httpStatus, Payload{
		Code:    code,
		Message: message,
	})
}
