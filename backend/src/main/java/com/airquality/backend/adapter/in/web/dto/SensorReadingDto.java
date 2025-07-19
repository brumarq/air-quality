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
public class SensorReadingDto {
    private Long id;
    private Double value;
    private LocalDateTime timestamp;
    private SensorDto sensor;
}