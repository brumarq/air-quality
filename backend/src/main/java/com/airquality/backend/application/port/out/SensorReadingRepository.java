package com.airquality.backend.application.port.out;

import com.airquality.backend.application.domain.model.Measurement;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Outbound port for SensorReading persistence operations.
 */
public interface SensorReadingRepository {

    /**
     * Save a sensor reading for a specific sensor entity.
     */
    void save(Integer sensorEntityId, Measurement measurement);

    /**
     * Check if a reading already exists for a sensor entity.
     */
    boolean exists(Integer sensorEntityId, Measurement measurement);

    /**
     * Get all readings for a sensor entity within a time range, ordered by timestamp ascending.
     */
    List<Measurement> getSensorReadingHistory(Integer sensorEntityId, LocalDateTime from, LocalDateTime to);
}
