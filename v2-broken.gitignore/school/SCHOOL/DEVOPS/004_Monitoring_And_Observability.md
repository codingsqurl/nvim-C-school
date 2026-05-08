# 004_Monitoring_And_Observability

> Prometheus, Grafana, logging, alerting — knowing what your systems are doing.

## Level 1 — Intuition

### Concept

Monitoring tells you WHAT is wrong. Observability tells you WHY. Monitoring is the dashboard; observability is the ability to ask new questions without deploying new code.

### The Three Pillars

```
┌────────────────────────────────────────────┐
│           OBSERVABILITY                     │
├──────────────┬──────────────┬──────────────┤
│   METRICS    │    LOGS      │    TRACES    │
│  "How much?" │  "What       │  "Where did  │
│   (numbers)  │   happened?" │   time go?"  │
│              │   (events)   │   (journey)  │
├──────────────┴──────────────┴──────────────┤
│  USE Method (Resources):                   │
│  Utilization, Saturation, Errors           │
│  RED Method (Services):                    │
│  Rate, Errors, Duration                    │
└────────────────────────────────────────────┘
```

### Monitoring Maturity

```
Level 1: None         — "Users tell us it's down"
Level 2: Blackbox     — Ping checks, HTTP 200
Level 3: Whitebox     — App metrics, custom dashboards
Level 4: Predictive   — Anomaly detection, forecasts
Level 5: Self-healing — Auto-remediation
```

## Level 2 — Practical

### Prometheus Basics

```yaml
# prometheus.yml — scrapes metrics from targets
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']   # node_exporter

  - job_name: 'myapp'
    static_configs:
      - targets: ['localhost:8080']   # app exposes /metrics
```

```python
# Exposing Prometheus metrics from Python
from prometheus_client import Counter, Histogram, start_http_server

REQUESTS = Counter('http_requests_total', 'Total requests',
                   ['method', 'endpoint'])
LATENCY = Histogram('http_request_duration_seconds',
                    'Request latency')

@app.route('/api/users')
@LATENCY.time()
def get_users():
    REQUESTS.labels(method='GET', endpoint='/api/users').inc()
    return jsonify(users)

start_http_server(8000)  # metrics at :8000/metrics
```

### PromQL Queries

```promql
# Common PromQL patterns
rate(http_requests_total[5m])                    # requests/sec
sum(rate(http_requests_total[5m])) by (endpoint) # per endpoint
histogram_quantile(0.99,                         # p99 latency
  rate(http_request_duration_seconds_bucket[5m]))
node_memory_MemAvailable_bytes / 1024 / 1024     # available MB
up{job="myapp"} == 0                             # which targets are down
```

## Level 3 — Systems

### Grafana Dashboards

```
Dashboard Structure:
┌─────────────────────────────────────────────────┐
│ ROW 1: High-level KPIs (stat panels)            │
│  [Requests/s] [Error %] [p99 Latency] [CPU %]  │
├─────────────────────────────────────────────────┤
│ ROW 2: Time series (graphs)                     │
│  ┌─────────────────────┐┌─────────────────────┐ │
│  │ Request Rate        ││ Latency Percentiles │ │
│  │  ▁▂▃▅▃▂▁▂▃▅▇▆▄▂   ││  ▂▃▅▃▂▁▂▉▅▃▂▁▂▃▅ │ │
│  └─────────────────────┘└─────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ROW 3: Drill-down (tables, heatmaps)            │
└─────────────────────────────────────────────────┘
```

### Alerting with Alertmanager

```yaml
# alert.rules.yml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m])
              / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.endpoint }}"
          description: "{{ $value | humanizePercentage }} errors"

      - alert: HighLatency
        expr: histogram_quantile(0.99,
              rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency > 1s"
```

### Log Aggregation Architecture

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│  App 1   │   │  App 2   │   │  Nginx   │
│ stdout→  │   │ stdout→  │   │ access→  │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │               │               │
     └───────────────┼───────────────┘
                     ▼
          ┌─────────────────────┐
          │   Log Aggregator    │ ← Fluentd / Logstash / Vector
          │   (parse, filter)   │
          └─────────┬───────────┘
                    ▼
          ┌─────────────────────┐
          │   Storage + Search  │ ← Elasticsearch / Loki
          └─────────┬───────────┘
                    ▼
          ┌─────────────────────┐
          │   Visualization     │ ← Kibana / Grafana
          └─────────────────────┘
```

## Level 4 — Expert

### SLIs, SLOs, SLAs

```
SLI (Service Level Indicator): What you measure
  "99.9% of requests complete in < 200ms"

SLO (Service Level Objective): Internal target
  "p99 latency < 200ms, measured over 30 days"

SLA (Service Level Agreement): External promise
  "If p99 > 200ms for > 5 min, customer gets credit"

Error Budget = 100% - SLO
  100% - 99.9% = 0.1% error budget
  = 43 minutes of allowed downtime per month
  Use it for: deployments, experiments, chaos
```

### Service Mesh Observability

```
┌─────────────────────────────────────────────┐
│ Service A  ──→  Sidecar Proxy  ──→  Sidecar Proxy  ──→  Service B │
│                   │                        │                      │
│              ┌────┴────────────┬───────────┘                      │
│              ▼                 ▼                                   │
│        Metrics (Prometheus)   Traces (Jaeger)                     │
│              │                 │                                   │
│              └────────┬────────┘                                   │
│                       ▼                                           │
│                Grafana Dashboard                                  │
└─────────────────────────────────────────────┘
```

### Anomaly Detection

```python
# Simple moving average anomaly detection
import numpy as np

def is_anomaly(value, window, threshold=3):
    mean = np.mean(window)
    std = np.std(window)
    z_score = (value - mean) / std if std > 0 else 0
    return abs(z_score) > threshold

# In practice, use:
# - Holt-Winters for seasonal data
# - Isolation Forests for multivariate
# - Prometheus: predict_linear() for disk/memory forecasting
```

---

## Exercises

1. Install Prometheus and node_exporter locally via Docker. Verify metrics at `localhost:9090`. Query `node_cpu_seconds_total`.
2. Write a Prometheus alert rule that fires when disk usage exceeds 80%. Test with `promtool test rules`.
3. Create a Grafana dashboard with: a stat panel for uptime, a graph for request rate, and a table of top endpoints by latency.

## Quiz

1. What's the difference between metrics, logs, and traces?
2. What does the RED method stand for? What's it used for?
3. Write a PromQL query for p95 latency over the last 10 minutes.
4. What is an error budget, and why is it useful?
5. How does Alertmanager differ from Prometheus alert rules?

---

## Navigation

**Parent**: [[000_DEVOPS_MOC|DEVOPS]]

**Synapses**:
- [[005_Site_Reliability|DEVOPS 005]] — SRE principles
- [[002_Linux_Administration|DEVOPS 002]] — Systemd logs
- [[005_Networking_In_Linux|LINUX 005]] — Network monitoring
