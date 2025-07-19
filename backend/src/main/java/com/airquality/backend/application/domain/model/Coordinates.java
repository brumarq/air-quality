package com.airquality.backend.application.domain.model;

import lombok.Builder;

@Builder
public record Coordinates(Double latitude, Double longitude) {
    public Coordinates {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Coordinates cannot be null");
        }

        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Latitude must be between -90.0 and 90.0 degrees.");
        }

        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Longitude must be between -180.0 and 180.0 degrees.");
        }
    }
}
