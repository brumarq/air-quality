package com.airquality.backend.adapter.out.persistence;

import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.mapper.SensorMapper;
import com.airquality.backend.adapter.out.persistence.repository.MonitoringStationEntityRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorEntityRepository;
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
    private final SensorMapper sensorMapper;

    @Override
    @Transactional
    public void save(Integer stationId, Sensor sensor) {
        log.info("Persisting sensor {} for station {}", sensor.getId(), stationId);
        
        stationRepository.findById(stationId).ifPresent(stationEntity -> {
            SensorEntity sensorEntity = sensorMapper.toEntity(sensor);
            sensorEntity.setStation(stationEntity);
            
            sensorEntityRepository.save(sensorEntity);
            log.info("Successfully persisted sensor {} for station {}", sensor.getId(), stationId);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public boolean exists(Integer sensorId, String parameter, Integer stationId) {
        return sensorEntityRepository.existsByIdAndParameterAndStationId(sensorId, parameter, stationId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Sensor> findByStationId(Integer stationId) {
        return sensorEntityRepository.findByStationId(stationId).stream()
                .map(sensorMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Sensor> findBySensorIdAndParameterAndStationId(Integer sensorId, String parameter, Integer stationId) {
        return sensorEntityRepository.findByIdAndParameterAndStationId(sensorId, parameter, stationId)
                .map(sensorMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Integer> getSensorEntityId(Integer sensorId, String parameter, Integer stationId) {
        return sensorEntityRepository.findByIdAndParameterAndStationId(sensorId, parameter, stationId)
                .map(SensorEntity::getId);
    }
}