package com.airquality.backend.application.port.in;

import com.airquality.backend.application.domain.model.MonitoringStation;

public interface ProcessAirQualityDataUseCase {
    void processAirQualityData(MonitoringStation locationData);
}
