# 001_DevOps_Philosophy

> What DevOps is, the culture shift, and the frameworks that drive it.

## Level 1 — Intuition

### Concept

DevOps is not a role. It's a culture where development and operations teams share responsibility for the entire software lifecycle — from code to customer.

### The Wall of Confusion

```
BEFORE DevOps:
┌──────────────┐     ┌──────────────┐
│  Developers  │ ──→ │  Operations  │
│ "It works on │     │ "It's not my │
│   my machine"│     │    code"     │
└──────────────┘     └──────────────┘
       ↑                      ↑
  Throw code over        Deploy and pray
    the wall

AFTER DevOps:
┌─────────────────────────────────────┐
│       One Team, Shared Ownership     │
│  Build ─→ Test ─→ Deploy ─→ Monitor │
│         └──── Feedback Loop ────────┘│
└─────────────────────────────────────┘
```

### CALMS Framework

| Letter | Pillar | Meaning |
|--------|--------|---------|
| C | Culture | Shared responsibility, blamelessness |
| A | Automation | CI/CD, infrastructure as code |
| L | Lean | Eliminate waste, small batches |
| M | Measurement | Metrics, monitoring, data-driven decisions |
| S | Sharing | Knowledge transfer, transparent communication |

### The Three Ways (Gene Kim)

1. **Flow** — Left-to-right: Dev → Ops → Customer (make work visible, limit WIP)
2. **Feedback** — Right-to-left: Customer → Ops → Dev (amplify feedback loops)
3. **Continuous Learning** — Experimentation, learning from failure

### CI/CD Pipeline Visualization

```
Code Commit → Build → Unit Tests → Integration Tests → Deploy Staging → E2E Tests → Deploy Prod
    │                                                        │
    └─────────────── If any step fails ←─────────────────────┘
```

## Level 2 — Practical

### DevOps Metrics (DORA — Four Key Metrics)

| Metric | Elite | Low |
|--------|-------|-----|
| Deployment Frequency | Multiple times/day | Once per month |
| Lead Time for Changes | < 1 hour | 1-6 months |
| Mean Time to Recover (MTTR) | < 1 hour | > 1 week |
| Change Failure Rate | 0-15% | 45-60% |

### DevOps in Practice

```bash
# Start with: version control EVERYTHING
git init && git add -A && git commit -m "initial"

# Automate a manual process
# Before: manually scp files to server
# After: CI/CD pipeline does it on push
```

```python
# Minimal health check for any deployed service
import requests

def health_check(url):
    try:
        r = requests.get(f"{url}/health", timeout=5)
        return r.status_code == 200
    except:
        return False
```

## Level 3 — Systems

### Deployment Strategies

```
Rolling: Update one server at a time
┌───┐  ┌───┐  ┌───┐     ┌───┐  ┌───┐  ┌───┐
│ v1│→ │ v2│→ │ v2│...→ │ v2│  │ v2│  │ v2│
└───┘  └───┘  └───┘     └───┘  └───┘  └───┘

Blue/Green: Two identical environments, swap traffic
┌──────────┐         ┌──────────┐
│  BLUE v1 │ ──→     │  BLUE    │ (old, kept as rollback)
│ (active) │  swap   │          │
└──────────┘         └──────────┘
┌──────────┐         ┌──────────┐
│ GREEN v2 │         │ GREEN v2 │ (new, active)
│ (idle)   │         │          │
└──────────┘         └──────────┘

Canary: Route small % of traffic to new version
Load Balancer → 90% v1, 10% v2 → gradually increase v2
```

### Configuration Management

```
Infrastructure as Code Principles:
1. Idempotency: Running twice produces same state
2. Declarative: State desired state, not steps
3. Versioned: Every change tracked in git
4. Tested: Validate before applying
```

## Level 4 — Expert

### Platform Engineering vs DevOps

| Aspect | DevOps | Platform Engineering |
|--------|--------|---------------------|
| Focus | Cultural transformation | Developer productivity |
| Output | Pipeline ownership | Internal developer platform (IDP) |
| Users | Ops owns, Dev uses | Dev self-serves via platform |
| Scale | Team level | Organization level |

### Toil Identification

```python
# Toil = manual, repetitive, automatable work
def classify_toil(task):
    is_manual = task.requires_human == True
    is_repetitive = task.frequency > 3  # times/week
    is_automatable = task.has_api == True

    if is_manual and is_repetitive and is_automatable:
        return "TOIL — Automate this!"
    return "Engineering work — Keep doing"
```

---

## Exercises

1. Map your current workflow: Where is the "wall of confusion"? List 3 manual steps that could be automated.
2. Research a company's DevOps journey (Etsy, Netflix, or Spotify). List 3 practices they adopted.
3. Implement a simple health check endpoint for any running service you have and curl it.

## Quiz

1. What does CALMS stand for in DevOps?
2. What is the difference between rolling and blue/green deployment?
3. Name the three ways from The Phoenix Project.
4. What is toil, and why is it harmful?
5. What's the difference between DevOps and Platform Engineering?

---

## Navigation

**Parent**: [[000_DEVOPS_MOC|DEVOPS]]

**Synapses**:
- [[001_Mental_Models|CORE 001]] — Systems thinking
- [[002_Linux_Administration|DEVOPS 002]] — Linux admin
- [[004_DNS_And_HTTP|NETWORKING 004]] — Web protocol fundamentals
