package com.airquality.backend.adapter.out.persistence.repository;

import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorEntityRepository extends JpaRepository<SensorEntity, Integer> {
    
    boolean existsByIdAndParameterAndStationId(Integer sensorId, String parameter, Integer stationId);
    
    Optional<SensorEntity> findByIdAndParameterAndStationId(Integer sensorId, String parameter, Integer stationId);
    
    List<SensorEntity> findByStationId(Integer stationId);
}