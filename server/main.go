package main

import (
	"log"
	"os"

	"github.com/ayussh-2/project-zathura/server/api"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
    app := fiber.New(fiber.Config{
        AppName: "HectoClash API",
    })

    app.Use(logger.New())
    app.Use(recover.New())
    app.Use(cors.New())

    setupRoutes(app)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Printf("Server starting on port %s", port)
    log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
    app.Get("/health", api.HealthCheck)
}