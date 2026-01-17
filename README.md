# Air Quality Monitor

> [!WARNING]  
> **Hey!** This is just a pet project I built to learn and experiment with technologies like **Kafka**, **Go**, **Domain-Driven Design**, **Hexagonal Architecture**, **Mapbox**, and more. It's not production-ready, just a fun playground for exploring how these pieces fit together.

---

## What Does It Look Like?
![example](https://github.com/user-attachments/assets/de2521c6-fb06-4dc1-82ec-dea4b71b3d9f)

---

## What Is This?

A real-time air quality monitoring system that:
- Collects air quality data from the OpenAQ public API
- Streams it through Kafka
- Stores it in PostgreSQL using a clean DDD architecture
- Displays monitoring stations on an interactive map

---

## Architecture Overview

```
         ┌─────────────────┐
         │   OpenAQ API    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Go Collector   │
         └────────┬────────┘
                  │
                  ▼
           ┌─────────────┐
           │    Kafka    │
           │ sensor-data │
           └──────┬──────┘
                  ▼
           ┌─────────────┐
           │   Backend   │
           │ Spring Boot │
           │  (DDD/Hex)  │
           └──────┬──────┘
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
┌─────────────┐        ┌─────────────┐
│ PostgreSQL  │        │  REST API   │
└─────────────┘        └──────┬──────┘
                              ▼
                       ┌─────────────┐
                       │  Frontend   │
                       │   Next.js   │
                       │   Mapbox    │
                       └─────────────┘
```

---

## Tech Stack

| Component | Tech |
|-----------|------|
| **Frontend** | Next.js, TypeScript, Mapbox GL, Tailwind, shadcn/ui |
| **Backend** | Spring Boot, Java, Hexagonal Architecture, DDD |
| **Data Collector** | Go |
| **Message Broker** | Apache Kafka |
| **Database** | PostgreSQL |

---

## What I Learned

- **Hexagonal Architecture** - Keeping domain logic isolated from infrastructure
- **DDD Patterns** - Aggregates, Value Objects, Repositories
- **Event-Driven Systems** - Using Kafka for async data ingestion
- **Go** - Building a simple data collector
- **Mapbox** - Interactive map visualizations

---

## License

Do whatever you want with it. It's just for learning.
