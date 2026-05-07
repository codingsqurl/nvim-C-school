# 005_Orchestration_Basics

> From one machine to many — the orchestration leap from Docker to Kubernetes.

## Level 1 — Intuition

### Why Orchestration?

Docker Compose is perfect for one host. But when you need:

- **Zero-downtime deployments**: Rolling updates, blue-green
- **Auto-scaling**: More containers when traffic spikes, fewer when idle
- **Self-healing**: Dead containers restart automatically across nodes
- **Service discovery**: 100 containers across 10 hosts find each other
- **Configuration management**: Secrets, configs, environment injection at scale
- **Resource management**: Bin-packing workloads efficiently across a cluster

That's where orchestrators come in — they turn a pool of machines into a single logical computer that runs containers.

### Docker Swarm vs Kubernetes

Docker's built-in orchestrator is **Swarm** (formerly "Swarm mode"). It's simpler, deeply integrated with Docker CLI syntax:

```bash
# Swarm: feels like Docker
docker service create --replicas 3 --name web nginx

# Kubernetes: feels like an operating system for clusters
kubectl create deployment web --image=nginx --replicas=3
```

Kubernetes won the market. This lesson focuses on Kubernetes concepts, as Swarm is increasingly niche (though Swarm's simplicity makes it a great conceptual stepping stone).

### Kubernetes at 30,000 Feet

```
┌──────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                        │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐        │
│  │    Control Plane      │    │     Worker Node 1     │       │
│  │  ┌─────────────────┐ │    │  ┌─────────────────┐  │       │
│  │  │  API Server     │ │    │  │  kubelet        │  │       │
│  │  │  Scheduler      │ │    │  │  kube-proxy     │  │       │
│  │  │  Controller Mgr │ │    │  │  Container      │  │       │
│  │  │  etcd (state)   │ │    │  │  Runtime        │  │       │
│  │  └─────────────────┘ │    │  └─────────────────┘  │       │
│  └──────────────────────┘    │  ┌──────┐ ┌──────┐   │       │
│                               │  │ Pod  │ │ Pod  │   │       │
│                               │  └──────┘ └──────┘   │       │
│                               └──────────────────────┘       │
│  ┌──────────────────────┐                                    │
│  │    Worker Node 2     │                                    │
│  │  ┌──────┐ ┌──────┐  │                                    │
│  │  │ Pod  │ │ Pod  │  │                                    │
│  │  └──────┘ └──────┘  │                                    │
│  └──────────────────────┘                                    │
└──────────────────────────────────────────────────────────────┘
```

## Level 2 — Practical

### Core Kubernetes Objects

**Pod**: The smallest deployable unit — one or more containers that share network namespace, IP, and volumes. Think "logical host."

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    ports:
    - containerPort: 80
```

```bash
kubectl apply -f pod.yaml
kubectl get pods
kubectl logs nginx-pod
kubectl exec -it nginx-pod -- bash
kubectl delete pod nginx-pod
```

**Deployment**: Manages a set of identical pods — handles rolling updates, rollbacks, scaling.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "128Mi"
            cpu: "250m"
          requests:
            memory: "64Mi"
            cpu: "100m"
```

```bash
kubectl apply -f deployment.yaml
kubectl get deployments
kubectl get pods -l app=web
kubectl scale deployment web-deployment --replicas=5
kubectl set image deployment/web-deployment web=nginx:1.26-alpine  # rolling update
kubectl rollout status deployment/web-deployment
kubectl rollout undo deployment/web-deployment   # rollback
```

**Service**: Stable network endpoint for pods. Pods come and go (different IPs), but a Service's ClusterIP is constant.

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
  - port: 80          # service port
    targetPort: 80    # pod port
  type: ClusterIP     # internal only (default)
---
# For external access:
apiVersion: v1
kind: Service
metadata:
  name: web-lb
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer  # cloud LB (NodePort is alternative for bare-metal)
```

```bash
kubectl get services
kubectl describe service web-service
```

**ConfigMap & Secret**: Externalize configuration:

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DB_HOST: "postgres-service"
  LOG_LEVEL: "info"

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DB_PASSWORD: "s3cr3t!"
```

```yaml
# Usage in a Deployment
spec:
  containers:
  - name: app
    envFrom:
    - configMapRef:
        name: app-config
    - secretRef:
        name: app-secrets
```

### Setting Up Minikube

```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start a local cluster
minikube start --driver=docker --cpus=4 --memory=4096

# Verify
kubectl get nodes
kubectl get all --all-namespaces

# Dashboard
minikube dashboard

# Access a LoadBalancer service
minikube service web-lb

# Stop / delete
minikube stop
minikube delete
```

## Level 3 — Systems

### Deploying a Full App to Kubernetes

Convert the Compose app from [[004_Docker_Compose_Deep_Dive|DOCKER 004]] to Kubernetes manifests:

```yaml
# k8s/00-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: todoapp

---
# k8s/01-postgres.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pgdata
  namespace: todoapp
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 1Gi

---
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
  namespace: todoapp
stringData:
  password: devpass

---
apiVersion: v1
kind: Service
metadata:
  name: db
  namespace: todoapp
spec:
  selector:
    app: db
  ports:
  - port: 5432

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db
  namespace: todoapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: POSTGRES_DB
          value: todoapp
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: pgdata
```

```yaml
# k8s/02-api.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: todoapp
data:
  DATABASE_URL: postgresql://postgres:$(DB_PASSWORD)@db:5432/todoapp

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: todoapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: myrepo/api:latest
        ports:
        - containerPort: 4000
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: DATABASE_URL
          value: postgresql://postgres:$(DB_PASSWORD)@db:5432/todoapp
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /ready
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: todoapp
spec:
  selector:
    app: api
  ports:
  - port: 4000
```

```bash
kubectl apply -f k8s/
kubectl -n todoapp get all
kubectl -n todoapp logs deployment/api
kubectl -n todoapp port-forward service/api 4000:4000
```

### Ingress: Https Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todoapp-ingress
  namespace: todoapp
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: todoapp.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 4000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web
            port:
              number: 80
```

```bash
# Enable Ingress controller in Minikube
minikube addons enable ingress

# Apply and test
kubectl apply -f ingress.yaml
echo "$(minikube ip) todoapp.local" | sudo tee -a /etc/hosts
curl http://todoapp.local/api/health
```

### Kubernetes vs Docker Compose Mapping

| Compose | Kubernetes |
|---------|------------|
| `services:` | `Deployment` |
| `networks:` | `Service` + DNS |
| `volumes:` | `PersistentVolumeClaim` |
| `ports:` | `Service` (ClusterIP / NodePort / LoadBalancer) |
| `environment:` | `ConfigMap` + `Secret` |
| `depends_on:` | Init Containers + readiness probes |
| `restart:` | `restartPolicy` in Pod spec |
| `healthcheck:` | `livenessProbe` + `readinessProbe` |

## Level 4 — Expert

### Kompose: Compose to Kubernetes Migration

```bash
# Convert docker-compose.yml to Kubernetes manifests
curl -L https://github.com/kubernetes/kompose/releases/download/v1.32.0/kompose-linux-amd64 -o kompose
chmod +x kompose && sudo mv kompose /usr/local/bin/

kompose convert -f docker-compose.yml -o k8s/
# Generates: db-deployment.yaml, db-service.yaml, api-deployment.yaml, etc.

# OpenShift support
kompose convert --provider openshift
```

### Production-Grade Deployment Strategy

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # create 1 extra pod during update
      maxUnavailable: 0    # never have fewer than 3 pods
  template:
    spec:
      containers:
      - name: app
        image: myrepo/app:v1.2.3
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]  # drain connections
        terminationGracePeriodSeconds: 30
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              topologyKey: kubernetes.io/hostname   # spread pods across nodes
```

### Helm: The Kubernetes Package Manager

```bash
# What apt is to Debian, Helm is to Kubernetes
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-postgres bitnami/postgresql \
  --set auth.password=secret \
  --set persistence.size=10Gi

helm list
helm upgrade my-postgres bitnami/postgresql --set auth.password=newsecret
helm rollback my-postgres 1
helm uninstall my-postgres
```

```yaml
# Custom Helm chart: myapp/Chart.yaml
apiVersion: v2
name: myapp
version: 0.1.0

# myapp/values.yaml
replicaCount: 3
image:
  repository: myapp
  tag: latest
service:
  type: ClusterIP
  port: 80

# myapp/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    spec:
      containers:
      - name: app
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

### Kubernetes in Production: The Ecosystem

```text
Monitoring:  Prometheus + Grafana (kube-prometheus-stack)
Logging:     Loki + Promtail, or EFK (Elasticsearch, Fluentd, Kibana)
Service Mesh: Istio / Linkerd — mTLS, traffic splitting, observability
GitOps:      ArgoCD / Flux — declarative, automated deployments from git
Policy:      OPA/Gatekeeper — enforce security and compliance rules
Secrets:     External Secrets Operator — sync secrets from AWS/GCP vaults
```

---

## Exercises

### Ex 1: Deploy Your Compose App with Kompose

Take the full-stack app from [[004_Docker_Compose_Deep_Dive|DOCKER 004]] Exercise 1. Run `kompose convert`. Inspect the generated files. Deploy to Minikube with `kubectl apply -f k8s/`. Verify with `kubectl -n <namespace> get all`.

### Ex 2: Rolling Update Practice

```bash
kubectl create deployment rolling-demo --image=nginx:1.25-alpine --replicas=3
# Watch in another terminal:
kubectl get pods -w
# In original terminal:
kubectl set image deployment/rolling-demo nginx=nginx:1.26-alpine
kubectl rollout status deployment/rolling-demo
kubectl rollout history deployment/rolling-demo
kubectl rollout undo deployment/rolling-demo
```

### Ex 3: Write Kubernetes Manifests by Hand

Without Kompose, write the Deployment, Service, ConfigMap, and Secret for a simple Flask app that connects to Redis. Deploy to Minikube and hit the endpoint.

---

## Quiz

**Q1.** What is the smallest deployable unit in Kubernetes?

> (A) Container (B) Pod (C) Deployment (D) Service

**A1:** (B) A Pod is the smallest unit — it encapsulates one or more containers that share the same network namespace and storage. You never deploy a raw container.

**Q2.** What Kubernetes object provides a stable IP and DNS name for a set of pods?

> (A) Deployment (B) ConfigMap (C) Service (D) Ingress

**A2:** (C) A Service provides a stable endpoint (ClusterIP) and DNS-based service discovery regardless of which pods come and go behind it.

**Q3.** What's the difference between a liveness probe and a readiness probe?

> (A) Liveness checks if the pod should be restarted; readiness checks if the pod should receive traffic
> (B) Liveness is HTTP, readiness is TCP
> (C) They are identical — just two names
> (D) Liveness is checked at pod creation, readiness is checked periodically

**A3:** (A) Liveness probe failure triggers a pod restart ("keep it alive by killing it"). Readiness probe failure removes the pod from Service endpoints ("not ready for traffic yet").

**Q4.** Kompose is a tool that...

> (A) Compiles Dockerfiles into binaries
> (B) Converts docker-compose.yml into Kubernetes manifests
> (C) Manages Kubernetes cluster provisioning
> (D) Scans container images for vulnerabilities

**A4:** (B) Kompose translates docker-compose.yml into equivalent Kubernetes YAML (Deployments, Services, PersistentVolumeClaims, etc.).

**Q5.** You deploy a pod, it starts, but `kubectl get pods` shows `CrashLoopBackOff`. What's the most likely cause?

> (A) The image doesn't exist
> (B) The container's main process exits immediately (wrong CMD or app crash)
> (C) The Service can't find the pod
> (D) The namespace doesn't exist

**A5:** (B) CrashLoopBackOff means the container started, ran, then exited (non-zero exit code). Kubernetes tries to restart it, but it keeps crashing. Check logs: `kubectl logs <pod>`.

---

## Navigation

**Parent**: [[000_DOCKER_MOC|DOCKER]]

**Synapses**:
- [[004_Docker_Compose_Deep_Dive|DOCKER 004]] — Compose to Kubernetes mapping
- [[006_CI_CD_With_Docker|DOCKER 006]] — CI/CD deploys to Kubernetes
