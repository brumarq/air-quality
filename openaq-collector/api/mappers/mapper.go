package mapper

import (
	"openaq-collector/api/models"
	"time"
)

func MapToLocationData(locationResult *models.LocationResult) models.LocationData {

	locationData := models.LocationData{
		Location: models.LocationInfo{
			ID:       locationResult.ID,
			Name:     locationResult.Name,
			Country:  locationResult.Country.Code,
			Timezone: locationResult.Timezone,
			Coordinates: models.CoordinateInfo{
				Latitude:  locationResult.Coordinates.Latitude,
				Longitude: locationResult.Coordinates.Longitude,
			},
		},
		Metadata: models.MetadataInfo{
			Provider:  locationResult.Provider.Name,
			Owner:     locationResult.Owner.Name,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		},
		Sensors: []models.SensorWithMeasurement{},
	}

	// Add license if available
	if len(locationResult.Licenses) > 0 {
		locationData.Metadata.License = locationResult.Licenses[0].Name
	}

	return locationData
}

func MapToSensorMeasurement(sensorResult *models.SensorResult) models.SensorWithMeasurement {
	return models.SensorWithMeasurement{
		ID:   sensorResult.ID,
		Name: sensorResult.Name,
		Parameter: models.ParameterInfo{
			Name:        sensorResult.Parameter.Name,
			Units:       sensorResult.Parameter.Units,
			DisplayName: sensorResult.Parameter.DisplayName,
		},
		Measurement: models.MeasurementData{
			Datetime: models.DatetimeInfo{
				UTC:   sensorResult.Latest.Datetime.UTC,
				Local: sensorResult.Latest.Datetime.Local,
			},
			Value: sensorResult.Latest.Value,
		},
	}
}
