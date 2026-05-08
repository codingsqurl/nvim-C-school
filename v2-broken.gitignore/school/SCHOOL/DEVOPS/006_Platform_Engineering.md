# 006_Platform_Engineering

> Building internal platforms, developer experience, and GitOps workflows.

## Level 1 — Intuition

### Concept

Platform Engineering builds internal developer platforms (IDPs) that make other engineers more productive. Instead of every team reinventing deployment, monitoring, and secrets management, the platform provides a golden path: opinionated, supported, and self-service.

```
Without Platform:                  With Platform:
┌────────┐ ┌────────┐       ┌────┐┌────┐┌────┐
│ Team A │ │ Team B │       │ A  ││ B  ││ C  │
│ CI/CD  │ │ CI/CD  │       └──┬─┘└──┬─┘└──┬─┘
│ Deploy │ │ Deploy │         ┌─┴─────┴─────┴─┐
│ Monitor│ │ Monitor│         │   PLATFORM     │
│ Secrets│ │ Secrets│         │ CI/CD, Deploy, │
└────────┘ └────────┘         │ Monitor, Auth  │
     6x duplicate effort      └───────────────┘
                              Built once, used by all
```

### The Platform as a Product

```
Treat your platform like a product, not a project:
- Users: Your fellow developers
- UX: CLI, web portal, API, docs, templates
- SLAs: Uptime, support response time
- Feedback: NPS surveys, usage analytics
- Roadmap: What do developers need next?
```

## Level 2 — Practical

### Internal Developer Platform (IDP) Components

```
┌──────────────────────────────────────────────────────────┐
│                 INTERNAL DEVELOPER PLATFORM               │
├────────────┬────────────┬────────────┬──────────────────┤
│ Onboarding │ CI/CD      │ Deployment │ Observability    │
│ - Scaffold │ - Build    │ - K8s/ECS  │ - Dashboards     │
│ - Templates│ - Test     │ - Canary   │ - Alerts         │
│ - IAM      │ - Scan     │ - Rollback │ - Log search     │
├────────────┴────────────┴────────────┴──────────────────┤
│              API / CLI / Web Portal / Terraform Provider  │
└──────────────────────────────────────────────────────────┘
```

### Scaffolding with Templates

```bash
# Platform CLI: scaffold a new service
platform create service \
  --name user-api \
  --language python \
  --template fastapi-postgres \
  --team auth-team

# What gets created:
# user-api/
# ├── Dockerfile
# ├── docker-compose.yml
# ├── .github/workflows/ci.yml
# ├── terraform/
# │   └── main.tf         # Pre-configured infra
# ├── k8s/
# │   └── deployment.yaml # Production manifests
# ├── monitoring/
# │   └── alerts.yml      # Default SLI alerts
# ├── src/
# │   └── main.py         # Scaffolded FastAPI app
# └── README.md            # Team ownership, runbook link
```

### Developer Experience (DevEx) Metrics

| Category | Metric | Target |
|----------|--------|--------|
| Onboarding | Time to 10th PR | < 1 day |
| Build | P50 CI time | < 10 min |
| Deploy | Time from merge to prod | < 1 hour |
| Feedback | Failed CI recovery time | < 30 min |
| Satisfaction | Developer NPS | > 50 |

## Level 3 — Systems

### GitOps with ArgoCD

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: user-api
spec:
  project: default
  source:
    repoURL: https://github.com/company/user-api
    targetRevision: main
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: user-api
  syncPolicy:
    automated:
      prune: true           # Remove resources not in git
      selfHeal: true        # Revert manual cluster changes
    syncOptions:
      - CreateNamespace=true
```

```
GitOps Flow:
┌─────────────────────────────────────────────────┐
│  dev pushes     git repo         ArgoCD polls   │
│  ┌──────┐     ┌──────────┐     ┌──────────────┐ │
│  │ Code │ ──→ │ Git (truth)│ ──→│ ArgoCD syncs │ │
│  └──────┘     └──────────┘     │ to cluster   │ │
│                                └──────┬───────┘ │
│                                       ↓         │
│                                ┌──────────────┐ │
│                                │  K8s Cluster │ │
│                                │  = Git state │ │
│                                └──────────────┘ │
└─────────────────────────────────────────────────┘
```

### Backstage (Developer Portal)

```yaml
# catalog-info.yaml — register service in Backstage
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: user-api
  description: User management service
  annotations:
    github.com/project-slug: company/user-api
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  lifecycle: production
  owner: auth-team
  providesApis:
    - user-api-grpc
  dependsOn:
    - component:postgres-db
    - component:auth-service
```

### Platform APIs

```python
# Platform API: provision environment on demand
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class EnvironmentRequest(BaseModel):
    name: str
    team: str
    template: str  # e.g., "python-fastapi", "go-grpc"
    ttl_hours: int = 72

class Environment(BaseModel):
    id: str
    name: str
    url: str
    status: str
    expires_at: str

@app.post("/environments", response_model=Environment)
async def create_environment(req: EnvironmentRequest):
    """Provision a preview environment for a feature branch."""
    # 1. Validate template exists
    # 2. Terraform apply (or Crossplane claim)
    # 3. Deploy via ArgoCD
    # 4. Return URL
    return Environment(
        id="env-abc123",
        name=req.name,
        url=f"https://{req.name}.preview.company.com",
        status="provisioning",
        expires_at="2026-01-04T12:00:00Z"
    )
```

## Level 4 — Expert

### Platform Maturity Model

| Level | Name | Characteristics |
|-------|------|-----------------|
| 0 | Manual | ClickOps, SSH, no versioning |
| 1 | Scripted | Bash/Python scripts, git for code |
| 2 | Templated | Scaffolding, cookiecutter, shared CI |
| 3 | Self-Service | API/CLI portal, on-demand provisioning |
| 4 | Productized | SLAs, support, roadmap, adoption metrics |
| 5 | Intelligent | Auto-scaling, cost optimization, anomaly detection |

### Measuring Platform Adoption

```python
# Platform adoption dashboard metrics
adoption_metrics = {
    "active_services": "Count of services using platform CI/CD",
    "onboarding_time": "Time from team request to first deploy",
    "deploy_frequency": "Deploys/day across platform users",
    "reuse_rate": "% of teams using shared templates vs custom",
    "support_load": "Platform team tickets per week",
    "cost_per_service": "Infra cost / number of services",
    "developer_nps": "Would you recommend our platform? (0-10)"
}
```

### Build vs Buy Decision Framework

```
Decision Matrix:
┌─────────────────┬─────────────────┬─────────────────┐
│   BUILD         │   ADOPT (OSS)   │   BUY           │
├─────────────────┼─────────────────┼─────────────────┤
│ Core competency │ Cross-cutting   │ Non-differentiating│
│ Unique needs    │ Community exists│ Compliance needs │
│ Small scope     │ Active maintain │ Support contract │
│ Team bandwidth  │ Extensible API  │ Budget available │
└─────────────────┴─────────────────┴─────────────────┘

Examples:
- Build: Custom deployment orchestration (your special sauce)
- Adopt: ArgoCD, Backstage, Prometheus (battle-tested OSS)
- Buy: Datadog, PagerDuty (managed, 24/7 support)
```

---

## Exercises

1. Design a minimal IDP: list 5 components you'd include, their tools (OSS or cloud), and draw the architecture.
2. Write a Backstage `catalog-info.yaml` for a simple web service. Include owner, lifecycle, dependencies, and API annotations.
3. Create a CLI tool (in Python or bash) that scaffolds a new service with a Dockerfile, a basic CI config, and a README template.

## Quiz

1. What is the difference between DevOps and Platform Engineering?
2. What is GitOps, and how does ArgoCD implement it?
3. Name three key DevEx metrics and their typical targets.
4. What is Backstage and what problem does it solve?
5. When should you build vs buy a platform component?

---

## Navigation

**Parent**: [[000_DEVOPS_MOC|DEVOPS]]

**Synapses**:
- [[005_Site_Reliability|DEVOPS 005]] — SRE and platform overlap
- [[003_Infrastructure_As_Code|DEVOPS 003]] — IaC foundations
- [[006_Building_APIs_With_FastAPI|PYTHON 006]] — Platform API pattern
