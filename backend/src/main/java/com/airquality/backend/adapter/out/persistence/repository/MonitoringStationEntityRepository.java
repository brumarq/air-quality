package com.airquality.backend.adapter.out.persistence.repository;

import com.airquality.backend.adapter.out.persistence.entity.MonitoringStationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonitoringStationEntityRepository extends JpaRepository<MonitoringStationEntity, Integer> {
}