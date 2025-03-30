package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	mapper "openaq-collector/api/mappers"
	"openaq-collector/api/models"
	"time"
)

// Client handles HTTP requests to air quality APIs
type Client struct {
	httpClient *http.Client
	baseURL    string
	apiKey     string
}

// NewClient creates a new API client
func NewClient(baseURL string, apiKey string) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseURL: baseURL,
		apiKey:  apiKey,
	}
}

func (c *Client) FetchAirQualityData() error {

	locationIDs := []int{
		3063270,
		9648,
		9645,
		9642,
		9651,
		2163033,
		2163037,
		9650,
		2163038,
	}

	var allLocationsData []models.LocationData

	// Process each location
	for _, locationId := range locationIDs {
		locationData, err := c.FetchLocationWithSensors(locationId)
		if err != nil {
			log.Printf("Error processing location %d: %v", locationId, err)
			continue // Skip this location but continue with others
		}

		allLocationsData = append(allLocationsData, locationData)
	}

	// Send all data to Kafka
	// for _, locationData := range allLocationsData {
	//     if err := c.sendToKafka(locationData); err != nil {
	//         log.Printf("Error sending data to Kafka for location %d: %v",
	//             locationData.Location.ID, err)
	//     }
	// }

	log.Printf("Successfully processed %d locations", len(allLocationsData))

	return nil
}

func (c *Client) FetchLocationWithSensors(locationId int) (models.LocationData, error) {
	// Step 1: Fetch location data
	locationResp, err := c.FetchLocationData(locationId)
	if err != nil {
		return models.LocationData{}, fmt.Errorf("failed to fetch location: %w", err)
	}

	if len(locationResp.Results) == 0 {
		return models.LocationData{}, fmt.Errorf("no location found with ID: %d", locationId)
	}

	locationResult := locationResp.Results[0]

	// Step 2: Initialize the output structure
	locationData := mapper.MapToLocationData(&locationResult)

	// Step 3: Fetch each sensor's data and add to the location
	for _, sensorInfo := range locationResult.Sensors {
		sensorData, err := c.FetchSensorData(sensorInfo.ID)
		if err != nil {
			log.Printf("Warning: Could not fetch sensor %d: %v", sensorInfo.ID, err)
			continue
		}

		if len(sensorData.Results) == 0 {
			log.Printf("Warning: No data for sensor %d", sensorInfo.ID)
			continue
		}

		sensorResult := sensorData.Results[0]

		sensorWithMeasurement := mapper.MapToSensorMeasurement(&sensorResult)

		locationData.Sensors = append(locationData.Sensors, sensorWithMeasurement)
	}

	return locationData, nil
}

func (c *Client) FetchLocationData(locationId int) (models.OpenAQLocationResponse, error) {
	// Use the locationId parameter instead of hardcoded 8118
	requestUrl := fmt.Sprintf("%s/locations/%d", c.baseURL, locationId)

	req, err := http.NewRequest(http.MethodGet, requestUrl, nil)
	if err != nil {
		return models.OpenAQLocationResponse{}, fmt.Errorf("failed to create request for openAQ: %w", err)
	}

	req.Header.Add("X-API-Key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return models.OpenAQLocationResponse{}, fmt.Errorf("failed to perform request for openAQ: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return models.OpenAQLocationResponse{}, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var response models.OpenAQLocationResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return models.OpenAQLocationResponse{}, fmt.Errorf("failed to parse API response: %w", err)
	}

	return response, nil
}

func (c *Client) FetchSensorData(sensorId int) (models.SensorResponse, error) {
	requestUrl := fmt.Sprintf("%s/sensors/%d", c.baseURL, sensorId)

	req, err := http.NewRequest(http.MethodGet, requestUrl, nil)
	if err != nil {
		return models.SensorResponse{}, fmt.Errorf("failed to create request for sensor: %w", err)
	}

	req.Header.Add("X-API-Key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return models.SensorResponse{}, fmt.Errorf("failed to perform request for sensor: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return models.SensorResponse{}, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var response models.SensorResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return models.SensorResponse{}, fmt.Errorf("failed to parse sensor API response: %w", err)
	}

	return response, nil
}
