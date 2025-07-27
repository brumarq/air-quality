package com.airquality.backend.application.domain.model;

import lombok.Builder;

@Builder
public record Location(String name, String city, String country, Coordinates coordinates) {
    public Location {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Location name cannot be null or empty");
        }
        if (coordinates == null) {
            throw new IllegalArgumentException("Location coordinates cannot be null");
        }
    }
}
