package com.airquality.backend.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorEntity {
    @Id
    @Column(name = "sensor_id")
    private Integer id;
    
    @Column(name = "parameter", nullable = false)
    private String parameter;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private MonitoringStationEntity station;
}