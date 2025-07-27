package com.airquality.backend.application.service;

import com.airquality.backend.application.domain.model.MonitoringStation;
import com.airquality.backend.application.domain.model.Parameter;
import com.airquality.backend.application.domain.model.Sensor;
import com.airquality.backend.application.port.in.GetSensorsUseCase;
import com.airquality.backend.application.port.in.GetStationsUseCase;
import com.airquality.backend.application.port.in.ProcessAirQualityDataUseCase;
import com.airquality.backend.application.port.out.MonitoringStationRepository;
import com.airquality.backend.application.port.out.SensorRepository;
import com.airquality.backend.application.port.out.SensorReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AirQualityService implements ProcessAirQualityDataUseCase, GetStationsUseCase, GetSensorsUseCase {

    private final MonitoringStationRepository stationRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;

    /**
     * Processes incoming air quality data from Kafka.
     * Each entity type (station, sensors, readings) is processed independently.
     */
    @Override
    public void processAirQualityData(MonitoringStation incomingStation) {
        log.info("Processing air quality data for location: {}", incomingStation.getLocation().name());
        
        try {
            // Step 1: Process monitoring station entity
            Integer stationId = processMonitoringStation(incomingStation);
            
            // Step 2: Process sensor entities independently
            for (Sensor sensor : incomingStation.getSensors()) {
                processSensorEntity(stationId, sensor);
            }
            
            log.info("Successfully processed air quality data for location: {}", incomingStation.getLocation().name());
            
        } catch (Exception e) {
            log.error("Error processing air quality data for location: {}", 
                    incomingStation.getLocation().name(), e);
            throw e;
        }
    }
    
    /**
     * Processes monitoring station entity independently.
     * Creates new station if it doesn't exist, otherwise returns existing station ID.
     */
    private Integer processMonitoringStation(MonitoringStation incomingStation) {
        Optional<MonitoringStation> existingStation = stationRepository.findById(incomingStation.getId());
        
        if (existingStation.isEmpty()) {
            log.info("Creating new monitoring station: {}", incomingStation.getLocation().name());
            MonitoringStation savedStation = stationRepository.save(incomingStation);
            return savedStation.getId();
        } else {
            log.debug("Using existing monitoring station: {}", incomingStation.getLocation().name());
            return existingStation.get().getId();
        }
    }
    
    /**
     * Processes sensor entity independently.
     * Creates sensor if new, then processes its reading.
     */
    private void processSensorEntity(Integer stationId, Sensor sensor) {
        boolean sensorExists = sensorRepository.exists(
                sensor.getId(),
                sensor.getParameter().getValue(),
                stationId
        );
        
        if (!sensorExists) {
            log.info("Creating new sensor {} for parameter {}", sensor.getId(), sensor.getParameter().getValue());
            sensorRepository.save(stationId, sensor);
        }
        
        // Step 3: Process sensor reading entity independently
        processSensorReading(stationId, sensor);
    }
    
    /**
     * Processes sensor reading entity independently.
     * Saves reading if measurement data is available.
     */
    private void processSensorReading(Integer stationId, Sensor sensor) {
        if (sensor.getLastMeasurement().isEmpty()) {
            log.debug("No measurement data for sensor {}", sensor.getId());
            return;
        }
        
        log.debug("Processing reading for sensor {}", sensor.getId());
        sensorRepository.getSensorEntityId(sensor.getId(), sensor.getParameter().getValue(), stationId)
                .ifPresentOrElse(
                        sensorEntityId -> sensorReadingRepository.save(sensorEntityId, sensor.getLastMeasurement().get()),
                        () -> log.warn("Could not find sensor entity for sensor {}", sensor.getId())
                );
    }

    @Override
    public List<MonitoringStation> getAllStations() {
        log.info("Retrieving all monitoring stations");
        return stationRepository.findAll();
    }

    @Override
    public List<Sensor> getSensorsByStationId(Integer stationId) {
        log.info("Retrieving sensors for station {}", stationId);
        return sensorRepository.findByStationId(stationId);
    }

    public Optional<MonitoringStation> getStationById(Integer stationId) {
        log.info("Retrieving station {}", stationId);
        return stationRepository.findById(stationId);
    }
}
