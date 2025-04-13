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
    private String parameter;
    private String unit;
    private Double lastValue;
    private String lastUpdated;
    private Integer locationId;
}