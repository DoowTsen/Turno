package app

import (
	"fmt"

	"github.com/gin-gonic/gin"
	redislib "github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"turno/services/api/internal/config"
	"turno/services/api/internal/handler"
	"turno/services/api/internal/model"
	loggerpkg "turno/services/api/pkg/logger"
	mysqlpkg "turno/services/api/pkg/mysql"
	redispkg "turno/services/api/pkg/redis"
)

type Application struct {
	Config *config.Config
	Logger *zap.Logger
	DB     *gorm.DB
	Redis  *redislib.Client
}

func Bootstrap() (*Application, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}

	log, err := loggerpkg.New()
	if err != nil {
		return nil, fmt.Errorf("init logger: %w", err)
	}

	db, err := mysqlpkg.New(cfg.MySQL)
	if err != nil {
		return nil, fmt.Errorf("connect mysql: %w", err)
	}

	if err := db.AutoMigrate(
		&model.User{},
		&model.UserAddress{},
		&model.Category{},
		&model.CategoryI18n{},
		&model.Product{},
		&model.ProductImage{},
		&model.Favorite{},
		&model.Order{},
		&model.Shipment{},
		&model.Review{},
		&model.Conversation{},
		&model.Message{},
		&model.AfterSale{},
		&model.AfterSaleLog{},
		&model.Notification{},
		&model.NotificationTemplate{},
		&model.PlatformConfig{},
		&model.AdminAuditLog{},
	); err != nil {
		return nil, fmt.Errorf("auto migrate: %w", err)
	}

	redisClient, err := redispkg.New(cfg.Redis)
	if err != nil {
		return nil, fmt.Errorf("connect redis: %w", err)
	}

	return &Application{
		Config: cfg,
		Logger: log,
		DB:     db,
		Redis:  redisClient,
	}, nil
}

func (a *Application) Router() *gin.Engine {
	deps := handler.Dependencies{Config: a.Config, Logger: a.Logger, DB: a.DB, Redis: a.Redis}
	return handler.NewRouter(deps)
}

