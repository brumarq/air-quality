package com.airquality.backend.application.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum Parameter {
    PM2_5("pm25"),
    PM10("pm10"),
    NO("no"),
    NO2("no2"),
    O3("o3"),
    CO("co"),
    SO2("so2"),
    TEMPERATURE("Temperature"),
    HUMIDITY("Humidity");

    private final String value;

    public static Parameter fromValue(String value) {
        return Arrays.stream(values())
                .filter(parameter -> parameter.getValue().equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown parameter: " + value));
    }
}
