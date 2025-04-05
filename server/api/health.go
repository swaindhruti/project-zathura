package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

func HealthCheck(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{
        "status":    "ok",
        "message":   "HectoClash API is running",
        "timestamp": time.Now().Unix(),
    })
}