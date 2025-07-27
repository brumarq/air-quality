package com.airquality.backend.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "monitoring_stations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonitoringStationEntity {
    
    @Id
    private Integer id;
    
    // Location data embedded directly
    private String locationName;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    
    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SensorEntity> sensors;
}