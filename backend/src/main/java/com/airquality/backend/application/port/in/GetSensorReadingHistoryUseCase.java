package com.airquality.backend.application.port.in;

import com.airquality.backend.application.domain.model.Measurement;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Inbound port for retrieving a sensor's reading history.
 */
public interface GetSensorReadingHistoryUseCase {

    /**
     * Get all readings for a sensor within a time range, ordered by timestamp ascending.
     */
    List<Measurement> getSensorReadingHistory(Integer sensorId, LocalDateTime from, LocalDateTime to);
}
