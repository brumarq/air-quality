package com.airquality.backend.adapter.in.consumer.mapper;

import com.airquality.backend.adapter.in.consumer.dto.LocationDto;
import com.airquality.backend.adapter.in.consumer.dto.SensorDataDto;
import com.airquality.backend.adapter.in.consumer.dto.SensorDto;
import com.airquality.backend.application.domain.model.Location;
import com.airquality.backend.application.domain.model.LocationData;
import com.airquality.backend.application.domain.model.Sensor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ConsumerDtoMapper {
    public LocationData toDomain(SensorDataDto dto) {
        return LocationData.builder()
                .location(toDomain(dto.getLocation()))
                .sensors(toDomainSensors(dto.getSensors()))
                .build();
    }

    private List<Sensor> toDomainSensors(List<SensorDto> dtos) {
        return dtos.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private Sensor toDomain(SensorDto dto) {
        return Sensor.builder()
                .id(dto.getId())
                .parameter(dto.getParameter())
                .unit(dto.getUnit())
                .lastValue(dto.getLastValue())
                .lastUpdated(dto.getLastUpdated())
                .build();
    }

    private Location toDomain(LocationDto dto) {
        return Location.builder()
                .id(dto.getId())
                .name(dto.getName())
                .city(dto.getCity())
                .country(dto.getCountry())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();
    }
}
