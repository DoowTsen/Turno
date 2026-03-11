package handler

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/response"
)

func parseUintParam(c *gin.Context, name string) (uint64, error) {
	return strconv.ParseUint(c.Param(name), 10, 64)
}

func EmptyList(c *gin.Context) {
	response.Success(c, []any{})
}

func parsePositiveInt(value string) (int, error) {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, err
	}
	if parsed <= 0 {
		return 0, strconv.ErrSyntax
	}
	return parsed, nil
}

func parseOptionalUint64(value string) (*uint64, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := strconv.ParseUint(trimmed, 10, 64)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func parseOptionalInt64(value string) (*int64, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := strconv.ParseInt(trimmed, 10, 64)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func parseOptionalBool(value string) *bool {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return nil
	}
	result := trimmed == "1" || trimmed == "true" || trimmed == "yes"
	return &result
}

func parseOptionalDate(value string, endOfDay bool) (*time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return nil, err
	}
	if endOfDay {
		parsed = parsed.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
	}
	return &parsed, nil
}
