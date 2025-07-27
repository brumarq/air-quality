package com.airquality.backend.adapter.out.persistence.mapper;

import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.application.domain.model.Parameter;
import com.airquality.backend.application.domain.model.Sensor;
import org.springframework.stereotype.Component;

@Component
public class SensorMapper {

    public Sensor toDomain(SensorEntity entity) {
        if (entity == null) {
            return null;
        }

        return Sensor.builder()
                .id(entity.getId())
                .parameter(Parameter.valueOf(entity.getParameter().toUpperCase()))
                .lastMeasurement(null) // Would need to fetch latest reading separately
                .build();
    }

    public SensorEntity toEntity(Sensor sensor) {
        if (sensor == null) {
            return null;
        }

        return SensorEntity.builder()
                .id(sensor.getId())
                .parameter(sensor.getParameter().getValue())
                .build();
    }
}