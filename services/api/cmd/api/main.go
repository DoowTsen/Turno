package main

import (
	"log"

	"turno/services/api/internal/app"
)

func main() {
	application, err := app.Bootstrap()
	if err != nil {
		log.Fatalf("bootstrap application failed: %v", err)
	}

	router := application.Router()
	if err := router.Run(":" + application.Config.HTTP.Port); err != nil {
		log.Fatalf("run server failed: %v", err)
	}
}
