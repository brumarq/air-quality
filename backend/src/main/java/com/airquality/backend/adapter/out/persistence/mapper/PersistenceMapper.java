package com.airquality.backend.adapter.out.persistence.mapper;

import com.airquality.backend.adapter.out.persistence.entity.LocationEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.application.domain.model.Location;
import com.airquality.backend.application.domain.model.Sensor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Component
public class PersistenceMapper {
    
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    
    public LocationEntity toEntity(Location location) {
        return LocationEntity.builder()
                .id(location.getId())
                .name(location.getName())
                .city(location.getCity())
                .country(location.getCountry())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .build();
    }
    
    public SensorEntity toEntity(Sensor sensor, LocationEntity location) {
        return SensorEntity.builder()
                .sensorId(sensor.getId())
                .parameter(sensor.getParameter())
                .unit(sensor.getUnit())
                .lastValue(sensor.getLastValue())
                .lastUpdated(parseDateTime(sensor.getLastUpdated()))
                .location(location)
                .build();
    }
    
    public SensorReadingEntity toReadingEntity(Sensor sensor, SensorEntity sensorEntity) {
        return SensorReadingEntity.builder()
                .value(sensor.getLastValue())
                .timestamp(parseDateTime(sensor.getLastUpdated()))
                .sensor(sensorEntity)
                .build();
    }
    
    public LocalDateTime parseDateTime(String dateTimeString) {
        if (dateTimeString == null || dateTimeString.isEmpty()) {
            return LocalDateTime.now();
        }
        
        try {
            return LocalDateTime.parse(dateTimeString, ISO_FORMATTER);
        } catch (DateTimeParseException e) {
            return LocalDateTime.now();
        }
    }
}