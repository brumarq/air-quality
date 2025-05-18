package com.airquality.backend.adapter.in.consumer;

import com.airquality.backend.adapter.in.consumer.dto.SensorDataDto;
import com.airquality.backend.adapter.in.consumer.mapper.ConsumerDtoMapper;
import com.airquality.backend.application.domain.model.LocationData;
import com.airquality.backend.application.port.in.ProcessAirQualityDataUseCase;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AirQualityConsumer {
    private final ProcessAirQualityDataUseCase processAirQualityDataUseCase;
    private final ConsumerDtoMapper consumerDtoMapper;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${app.kafka.topic.sensor-data}")
    public void consume(String message) {
        try {
            log.info("Received Kafka message: {}", message);

            SensorDataDto locationDataDto = objectMapper.readValue(message, SensorDataDto.class);
            LocationData locationData = consumerDtoMapper.toDomain(locationDataDto);
            processAirQualityDataUseCase.processAirQualityData(locationData);

        } catch (Exception e) {
            log.error("Error processing Kafka message: {}", message, e);
        }
    }
}
