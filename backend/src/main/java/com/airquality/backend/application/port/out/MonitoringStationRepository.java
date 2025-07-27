package com.airquality.backend.application.port.out;

import com.airquality.backend.application.domain.model.MonitoringStation;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for MonitoringStation persistence operations.
 * Defines business-focused persistence operations the application needs.
 */
public interface MonitoringStationRepository {
    
    /**
     * Save or update a monitoring station.
     */
    MonitoringStation save(MonitoringStation station);
    
    /**
     * Find a monitoring station by its ID.
     */
    Optional<MonitoringStation> findById(Integer id);
    
    /**
     * Find all monitoring stations.
     */
    List<MonitoringStation> findAll();
}