package com.airquality.backend.adapter.in.consumer.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SensorDto {
    private Integer id;
    private String name;
    private ParameterDto parameter;
    private MeasurementDto measurement;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MeasurementDto {
        private DateTimeDto datetime;
        private Double value;
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class DateTimeDto {
            private String utc;
            private String local;

            public LocalDateTime toLocalDateTime() {
                if (utc != null) {
                    return OffsetDateTime.parse(utc).toLocalDateTime();
                }
                if (local != null) {
                    return LocalDateTime.parse(local);
                }
                throw new IllegalStateException("Both utc and local are null");
            }
        }
    }
}
