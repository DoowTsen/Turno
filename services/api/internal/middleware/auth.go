package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"turno/services/api/internal/auth"
	"turno/services/api/internal/config"
	"turno/services/api/internal/response"
)

const (
	ContextUserIDKey = "currentUserID"
	ContextRoleKey   = "currentUserRole"
)

var adminPermissionMap = map[string]map[string]struct{}{
	"admin": {
		"users.write":         {},
		"products.write":      {},
		"after_sales.write":   {},
		"categories.write":    {},
		"notifications.write": {},
	},
	"super_admin": {
		"users.write":         {},
		"products.write":      {},
		"after_sales.write":   {},
		"categories.write":    {},
		"notifications.write": {},
	},
	"operator": {
		"products.write":      {},
		"categories.write":    {},
		"notifications.write": {},
	},
	"customer_service": {
		"after_sales.write":   {},
		"notifications.write": {},
	},
	"auditor": {
		"products.write": {},
	},
}

func authenticateRequest(c *gin.Context, cfg *config.Config) bool {
	authorization := c.GetHeader("Authorization")
	if authorization == "" {
		response.Error(c, 401, "UNAUTHORIZED", "missing authorization header")
		c.Abort()
		return false
	}

	parts := strings.SplitN(authorization, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		response.Error(c, 401, "UNAUTHORIZED", "invalid authorization header")
		c.Abort()
		return false
	}

	claims, err := auth.ParseToken(cfg.JWT.Secret, parts[1])
	if err != nil {
		response.Error(c, 401, "UNAUTHORIZED", "invalid token")
		c.Abort()
		return false
	}

	c.Set(ContextUserIDKey, claims.UserID)
	c.Set(ContextRoleKey, claims.Role)
	return true
}

func AuthRequired(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !authenticateRequest(c, cfg) {
			return
		}
		c.Next()
	}
}

func AdminRequired(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !authenticateRequest(c, cfg) {
			return
		}

		role := CurrentUserRole(c)
		if !IsManagementRole(role) {
			response.Error(c, 403, "FORBIDDEN", "admin permission required")
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireAdminPermission(cfg *config.Config, permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !authenticateRequest(c, cfg) {
			return
		}

		role := CurrentUserRole(c)
		if !IsManagementRole(role) || !HasAdminPermission(role, permission) {
			response.Error(c, 403, "FORBIDDEN", "permission denied")
			c.Abort()
			return
		}
		c.Next()
	}
}

func IsManagementRole(role string) bool {
	_, ok := adminPermissionMap[role]
	return ok
}

func HasAdminPermission(role, permission string) bool {
	permissions, ok := adminPermissionMap[role]
	if !ok {
		return false
	}
	_, exists := permissions[permission]
	return exists
}

func CurrentUserID(c *gin.Context) uint64 {
	value, ok := c.Get(ContextUserIDKey)
	if !ok {
		return 0
	}
	userID, _ := value.(uint64)
	return userID
}

func CurrentUserRole(c *gin.Context) string {
	value, ok := c.Get(ContextRoleKey)
	if !ok {
		return ""
	}
	role, _ := value.(string)
	return role
}
