package com.airquality.backend.adapter.in.consumer.mapper;

import com.airquality.backend.adapter.in.consumer.dto.LocationDto;
import com.airquality.backend.adapter.in.consumer.dto.SensorDataDto;
import com.airquality.backend.adapter.in.consumer.dto.SensorDto;
import com.airquality.backend.application.domain.model.Coordinates;
import com.airquality.backend.application.domain.model.Location;
import com.airquality.backend.application.domain.model.LocationData;
import com.airquality.backend.application.domain.model.Measurement;
import com.airquality.backend.application.domain.model.Parameter;
import com.airquality.backend.application.domain.model.Sensor;
import com.airquality.backend.application.domain.model.Unit;
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
                .parameter(Parameter.fromName(dto.getParameter().getName()))
                .lastMeasurement(
                        Measurement.builder()
                                .value(dto.getMeasurement().getValue())
                                .parameter(Parameter.fromName(dto.getParameter().getName()))
                                .timestamp(dto.getMeasurement().getDatetime().toLocalDateTime())
                                .unit(Unit.fromDisplayValue(dto.getParameter().getUnits())).build())
                .build();
    }

    private Location toDomain(LocationDto dto) {
        return Location.builder()
                .id(dto.getId())
                .name(dto.getName())
                .city(null)
                .country(dto.getCountry())
                .coordinates(
                        Coordinates.builder().
                                latitude(dto.getCoordinates().getLatitude())
                                .longitude(dto.getCoordinates().getLongitude())
                                .build()
                )
                .build();
    }
}