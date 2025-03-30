package models

// OpenAQLocationResponse represents the overall response from the locations endpoint
type OpenAQLocationResponse struct {
	Meta    Meta             `json:"meta"`
	Results []LocationResult `json:"results"`
}

// LocationResult represents a single location from the response
type LocationResult struct {
	ID            int          `json:"id"`
	Name          string       `json:"name"`
	Locality      string       `json:"locality"`
	Timezone      string       `json:"timezone"`
	Country       Country      `json:"country"`
	Owner         Owner        `json:"owner"`
	Provider      Provider     `json:"provider"`
	IsMobile      bool         `json:"isMobile"`
	IsMonitor     bool         `json:"isMonitor"`
	Instruments   []Instrument `json:"instruments"`
	Sensors       []SensorInfo `json:"sensors"`
	Coordinates   Coordinates  `json:"coordinates"`
	Licenses      []License    `json:"licenses"`
	Bounds        []float64    `json:"bounds"`
	Distance      interface{}  `json:"distance"`
	DatetimeFirst Datetime     `json:"datetimeFirst"`
	DatetimeLast  Datetime     `json:"datetimeLast"`
}

// Country contains information about the country where the location is
type Country struct {
	ID   int    `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
}

// Owner contains information about who owns the monitoring station
type Owner struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Provider contains information about the data provider
type Provider struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Instrument contains information about the monitoring instruments
type Instrument struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// SensorInfo contains basic information about a sensor
type SensorInfo struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Parameter Parameter `json:"parameter"`
}

// License contains information about the data license
type License struct {
	ID          int         `json:"id"`
	Name        string      `json:"name"`
	Attribution Attribution `json:"attribution"`
	DateFrom    string      `json:"dateFrom"`
	DateTo      interface{} `json:"dateTo"`
}

// Attribution contains attribution information for the license
type Attribution struct {
	Name string      `json:"name"`
	URL  interface{} `json:"url"`
}
