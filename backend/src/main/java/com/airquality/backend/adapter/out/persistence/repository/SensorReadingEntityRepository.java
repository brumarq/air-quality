package com.airquality.backend.adapter.out.persistence.repository;

import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SensorReadingEntityRepository extends JpaRepository<SensorReadingEntity, Long> {
    
    boolean existsBySensorIdAndTimestampAndValueAndUnit(Integer sensorId, LocalDateTime timestamp, Double value, String unit);
    
    @Query("SELECT sr FROM SensorReadingEntity sr WHERE sr.sensor.id = :sensorId ORDER BY sr.timestamp DESC LIMIT 1")
    Optional<SensorReadingEntity> findLatestBySensorId(@Param("sensorId") Integer sensorId);

    List<SensorReadingEntity> findBySensorIdAndTimestampBetween(Integer sensorId, LocalDateTime from, LocalDateTime to);
}
