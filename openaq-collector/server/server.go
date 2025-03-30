package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// Server handles HTTP requests for the microservice
type Server struct {
	httpServer *http.Server
}

// NewServer creates a new HTTP server
func NewServer(port string) *Server {
	mux := http.NewServeMux()

	// Register routes
	mux.HandleFunc("/health", healthCheckHandler)
	mux.HandleFunc("/metrics", metricsHandler)

	// Create the server with proper timeouts
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	return &Server{
		httpServer: server,
	}
}

// Start begins listening for HTTP requests
func (s *Server) Start() error {
	log.Printf("Starting HTTP server on %s", s.httpServer.Addr)
	return s.httpServer.ListenAndServe()
}

// Shutdown gracefully stops the HTTP server
func (s *Server) Shutdown(ctx context.Context) error {
	log.Println("Shutting down HTTP server")
	return s.httpServer.Shutdown(ctx)
}

// healthCheckHandler responds to health check requests
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := map[string]string{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
	}

	json.NewEncoder(w).Encode(response)
}

// metricsHandler provides basic metrics about the service
func metricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	metrics := map[string]interface{}{
		"uptime":       formatUptime(),
		"api_requests": 0, // Replace with actual counter
		"errors":       0, // Replace with actual counter
	}

	json.NewEncoder(w).Encode(metrics)
}

// Helper function to calculate uptime
func formatUptime() string {
	// For a real implementation, you'd track the start time
	// when the service starts and calculate the difference
	return "0h 0m 0s"
}
