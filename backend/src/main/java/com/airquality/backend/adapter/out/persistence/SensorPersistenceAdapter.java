package com.airquality.backend.adapter.out.persistence;

import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.adapter.out.persistence.mapper.SensorMapper;
import com.airquality.backend.adapter.out.persistence.repository.MonitoringStationEntityRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorEntityRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorReadingEntityRepository;
import com.airquality.backend.application.domain.model.Sensor;
import com.airquality.backend.application.port.out.SensorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class SensorPersistenceAdapter implements SensorRepository {

    private final SensorEntityRepository sensorEntityRepository;
    private final MonitoringStationEntityRepository stationRepository;
    private final SensorReadingEntityRepository sensorReadingRepository;
    private final SensorMapper sensorMapper;

    @Override
    @Transactional
    public Sensor save(Integer stationId, Sensor sensor) {
        log.info("Persisting sensor {} for station {}", sensor.getId(), stationId);
        
        return stationRepository.findById(stationId)
                .map(stationEntity -> {
                    SensorEntity sensorEntity = sensorMapper.toEntity(sensor);
                    sensorEntity.setStation(stationEntity);
                    
                    SensorEntity savedEntity = sensorEntityRepository.save(sensorEntity);
                    log.info("Successfully persisted sensor {} for station {}", sensor.getId(), stationId);
                    
                    return sensorMapper.toDomain(savedEntity, Optional.empty());
                })
                .orElseThrow(() -> new IllegalArgumentException("Station not found: " + stationId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Sensor> findByStationId(Integer stationId) {
        List<SensorEntity> entities = sensorEntityRepository.findByStationId(stationId);
        return entities.stream()
                .map(entity -> {
                    Optional<SensorReadingEntity> latestReading = 
                        sensorReadingRepository.findLatestBySensorId(entity.getId());
                    return sensorMapper.toDomain(entity, latestReading);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Sensor> getSensor(Integer sensorId, String parameter, Integer stationId) {
        return sensorEntityRepository.findByIdAndParameterAndStationId(sensorId, parameter, stationId)
                .map(entity -> {
                    Optional<SensorReadingEntity> latestReading = 
                        sensorReadingRepository.findLatestBySensorId(entity.getId());
                    return sensorMapper.toDomain(entity, latestReading);
                });
    }
}