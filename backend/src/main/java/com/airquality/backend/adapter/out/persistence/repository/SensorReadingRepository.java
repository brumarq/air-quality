package com.airquality.backend.adapter.out.persistence.repository;

import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReadingEntity, Long> {
    List<SensorReadingEntity> findBySensorIdOrderByTimestampDesc(Long sensorId);
    
    @Query("SELECT sr FROM SensorReadingEntity sr WHERE sr.sensor.id = :sensorId AND sr.timestamp >= :since ORDER BY sr.timestamp DESC")
    List<SensorReadingEntity> findBySensorIdAndTimestampAfter(@Param("sensorId") Long sensorId, @Param("since") LocalDateTime since);
    
    @Query("SELECT sr FROM SensorReadingEntity sr WHERE sr.sensor.location.id = :locationId ORDER BY sr.timestamp DESC")
    List<SensorReadingEntity> findByLocationIdOrderByTimestampDesc(@Param("locationId") Integer locationId);
    
    boolean existsBySensorIdAndTimestampAndValue(Long sensorId, LocalDateTime timestamp, Double value);
}