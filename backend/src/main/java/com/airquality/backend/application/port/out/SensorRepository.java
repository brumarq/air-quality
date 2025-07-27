package com.airquality.backend.application.port.out;

import com.airquality.backend.application.domain.model.Sensor;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Sensor persistence operations.
 */
public interface SensorRepository {
    
    /**
     * Save a new sensor for a station.
     */
    void save(Integer stationId, Sensor sensor);
    
    /**
     * Check if a sensor exists.
     */
    boolean exists(Integer sensorId, String parameter, Integer stationId);
    
    /**
     * Find sensors by station ID.
     */
    List<Sensor> findByStationId(Integer stationId);
    
    /**
     * Find a specific sensor.
     */
    Optional<Sensor> findBySensorIdAndParameterAndStationId(Integer sensorId, String parameter, Integer stationId);
    
    /**
     * Get the entity ID for a sensor (needed for reading operations).
     */
    Optional<Integer> getSensorEntityId(Integer sensorId, String parameter, Integer stationId);
}