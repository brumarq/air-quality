package models

// SensorResponse represents the overall response from the sensors endpoint
type SensorResponse struct {
	Meta    Meta           `json:"meta"`
	Results []SensorResult `json:"results"`
}

// Meta contains metadata about the API response
type Meta struct {
	Name    string `json:"name"`
	Website string `json:"website"`
	Page    int    `json:"page"`
	Limit   int    `json:"limit"`
	Found   int    `json:"found"`
}

// SensorResult represents a single sensor from the response
type SensorResult struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	Parameter     Parameter `json:"parameter"`
	DatetimeFirst Datetime  `json:"datetimeFirst"`
	DatetimeLast  Datetime  `json:"datetimeLast"`
	Coverage      Coverage  `json:"coverage"`
	Latest        Latest    `json:"latest"`
	Summary       Summary   `json:"summary"`
}

// Parameter contains information about what the sensor measures

// Coverage provides information about data completeness
type Coverage struct {
	ExpectedCount    int      `json:"expectedCount"`
	ExpectedInterval string   `json:"expectedInterval"`
	ObservedCount    int      `json:"observedCount"`
	ObservedInterval string   `json:"observedInterval"`
	PercentComplete  float64  `json:"percentComplete"`
	PercentCoverage  float64  `json:"percentCoverage"`
	DatetimeFrom     Datetime `json:"datetimeFrom"`
	DatetimeTo       Datetime `json:"datetimeTo"`
}

// Latest contains the most recent measurement from the sensor
type Latest struct {
	Datetime    Datetime    `json:"datetime"`
	Value       float64     `json:"value"`
	Coordinates Coordinates `json:"coordinates"`
}

// Coordinates represents geographical coordinates

// Summary contains statistical information about the sensor readings
type Summary struct {
	Min float64 `json:"min"`
	Max float64 `json:"max"`
	Avg float64 `json:"avg"`
}
