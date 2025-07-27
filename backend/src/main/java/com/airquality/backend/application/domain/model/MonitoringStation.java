package com.airquality.backend.application.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonitoringStation {
    private Integer id;
    private Location location;
    @Builder.Default
    private List<Sensor> sensors = new ArrayList<>();

}
