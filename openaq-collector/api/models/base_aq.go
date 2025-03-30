package models

type Coordinates struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type Parameter struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Units       string `json:"units"`
	DisplayName string `json:"displayName"`
}

// Datetime represents a timestamp in both UTC and local time
type Datetime struct {
	UTC   string `json:"utc"`
	Local string `json:"local"`
}
