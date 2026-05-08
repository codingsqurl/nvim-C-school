# 004_Docker_Compose_Deep_Dive

> One command to rule them all — `docker compose up` and your entire stack comes alive.

## Level 1 — Intuition

### The Orchestration Problem

Without Compose, running a 3-service app requires 6+ `docker` commands in the right order:

```bash
docker network create appnet
docker volume create dbdata
docker run -d --name db --network appnet -v dbdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:16
docker run -d --name api --network appnet -e DATABASE_URL=postgres://db:5432 myapi
docker run -d --name web --network appnet -p 8080:80 myweb
# Now stop everything — 3 more commands. Update one? Re-run the whole sequence.
```

Compose replaces this with a single declarative file:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    volumes: [dbdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_PASSWORD: secret
  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql://db:5432/mydb
  web:
    build: ./web
    ports: ["8080:80"]
volumes:
  dbdata:
```

```bash
docker compose up -d     # bring everything up
docker compose down      # tear everything down
docker compose down -v   # also remove volumes
```

That's it. Declarative infrastructure as code, committed alongside your application.

## Level 2 — Practical

### The docker-compose.yml Reference

```yaml
version: "3.8"  # optional since Compose v2 (spec version)

services:
  api:
    # Build from Dockerfile
    build:
      context: ./api          # directory with Dockerfile
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production

    # Or use a pre-built image (image takes precedence if both specified)
    image: myrepo/api:latest

    # Container naming
    container_name: api-prod

    # Commands
    command: ["node", "server.js"]  # override CMD
    entrypoint: ["docker-entrypoint.sh"]  # override ENTRYPOINT

    # Environment
    environment:
      NODE_ENV: production
      DB_HOST: db
    env_file:
      - .env.production

    # Ports
    ports:
      - "3000:3000"                 # host:container
      - "127.0.0.1:9229:9229"       # bind to localhost only

    # Volumes
    volumes:
      - app-data:/data              # named volume
      - ./config:/app/config:ro     # bind mount (relative paths work)
      - /var/run/docker.sock:/var/run/docker.sock  # Docker-in-Docker

    # Networking
    networks:
      - backend
      - frontend

    # Resource constraints
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
        reservations:
          cpus: "0.25"
          memory: 128M

    # Runtime
    restart: unless-stopped
    stdin_open: true   # -i
    tty: true          # -t

    # Dependencies
    depends_on:
      db:
        condition: service_healthy

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}   # from .env or shell
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

networks:
  backend:
    driver: bridge
  frontend:
    driver: bridge

volumes:
  pgdata:
  app-data:
```

### Environment Variables and Secrets

```yaml
# .env (in same directory as docker-compose.yml)
DB_PASSWORD=super_secret_value
API_KEY=sk-1234567890
```

```yaml
# docker-compose.yml references them via ${VAR}
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD}
```

```bash
# Override .env with shell variables
DB_PASSWORD=override docker compose up

# Use a different env file
docker compose --env-file .env.prod up
```

**Secrets in Swarm mode** (not available in plain Compose):
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  db:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

### Profiles (Conditional Services)

```yaml
services:
  app:
    image: myapp
  debug-tools:
    image: busybox
    profiles: ["debug"]

# $ docker compose up             # only starts app
# $ docker compose --profile debug up  # starts app + debug-tools
```

### Extending via Multiple Files

```yaml
# docker-compose.yml (base)
services:
  app:
    image: myapp
    ports: ["3000:3000"]

# docker-compose.prod.yml (production overrides)
services:
  app:
    restart: always
    environment:
      NODE_ENV: production
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# Later files override earlier ones — perfect for env-specific configs
```

## Level 3 — Systems

### depends_on vs Health Checks

`depends_on` without conditions only guarantees **startup order** — not that the database is actually ready to accept connections:

```yaml
# Incomplete: db container starts first, but postgres may not be ready
depends_on:
  - db

# Complete: waits until db reports healthy
depends_on:
  db:
    condition: service_healthy
```

This requires a `healthcheck` on the dependent service. Without it, `condition: service_healthy` will fail.

### Health Checks in Depth

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "postgres"]
  # or
  test: ["CMD-SHELL", "pg_isready -U postgres || exit 1"]
  interval: 10s     # how often to check
  timeout: 5s       # how long to wait for response
  retries: 3        # consecutive failures before unhealthy
  start_period: 30s # grace period after container start
```

Services report status: `starting` → `healthy` or `unhealthy`. Unhealthy containers are NOT automatically restarted — use `restart: always` for that.

### Development vs Production Configs

```yaml
# docker-compose.dev.yml — fast iteration
services:
  api:
    build:
      context: ./api
      target: development    # multi-stage build target
    volumes:
      - ./api/src:/app/src   # hot-reload
    environment:
      NODE_ENV: development
    command: npm run dev
  db:
    ports: ["5432:5432"]     # expose to host for local tools

# docker-compose.prod.yml — hardened
services:
  api:
    image: myrepo/api:${TAG}
    restart: always
    environment:
      NODE_ENV: production
    deploy:
      resources:
        limits:
          memory: 512M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
  db:
    # no host port — only accessible via internal network
    deploy:
      resources:
        limits:
          memory: 1G
```

```bash
# Dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Prod
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Networking in Compose

Compose creates a default network for all services. Services communicate using their service names as DNS hostnames:

```yaml
services:
  api:
    environment:
      DB_HOST: db           # resolved to db container's IP
      REDIS_HOST: cache     # resolved to cache container's IP
  db:
    ...
  cache:
    ...
```

For complex topologies, define custom networks and attach services selectively:

```yaml
services:
  api:
    networks: [backend, frontend]
  db:
    networks: [backend]       # only backend — isolated from public
  web:
    networks: [frontend]      # only frontend — can't reach db directly

networks:
  backend:
    internal: false           # default — can reach internet
  frontend:
    internal: true            # can't reach internet — extra security
```

### Using extends (Deprecated but Common)

```yaml
# Legacy pattern — prefer multiple compose files
services:
  prod-api:
    extends:
      file: docker-compose.yml
      service: api
```

## Level 4 — Expert

### Compose Watch (Hot Reload 2.0)

Docker Compose v2.22+ introduced `watch`, automatically updating containers on file changes — a massive improvement over bind mounts for some scenarios:

```yaml
services:
  api:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: ./package.json
        - action: sync+restart
          path: ./config.yaml
          target: /app/config.yaml
```

- `sync`: Copy changed file directly into running container (no rebuild)
- `rebuild`: Trigger `docker compose build` for this service
- `sync+restart`: Sync file then restart the container

```bash
docker compose watch   # runs in foreground, watches for changes
```

### Advanced Startup Dependencies

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy
        restart: true    # restart app if db restarts
      redis:
        condition: service_started
```

### Init Containers and Sidecars

```yaml
services:
  migrator:
    image: myapi
    command: ["npm", "run", "migrate"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"   # run once, exit — init container pattern

  api:
    image: myapi
    depends_on:
      migrator:
        condition: service_completed_successfully
      db:
        condition: service_healthy

  # Sidecar for log shipping
  log-shipper:
    image: fluentd
    volumes:
      - ./fluentd.conf:/fluentd/etc/fluent.conf
    depends_on: [api]
```

### Production Stack: Full Compose for Real Deployments

```yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.le.acme.email=admin@example.com"
      - "--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json"
    ports: ["80:80", "443:443"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  api:
    image: myrepo/api:${TAG:-latest}
    labels:
      traefik.enable: "true"
      traefik.http.routers.api.rule: "Host(`api.example.com`)"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 10s

volumes:
  letsencrypt:
```

---

## Exercises

### Ex 1: Full-Stack App (Frontend + Backend + Database)

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: todoapp
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 3s
      retries: 5

  api:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:devpass@db:5432/todoapp
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "4000:4000"

  web:
    build: ./frontend
    environment:
      API_URL: http://api:4000
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  pgdata:
```

```bash
docker compose up -d
docker compose ps
docker compose logs -f api
curl localhost:4000/health
```

### Ex 2: Multi-Environment Setup

Create `docker-compose.yml` (base), `docker-compose.dev.yml`, and `docker-compose.prod.yml`. Use `environment` differences, volume mounts for dev, and `restart` policies for prod. Run each environment.

### Ex 3: Add a Health Check to a Custom API

Write a `/health` endpoint in your API that checks DB connectivity. Add the Compose `healthcheck` stanza. Test: `docker compose ps` should show `healthy` status.

---

## Quiz

**Q1.** What does `docker compose up -d` do that `docker compose up` doesn't?

> (A) Validates the YAML syntax
> (B) Runs containers in detached (background) mode
> (C) Pulls images before starting
> (D) Creates volumes before starting

**A1:** (B) The `-d` flag runs containers detached, returning control to the terminal. Without it, logs stream to stdout in the foreground.

**Q2.** In Compose, service `api` sets `DATABASE_URL: postgresql://db:5432/mydb`. How does `db` resolve?

> (A) Compose injects a `/etc/hosts` entry
> (B) Docker's embedded DNS resolves the service name `db` to the container's IP
> (C) The `db` hostname is hardcoded in the bridge driver
> (D) Compose configures an nginx proxy

**A2:** (B) Services on the same Compose network resolve each other by service name via Docker's embedded DNS at `127.0.0.11`.

**Q3.** What's the difference between `depends_on: - db` and `depends_on: db: condition: service_healthy`?

> (A) No difference — both wait for DB readiness
> (B) The first only guarantees container start order; the second waits for the health check to pass
> (C) The first uses TCP probes, the second uses HTTP
> (D) `condition: service_healthy` requires Swarm mode

**A3:** (B) Simple `depends_on` only sequences container startup. `condition: service_healthy` actually waits until the health check reports healthy — the DB service could be running but postgres still initializing.

**Q4.** How do you override a service's configuration for different environments?

> (A) Edit the Dockerfile for each environment
> (B) Use `docker compose -f base.yml -f override.yml up` — later files merge/override
> (C) Create separate docker-compose.yml for each env
> (D) Use Docker contexts

**A4:** (B) Multiple `-f` flags merge compose files. Keys in later files override those in earlier files. Use a base file plus env-specific overrides (dev, staging, prod).

**Q5.** You `docker compose down` but your database volume data persists. What command also removes volumes?

> (A) `docker compose down --remove-orphans`
> (B) `docker compose down -v`
> (C) `docker compose rm -v`
> (D) `docker compose purge`

**A5:** (B) `docker compose down -v` removes named volumes declared in the `volumes:` section. Without `-v`, volumes persist for data safety.

---

## Navigation

**Parent**: [[000_DOCKER_MOC|DOCKER]]

**Synapses**:
- [[003_Volumes_And_Networking|DOCKER 003]] — Volumes and networks in Compose context
- [[005_Orchestration_Basics|DOCKER 005]] — From Compose to Kubernetes
- [[006_CI_CD_With_Docker|DOCKER 006]] — Compose in CI/CD pipelines
