package com.airquality.backend.adapter.out.persistence.mapper;

import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.application.domain.model.Measurement;
import org.springframework.stereotype.Component;

@Component
public class SensorReadingMapper {

    public SensorReadingEntity toEntity(Measurement measurement, SensorEntity sensorEntity) {
        if (measurement == null) {
            return null;
        }

        return SensorReadingEntity.builder()
                .value(measurement.value())
                .timestamp(measurement.timestamp())
                .unit(measurement.unit().getDisplayValue())
                .sensor(sensorEntity)
                .build();
    }
}