# 002_Dockerfiles_And_Images

> From `docker run` to `docker build` — crafting reproducible environments.

## Level 1 — Intuition

### What Is a Dockerfile?

A Dockerfile is a recipe. Each instruction adds a layer to the image. Think of it as a shell script with superpowers — caching, parallel builds, multi-stage inheritance.

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "server.js"]
```

That 6-line file produces a deterministic, isolated, shippable unit that runs identically on every machine with Docker.

### The Build Context

When you run `docker build`, the daemon needs a **build context** — the files it can COPY/ADD. By default, this is the directory containing the Dockerfile. The ENTIRE context is sent to the daemon before the build starts:

```
docker build -t myapp:v1 .
                      │
                      └── build context = current directory
```

This is why `.dockerignore` exists — it's like `.gitignore` for build contexts. Without it, `node_modules`, `.git`, and build artifacts bloat the context upload.

```
# .dockerignore
node_modules
.git
*.log
dist
.env
```

## Level 2 — Practical

### Anatomy of Instructions

| Instruction | Purpose | Example |
|-------------|---------|---------|
| `FROM` | Base image (must be first) | `FROM python:3.12-slim` |
| `WORKDIR` | Set working directory | `WORKDIR /app` |
| `COPY` | Copy files from context to image | `COPY src/ /app/src/` |
| `ADD` | Like COPY + auto-extract tar + URL fetch | `ADD archive.tar.gz /app/` |
| `RUN` | Execute command during build | `RUN apt-get update && apt-get install -y curl` |
| `ENV` | Set environment variable | `ENV NODE_ENV=production` |
| `EXPOSE` | Document container port (informational) | `EXPOSE 3000` |
| `CMD` | Default command at runtime | `CMD ["node", "server.js"]` |
| `ENTRYPOINT` | Executable + args pattern | `ENTRYPOINT ["python"]` |

### CMD vs ENTRYPOINT

```
ENTRYPOINT = the "verb"    (what program to run)
CMD        = the "object"  (default arguments)

docker run myimage arg1    → ENTRYPOINT + arg1   (CMD is replaced)
docker run myimage         → ENTRYPOINT + CMD    (defaults used)
```

```dockerfile
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
# $ docker run myimage                    → docker-entrypoint.sh nginx -g "daemon off;"
# $ docker run myimage postgres           → docker-entrypoint.sh postgres
```

### Layer Caching Strategy

Docker caches each instruction's output. If a layer hasn't changed, Docker reuses the cache. **Order matters enormously**:

```dockerfile
# BAD: copies all code before installing deps
COPY . .
RUN npm ci       # cache invalidated on ANY code change

# GOOD: install deps first, then copy code
COPY package*.json ./
RUN npm ci       # cached unless package.json changes
COPY . .         # only this layer invalidates on code change
```

General rule: **least-frequently-changing operations first**.

### Building Images

```bash
# Basic build
docker build -t myapp:latest .

# Build with specific Dockerfile
docker build -f Dockerfile.prod -t myapp:prod .

# Build without cache (force all layers to rebuild)
docker build --no-cache -t myapp:latest .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .

# Pass build arguments
docker build --build-arg VERSION=1.2.3 -t myapp:1.2.3 .

# Show build progress (desktop) or plain (CI)
docker build --progress=plain -t myapp .
```

### Image Management

```bash
docker images                    # list local images
docker image ls                  # same, verbose
docker pull node:20-alpine       # download image
docker tag myapp:latest myapp:v1 # create alias tag
docker push myrepo/myapp:v1      # push to registry (Dockerfile instructions don't change)
docker rmi myapp:v1              # remove image (no containers using it)
docker image prune -a            # remove all unused images
```

## Level 3 — Systems

### Multi-Stage Builds

The breakthrough feature that eliminated builder images. Build in one stage, copy only runtime artifacts in another:

```dockerfile
# Stage 1: Build
FROM golang:1.22 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/app ./cmd/server

# Stage 2: Runtime (tiny!)
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/app /bin/app
EXPOSE 8080
ENTRYPOINT ["/bin/app"]
```

Result: final image is ~13 MB instead of ~800 MB. The builder stage (with Go toolchain, source code, build artifacts) is discarded.

```dockerfile
# Multi-stage for Node.js
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/server.js"]
```

### Best Practices for Small Images

1. **Use slim/alpine base images**: `node:20-alpine` (120 MB) vs `node:20` (1 GB)
2. **Combine RUN commands** to reduce layers:
   ```dockerfile
   # BAD: 3 layers, 3 cached apt lists
   RUN apt-get update
   RUN apt-get install -y curl
   RUN rm -rf /var/lib/apt/lists/*

   # GOOD: 1 layer
   RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
   ```
3. **Clean up in the same layer**: deleted files in later layers don't shrink the image — earlier layers still contain them
4. **Use `.dockerignore`** aggressively — `node_modules`, `.git`, logs, local configs
5. **Pin versions** for reproducibility:
   ```dockerfile
   FROM node:20.11.1-alpine3.19  # pinned
   # NOT: FROM node:latest       # non-deterministic!
   ```
6. **Run as non-root**:
   ```dockerfile
   RUN addgroup -S appgroup && adduser -S appuser -G appgroup
   USER appuser
   ```

### BuildKit and Advanced Builds

```bash
# Enable BuildKit (default on Docker 23+, or export DOCKER_BUILDKIT=1)
docker build -t myapp .

# BuildKit features:
# --mount=type=cache    → cache package managers across builds
# --mount=type=secret   → mount secrets without persisting in image
# --mount=type=ssh      → use SSH agent for private git repos
```

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine
# Cache npm downloads across builds (dramatically faster!)
RUN --mount=type=cache,target=/root/.npm npm ci

# SSH mount for private repos
RUN --mount=type=ssh git clone git@github.com:myorg/private-repo.git

# Secret mount (not baked into image layers!)
RUN --mount=type=secret,id=aws_creds aws s3 cp s3://bucket/file .
```

```bash
docker build --ssh default --secret id=aws_creds,src=$HOME/.aws/credentials -t myapp .
```

## Level 4 — Expert

### Distroless Images

Google's "distroless" images contain ONLY the application and its runtime dependencies — no shell, no package manager, no `apt`. Attack surface drops to near zero:

```dockerfile
FROM golang:1.22 AS builder
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app ./...

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app /app
ENTRYPOINT ["/app"]
```

You can't `docker exec -it bash` into it — there IS no bash. This forces proper logging, health checks, and observability from day one.

### Cross-Platform Builds

```bash
# Create buildx builder with multi-arch support
docker buildx create --name multiarch --use

# Build for both platforms
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myrepo/app:latest --push .

# Inspect manifest
docker buildx imagetools inspect myrepo/app:latest
```

### Image Vulnerability Scanning

```bash
# Docker Scout (built-in)
docker scout quickview node:20-alpine
docker scout cves myapp:latest

# Trivy (standalone, fast)
trivy image myapp:latest
trivy image --severity HIGH,CRITICAL myapp:latest

# Grype (from Anchore)
grype myapp:latest
```

### Supply Chain with SBOMs

```bash
# Generate Software Bill of Materials
docker sbom myapp:latest
syft myapp:latest -o spdx-json

# SLSA provenance via BuildKit
docker buildx build --provenance=true --sbom=true -t myapp:latest .
```

---

## Exercises

### Ex 1: Dockerize a Node.js App

Create this minimal app structure:
```text
project/
├── Dockerfile
├── .dockerignore
├── package.json
└── server.js
```

```javascript
// server.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello from Docker!\n');
});
server.listen(3000, () => console.log('Listening on :3000'));
```

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

```bash
docker build -t node-hello .
docker run -d -p 3000:3000 node-hello
curl localhost:3000
```

### Ex 2: Dockerize a Python App

```python
# app.py
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from Python!\n'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

```dockerfile
FROM python:3.12-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

### Ex 3: Static Site with Nginx

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /src/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Analyze image sizes: `docker images | grep static-site`

---

## Quiz

**Q1.** Why does `COPY package.json ./` appear BEFORE `COPY . .` in a well-crafted Dockerfile?

> (A) Docker requires package files first  
> (B) To cache the `npm ci` layer — only invalidate when dependencies change, not code  
> (C) package.json must be in the root  
> (D) npm can't run in later layers

**A1:** (B) Docker layer caching. By copying `package.json` first and running `npm ci`, that layer is cached until dependencies actually change. Code changes only invalidate the final `COPY . .` layer.

**Q2.** What's the key difference between `CMD` and `ENTRYPOINT`?

> (A) ENTRYPOINT runs at build time, CMD runs at runtime
> (B) CMD provides defaults that can be overridden by `docker run` args; ENTRYPOINT defines the main executable
> (C) ENTRYPOINT is for HTTP servers only
> (D) There is no difference

**A2:** (B) `ENTRYPOINT` sets the executable (never overridden by `docker run` args unless `--entrypoint` is used). `CMD` provides default arguments that can be replaced by `docker run image args`.

**Q3.** In a multi-stage build, what happens to the build stage after the final image is produced?

> (A) It's cached and tagged separately
> (B) It's discarded — only artifacts explicitly copied with `COPY --from=` survive
> (C) It becomes the base of the final image
> (D) It's pushed to the registry as a build cache

**A3:** (B) Build stages are intermediate and discarded. Only what you `COPY --from=builder` persists in the final image. This is the key to tiny production images.

**Q4.** What does `.dockerignore` affect?

> (A) Which images can be pulled from a registry
> (B) Which files are sent as the build context to the daemon
> (C) Which containers can access a volume
> (D) Which layers are cached

**A4:** (B) It filters the build context — the files sent to the daemon before `docker build` starts. Reduces context size and prevents accidentally COPY-ing `.env`, `node_modules`, etc.

**Q5.** What's wrong with `FROM node:latest`?

> (A) Nothing — it's idiomatic Docker
> (B) `latest` is non-deterministic; builds break when a new major version ships
> (C) `latest` doesn't exist on Docker Hub
> (D) The `node` image doesn't support tags

**A5:** (B) `latest` is a floating tag. Today it's Node 22, tomorrow it could be Node 24 — with breaking changes. Pin versions: `FROM node:20.11.1-alpine3.19`.

---

## Navigation

**Parent**: [[000_DOCKER_MOC|DOCKER]]

**Synapses**:
- [[001_Containers_And_Why|DOCKER 001]] — Image/container fundamentals
- [[003_Volumes_And_Networking|DOCKER 003]] — Where container data persists
- [[004_Docker_Compose_Deep_Dive|DOCKER 004]] — Multi-container apps with Compose
