package com.airquality.backend.application.domain.model;

import lombok.Builder;

import java.time.LocalDateTime;


@Builder
public record Measurement(Double value, Unit unit, LocalDateTime timestamp, Parameter parameter) {
    public Measurement {
        if (value == null) {
            throw new IllegalArgumentException("Measurement value cannot be null");
        }
        if (unit == null) {
            throw new IllegalArgumentException("Measurement unit cannot be null");
        }
        if (timestamp == null) {
            throw new IllegalArgumentException("Measurement timestamp cannot be null");
        }
        if (parameter == null) {
            throw new IllegalArgumentException("Measurement parameter cannot be null");
        }
        if (value < 0) {
            throw new IllegalArgumentException("Measurement value cannot be negative: " + value);
        }
    }
}
