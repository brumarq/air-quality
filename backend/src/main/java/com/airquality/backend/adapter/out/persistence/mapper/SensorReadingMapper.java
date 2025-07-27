package com.airquality.backend.adapter.out.persistence.mapper;

import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.application.domain.model.Measurement;
import com.airquality.backend.application.domain.model.Parameter;
import com.airquality.backend.application.domain.model.Unit;
import org.springframework.stereotype.Component;

@Component
public class SensorReadingMapper {

    public SensorReadingEntity toEntity(Measurement measurement, SensorEntity sensorEntity) {
        return SensorReadingEntity.builder()
                .value(measurement.value())
                .timestamp(measurement.timestamp())
                .unit(measurement.unit().getDisplayValue())
                .sensor(sensorEntity)
                .build();
    }

    public Measurement toDomain(SensorReadingEntity readingEntity) {
        Parameter parameter = Parameter.fromValue(readingEntity.getSensor().getParameter());

        return Measurement.builder()
                .value(readingEntity.getValue())
                .unit(Unit.fromDisplayValue(readingEntity.getUnit()))
                .timestamp(readingEntity.getTimestamp())
                .parameter(parameter)
                .build();
    }
}