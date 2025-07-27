package com.airquality.backend.adapter.out.persistence.mapper;

import com.airquality.backend.adapter.out.persistence.entity.MonitoringStationEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.adapter.out.persistence.repository.SensorReadingEntityRepository;
import com.airquality.backend.application.domain.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MonitoringStationMapper {
    
    private final SensorReadingEntityRepository sensorReadingEntityRepository;

    public MonitoringStationEntity toEntity(MonitoringStation domain) {
        MonitoringStationEntity entity = MonitoringStationEntity.builder()
                .id(domain.getId())
                .locationName(domain.getLocation().name())
                .city(domain.getLocation().city())
                .country(domain.getLocation().country())
                .latitude(domain.getLocation().coordinates().latitude())
                .longitude(domain.getLocation().coordinates().longitude())
                .build();

        List<SensorEntity> sensorEntities = domain.getSensors().stream()
                .map(sensor -> toSensorEntity(sensor, entity))
                .collect(Collectors.toList());
        
        entity.setSensors(sensorEntities);
        return entity;
    }

    public MonitoringStation toDomain(MonitoringStationEntity entity) {
        Location location = Location.builder()
                .name(entity.getLocationName())
                .city(entity.getCity())
                .country(entity.getCountry())
                .coordinates(Coordinates.builder()
                        .latitude(entity.getLatitude())
                        .longitude(entity.getLongitude())
                        .build())
                .build();

        List<Sensor> sensors = entity.getSensors().stream()
                .map(this::toSensorDomain)
                .collect(Collectors.toList());

        return MonitoringStation.builder()
                .id(entity.getId())
                .location(location)
                .sensors(sensors)
                .build();
    }

    private SensorEntity toSensorEntity(Sensor sensor, MonitoringStationEntity station) {
        return SensorEntity.builder()
                .id(sensor.getId())
                .parameter(sensor.getParameter().getValue())
                .station(station)
                .build();
    }

    private Sensor toSensorDomain(SensorEntity entity) {
        Optional<SensorReadingEntity> latestReading = sensorReadingEntityRepository.findLatestBySensorId(entity.getId());
        
        Measurement measurement = null;
        if (latestReading.isPresent()) {
            SensorReadingEntity reading = latestReading.get();
            measurement = Measurement.builder()
                    .value(reading.getValue())
                    .unit(Unit.fromDisplayValue(reading.getUnit()))
                    .timestamp(reading.getTimestamp())
                    .parameter(Parameter.fromValue(entity.getParameter()))
                    .build();
        }

        return Sensor.builder()
                .id(entity.getId())
                .parameter(Parameter.fromValue(entity.getParameter()))
                .lastMeasurement(Optional.ofNullable(measurement))
                .build();
    }
}