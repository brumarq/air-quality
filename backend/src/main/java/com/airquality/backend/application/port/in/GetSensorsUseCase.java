package com.airquality.backend.application.port.in;

import com.airquality.backend.application.domain.model.Sensor;

import java.util.List;

/**
 * Inbound port for retrieving sensor data.
 */
public interface GetSensorsUseCase {
    
    /**
     * Get all sensors for a specific monitoring station.
     */
    List<Sensor> getSensorsByStationId(Integer stationId);
}