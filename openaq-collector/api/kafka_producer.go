package api

import (
	"encoding/json"
	"fmt"
	"log"
	"openaq-collector/api/models"

	"github.com/IBM/sarama"
)

type KafkaProducer struct {
	producer sarama.SyncProducer
	topic    string
}

func NewKafkaProducer(brokers []string, topic string) (*KafkaProducer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5
	config.Producer.Return.Successes = true

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Kafka producer: %w", err)
	}

	return &KafkaProducer{
		producer: producer,
		topic:    topic,
	}, nil
}

func (kp *KafkaProducer) SendLocationData(locationData models.LocationData) error {
	// Convert location data to JSON
	jsonData, err := json.Marshal(locationData)
	if err != nil {
		return fmt.Errorf("failed to marshal location data: %w", err)
	}

	// Create message
	msg := &sarama.ProducerMessage{
		Topic: kp.topic,
		Key:   sarama.StringEncoder(fmt.Sprintf("%d", locationData.Location.ID)),
		Value: sarama.ByteEncoder(jsonData),
	}

	// Send message to Kafka
	partition, offset, err := kp.producer.SendMessage(msg)
	if err != nil {
		return fmt.Errorf("failed to send message to Kafka: %w", err)
	}

	log.Printf("Location data for ID %d sent to Kafka topic %s (partition %d, offset %d)",
		locationData.Location.ID, kp.topic, partition, offset)
	return nil
}

// Close closes the Kafka producer
func (kp *KafkaProducer) Close() error {
	if kp.producer != nil {
		return kp.producer.Close()
	}
	return nil
}
