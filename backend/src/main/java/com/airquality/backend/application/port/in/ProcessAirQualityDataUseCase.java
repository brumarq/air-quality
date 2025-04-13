package com.airquality.backend.application.port.in;

import com.airquality.backend.application.domain.model.LocationData;

public interface ProcessAirQualityDataUseCase {
    void processAirQualityData(LocationData locationData);
}
