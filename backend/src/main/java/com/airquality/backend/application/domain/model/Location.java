package com.airquality.backend.application.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Location {
    private Integer id;
    private String name;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
}
