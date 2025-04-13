package com.airquality.backend.adapter.in.consumer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SensorDto {
    private Integer id;
    private String parameter;
    private String unit;
    private Double lastValue;
    private String lastUpdated;
}
