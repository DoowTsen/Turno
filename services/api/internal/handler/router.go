package handler

import (
	"github.com/gin-gonic/gin"
	redislib "github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"turno/services/api/internal/config"
	"turno/services/api/internal/middleware"
	"turno/services/api/internal/service"
)

type Dependencies struct {
	Config *config.Config
	Logger *zap.Logger
	DB     *gorm.DB
	Redis  *redislib.Client
}

func NewRouter(deps Dependencies) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestLogger(deps.Logger))
	r.Use(middleware.CORS())
	r.Static("/uploads", "./public/uploads")

	authService := service.NewAuthService(deps.DB, deps.Config)
	userService := service.NewUserService(deps.DB)
	categoryService := service.NewCategoryService(deps.DB)
	productService := service.NewProductService(deps.DB)
	favoriteService := service.NewFavoriteService(deps.DB)
	orderService := service.NewOrderService(deps.DB)
	reviewService := service.NewReviewService(deps.DB)
	notificationService := service.NewNotificationService(deps.DB)
	chatService := service.NewChatService(deps.DB)
	afterSaleService := service.NewAfterSaleService(deps.DB)
	adminService := service.NewAdminService(deps.DB)

	authHandler := NewAuthHandler(authService)
	userHandler := NewUserHandler(userService)
	categoryHandler := NewCategoryHandler(categoryService)
	productHandler := NewProductHandler(productService)
	favoriteHandler := NewFavoriteHandler(favoriteService)
	orderHandler := NewOrderHandler(orderService)
	reviewHandler := NewReviewHandler(reviewService)
	notificationHandler := NewNotificationHandler(notificationService)
	chatHandler := NewChatHandler(chatService)
	afterSaleHandler := NewAfterSaleHandler(afterSaleService)
	adminHandler := NewAdminHandler(adminService)

	api := r.Group("/api/v1")
	{
		api.GET("/health", Health)
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.GET("/categories/tree", categoryHandler.Tree)
		api.GET("/products", productHandler.List)
		api.GET("/products/:id", productHandler.Detail)
		api.GET("/products/:id/reviews", reviewHandler.ListByProduct)
		api.GET("/site/home-config", adminHandler.GetHomeConfig)

		authed := api.Group("")
		authed.Use(middleware.AuthRequired(deps.Config))
		{
			authed.GET("/auth/me", authHandler.Me)
			authed.GET("/users/profile", authHandler.Me)
			authed.PUT("/users/profile", userHandler.UpdateProfile)
			authed.PUT("/users/preferences/language", userHandler.UpdateLanguage)
			authed.GET("/users/addresses", userHandler.ListAddresses)
			authed.POST("/users/addresses", userHandler.CreateAddress)
			authed.PUT("/users/addresses/:id", userHandler.UpdateAddress)
			authed.DELETE("/users/addresses/:id", userHandler.DeleteAddress)
			authed.PATCH("/users/addresses/:id/default", userHandler.SetDefaultAddress)

			authed.POST("/products", productHandler.Create)
			authed.PUT("/products/:id", productHandler.Update)
			authed.PATCH("/products/:id/status", productHandler.ChangeStatus)
			authed.GET("/me/products", productHandler.MyProducts)

			authed.GET("/me/favorites", favoriteHandler.List)
			authed.POST("/products/:id/favorite", favoriteHandler.Add)
			authed.DELETE("/products/:id/favorite", favoriteHandler.Remove)

			authed.POST("/orders", orderHandler.Create)
			authed.GET("/orders/:id", orderHandler.Detail)
			authed.GET("/orders/:id/after-sales", afterSaleHandler.DetailByOrder)
			authed.POST("/orders/:id/after-sales", afterSaleHandler.Create)
			authed.GET("/me/orders/buy", orderHandler.ListByBuyer)
			authed.GET("/me/orders/sell", orderHandler.ListBySeller)
			authed.GET("/me/after-sales", afterSaleHandler.ListMine)
			authed.PATCH("/after-sales/:id/seller-response", afterSaleHandler.SellerRespond)
			authed.PATCH("/orders/:id/cancel", orderHandler.Cancel)
			authed.PATCH("/orders/:id/ship", orderHandler.Ship)
			authed.PATCH("/orders/:id/confirm-receipt", orderHandler.ConfirmReceipt)
			authed.GET("/orders/:id/review-status", reviewHandler.HasReviewed)
			authed.POST("/orders/:id/reviews", reviewHandler.Create)

			authed.GET("/me/notifications", notificationHandler.ListMine)
			authed.GET("/me/notifications/summary", notificationHandler.Summary)
			authed.PATCH("/notifications/:id/read", notificationHandler.MarkRead)
			authed.PATCH("/me/notifications/read-all", notificationHandler.MarkAllRead)
			authed.GET("/me/conversations", chatHandler.ListConversations)
			authed.POST("/products/:id/conversations", chatHandler.StartConversation)
			authed.GET("/conversations/:id/messages", chatHandler.ListMessages)
			authed.POST("/conversations/:id/messages", chatHandler.SendMessage)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AdminRequired(deps.Config))
		{
			admin.GET("/overview", adminHandler.Overview)
			admin.GET("/trends", adminHandler.Trends)
			admin.GET("/alerts", adminHandler.Alerts)
			admin.GET("/site/home-config", adminHandler.GetHomeConfig)
			admin.PUT("/site/home-config", middleware.RequireAdminPermission(deps.Config, "categories.write"), adminHandler.SaveHomeConfig)
			admin.GET("/site/action-template-bindings", adminHandler.ListActionTemplateBindings)
			admin.PUT("/site/action-template-bindings", middleware.RequireAdminPermission(deps.Config, "notifications.write"), adminHandler.SaveActionTemplateBindings)
			admin.GET("/audit-logs", adminHandler.ListAuditLogs)
			admin.GET("/notification-templates", adminHandler.ListNotificationTemplates)
			admin.POST("/notification-templates", middleware.RequireAdminPermission(deps.Config, "notifications.write"), adminHandler.CreateNotificationTemplate)
			admin.PUT("/notification-templates/:id", middleware.RequireAdminPermission(deps.Config, "notifications.write"), adminHandler.UpdateNotificationTemplate)
			admin.POST("/notifications/send", middleware.RequireAdminPermission(deps.Config, "notifications.write"), adminHandler.SendNotification)
			admin.GET("/users", adminHandler.ListUsers)
			admin.POST("/users/batch-status", middleware.RequireAdminPermission(deps.Config, "users.write"), adminHandler.BatchUpdateUserStatus)
			admin.PATCH("/users/:id/status", middleware.RequireAdminPermission(deps.Config, "users.write"), adminHandler.UpdateUserStatus)
			admin.GET("/products", adminHandler.ListProducts)
			admin.POST("/products/batch-status", middleware.RequireAdminPermission(deps.Config, "products.write"), adminHandler.BatchUpdateProductStatus)
			admin.PATCH("/products/:id/status", middleware.RequireAdminPermission(deps.Config, "products.write"), adminHandler.UpdateProductStatus)
			admin.GET("/orders", adminHandler.ListOrders)
			admin.GET("/orders/export", adminHandler.ExportOrdersCSV)
			admin.GET("/orders/:id", adminHandler.OrderDetail)
			admin.GET("/after-sales", adminHandler.ListAfterSales)
			admin.GET("/after-sales/export", adminHandler.ExportAfterSalesCSV)
			admin.POST("/after-sales/batch-status", middleware.RequireAdminPermission(deps.Config, "after_sales.write"), adminHandler.BatchUpdateAfterSaleStatus)
			admin.PATCH("/after-sales/:id/status", middleware.RequireAdminPermission(deps.Config, "after_sales.write"), adminHandler.UpdateAfterSaleStatus)
			admin.GET("/categories", adminHandler.ListCategories)
			admin.PUT("/categories/:id", middleware.RequireAdminPermission(deps.Config, "categories.write"), adminHandler.UpdateCategory)
		}
	}

	return r
}
