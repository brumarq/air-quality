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
    Sensor save(Integer stationId, Sensor sensor);

    /**
     * Find sensors by station ID.
     */
    List<Sensor> findByStationId(Integer stationId);

    /**
     * Get the entity ID for a sensor (needed for reading operations).
     */
    Optional<Sensor> getSensor(Integer sensorId, String parameter, Integer stationId);
}