# frozen_string_literal: true

class BlogData
  MAIN_POST = {
    id: 1,
    title: "Building a Real-Time Analytics Pipeline with Stream Processing",
    author: "Sarah Chen",
    date: "2025-01-15",
    reading_time: "12 min read",
    tags: %w[architecture streaming rust python],
    excerpt: "A deep dive into building a production-grade analytics pipeline using Kafka, Flink, and custom Rust workers.",
    content: <<~MARKDOWN
## Introduction

Building a real-time analytics pipeline is one of the most challenging distributed systems problems. You need to handle **millions of events per second**, ensure exactly-once processing semantics, and deliver results with sub-second latency. In this post, I'll walk through how we built our production pipeline processing 2.5 million events/second.

## Architecture Overview

Our pipeline consists of four main stages:

1. **Ingestion** — Kafka producers collecting events from edge servers
2. **Processing** — Apache Flink for stream transformations and windowed aggregations
3. **Storage** — TimescaleDB for time-series data, Redis for real-time dashboards
4. **Serving** — GraphQL API with subscription support for live updates

```yaml
# docker-compose.yml — Local development stack
version: "3.9"
services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_NUM_PARTITIONS: 12
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"

  flink-jobmanager:
    image: flink:1.18-scala_2.12
    command: jobmanager
    environment:
      FLINK_PROPERTIES: |
        jobmanager.rpc.address: flink-jobmanager
        state.backend: rocksdb
        state.checkpoints.dir: s3://checkpoints/flink
    ports:
      - "8081:8081"

  timescaledb:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_PASSWORD: analytics
    volumes:
      - timescale_data:/var/lib/postgresql/data
```

## Event Schema Design

Every event in our system follows a strict schema. We use Avro for serialization with a schema registry to ensure backward compatibility:

```javascript
// event-schema.js — Base event definition
const EventSchema = {
  type: 'record',
  name: 'AnalyticsEvent',
  namespace: 'com.pipeline.events',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'timestamp', type: { type: 'long', logicalType: 'timestamp-millis' } },
    { name: 'user_id', type: ['null', 'string'], default: null },
    { name: 'session_id', type: 'string' },
    { name: 'event_type', type: {
      type: 'enum',
      name: 'EventType',
      symbols: ['PAGE_VIEW', 'CLICK', 'PURCHASE', 'CUSTOM']
    }},
    { name: 'properties', type: { type: 'map', values: 'string' } },
    { name: 'context', type: {
      type: 'record',
      name: 'EventContext',
      fields: [
        { name: 'ip', type: 'string' },
        { name: 'user_agent', type: 'string' },
        { name: 'locale', type: 'string' },
        { name: 'page_url', type: 'string' }
      ]
    }}
  ]
};
```

## The Ingestion Layer

Our ingestion layer uses a custom Rust service for maximum throughput. Here's the core event receiver:

```rust
// src/ingestion/receiver.rs
use tokio::net::TcpListener;
use rdkafka::producer::{FutureProducer, FutureRecord};
use serde::Deserialize;
use std::sync::Arc;
use metrics::{counter, histogram};

#[derive(Deserialize)]
struct IncomingEvent {
    event_id: String,
    timestamp: i64,
    user_id: Option<String>,
    session_id: String,
    event_type: String,
    properties: HashMap<String, String>,
}

pub struct EventReceiver {
    producer: Arc<FutureProducer>,
    batch_size: usize,
    flush_interval: Duration,
}

impl EventReceiver {
    pub async fn start(&self, addr: &str) -> Result<(), Box<dyn std::error::Error>> {
        let listener = TcpListener::bind(addr).await?;
        let mut batch = Vec::with_capacity(self.batch_size);

        loop {
            tokio::select! {
                Ok((stream, _)) = listener.accept() => {
                    let event = self.parse_event(stream).await?;
                    batch.push(event);

                    if batch.len() >= self.batch_size {
                        self.flush_batch(&mut batch).await?;
                    }
                }
                _ = tokio::time::sleep(self.flush_interval) => {
                    if !batch.is_empty() {
                        self.flush_batch(&mut batch).await?;
                    }
                }
            }
        }
    }

    async fn flush_batch(&self, batch: &mut Vec<IncomingEvent>) -> Result<(), KafkaError> {
        let futures: Vec<_> = batch.drain(..).map(|event| {
            let key = event.session_id.clone();
            let payload = serde_json::to_vec(&event).unwrap();

            self.producer.send(
                FutureRecord::to("analytics-events")
                    .key(&key)
                    .payload(&payload),
                Duration::from_secs(5),
            )
        }).collect();

        let results = futures::future::join_all(futures).await;
        counter!("events_flushed", results.len() as u64);

        for result in results {
            if let Err((err, _)) = result {
                counter!("flush_errors", 1);
                tracing::error!("Failed to produce message: {:?}", err);
            }
        }

        Ok(())
    }
}
```

## Stream Processing with Flink

The heart of our pipeline is the Flink job that performs windowed aggregations. We compute metrics over tumbling and sliding windows:

```python
# jobs/stream_processor.py
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment, EnvironmentSettings
from pyflink.table.window import Tumble, Slide
from pyflink.table.expressions import col, lit, call

def create_pipeline():
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(4)
    env.enable_checkpointing(60000)  # checkpoint every 60s

    t_env = StreamTableEnvironment.create(env)

    # Define Kafka source
    t_env.execute_sql(\"\"\"
        CREATE TABLE events (
            event_id STRING,
            event_timestamp TIMESTAMP(3),
            user_id STRING,
            session_id STRING,
            event_type STRING,
            properties MAP<STRING, STRING>,
            WATERMARK FOR event_timestamp AS event_timestamp - INTERVAL '5' SECOND
        ) WITH (
            'connector' = 'kafka',
            'topic' = 'analytics-events',
            'properties.bootstrap.servers' = 'kafka:9092',
            'format' = 'json',
            'scan.startup.mode' = 'latest-offset'
        )
    \"\"\")

    # 1-minute tumbling window: event counts by type
    minute_counts = t_env.sql_query(\"\"\"
        SELECT
            event_type,
            TUMBLE_START(event_timestamp, INTERVAL '1' MINUTE) AS window_start,
            TUMBLE_END(event_timestamp, INTERVAL '1' MINUTE) AS window_end,
            COUNT(*) AS event_count,
            COUNT(DISTINCT user_id) AS unique_users,
            COUNT(DISTINCT session_id) AS unique_sessions
        FROM events
        GROUP BY
            event_type,
            TUMBLE(event_timestamp, INTERVAL '1' MINUTE)
    \"\"\")

    # 5-minute sliding window (1-min slide): trend detection
    trend_analysis = t_env.sql_query(\"\"\"
        SELECT
            event_type,
            HOP_START(event_timestamp, INTERVAL '1' MINUTE, INTERVAL '5' MINUTE) AS window_start,
            COUNT(*) AS event_count,
            COUNT(*) / 5.0 AS events_per_minute
        FROM events
        GROUP BY
            event_type,
            HOP(event_timestamp, INTERVAL '1' MINUTE, INTERVAL '5' MINUTE)
    \"\"\")

    return minute_counts, trend_analysis
```

## Storage Layer

We use TimescaleDB for efficient time-series storage with automatic partitioning:

```sql
-- migrations/001_create_hypertables.sql
CREATE TABLE event_aggregates (
    time        TIMESTAMPTZ NOT NULL,
    event_type  TEXT NOT NULL,
    event_count BIGINT DEFAULT 0,
    unique_users BIGINT DEFAULT 0,
    unique_sessions BIGINT DEFAULT 0,
    p50_latency DOUBLE PRECISION,
    p99_latency DOUBLE PRECISION
);

-- Convert to hypertable with 1-hour chunks
SELECT create_hypertable('event_aggregates', 'time',
    chunk_time_interval => INTERVAL '1 hour'
);

-- Continuous aggregate for hourly rollups
CREATE MATERIALIZED VIEW hourly_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    event_type,
    SUM(event_count) AS total_events,
    SUM(unique_users) AS total_unique_users,
    AVG(p50_latency) AS avg_p50_latency,
    MAX(p99_latency) AS max_p99_latency
FROM event_aggregates
GROUP BY bucket, event_type;

-- Retention policy: keep raw data for 7 days
SELECT add_retention_policy('event_aggregates', INTERVAL '7 days');

-- Compression policy: compress chunks older than 2 hours
ALTER TABLE event_aggregates SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'event_type',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('event_aggregates', INTERVAL '2 hours');
```

## Real-Time API with GraphQL Subscriptions

The serving layer exposes both query and subscription endpoints:

```ruby
# app/graphql/subscriptions/analytics_subscription.rb
module Subscriptions
  class AnalyticsSubscription < GraphQL::Schema::Subscription
    field :event_type, String, null: false
    field :window_start, GraphQL::Types::ISO8601DateTime, null: false
    field :event_count, Integer, null: false
    field :unique_users, Integer, null: false
    field :events_per_minute, Float, null: false

    argument :event_types, [String], required: false

    def subscribe(event_types: nil)
      context[:event_types] = event_types
      :no_response
    end

    def update(event_types: nil)
      return :no_update if event_types && !event_types.include?(object[:event_type])

      {
        event_type: object[:event_type],
        window_start: object[:window_start],
        event_count: object[:event_count],
        unique_users: object[:unique_users],
        events_per_minute: object[:events_per_minute]
      }
    end
  end
end
```

## Performance Monitoring

We built a custom metrics collector in Go for monitoring pipeline health:

```go
// cmd/metrics-collector/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"net/http"
)

var (
	eventsProcessed = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "pipeline_events_processed_total",
			Help: "Total number of events processed by stage",
		},
		[]string{"stage", "event_type"},
	)

	processingLatency = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "pipeline_processing_latency_seconds",
			Help:    "Processing latency by pipeline stage",
			Buckets: prometheus.ExponentialBuckets(0.001, 2, 15),
		},
		[]string{"stage"},
	)

	backpressureGauge = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "pipeline_backpressure_ratio",
			Help: "Ratio of input rate to processing capacity",
		},
		[]string{"stage"},
	)
)

func init() {
	prometheus.MustRegister(eventsProcessed, processingLatency, backpressureGauge)
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start metrics HTTP server
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Fatal(http.ListenAndServe(":9090", nil))
	}()

	// Poll pipeline stages every 5 seconds
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			collectKafkaMetrics()
			collectFlinkMetrics()
			collectStorageMetrics()
		}
	}
}

func collectKafkaMetrics() {
	// Query Kafka consumer group lag
	lag, err := getConsumerLag("analytics-pipeline")
	if err != nil {
		log.Printf("Error collecting Kafka metrics: %v", err)
		return
	}

	for topic, partitionLags := range lag {
		var totalLag int64
		for _, l := range partitionLags {
			totalLag += l
		}
		backpressureGauge.WithLabelValues("kafka").Set(float64(totalLag))
		fmt.Printf("Topic %s total lag: %d\\n", topic, totalLag)
	}
}
```

## Deployment with Kubernetes

We deploy the entire pipeline using Helm charts with auto-scaling:

```bash
#!/bin/bash
# deploy.sh — Rolling deployment with canary validation

set -euo pipefail

ENVIRONMENT=${1:-staging}
VERSION=${2:-$(git rev-parse --short HEAD)}

echo "Deploying pipeline v${VERSION} to ${ENVIRONMENT}"

# Build and push container images
docker build -t pipeline/ingestion:${VERSION} -f docker/ingestion.Dockerfile .
docker build -t pipeline/processor:${VERSION} -f docker/processor.Dockerfile .
docker push pipeline/ingestion:${VERSION}
docker push pipeline/processor:${VERSION}

# Deploy with Helm
helm upgrade --install analytics-pipeline ./helm/analytics-pipeline \\
  --namespace analytics \\
  --set image.tag=${VERSION} \\
  --set environment=${ENVIRONMENT} \\
  --set ingestion.replicas=3 \\
  --set processor.parallelism=8 \\
  --set storage.retention=7d \\
  --values ./helm/values-${ENVIRONMENT}.yaml \\
  --wait --timeout 10m

# Canary validation
echo "Running canary checks..."
kubectl wait --for=condition=ready pod -l app=ingestion -n analytics --timeout=120s

HEALTH=$(curl -s http://ingestion.analytics.svc/health | jq -r '.status')
if [ "$HEALTH" != "healthy" ]; then
  echo "Canary check failed! Rolling back..."
  helm rollback analytics-pipeline -n analytics
  exit 1
fi

echo "Deployment successful!"
```

## Lessons Learned

After running this pipeline in production for 18 months, here are our key takeaways:

1. **Schema evolution is critical** — Use a schema registry from day one. We broke our pipeline twice with incompatible schema changes before adding Avro with compatibility checks.

2. **Backpressure handling matters** — Without proper backpressure, a spike in traffic causes cascading failures. Our Rust ingestion layer applies adaptive rate limiting based on Kafka producer queue depth.

3. **Idempotency everywhere** — Network partitions and retries are inevitable. Every stage in our pipeline uses idempotency keys to ensure exactly-once semantics without transactions.

4. **Monitor the monitors** — Our metrics collector itself needs monitoring. We use a separate Prometheus instance to watch the primary monitoring stack.

5. **Start simple, add complexity later** — We began with a single Kafka topic and a Python consumer. The Flink jobs and Rust ingestion layer came later when we actually needed the throughput.

The full source code is available on our engineering blog, along with Terraform modules for the cloud infrastructure.
    MARKDOWN
  }.freeze

  RELATED_POSTS = [
    {
      id: 2,
      title: "Zero-Downtime Database Migrations at Scale",
      excerpt: "How we migrate tables with 500M+ rows without locking or downtime, using ghost tables and incremental backfills.",
      date: "2025-01-08",
      tags: %w[database postgres migrations]
    },
    {
      id: 3,
      title: "Taming WebSocket Connections with Connection Pooling",
      excerpt: "Lessons from managing 200K concurrent WebSocket connections with a custom Go-based connection manager.",
      date: "2024-12-22",
      tags: %w[websockets go networking]
    },
    {
      id: 4,
      title: "From Monolith to Micro-Frontends: A Migration Story",
      excerpt: "A practical guide to decomposing a large React SPA into independently deployable micro-frontends using Module Federation.",
      date: "2024-12-15",
      tags: %w[react micro-frontends webpack]
    },
    {
      id: 5,
      title: "Implementing RBAC with Cedar Policy Language",
      excerpt: "Building a fine-grained authorization system using Amazon's Cedar policy language for complex multi-tenant permissions.",
      date: "2024-12-01",
      tags: %w[security authorization cedar]
    }
  ].freeze

  def self.find_post(id)
    return MAIN_POST if id.to_i == MAIN_POST[:id]

    nil
  end

  def self.related_posts(exclude_id)
    RELATED_POSTS.reject { |p| p[:id] == exclude_id.to_i }
  end
end
