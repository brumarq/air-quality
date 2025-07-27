package com.airquality.backend.adapter.out.persistence;

import com.airquality.backend.adapter.out.persistence.entity.MonitoringStationEntity;
import com.airquality.backend.adapter.out.persistence.mapper.MonitoringStationMapper;
import com.airquality.backend.adapter.out.persistence.repository.MonitoringStationEntityRepository;
import com.airquality.backend.application.domain.model.MonitoringStation;
import com.airquality.backend.application.port.out.MonitoringStationRepository;
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
public class MonitoringStationPersistenceAdapter implements MonitoringStationRepository {

    private final MonitoringStationEntityRepository jpaRepository;
    private final MonitoringStationMapper mapper;

    @Override
    @Transactional
    public MonitoringStation save(MonitoringStation station) {
        log.info("Persisting monitoring station: {}", station.getLocation().name());
        
        // Convert domain to entity and save (without sensors)
        MonitoringStationEntity entity = mapper.toEntity(station);
        MonitoringStationEntity savedEntity = jpaRepository.save(entity);
        
        log.info("Successfully persisted station: {}", station.getLocation().name());
        return mapper.toDomain(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MonitoringStation> findById(Integer id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonitoringStation> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

}