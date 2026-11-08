# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Spring Boot Java)
- **Build**: `./gradlew build` (from `backend/` directory)
- **Test**: `./gradlew test`
- **Run**: `./gradlew bootRun` (starts on port 8081)
- **Clean**: `./gradlew clean`

### Frontend (Next.js TypeScript)
- **Install dependencies**: `npm install` (from `frontend/` directory)
- **Development**: `npm run dev` (starts on port 3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Production**: `npm run start`

### Data Collector (Go)
- **Build**: `go build -o collector ./cmd` (from `openaq-collector/` directory)
- **Run**: `go run ./cmd/main.go`
- **Test**: `go test ./...`

## Architecture Overview

This is a microservices air quality monitoring system with three main components:

### 1. Backend (Spring Boot + Hexagonal Architecture)
Located in `backend/src/main/java/com/airquality/backend/`:

**Domain Layer** (`application/domain/model/`):
- `MonitoringStation`: Aggregate root containing location and sensors
- `Sensor`: Entity with measurements and business rules
- Value Objects: `Location`, `Coordinates`, `Measurement`, `Parameter`, `Unit`

**Application Layer** (`application/`):
- Use Case interfaces in `port/in/`: `GetStationsUseCase`, `ProcessAirQualityDataUseCase`
- Repository interfaces in `port/out/`: `MonitoringStationRepository`, `SensorRepository`
- Service implementation: `AirQualityService`

**Infrastructure Adapters**:
- **Input Adapters** (`adapter/in/`):
  - REST Controller: `AirQualityController` (port 8081)
  - Kafka Consumer: `AirQualityConsumer` (consumes from `sensor-data` topic)
- **Output Adapters** (`adapter/out/persistence/`):
  - JPA Entities: `MonitoringStationEntity`, `SensorEntity`, `SensorReadingEntity`
  - Repository implementations with custom business logic

**Key Business Rules**:
- One sensor per parameter per monitoring station
- Duplicate readings are prevented at database level
- Domain models enforce invariants (e.g., sensor must belong to station)

### 2. Frontend (Next.js + TypeScript)
Located in `frontend/`:
- Interactive map using Mapbox GL (`components/map/`)
- Real-time air quality data visualization
- Responsive design with Tailwind CSS + shadcn/ui components
- API client in `lib/api/air-quality.ts` connects to backend on port 8081

### 3. Data Collector (Go)
Located in `openaq-collector/`:
- Fetches air quality data from OpenAQ API every 2 minutes
- Publishes to Kafka topic `sensor-data` for backend consumption
- HTTP server for health checks and metrics

## Database Setup

**PostgreSQL** (required for backend):
- Database: `sensor_db`
- Username: `admin`, Password: `admin`
- Port: 5432
- DDL mode: `create-drop` (recreates schema on restart)

**Kafka** (optional but recommended):
- Bootstrap servers: `localhost:9092`
- Topic: `sensor-data`
- Consumer group: `sensor-data-group`

## Domain-Driven Design Patterns

The backend follows DDD with clear separation:
- **Entities**: `MonitoringStation`, `Sensor` (have identity)
- **Value Objects**: `Location`, `Coordinates`, `Measurement`, `Parameter`, `Unit` (immutable, equality by value)
- **Aggregates**: `MonitoringStation` is the aggregate root that controls access to `Sensor` entities
- **Repositories**: Abstract data access behind interfaces in domain layer
- **Use Cases**: Application services that orchestrate domain operations

## API Endpoints

**Backend REST API** (`http://localhost:8081/api/v1/air-quality/`):
- `GET /locations` - List all monitoring stations
- `GET /locations/{locationId}/sensors` - Get sensors for a specific station

**CORS**: Configured for frontend (`http://localhost:3000`)

## Testing Strategy

- **Backend**: JUnit tests in `src/test/java/`
- **Frontend**: Run `npm run lint` for code quality
- **Integration**: Ensure Kafka, PostgreSQL, and all services are running for full system test

## DevOps / Infrastructure

The project is being containerized and deployed to Kubernetes (minikube) via Helm + ArgoCD, with CI/CD through GitHub Actions and GHCR. See `PLAN.md` for the full DevOps roadmap, current phase, and step-by-step instructions.
