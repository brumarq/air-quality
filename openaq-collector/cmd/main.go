package main

import (
	"context"
	"fmt"
	"openaq-collector/api"
	"openaq-collector/config"
	"openaq-collector/server"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize components
	client := api.NewClient(cfg.APIEndpoint, cfg.APIKey)
	srv := server.NewServer(cfg.ServerPort)

	// Setup shutdown handling
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start services
	startHTTPServer(srv)
	startDataCollector(ctx, client)

	// Log startup information
	fmt.Println("Service started successfully on port", cfg.ServerPort)
	fmt.Println("Press Ctrl+C to stop")

	// Wait for shutdown signal and handle graceful shutdown
	waitForShutdown(srv, cancel)
}

// startHTTPServer starts the HTTP server in a goroutine
func startHTTPServer(srv *server.Server) {
	go func() {
		if err := srv.Start(); err != nil {
			fmt.Printf("Server error: %v\n", err)
		}
	}()
}

// startDataCollector initiates periodic data collection
func startDataCollector(ctx context.Context, client *api.Client) {
	go func() {
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				client.FetchAirQualityData()
			case <-ctx.Done():
				fmt.Println("Stopping periodic data fetch")
				return
			}
		}
	}()
}

// waitForShutdown blocks until shutdown signal is received and handles graceful shutdown
func waitForShutdown(srv *server.Server, cancel context.CancelFunc) {
	// Setup signal handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Block until signal is received
	<-sigChan
	fmt.Println("Shutdown signal received, stopping service...")

	// Cancel the context to stop background tasks
	cancel()

	// Graceful server shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		fmt.Printf("Server shutdown error: %v\n", err)
	}

	fmt.Println("Service stopped")
}
