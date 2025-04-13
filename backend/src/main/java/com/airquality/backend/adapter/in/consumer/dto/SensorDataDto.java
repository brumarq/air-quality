package com.airquality.backend.adapter.in.consumer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SensorDataDto {
    private LocationDto location;
    private List<SensorDto> sensors;
}
