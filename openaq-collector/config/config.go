package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort   string
	APIEndpoint  string
	APIKey       string
	PollInterval time.Duration
}

func Load() *Config {
	godotenv.Load("../.env")

	return &Config{
		ServerPort:   getEnv("SERVER_PORT", "8080"),
		APIEndpoint:  getEnv("OPENAQ_API_ENDPOINT", ""),
		APIKey:       getEnv("OPENAQ_API_KEY", ""),
		PollInterval: getDuration("POLL_INTERVAL", 5*time.Minute),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return fallback
}
