package com.airquality.backend.adapter.in.web.controller;

import com.airquality.backend.adapter.in.web.dto.LocationDto;
import com.airquality.backend.adapter.in.web.dto.SensorDto;
import com.airquality.backend.application.domain.model.MonitoringStation;
import com.airquality.backend.application.domain.model.Sensor;
import com.airquality.backend.application.port.in.GetSensorsUseCase;
import com.airquality.backend.application.port.in.GetStationsUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/air-quality")
@RequiredArgsConstructor
public class AirQualityController {

    private final GetStationsUseCase getStationsUseCase;
    private final GetSensorsUseCase getSensorsUseCase;

    @GetMapping("/locations")
    public ResponseEntity<List<LocationDto>> getLocations() {
        log.info("Fetching all locations");
        
        List<MonitoringStation> stations = getStationsUseCase.getAllStations();
        List<LocationDto> locationDtos = stations.stream()
                .map(this::toLocationDto)
                .toList();
        
        log.info("Found {} locations", locationDtos.size());
        return ResponseEntity.ok(locationDtos);
    }

    @GetMapping("/locations/{locationId}/sensors")
    public ResponseEntity<List<SensorDto>> getLocationSensors(@PathVariable Integer locationId) {
        log.info("Fetching sensors for location {}", locationId);
        
        List<Sensor> sensors = getSensorsUseCase.getSensorsByStationId(locationId);
        List<SensorDto> sensorDtos = sensors.stream()
                .map(this::toSensorDto)
                .toList();
        
        log.info("Found {} sensors for location {}", sensorDtos.size(), locationId);
        return ResponseEntity.ok(sensorDtos);
    }

    private LocationDto toLocationDto(MonitoringStation station) {
        return LocationDto.builder()
                .id(station.getId())
                .name(station.getLocation().name())
                .city(station.getLocation().city())
                .country(station.getLocation().country())
                .latitude(station.getLocation().coordinates().latitude())
                .longitude(station.getLocation().coordinates().longitude())
                .build();
    }

    private SensorDto toSensorDto(Sensor sensor) {
        SensorDto.SensorDtoBuilder builder = SensorDto.builder()
                .id(sensor.getId().longValue())
                .sensorId(sensor.getId())
                .parameter(sensor.getParameter().getValue())
                .locationId(null); // Not needed since we're getting sensors by location
        
        sensor.getLastMeasurement().ifPresent(measurement -> 
            builder.unit(measurement.unit().getValue())
                   .lastValue(measurement.value())
                   .lastUpdated(measurement.timestamp())
        );
        
        return builder.build();
    }
}