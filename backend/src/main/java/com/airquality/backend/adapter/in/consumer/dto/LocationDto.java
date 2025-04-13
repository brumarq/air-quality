package com.airquality.backend.adapter.in.consumer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationDto {
    private int id;
    private String name;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
}
