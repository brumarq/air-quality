package com.airquality.backend.adapter.in.web.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor 
@AllArgsConstructor
public class SensorReadingHistoryDto {
    private LocalDateTime timestamp;
    private Double value;
    private String unit;
}
