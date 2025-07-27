package com.airquality.backend.adapter.in.consumer.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LocationDto {
    @NotNull
    private Integer id;
    @NotBlank
    private String name;
    private String country;
    private String timezone;
    @NotNull @Valid
    private CoordinatesDto coordinates;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CoordinatesDto {
        @NotNull
        private Double latitude;
        @NotNull
        private Double longitude;
    }
}
