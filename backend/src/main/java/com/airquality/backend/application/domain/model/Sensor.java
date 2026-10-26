package com.airquality.backend.application.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Optional;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sensor {
    private Integer id;
    private Parameter parameter;
    private Optional<Measurement> lastMeasurement;
}