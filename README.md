# Air Quality Monitor

> [!WARNING]  
> **Hey!** This is just a pet project I built to learn and experiment with technologies like **Kafka**, **Go**, **Domain-Driven Design**, **Hexagonal Architecture**, **Mapbox**, and more. It's not production-ready, there are no tests, just a fun playground for exploring how these pieces fit together.

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

## Running It Locally (Kubernetes)

Everything runs on [minikube](https://minikube.sigs.k8s.io/), deployed via Helm. You'll need Docker, `minikube`, `kubectl`, and `helm` installed (e.g. `pacman -S minikube kubectl helm` on Arch, `brew install minikube kubectl helm` on macOS).

### 1. Get your secrets and fill in local values
- Mapbox token: https://account.mapbox.com/access-tokens/
- OpenAQ API key: https://explore.openaq.org/account

```bash
cp deploy/values/local.yaml.example deploy/values/local.yaml
```
Edit `deploy/values/local.yaml` and fill in a DB password and your `OPENAQ_API_KEY`. This file is gitignored — never committed.

### 2. Start minikube
```bash
minikube start --driver=docker --cpus=4 --memory=6g
minikube addons enable ingress
```

### 3. Build the images into minikube's Docker daemon
```bash
eval $(minikube docker-env)

docker build -t air-quality-backend:latest ./backend

docker build -t air-quality-frontend:latest \
  --build-arg NEXT_PUBLIC_API_BASE_URL=/api/v1/air-quality \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token> \
  ./frontend

docker build -t air-quality-collector:latest ./openaq-collector
```

### 4. Deploy with Helm
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami

cd deploy/helm/air-quality
helm dependency build
helm install air-quality . -f ../../values/local.yaml -n air-quality --create-namespace
```

### 5. Point your hosts file at the cluster
```bash
echo "$(minikube ip) air-quality.test" | sudo tee -a /etc/hosts
```

### 6. Verify
```bash
kubectl get pods -n air-quality -w
curl http://air-quality.test/api/v1/air-quality/locations
```
Then open `http://air-quality.test` in a browser. Note the collector polls OpenAQ every 2 minutes, so the map may take a moment to populate on first boot.
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
