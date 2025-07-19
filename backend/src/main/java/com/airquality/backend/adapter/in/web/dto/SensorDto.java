package com.airquality.backend.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorDto {
    private Long id;
    private Integer sensorId;
    private String parameter;
    private String unit;
    private Double lastValue;
    private LocalDateTime lastUpdated;
    private Integer locationId;
}