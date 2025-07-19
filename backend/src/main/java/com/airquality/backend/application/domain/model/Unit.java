package com.airquality.backend.application.domain.model;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum Unit {
    MICROGRAMS_PER_CUBIC_METER("µg/m³");

    private final String displayValue;

    @JsonValue
    public String getValue() {
        return displayValue;
    }

    public static Unit fromDisplayValue(String displayValue) {
        return Arrays.stream(values())
                .filter(unit -> unit.getDisplayValue().equals(displayValue))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown unit: " + displayValue));
    }
}
