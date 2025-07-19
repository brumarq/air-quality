package com.airquality.backend.application.service;

import com.airquality.backend.adapter.out.persistence.entity.LocationEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorEntity;
import com.airquality.backend.adapter.out.persistence.entity.SensorReadingEntity;
import com.airquality.backend.adapter.out.persistence.mapper.PersistenceMapper;
import com.airquality.backend.adapter.out.persistence.repository.LocationRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorReadingRepository;
import com.airquality.backend.adapter.out.persistence.repository.SensorRepository;
import com.airquality.backend.application.domain.model.Location;
import com.airquality.backend.application.domain.model.LocationData;
import com.airquality.backend.application.domain.model.Sensor;
import com.airquality.backend.application.port.in.ProcessAirQualityDataUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AirQualityService implements ProcessAirQualityDataUseCase {

    private final LocationRepository locationRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final PersistenceMapper persistenceMapper;

    @Override
    @Transactional
    public void processAirQualityData(LocationData locationData) {
        log.info("Processing air quality data for location: {}", locationData.getLocation().getName());
        
        try {
            LocationEntity locationEntity = saveOrUpdateLocation(locationData.getLocation());
            
            for (Sensor sensor : locationData.getSensors()) {
                SensorEntity sensorEntity = saveOrUpdateSensor(sensor, locationEntity);
                saveSensorReading(sensor, sensorEntity);
            }
            
            log.info("Successfully processed {} sensors for location: {}", 
                    locationData.getSensors().size(), locationData.getLocation().getName());
        } catch (Exception e) {
            log.error("Error processing air quality data for location: {}", 
                    locationData.getLocation().getName(), e);
            throw e;
        }
    }
    
    private LocationEntity saveOrUpdateLocation(Location location) {
        return locationRepository.findById(location.getId())
                .map(existing -> {
                    existing.setName(location.getName());
                    existing.setCity(location.getCity());
                    existing.setCountry(location.getCountry());
                    existing.setLatitude(location.getCoordinates().latitude());
                    existing.setLongitude(location.getCoordinates().longitude());
                    return locationRepository.save(existing);
                })
                .orElseGet(() -> {
                    LocationEntity newLocation = persistenceMapper.toEntity(location);
                    return locationRepository.save(newLocation);
                });
    }
    
    private SensorEntity saveOrUpdateSensor(Sensor sensor, LocationEntity locationEntity) {
        return sensorRepository.findBySensorIdAndParameterAndLocationId(
                sensor.getId(), sensor.getParameter().getValue(), locationEntity.getId())
                .map(existing -> {
                    existing.setUnit(sensor.getLastMeasurement().unit().getValue());
                    existing.setLastValue(sensor.getLastMeasurement().value());
                    existing.setLastUpdated(persistenceMapper.parseDateTime(sensor.getLastMeasurement().timestamp().toString()));
                    return sensorRepository.save(existing);
                })
                .orElseGet(() -> {
                    SensorEntity newSensor = persistenceMapper.toEntity(sensor, locationEntity);
                    return sensorRepository.save(newSensor);
                });
    }
    
    private void saveSensorReading(Sensor sensor, SensorEntity sensorEntity) {
        if (sensor.getLastMeasurement() != null) {
            if (!sensorReadingRepository.existsBySensorIdAndTimestampAndValue(
                    sensorEntity.getId(), sensor.getLastMeasurement().timestamp(), sensor.getLastMeasurement().value())) {
                SensorReadingEntity reading = persistenceMapper.toReadingEntity(sensor, sensorEntity);
                sensorReadingRepository.save(reading);
                log.info("Saved sensor reading for sensor {} with value {}",
                         sensorEntity.getSensorId(), sensor.getLastMeasurement().value());
            } else {
                log.info("Duplicate sensor reading ignored for sensor {} with value {}",
                         sensorEntity.getSensorId(), sensor.getLastMeasurement().value());
            }
        }
    }
}
