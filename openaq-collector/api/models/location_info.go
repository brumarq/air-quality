package models

// LocationData represents the complete air quality data for a location
type LocationData struct {
	Location LocationInfo            `json:"location"`
	Sensors  []SensorWithMeasurement `json:"sensors"`
	Metadata MetadataInfo            `json:"metadata"`
}

// LocationInfo contains the basic information about a monitoring location
type LocationInfo struct {
	ID          int            `json:"id"`
	Name        string         `json:"name"`
	Country     string         `json:"country"`
	Timezone    string         `json:"timezone"`
	Coordinates CoordinateInfo `json:"coordinates"`
}

// CoordinateInfo represents geographical coordinates
type CoordinateInfo struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// SensorWithMeasurement represents a sensor with its latest measurement
type SensorWithMeasurement struct {
	ID          int             `json:"id"`
	Name        string          `json:"name"`
	Parameter   ParameterInfo   `json:"parameter"`
	Measurement MeasurementData `json:"measurement"`
}

// ParameterInfo contains information about what the sensor measures
type ParameterInfo struct {
	Name        string `json:"name"`
	Units       string `json:"units"`
	DisplayName string `json:"displayName"`
}

// MeasurementData represents the actual measurement from a sensor
type MeasurementData struct {
	Datetime DatetimeInfo `json:"datetime"`
	Value    float64      `json:"value"`
}

// DatetimeInfo represents a timestamp in both UTC and local time
type DatetimeInfo struct {
	UTC   string `json:"utc"`
	Local string `json:"local"`
}

// MetadataInfo contains additional information about the data
type MetadataInfo struct {
	Provider  string `json:"provider"`
	Owner     string `json:"owner"`
	License   string `json:"license"`
	Timestamp string `json:"timestamp"` // When this data was collected
}
