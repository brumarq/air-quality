package com.airquality.backend.adapter.in.web.controller;

import com.airquality.backend.adapter.in.web.dto.LocationDto;
import com.airquality.backend.adapter.in.web.dto.SensorDto;
import com.airquality.backend.adapter.in.web.dto.SensorReadingDto;
import com.airquality.backend.adapter.out.persistence.entity.LocationEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.adapter.out.persistence.repository.LocationRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorReadingRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/air-quality")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AirQualityController {

    private final LocationRepository locationRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;

    @GetMapping("/locations")
    public ResponseEntity<List<LocationDto>> getLocations() {
        log.info("Fetching all locations");
        
        List<LocationEntity> locations = locationRepository.findAll();
        List<LocationDto> locationDtos = locations.stream()
                .map(this::toLocationDto)
                .collect(Collectors.toList());
        
        log.info("Found {} locations", locationDtos.size());
        return ResponseEntity.ok(locationDtos);
    }

    @GetMapping("/locations/{locationId}/sensors")
    public ResponseEntity<List<SensorDto>> getLocationSensors(@PathVariable Integer locationId) {
        log.info("Fetching sensors for location {}", locationId);
        
        List<SensorEntity> sensors = sensorRepository.findByLocationId(locationId);
        List<SensorDto> sensorDtos = sensors.stream()
                .map(this::toSensorDto)
                .collect(Collectors.toList());
        
        log.info("Found {} sensors for location {}", sensorDtos.size(), locationId);
        return ResponseEntity.ok(sensorDtos);
    }

    @GetMapping("/locations/{locationId}/readings")
    public ResponseEntity<List<SensorReadingDto>> getLocationReadings(
            @PathVariable Integer locationId,
            @RequestParam(defaultValue = "24") int hours) {
        
        log.info("Fetching readings for location {} for last {} hours", locationId, hours);
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<SensorReadingEntity> readings = sensorReadingRepository
                .findByLocationIdOrderByTimestampDesc(locationId);
        
        List<SensorReadingDto> readingDtos = readings.stream()
                .filter(reading -> reading.getTimestamp().isAfter(since))
                .map(this::toSensorReadingDto)
                .collect(Collectors.toList());
        
        log.info("Found {} readings for location {}", readingDtos.size(), locationId);
        return ResponseEntity.ok(readingDtos);
    }

    @GetMapping("/sensors/{sensorId}/readings")
    public ResponseEntity<List<SensorReadingDto>> getSensorReadings(
            @PathVariable Long sensorId,
            @RequestParam(defaultValue = "24") int hours) {
        
        log.info("Fetching readings for sensor {} for last {} hours", sensorId, hours);
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<SensorReadingEntity> readings = sensorReadingRepository
                .findBySensorIdAndTimestampAfter(sensorId, since);
        
        List<SensorReadingDto> readingDtos = readings.stream()
                .map(this::toSensorReadingDto)
                .collect(Collectors.toList());
        
        log.info("Found {} readings for sensor {}", readingDtos.size(), sensorId);
        return ResponseEntity.ok(readingDtos);
    }

    private LocationDto toLocationDto(LocationEntity entity) {
        return LocationDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .city(entity.getCity())
                .country(entity.getCountry())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .build();
    }

    private SensorDto toSensorDto(SensorEntity entity) {
        return SensorDto.builder()
                .id(entity.getId())
                .sensorId(entity.getSensorId())
                .parameter(entity.getParameter())
                .unit(entity.getUnit())
                .lastValue(entity.getLastValue())
                .lastUpdated(entity.getLastUpdated())
                .locationId(entity.getLocation().getId())
                .build();
    }

    private SensorReadingDto toSensorReadingDto(SensorReadingEntity entity) {
        return SensorReadingDto.builder()
                .id(entity.getId())
                .value(entity.getValue())
                .timestamp(entity.getTimestamp())
                .sensor(toSensorDto(entity.getSensor()))
                .build();
    }
}