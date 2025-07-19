package com.airquality.backend.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AirQualityStationDto {
    private String id;
    private String name;
    private double lat;
    private double lng;
    private int aqi;
    private String trend;
}