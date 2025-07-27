package com.airquality.backend.adapter.out.persistence;

import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.adapter.out.persistence.mapper.SensorReadingMapper;
import com.airquality.backend.adapter.out.persistence.repository.SensorEntityRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorReadingEntityRepository;
import com.airquality.backend.application.domain.model.Measurement;
import com.airquality.backend.application.port.out.SensorReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class SensorReadingPersistenceAdapter implements SensorReadingRepository {

    private final SensorReadingEntityRepository sensorReadingEntityRepository;
    private final SensorEntityRepository sensorEntityRepository;
    private final SensorReadingMapper sensorReadingMapper;

    @Override
    @Transactional
    public void save(Integer sensorEntityId, Measurement measurement) {
        log.debug("Persisting sensor reading for sensor entity {}", sensorEntityId);
        
        sensorEntityRepository.findById(sensorEntityId).ifPresent(sensorEntity -> {
            // Check for duplicates before saving
            if (exists(sensorEntityId, measurement)) {
                log.debug("Duplicate reading ignored for sensor entity {} with value {}", sensorEntityId, measurement.value());
                return;
            }
            
            SensorReadingEntity reading = sensorReadingMapper.toEntity(measurement, sensorEntity);
            sensorReadingEntityRepository.save(reading);
            log.info("Successfully persisted reading for sensor entity {} with value {}", sensorEntityId, measurement.value());
        });
    }

    @Override
    @Transactional(readOnly = true)
    public boolean exists(Integer sensorEntityId, Measurement measurement) {
        return sensorReadingEntityRepository.existsBySensorIdAndTimestampAndValueAndUnit(
                sensorEntityId,
                measurement.timestamp(),
                measurement.value(),
                measurement.unit().getDisplayValue()
        );
    }
}