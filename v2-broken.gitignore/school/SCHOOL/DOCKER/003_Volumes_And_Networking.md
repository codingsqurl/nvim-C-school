# 003_Volumes_And_Networking

> Data that survives `docker rm` and networks that connect containers — the foundation of real workloads.

## Level 1 — Intuition

### The Ephemeral Problem

By design, containers are ephemeral. Remove a container and its writable layer vanishes:

```bash
docker run -d --name db postgres:16-alpine
docker exec db psql -U postgres -c "CREATE TABLE users (id INT);"
docker rm -f db
docker run -d --name newdb postgres:16-alpine
docker exec newdb psql -U postgres -c "\dt"  # No relations found.
```

Data died with the container. This is where **volumes** and **bind mounts** come in.

### Mount Types at a Glance

```text
┌─────────────────────────────────────────────────────────────┐
│                      Docker Host                            │
│                                                             │
│  ┌──────────┐  bind mount   ┌─────────────────────────┐     │
│  │ /opt/app ├──────────────>│ Container A: /config    │     │
│  └──────────┘               └─────────────────────────┘     │
│                                                             │
│  ┌──────────────────────┐   volume mount                    │
│  │ /var/lib/docker      │                                   │
│  │ /volumes/myvol/_data ├──────────────> │ Container B:/data│
│  └──────────────────────┘                                    │
│                                                             │
│  ┌──────────┐  tmpfs mount (RAM only)                       │
│  │   RAM    ├──────────────> │ Container C: /tmp  │          │
│  └──────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

| Type | Managed by | Use Case |
|------|-----------|----------|
| **Volume** | Docker (`/var/lib/docker/volumes/`) | Database data, app state |
| **Bind Mount** | User (any host path) | Config files, dev hot-reload |
| **tmpfs** | RAM (never touches disk) | Secrets, temporary caches |

## Level 2 — Practical

### Volumes

```bash
# Create a named volume
docker volume create pgdata

# Mount it (auto-creates if volume doesn't exist)
docker run -d --name db \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# Now data survives container removal
docker rm -f db
docker run -d --name db2 \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine
# Data from the first container is still there!

# Volume management
docker volume ls
docker volume inspect pgdata    # shows Mountpoint on host
docker volume rm pgdata         # delete (must not be in use)
docker volume prune             # remove all unused volumes
```

### Bind Mounts

```bash
# Mount host directory into container (dev hot-reload)
docker run -d -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/config:/app/config:ro \
  node-app

# The :ro flag makes the bind mount read-only
# Container can't write to /app/config
```

**Warning**: Bind mount paths must be absolute (use `$(pwd)`, not `./src`). With docker-compose, relative paths work.

### The Modern Syntax: `--mount`

```bash
# Old syntax (-v)
docker run -v pgdata:/var/lib/postgresql/data ...

# New syntax (--mount) — more explicit, preferred for scripts
docker run \
  --mount type=volume,source=pgdata,target=/var/lib/postgresql/data \
  --mount type=bind,source=$(pwd)/config,target=/app/config,readonly \
  --mount type=tmpfs,target=/tmp,tmpfs-size=64m \
  postgres:16-alpine
```

### Backing Up and Restoring Volumes

```bash
# Backup: spin up a temporary container, tar the volume
docker run --rm -v pgdata:/data -v $(pwd):/backup alpine \
  tar czf /backup/pgdata-backup.tar.gz -C /data .

# Restore
docker run --rm -v pgdata:/data -v $(pwd):/backup alpine \
  tar xzf /backup/pgdata-backup.tar.gz -C /data
```

## Level 3 — Systems

### Docker Networks

Docker provides four network drivers:

| Driver | Scope | Use Case |
|--------|-------|----------|
| **bridge** | Single host (default) | Containers on the same host |
| **host** | Single host | Performance-critical (no NAT) |
| **overlay** | Multi-host (Swarm) | Distributed apps across nodes |
| **macvlan** | Single host | Container gets its own MAC/IP on the LAN |

### Bridge Network (Default)

```bash
# Default bridge: containers can talk via IP, NOT by name
docker run -d --name app1 alpine sleep 300
docker run -d --name app2 alpine sleep 300
docker exec app1 ping 172.17.0.3  # works (IP from app2)
docker exec app1 ping app2         # FAILS — default bridge has no DNS

# User-defined bridge: automatic DNS!
docker network create mynet
docker run -d --name app1 --network mynet alpine sleep 300
docker run -d --name app2 --network mynet alpine sleep 300
docker exec app1 ping app2         # WORKS — Docker's embedded DNS resolves it
```

**Key insight**: Always use user-defined bridges for DNS-based service discovery. The default bridge is only for legacy/testing.

### Network Deep Dive

```bash
# List networks
docker network ls

# Inspect (see connected containers, IPAM config, subnet)
docker network inspect mynet

# Connect a running container to a network
docker network connect mynet existing-container

# Disconnect
docker network disconnect mynet existing-container

# Remove (must have no connected containers)
docker network rm mynet
docker network prune
```

```json
// docker network inspect mynet — excerpt
[
  {
    "Name": "mynet",
    "Driver": "bridge",
    "IPAM": {
      "Config": [{ "Subnet": "172.18.0.0/16", "Gateway": "172.18.0.1" }]
    },
    "Containers": {
      "abc123": { "Name": "app1", "IPv4Address": "172.18.0.2/16" }
    }
  }
]
```

### Host Network

```bash
docker run --network host nginx
# Container uses host's network stack directly — no port mapping needed
# Port 80 in container = port 80 on host
# Highest performance, lowest isolation — use sparingly
```

### Container Linking (Predecessor to Networks)

```bash
# Legacy: --link (deprecated, but you'll see it)
docker run --link app1:alias app2
# Prefer user-defined networks instead
```

### Port Publishing Deep Dive

```bash
# Map host port 8080 to container port 80 on all interfaces
docker run -p 8080:80 nginx

# Map to specific interface only
docker run -p 127.0.0.1:8080:80 nginx

# Random host port (docker port <name> to find it)
docker run -P nginx             # -P publishes all EXPOSE'd ports to random host ports

# Protocol specification
docker run -p 8080:80/tcp nginx
docker run -p 5353:5353/udp pihole
```

## Level 4 — Expert

### Volume Drivers

Docker volumes support pluggable drivers — storage isn't limited to the local filesystem:

```bash
# AWS EBS
docker volume create --driver rexray/ebs --opt size=10 ebs-volume

# NFS
docker volume create --driver local \
  --opt type=nfs --opt o=addr=192.168.1.100,rw \
  --opt device=:/exports/data nfs-volume

# Cloud (Azure, GCP, etc.)
docker volume create --driver azurefile --opt share=myshare azure-volume
```

### Network Troubleshooting

```bash
# What's listening on what ports inside the container?
docker exec web netstat -tlnp

# Can this container reach that one?
docker exec web ping db
docker exec web nslookup db        # test DNS
docker exec web curl -v http://db:5432  # layer 7

# Test from a throwaway container
docker run --rm --network mynet alpine wget -O- http://web:3000

# iptables rules Docker creates (host only)
sudo iptables -t nat -L DOCKER
sudo iptables -t filter -L DOCKER-USER
```

### Embedded DNS

Docker's built-in DNS server runs at `127.0.0.11` inside each container. It resolves container names (and service names in Swarm) to IPs. It handles round-robin load balancing for services with multiple replicas:

```bash
# Run 3 replicas of the same service
docker run -d --network mynet alpine sleep 300  # api
docker run -d --network mynet alpine sleep 300  # api
docker run -d --network mynet alpine sleep 300  # api

# DNS returns round-robin across all three
docker run --rm --network mynet alpine nslookup api
```

### IPv6 and Custom Subnets

```bash
docker network create --subnet=10.10.0.0/16 --gateway=10.10.0.1 mynet
docker run --network mynet --ip 10.10.0.50 nginx

# IPv6-enabled network
docker network create --ipv6 --subnet=2001:db8:1::/64 ipv6net
```

---

## Exercises

### Ex 1: Persistent Database

```bash
# Create volume, run postgres, create data, destroy, recreate
docker volume create dbdata
docker run -d --name db -v dbdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=mydb postgres:16-alpine
sleep 5
docker exec db psql -U postgres -d mydb -c "CREATE TABLE users (name TEXT);"
docker exec db psql -U postgres -d mydb -c "INSERT INTO users VALUES ('alice');"
docker rm -f db
docker run -d --name db2 -v dbdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=mydb postgres:16-alpine
sleep 5
docker exec db2 psql -U postgres -d mydb -c "SELECT * FROM users;"
# Should show: alice
docker rm -f db2 && docker volume rm dbdata
```

### Ex 2: Multi-Container App (No Compose)

```bash
docker network create appnet

# Backend
docker run -d --name redis --network appnet redis:7-alpine

# Frontend — a quick Python HTTP server
docker run -d --name frontend --network appnet -p 8080:8080 \
  python:3.12-alpine sh -c \
  "pip install flask redis && python -c \"
from flask import Flask, jsonify
import redis, os
app = Flask(__name__)
r = redis.Redis(host='redis', port=6379)
@app.route('/')
def hello():
    count = r.incr('hits')
    return jsonify(hits=count)
app.run(host='0.0.0.0', port=8080)
\""

curl localhost:8080   # {"hits": 1}
curl localhost:8080   # {"hits": 2}

docker rm -f frontend redis && docker network rm appnet
```

### Ex 3: Volume Backup Script

```bash
#!/bin/bash
# backup-volume.sh — backup any named volume
VOLUME=$1
BACKUP_DIR=${2:-./backups}
mkdir -p "$BACKUP_DIR"
docker run --rm -v "$VOLUME":/data -v "$BACKUP_DIR":/backup alpine \
  tar czf "/backup/${VOLUME}-$(date +%Y%m%d).tar.gz" -C /data .
echo "Backed up $VOLUME to $BACKUP_DIR"
```

---

## Quiz

**Q1.** What's the primary difference between a volume and a bind mount?

> (A) Volumes are faster than bind mounts
> (B) Volumes are managed by Docker in `/var/lib/docker/volumes/`; bind mounts point to arbitrary host paths
> (C) Bind mounts can't be read-only
> (D) Volumes only work on Linux

**A1:** (B) Volumes are Docker-managed and live in Docker's storage area. Bind mounts reference any host filesystem path. Volumes are the recommended mechanism for persistent data.

**Q2.** Why does a user-defined bridge network support container name resolution but the default bridge doesn't?

> (A) User bridges use a different driver
> (B) Docker's embedded DNS server is only enabled on user-defined networks
> (C) The default bridge uses iptables instead of DNS
> (D) Container names are only unique on user networks

**A2:** (B) User-defined bridge networks include Docker's embedded DNS at `127.0.0.11`, allowing containers to find each other by name. The default `bridge` network does not enable this.

**Q3.** You delete a container with `docker rm` but the volume persists. What command removes all volumes not currently used by any container?

> (A) `docker volume clear`
> (B) `docker volume prune`
> (C) `docker system df`
> (D) `docker volume rm --all`

**A3:** (B) `docker volume prune` removes all anonymous volumes not used by at least one container. Use with caution — it's irreversible.

**Q4.** In docker-compose, if service `api` connects to service `db`, the connection string uses `db` as the hostname. What makes this work?

> (A) Compose generates a hosts file entry
> (B) Docker's embedded DNS resolves the service name to the container's IP
> (C) Compose configures a reverse proxy
> (D) Both services share the same network namespace

**A4:** (B) When services are on the same user-defined network (Compose creates one by default), Docker's embedded DNS resolves service names to container IP addresses.

**Q5.** A container writes logs to `/var/log/app.log`. After `docker rm` the container, the log is gone. How do you persist it?

> (A) Use `EXPOSE` in the Dockerfile
> (B) Mount a volume or bind mount at `/var/log` so writes go to the host
> (C) Use `COPY` to save logs during build
> (D) Docker automatically saves all container logs

**A5:** (B) Mount a volume or bind mount at the log path. Writes to mounted paths go to the host filesystem and survive container removal.

---

## Navigation

**Parent**: [[000_DOCKER_MOC|DOCKER]]

**Synapses**:
- [[001_Containers_And_Why|DOCKER 001]] — Namespaces that isolate container filesystems
- [[002_Dockerfiles_And_Images|DOCKER 002]] — Where volumes are declared in Dockerfiles
- [[004_Docker_Compose_Deep_Dive|DOCKER 004]] — Declarative volumes and networks in Compose
