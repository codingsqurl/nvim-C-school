# 005_Site_Reliability

> SRE principles, SLIs/SLOs, incident response, and chaos engineering.

## Level 1 — Intuition

### Concept

SRE is what happens when you treat operations as a software engineering problem. Google coined it: "SRE is what you get when you ask a software engineer to design an operations team."

### Core Philosophy

```
Traditional Ops:                    SRE:
┌──────────────────┐          ┌──────────────────────┐
│ Keep it running   │          │ Design it to be      │
│ at all costs      │          │ reliable by default  │
│ Manual fixes      │          │ Automated fixes      │
│ Fear change       │          │ Embrace risk (budget)│
│ 100% uptime goal  │          │ Error budget driven  │
└──────────────────┘          └──────────────────────┘

SRE Golden Rule: Spend ≤ 50% of time on ops (toil).
                 ≥ 50% on engineering (automation).
```

## Level 2 — Practical

### Defining SLIs and SLOs

```yaml
# SLO definition for a web service
slos:
  - name: "API Availability"
    sli: "Proportion of successful requests (non-5xx)"
    slo: 99.9%                    # over 30-day rolling window
    error_budget: 0.1%           # ~43 min/month allowed downtime

  - name: "API Latency"
    sli: "Proportion of requests < 300ms"
    slo: 99.0%
    error_budget: 1.0%           # ~7.2 hours/month

  - name: "Data Freshness"
    sli: "Proportion of data updated within 5 min"
    slo: 99.5%
    error_budget: 0.5%
```

```python
# Calculate error budget burn rate
def burn_rate(consumed_minutes, window_days=30):
    total_budget_minutes = (1 - 0.999) * window_days * 24 * 60
    # For 99.9% SLO over 30 days: 43.2 minutes
    return consumed_minutes / total_budget_minutes

# If burn rate > 1.0, you're burning budget faster than you earn it
# If burn rate > 14.4 (burning month's budget in a day) → PAGE IMMEDIATELY
```

### Toil Identification and Elimination

```python
# Toil budget tracking
class ToilTracker:
    def __init__(self):
        self.total_hours = 0
        self.toil_hours = 0

    def log_task(self, hours, is_manual, is_repetitive,
                 is_automatable, lacks_enduring_value):
        self.total_hours += hours
        if all([is_manual, is_repetitive,
                is_automatable, lacks_enduring_value]):
            self.toil_hours += hours

    def toil_percentage(self):
        return (self.toil_hours / self.total_hours) * 100

    def needs_engineering(self):
        return self.toil_percentage() > 50
```

## Level 3 — Systems

### Incident Response

```
Incident Management Lifecycle:
┌──────────────────────────────────────────────────────┐
│ DETECTION  →  RESPONSE  →  MITIGATION  →  RESOLUTION │
│   ↓                                      ↓           │
│ Alert fires ────────────────────→ Service restored   │
│                                              ↓       │
│                                         POSTMORTEM   │
│                                    ┌────────────────┐│
│                                    │ What happened? ││
│                                    │ Why? (5 Whys)  ││
│                                    │ Timeline       ││
│                                    │ Action items   ││
│                                    │ Blameless!     ││
│                                    └────────────────┘│
└──────────────────────────────────────────────────────┘
```

### Incident Commander Role

```python
# Minimal incident management state machine
from enum import Enum

class IncidentState(Enum):
    DETECTED = 1
    ACKNOWLEDGED = 2
    MITIGATING = 3
    RESOLVED = 4
    POSTMORTEM = 5

class Incident:
    def __init__(self, title):
        self.state = IncidentState.DETECTED
        self.title = title
        self.commander = None    # IC — coordinates
        self.communications = None  # Comms lead — updates
        self.operations = None   # Ops lead — fixes

    def declare(self, commander):
        self.commander = commander
        self.state = IncidentState.ACKNOWLEDGED
        # IC: "I'm taking command. Comms, update status page.
        #      Ops, start investigating."

    def mitigate(self):
        self.state = IncidentState.MITIGATING
        # Priority: STOP THE BLEEDING first, find root cause later

    def resolve(self):
        self.state = IncidentState.RESOLVED
        # Schedule postmortem within 48 hours
```

### Runbooks and Automation

```yaml
# Simple runbook as code
runbook:
  alert: "DiskSpaceLow"
  description: "Root disk below 10% free"

  investigation:
    - ssh: "{{ instance }}"
    - run: "df -h /"
    - run: "du -sh /var/log/* | sort -rh | head -10"

  mitigation:
    - name: "Rotate old logs"
      run: "sudo logrotate -f /etc/logrotate.conf"
    - name: "Clean package cache"
      run: "sudo apt clean"
    - name: "Scale up disk (if cloud)"
      run: "gcloud compute disks resize {{ disk }} --size +10GB"

  escalation:
    after: "10 minutes"
    to: "oncall-infra@company.com"
```

## Level 4 — Expert

### Chaos Engineering

```python
# Chaos experiment — test resilience by breaking things on purpose
"""
Chaos Engineering Principles:
1. Define "steady state" (normal behavior)
2. Hypothesize steady state continues in failure
3. Introduce real-world failure events
4. Disprove hypothesis → find weaknesses
"""

# Simple chaos experiment with Python
import random
import time
import requests

def chaos_experiment(target_url, failure_injection):
    """Inject failures and verify recovery."""
    print(f"Steady state: {target_url} responds in < 500ms")

    # Introduce failure
    if failure_injection == "latency":
        # Inject 5s delay (simulate network issue)
        print("Injecting: 5s latency")
    elif failure_injection == "kill_pod":
        # Kill a pod (simulate crash)
        print("Injecting: Pod termination")

    # Verify recovery
    for _ in range(10):
        start = time.time()
        try:
            r = requests.get(target_url, timeout=2)
            elapsed = time.time() - start
            print(f"  Response: {r.status_code}, {elapsed:.2f}s")
        except:
            print(f"  DOWN at t={time.time() - start:.2f}s")

# Tools: Chaos Monkey (Netflix), Gremlin, LitmusChaos
```

### Capacity Planning

```python
# Growth projection for capacity planning
def projected_capacity(current_rps, growth_rate, months, headroom=2.0):
    """
    current_rps: current requests per second
    growth_rate: monthly growth rate (0.05 = 5%)
    months: projection period
    headroom: capacity multiplier (2x = handle 2x peak)
    """
    future_rps = current_rps * (1 + growth_rate) ** months
    needed_capacity = future_rps * headroom
    return {
        "current_rps": current_rps,
        "future_rps": round(future_rps, 1),
        "capacity_needed": round(needed_capacity, 1),
        "provision_time": f"Start provisioning {months-3} months out"
    }

# Example: 1000 RPS growing 10% monthly, 12 month projection
print(projected_capacity(1000, 0.10, 12))
# {'future_rps': 3138.4, 'capacity_needed': 6276.9}
```

---

## Exercises

1. Define SLIs and SLOs for a service you've built (or a hypothetical one). Calculate the error budget in minutes per month.
2. Write a postmortem template using the format: Summary, Timeline, Root Cause, Impact, Action Items. Fill it in for a hypothetical outage.
3. Design a chaos experiment: pick a simple web app, hypothesize its behavior under 50% packet loss, then simulate it using `tc` (traffic control) or just describe the experiment.

## Quiz

1. What's the difference between an SLI, an SLO, and an SLA?
2. Why does SRE cap operational work at 50%?
3. What is an error budget, and when should you stop deployments?
4. What is the purpose of a blameless postmortem?
5. What is chaos engineering and how does it differ from traditional testing?

---

## Navigation

**Parent**: [[000_DEVOPS_MOC|DEVOPS]]

**Synapses**:
- [[004_Monitoring_And_Observability|DEVOPS 004]] — Measuring SLIs
- [[001_Mental_Models|CORE 001]] — Systems thinking
- [[006_Platform_Engineering|DEVOPS 006]] — Self-service platforms
