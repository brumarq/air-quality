package com.airquality.backend.adapter.out.persistence.mapper;

import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.application.domain.model.Measurement;
import com.airquality.backend.application.domain.model.Parameter;
import com.airquality.backend.application.domain.model.Sensor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SensorMapper {

    private final SensorReadingMapper sensorReadingMapper;

    public Sensor toDomain(SensorEntity entity, Optional<SensorReadingEntity> latestReading) {
        Optional<Measurement> latestMeasurement = latestReading.map(sensorReadingMapper::toDomain);

        return Sensor.builder()
                .id(entity.getId())
                .parameter(Parameter.fromValue(entity.getParameter()))
                .lastMeasurement(latestMeasurement)
                .build();
    }

    public SensorEntity toEntity(Sensor sensor) {
        return SensorEntity.builder()
                .id(sensor.getId())
                .parameter(sensor.getParameter().getValue())
                .build();
    }
}