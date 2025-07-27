package com.airquality.backend.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_readings", 
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"sensor_id", "timestamp", "value"}
       ))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorReadingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "value", nullable = false)
    private Double value;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "unit", nullable = false)
    private String unit;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id", nullable = false)
    private SensorEntity sensor;
}