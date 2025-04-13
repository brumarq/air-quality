package com.airquality.backend.application.service;

import com.airquality.backend.application.domain.model.LocationData;
import com.airquality.backend.application.port.in.ProcessAirQualityDataUseCase;
import org.springframework.stereotype.Service;

@Service
public class AirQualityService implements ProcessAirQualityDataUseCase {

    @Override
    public void processAirQualityData(LocationData locationData) {
        System.out.println("Processing air quality data: " + locationData.getLocation().getName());
    }
}
