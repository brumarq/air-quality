package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"openaq-collector/config"

	_ "github.com/lib/pq"
)

// One-off import of OpenAQ historical hourly data into sensor_readings, so the trend
// chart isn't limited to "since the live collector happened to be running". Reuses the
// sensors already known to the backend (created by the live Kafka pipeline) rather than
// creating stations/sensors itself - run the collector against a location at least once
// before backfilling it. See ESCH-HEAT-PROFILE-PLAN.md Step 2.5 ("PM2.5 station backfill").
//
// Usage:
//   go run ./cmd/backfill --location 9650 --from 2025-01-01
//   go run ./cmd/backfill --location 9650 --from 2025-01-01 --dry-run

type sensorMeta struct {
	ID            int
	ParameterName string
}

type sensorsListResponse struct {
	Results []struct {
		ID        int `json:"id"`
		Parameter struct {
			Name string `json:"name"`
		} `json:"parameter"`
	} `json:"results"`
}

type reading struct {
	Value     float64
	Unit      string
	Timestamp string // naive "YYYY-MM-DDTHH:MM:SS", UTC clock digits - matches how the live pipeline stores timestamps (see ConsumerDtoMapper/SensorDto.DateTimeDto.toLocalDateTime: OffsetDateTime.parse(utc).toLocalDateTime(), i.e. the UTC instant's wall-clock digits kept as-is, not converted to any local zone).
}

type hoursResponse struct {
	Results []struct {
		Value     float64 `json:"value"`
		Parameter struct {
			Units string `json:"units"`
		} `json:"parameter"`
		Period struct {
			DatetimeFrom struct {
				UTC string `json:"utc"`
			} `json:"datetimeFrom"`
		} `json:"period"`
	} `json:"results"`
}

func main() {
	locationID := flag.Int("location", 9650, "OpenAQ location ID to backfill (default: Esch/Alzette)")
	fromDate := flag.String("from", "2025-01-01", "Start date (YYYY-MM-DD)")
	toDate := flag.String("to", "", "End date (YYYY-MM-DD), default: today")
	dryRun := flag.Bool("dry-run", false, "Fetch and report counts without writing to the database")
	flag.Parse()

	if *toDate == "" {
		*toDate = time.Now().Format("2006-01-02")
	}

	cfg := config.Load()
	if cfg.APIKey == "" || cfg.APIEndpoint == "" {
		log.Fatal("OPENAQ_API_KEY and OPENAQ_API_ENDPOINT must be set")
	}

	httpClient := &http.Client{Timeout: 30 * time.Second}

	sensors, err := fetchLocationSensors(httpClient, cfg, *locationID)
	if err != nil {
		log.Fatalf("failed to list sensors for location %d: %v", *locationID, err)
	}
	log.Printf("Location %d: %d sensors, backfilling %s to %s", *locationID, len(sensors), *fromDate, *toDate)

	var db *sql.DB
	if !*dryRun {
		db, err = connectDB()
		if err != nil {
			log.Fatalf("failed to connect to postgres: %v", err)
		}
		defer db.Close()
	}

	totalFetched, totalInserted := 0, 0

	for _, sensor := range sensors {
		if db != nil {
			known, err := sensorKnownToBackend(db, sensor.ID)
			if err != nil {
				log.Fatalf("failed to check sensor %d: %v", sensor.ID, err)
			}
			if !known {
				log.Printf("sensor %d (%s): skipped - not yet known to the backend, run the live collector against location %d first", sensor.ID, sensor.ParameterName, *locationID)
				continue
			}
		}

		readings, err := fetchAllHours(httpClient, cfg, sensor.ID, *fromDate, *toDate)
		if err != nil {
			log.Printf("sensor %d (%s): error fetching hours: %v", sensor.ID, sensor.ParameterName, err)
			continue
		}
		totalFetched += len(readings)
		log.Printf("sensor %d (%s): fetched %d hourly readings", sensor.ID, sensor.ParameterName, len(readings))

		if *dryRun {
			continue
		}

		inserted, err := insertReadings(db, sensor.ID, readings)
		if err != nil {
			log.Printf("sensor %d (%s): error inserting: %v", sensor.ID, sensor.ParameterName, err)
			continue
		}
		totalInserted += inserted
		log.Printf("sensor %d (%s): inserted %d new rows (%d already present)", sensor.ID, sensor.ParameterName, inserted, len(readings)-inserted)
	}

	log.Printf("Done. Fetched %d readings total, inserted %d new rows.", totalFetched, totalInserted)
}

func fetchLocationSensors(client *http.Client, cfg *config.Config, locationID int) ([]sensorMeta, error) {
	requestURL := fmt.Sprintf("%s/locations/%d/sensors", cfg.APIEndpoint, locationID)
	body, err := doGet(client, cfg, requestURL)
	if err != nil {
		return nil, err
	}

	var parsed sensorsListResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}

	sensors := make([]sensorMeta, 0, len(parsed.Results))
	for _, s := range parsed.Results {
		sensors = append(sensors, sensorMeta{ID: s.ID, ParameterName: s.Parameter.Name})
	}
	return sensors, nil
}

func fetchAllHours(client *http.Client, cfg *config.Config, sensorID int, from, to string) ([]reading, error) {
	var all []reading
	page := 1

	for {
		requestURL := fmt.Sprintf("%s/sensors/%d/hours?datetime_from=%s&datetime_to=%s&limit=1000&page=%d",
			cfg.APIEndpoint, sensorID, url.QueryEscape(from), url.QueryEscape(to), page)

		body, err := doGetWithRetry(client, cfg, requestURL, 4)
		if err != nil {
			return nil, fmt.Errorf("page %d: %w", page, err)
		}

		var parsed hoursResponse
		if err := json.Unmarshal(body, &parsed); err != nil {
			return nil, fmt.Errorf("page %d: %w", page, err)
		}

		if len(parsed.Results) == 0 {
			break
		}

		for _, r := range parsed.Results {
			all = append(all, reading{
				Value:     r.Value,
				Unit:      r.Parameter.Units,
				Timestamp: strings.TrimSuffix(r.Period.DatetimeFrom.UTC, "Z"),
			})
		}

		if len(parsed.Results) < 1000 {
			break
		}
		page++
		time.Sleep(150 * time.Millisecond)
	}

	return all, nil
}

// apiError carries enough of the response to let the retry loop react correctly:
// a 429 means "wait out the rate-limit window", anything else transient (408/5xx)
// just means "try again shortly".
type apiError struct {
	status       int
	resetSeconds int // from X-RateLimit-Reset, only meaningful when status == 429
	body         string
}

func (e *apiError) Error() string {
	return fmt.Sprintf("status %d: %s", e.status, e.body)
}

func (e *apiError) transient() bool {
	switch e.status {
	case http.StatusRequestTimeout, http.StatusTooManyRequests,
		http.StatusInternalServerError, http.StatusBadGateway,
		http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return true
	}
	return false
}

// doGetWithRetry retries transient failures. A 429 waits out the rate-limit window
// (from X-RateLimit-Reset, which OpenAQ returns in seconds) rather than guessing;
// other transient errors (408/5xx, seen in practice from OpenAQ under load) use a
// short fixed backoff.
func doGetWithRetry(client *http.Client, cfg *config.Config, requestURL string, attempts int) ([]byte, error) {
	var lastErr error
	for i := 0; i < attempts; i++ {
		body, err := doGet(client, cfg, requestURL)
		if err == nil {
			return body, nil
		}
		lastErr = err

		var apiErr *apiError
		if ae, ok := err.(*apiError); ok {
			apiErr = ae
		}
		if apiErr == nil || !apiErr.transient() {
			return nil, err
		}

		wait := time.Duration(i+1) * 2 * time.Second
		if apiErr.status == http.StatusTooManyRequests && apiErr.resetSeconds > 0 {
			wait = time.Duration(apiErr.resetSeconds+1) * time.Second
		}
		log.Printf("  transient error (attempt %d/%d), waiting %v: %v", i+1, attempts, wait, err)
		time.Sleep(wait)
	}
	return nil, lastErr
}

func doGet(client *http.Client, cfg *config.Config, requestURL string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("X-API-Key", cfg.APIKey)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		resetSeconds, _ := strconv.Atoi(resp.Header.Get("X-RateLimit-Reset"))
		return nil, &apiError{status: resp.StatusCode, resetSeconds: resetSeconds, body: string(body)}
	}
	return body, nil
}

func connectDB() (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("PGHOST", "localhost"),
		getEnv("PGPORT", "5432"),
		getEnv("PGUSER", "admin"),
		getEnv("PGPASSWORD", "admin"),
		getEnv("PGDATABASE", "sensor_db"),
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}

func sensorKnownToBackend(db *sql.DB, sensorID int) (bool, error) {
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM sensors WHERE sensor_id = $1)", sensorID).Scan(&exists)
	return exists, err
}

// insertReadings batches multi-row inserts and relies on the existing unique constraint
// on (sensor_id, timestamp, value) to silently skip anything already there - whether
// written by a previous backfill run or by the live collector.
func insertReadings(db *sql.DB, sensorID int, readings []reading) (int, error) {
	if len(readings) == 0 {
		return 0, nil
	}

	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	inserted := 0
	const batchSize = 200

	for i := 0; i < len(readings); i += batchSize {
		end := min(i+batchSize, len(readings))
		batch := readings[i:end]

		var sb strings.Builder
		sb.WriteString("INSERT INTO sensor_readings (value, timestamp, unit, sensor_id) VALUES ")
		args := make([]interface{}, 0, len(batch)*4)

		for j, r := range batch {
			if j > 0 {
				sb.WriteString(", ")
			}
			base := j * 4
			fmt.Fprintf(&sb, "($%d, $%d, $%d, $%d)", base+1, base+2, base+3, base+4)
			args = append(args, r.Value, r.Timestamp, r.Unit, sensorID)
		}
		sb.WriteString(" ON CONFLICT (sensor_id, timestamp, value) DO NOTHING RETURNING id")

		rows, err := tx.Query(sb.String(), args...)
		if err != nil {
			return inserted, err
		}
		for rows.Next() {
			inserted++
		}
		rows.Close()
	}

	if err := tx.Commit(); err != nil {
		return inserted, err
	}
	return inserted, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
