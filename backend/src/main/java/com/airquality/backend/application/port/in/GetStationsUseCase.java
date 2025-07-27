package com.airquality.backend.application.port.in;

import com.airquality.backend.application.domain.model.MonitoringStation;

import java.util.List;

/**
 * Inbound port for retrieving monitoring station locations.
 */
public interface GetStationsUseCase {
    
    /**
     * Get all monitoring stations.
     */
    List<MonitoringStation> getAllStations();
}