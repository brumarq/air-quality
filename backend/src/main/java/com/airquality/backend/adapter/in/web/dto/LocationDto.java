package com.airquality.backend.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDto {
    private Integer id;
    private String name;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
}