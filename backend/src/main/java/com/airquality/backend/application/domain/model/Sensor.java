package com.airquality.backend.application.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sensor {
    private Integer id;
    private Parameter parameter;
    private Measurement lastMeasurement;
    private Location location;
}