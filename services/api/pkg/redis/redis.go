package redis

import (
	"context"
	"fmt"

	redislib "github.com/redis/go-redis/v9"

	"turno/services/api/internal/config"
)

func New(cfg config.RedisConfig) (*redislib.Client, error) {
	client := redislib.NewClient(&redislib.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}

	return client, nil
}
