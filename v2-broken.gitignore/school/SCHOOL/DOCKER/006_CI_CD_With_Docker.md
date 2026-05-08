# 006_CI_CD_With_Docker

> From `docker build` on your laptop to automated pipelines shipping to production — the final mile.

## Level 1 — Intuition

### The Manual Deployment Problem

Without CI/CD, shipping software looks like this:

```text
1. git push main
2. SSH into prod server
3. git pull
4. docker build -t myapp:latest .
5. docker stop myapp && docker rm myapp
6. docker run -d --name myapp myapp:latest
7. curl https://myapp.com/health  # is it up?
8. tail -f logs  # are there errors?
```

This breaks at any scale — missed steps, inconsistent environments, zero audit trail. CI/CD automates this entire flow:

```text
git push main → [ CI Pipeline ]
                     ├── Lint & test
                     ├── Build image
                     ├── Scan for vulnerabilities
                     ├── Push to registry
                     └── Deploy to staging
                              │
                              ├── Smoke tests pass?
                              └── Deploy to production
```

### The Pipeline as Code

Modern CI/CD lives in your repository as YAML (GitHub Actions, GitLab CI, CircleCI). The pipeline IS code — reviewed, versioned, and tested like the application.

```
┌──────────┐    trigger     ┌──────────────────┐    deploy    ┌──────────┐
│   Git    │ ─────────────> │   CI/CD Runner   │ ──────────> │  Cluster │
│  Repo    │                │ (GitHub Actions) │             │  (K8s)   │
└──────────┘                └────────┬─────────┘             └──────────┘
                                     │
                              ┌──────▼──────┐
                              │  Registry   │
                              │ (GHCR/DH)   │
                              └─────────────┘
```

## Level 2 — Practical

### Docker in GitHub Actions

```yaml
# .github/workflows/docker-build.yml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,format=short

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

What this does:
1. Triggers on pushes/PRs to main
2. Checks out code
3. Logs into GitHub Container Registry (GHCR) using the repo's built-in token
4. Sets up Buildx for multi-platform, caching, and provenance
5. Auto-tags images based on branch, PR number, semver tag, or commit SHA
6. Builds the image (and pushes on merge to main, but NOT on PRs — builds only)
7. Uses GitHub Actions cache to speed up subsequent builds

### Docker Compose in CI

```yaml
# .github/workflows/test.yml
name: Integration Tests

on: [pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start services
        run: docker compose -f docker-compose.ci.yml up -d --wait

      - name: Run tests
        run: |
          # Wait for API to be healthy
          for i in $(seq 1 30); do
            curl -s http://localhost:4000/health && break
            sleep 2
          done
          # Run integration tests
          npm run test:integration

      - name: Show logs on failure
        if: failure()
        run: docker compose logs

      - name: Cleanup
        if: always()
        run: docker compose down -v
```

### Docker Hub and GHCR: Container Registries Decoded

```bash
# Docker Hub
docker login
docker tag myapp:latest myusername/myapp:v1.0.0
docker push myusername/myapp:v1.0.0

# GitHub Container Registry
docker login ghcr.io -u YOUR_USERNAME -p $GITHUB_TOKEN
docker tag myapp:latest ghcr.io/myorg/myapp:v1.0.0
docker push ghcr.io/myorg/myapp:v1.0.0

# AWS ECR
aws ecr get-login-password | docker login --username AWS \
  --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag myapp:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:v1
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:v1
```

### Image Tagging Strategy

Immutable tags save sanity. Never use `:latest` in production manifests:

```yaml
# CI auto-tags:
#   main branch push    → myapp:sha-abc1234
#   tag v1.2.3          → myapp:1.2.3, myapp:1.2, myapp:1
#   PR #42              → myapp:pr-42
```

```bash
# In deployment YAML, pin to exact version
image: myapp:1.2.3
# NOT: image: myapp:latest   (this is a footgun — which version is "latest"?)
```

## Level 3 — Systems

### Multi-Stage CI Pipeline

A production-grade pipeline has distinct stages with artifact passing:

```yaml
# .github/workflows/production.yml
name: Production Pipeline

on:
  push:
    tags: ['v*']

jobs:
  # ── Stage 1: Test ──
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f docker-compose.ci.yml up -d --wait
      - run: npm test
      - run: docker compose down -v

  # ── Stage 2: Build & Scan ──
  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: type=semver,pattern={{version}}

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true

      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ghcr.io/${{ github.repository }}:${{ steps.meta.outputs.version }}
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH

      - name: Upload scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif

  # ── Stage 3: Deploy Staging ──
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging K8s
        run: |
          echo "${{ secrets.KUBECONFIG }}" > kubeconfig.yaml
          kubectl --kubeconfig=kubeconfig.yaml \
            set image deployment/api \
            api=ghcr.io/${{ github.repository }}:${{ needs.build.outputs.image_tag }} \
            -n staging
          kubectl --kubeconfig=kubeconfig.yaml \
            rollout status deployment/api -n staging --timeout=5m

      - name: Smoke test
        run: |
          curl -f --retry 10 --retry-delay 5 \
            https://staging.myapp.com/health || exit 1

  # ── Stage 4: Deploy Production ──
  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to prod K8s
        run: |
          echo "${{ secrets.KUBECONFIG_PROD }}" > kubeconfig.yaml
          kubectl --kubeconfig=kubeconfig.yaml \
            set image deployment/api \
            api=ghcr.io/${{ github.repository }}:${{ needs.build.outputs.image_tag }} \
            -n production
          kubectl --kubeconfig=kubeconfig.yaml \
            rollout status deployment/api -n production --timeout=10m
```

### Environment Gates in GitHub Actions

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy-prod:
    environment:
      name: production
      url: https://myapp.com
```

GitHub Actions **Deployment Environments** provide:
- **Required reviewers**: Someone must click "approve" before this job runs
- **Wait timer**: Deploy can't happen within X minutes of the previous
- **Branch restrictions**: Only tags or specific branches can trigger
- **Secret isolation**: `secrets.PROD_KUBECONFIG` only available in this environment

### Security Scanning in CI

```yaml
# Trivy scan (fail on CRITICAL)
- name: Vulnerability scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ github.repository }}:${{ github.sha }}
    exit-code: '1'
    severity: 'CRITICAL'

# Docker Scout
- name: Docker Scout
  run: |
    curl -fsSL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh
    docker scout cves ${{ env.REGISTRY }}/${{ github.repository }}:${{ github.sha }} \
      --exit-code --only-severity critical,high

# Dockle — best practice linter for images
- name: Dockle
  uses: hands-lab/dockle-action@v1
  with:
    image: ${{ env.REGISTRY }}/${{ github.repository }}:${{ github.sha }}
    exit-code: '1'
    failure-threshold: WARN
```

## Level 4 — Expert

### Blue-Green Deployments

Two identical environments — one live (blue), one idle (green). Deploy to green, smoke-test, then switch traffic:

```bash
# Blue (current live): Deployment "api-blue" serving traffic
# Green (next version): Deployment "api-green" with v1.3.0

kubectl apply -f deployment-green.yaml
kubectl rollout status deployment/api-green

# Smoke test green
GREEN_POD=$(kubectl get pods -l app=api,version=green -o jsonpath='{.items[0].metadata.name}')
kubectl exec $GREEN_POD -- curl -f http://localhost:4000/health

# Switch service selector from blue to green
kubectl patch service api -p '{"spec":{"selector":{"version":"green"}}}'

# Blue is now idle — keep it around for quick rollback
# kubectl patch service api -p '{"spec":{"selector":{"version":"blue"}}}'
```

### Canary Deployments (Argo Rollouts)

```yaml
# Argo Rollouts — incrementally shift traffic
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api-rollout
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 20    # 20% of traffic to canary
      - pause:
          duration: 5m   # wait 5 minutes, monitor metrics
      - setWeight: 50
      - pause:
          duration: 5m
      - setWeight: 100   # full promotion
  selector:
    matchLabels:
      app: api
  template:
    spec:
      containers:
      - name: api
        image: myrepo/api:v1.3.0
```

### GitOps with ArgoCD

```yaml
# argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp-deploy
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

With GitOps, the git repo is the source of truth. CI builds and pushes the image. A separate repo (or path) holds the Kubernetes manifests. ArgoCD detects drift and reconciles automatically — no `kubectl apply` from CI.

### Docker Content Trust & Sigstore

```bash
# Docker Content Trust (Notary v1, legacy)
export DOCKER_CONTENT_TRUST=1
docker push myrepo/myapp:v1.0.0  # requires signing key

# Sigstore / Cosign (modern, OCI-native)
cosign sign --key cosign.key myrepo/myapp:v1.0.0
cosign verify --key cosign.pub myrepo/myapp:v1.0.0
```

CI signs images after building. Admission controllers in Kubernetes verify signatures before allowing pod scheduling — preventing tampered images from running in prod.

---

## Exercises

### Ex 1: Full CI/CD Pipeline

Create a `.github/workflows/cicd.yml` that:
1. Runs on pushes to `main`
2. Runs integration tests with `docker compose` (use a CI-specific compose file)
3. Builds a multi-stage Docker image
4. Scans it with Trivy
5. Pushes to ghcr.io
6. Deploys to a local Minikube cluster via `kubectl set image`

### Ex 2: Container Registry Setup

```bash
# Tag and push to Docker Hub
docker tag myapp:latest <your-dockerhub>/myapp:v1
docker push <your-dockerhub>/myapp:v1

# Pull from GHCR
docker pull ghcr.io/<your-username>/myapp:sha-abc1234

# List tags for an image on Docker Hub
curl -s "https://hub.docker.com/v2/repositories/<namespace>/<repo>/tags/" | jq .
```

### Ex 3: Security Scanning Workflow

Run Trivy against your image locally, then add it as a CI step:

```bash
docker pull aquasec/trivy
trivy image myapp:latest --severity HIGH,CRITICAL
trivy image myapp:latest --format table --exit-code 1
```

Fix any HIGH/CRITICAL findings (update base image, remove unused packages) before the build succeeds in CI.

---

## Capstone Milestone

> **Containerize and deploy a full production application.**

Build a complete CI/CD pipeline for a 3-tier app (frontend, backend, database). Requirements:

1. **Multi-stage Dockerfiles** for frontend (React/Vue, served by nginx) and backend (Node/Go/Python)
2. **Docker Compose** for local development with hot-reload
3. **GitHub Actions** pipeline: test → build → scan → push to GHCR → deploy to Kubernetes
4. **Kubernetes manifests**: Deployments, Services, Ingress, ConfigMaps, Secrets, PersistentVolumeClaim
5. **Health checks** on every service
6. **Rolling update** strategy with `maxUnavailable: 0`
7. **Secrets** via Kubernetes Secrets (NOT in git)
8. **Documented in README** with architecture diagram

Reference implementation skeleton available at [[000_DOCKER_MOC|DOCKER MOC]].

---

## Quiz

**Q1.** In GitHub Actions, what does `needs: [test, build]` do in a job definition?

> (A) Installs the listed dependency packages
> (B) Makes the job run only after both `test` and `build` jobs complete successfully
> (C) Checks if the listed jobs exist in the workflow
> (D) Lists the jobs that depend on this job

**A1:** (B) `needs` defines job dependencies — this job won't start until `test` and `build` both succeed. If either fails, this job is skipped.

**Q2.** Why should you never use `image: myapp:latest` in a Kubernetes Deployment manifest?

> (A) `latest` is a reserved keyword in Kubernetes
> (B) Kubernetes can't pull images tagged `latest`
> (C) `latest` is non-deterministic — you don't know which version is actually running, making rollbacks and audits impossible
> (D) Docker Hub blocks `latest` pulls from Kubernetes clusters

**A2:** (C) `latest` is a floating tag. The image it points to today is different from last week. You lose reproducibility, auditability, and the ability to reliably roll back.

**Q3.** What's the purpose of `docker/build-push-action` with `cache-from: type=gha` and `cache-to: type=gha,mode=max`?

> (A) Stores build cache in GitHub Actions cache to dramatically speed up subsequent builds
> (B) Pushes the image to two registries simultaneously
> (C) Creates a backup of the Dockerfile
> (D) Enables multi-platform builds

**A3:** (A) It saves build layer cache to GitHub Actions' cache backend. On the next run, Docker reuses unchanged layers instead of rebuilding from scratch — builds go from minutes to seconds for unchanged layers.

**Q4.** What's the difference between a rolling deployment and a blue-green deployment?

> (A) Rolling deploys to fewer replicas; blue-green deploys to more replicas
> (B) Rolling gradually replaces pods; blue-green maintains two complete environments and switches traffic all at once
> (C) Rolling uses Kubernetes; blue-green uses Docker Swarm
> (D) They are the same strategy with different names

**A4:** (B) Rolling replaces pods incrementally (2 → 3 → 4 → 5 of new version). Blue-green stands up an entirely new environment alongside the old one, then atomically switches traffic — instant rollback, but doubles resource usage.

**Q5.** Cosign and Sigstore provide what capability in a container CI/CD pipeline?

> (A) Compression of container layers
> (B) Cryptographic signing and verification of container images
> (C) Container vulnerability scanning
> (D) Image layer deduplication

**A5:** (B) Sigstore/Cosign signs container images with cryptographic keys (or keyless via OIDC). Admission controllers or policy engines verify these signatures before allowing the image to run — preventing supply chain attacks.

---

## Navigation

**Parent**: [[000_DOCKER_MOC|DOCKER]]

**Synapses**:
- [[005_Orchestration_Basics|DOCKER 005]] — Deploying to Kubernetes from CI/CD
- [[004_Docker_Compose_Deep_Dive|DOCKER 004]] — Compose in integration test pipelines
- [[002_Dockerfiles_And_Images|DOCKER 002]] — Multi-stage builds in CI context
