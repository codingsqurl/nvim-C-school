# 001_Containers_And_Why

> Isolation, portability, and reproducibility — the container revolution.

## Level 1 — Intuition

### The Problem: "It Works On My Machine"

Every developer has said it. Code ran perfectly on your laptop, but the server throws cryptic errors. Different OS, wrong Python version, missing shared libraries, conflicting dependencies. The root cause: **environments diverge**.

```text-mermaid
flowchart LR
    A[My Laptop\nPython 3.11] -->|deploy| B[Prod Server\nPython 3.8]
    B -->|ERROR| C[AttributeError: ...]
```

### Containers vs Virtual Machines

| | VM | Container |
|---|---|---|
| **Isolation** | Hypervisor + guest OS | Kernel namespaces |
| **Startup** | Minutes | Milliseconds |
| **Disk** | GB per VM | MB per image |
| **Density** | Dozens/server | Thousands/server |
| **Portability** | Hypervisor-specific | OCI standard |

A VM virtualizes **hardware** — each gets its own kernel, drivers, init system. A container virtualizes the **OS** — it shares the host kernel but isolates userspace with [[002_Linux_Fundamentals|namespaces and cgroups]].

```
VM Stack:                    Container Stack:
┌──────────────┐             ┌──────────────┐
│   App        │             │   App        │
├──────────────┤             ├──────────────┤
│   Bin/Libs   │             │   Bin/Libs   │
├──────────────┤             ├──────────────┤
│ Guest OS     │             │ Container    │
├──────────────┤             │ Engine        │
│ Hypervisor   │             ├──────────────┤
├──────────────┤             │   Host OS    │
│   Host OS    │             ├──────────────┤
├──────────────┤             │   Hardware   │
│  Hardware    │             └──────────────┘
└──────────────┘
```

### Docker Architecture

Docker has three core components:

1. **Docker Daemon** (`dockerd`) — runs on the host, manages images/containers/networks
2. **Docker Client** (`docker`) — the CLI you type commands into; talks to daemon via REST API
3. **Docker Registry** — artifact repository for images (Docker Hub is the default)

```
┌──────────┐    commands     ┌───────────┐    pulls/pushes    ┌──────────┐
│  Client  │ ──────────────> │  Daemon   │ <────────────────>│ Registry │
│  (docker)│ <────────────── │ (dockerd) │                   │ (Hub)    │
└──────────┘    responses    │   │       │                   └──────────┘
                              │   │ runs  │
                           ┌──┘   └──> ┌──────────────┐
                           │           │ Container A  │
                           │           │ (nginx)      │
                           │           ├──────────────┤
                           │           │ Container B  │
                           │           │ (postgres)   │
                           │           └──────────────┘
```

### Images, Containers, Layers

- **Image**: A read-only template — like a class in OOP. Built from a Dockerfile.
- **Container**: A running instance of an image — like an object. Has a writable layer on top.
- **Layer**: Each instruction in a Dockerfile (RUN, COPY) creates a filesystem layer. Layers are cached and shared between images — the magic behind Docker's speed.

```
Image "myapp:latest"          Container (running)
┌─────────────────────┐       ┌─────────────────────┐
│ Layer 4: CMD ["npm"] │       │ Container R/W layer │  <-- only writable part
├─────────────────────┤       ├─────────────────────┤
│ Layer 3: COPY src/  │       │ Layer 4: CMD ["npm"] │
├─────────────────────┤       ├─────────────────────┤
│ Layer 2: RUN npm ci │       │ Layer 3: COPY src/  │
├─────────────────────┤       ├─────────────────────┤
│ Layer 1: FROM node  │       │ Layer 2: RUN npm ci │
├─────────────────────┤       ├─────────────────────┤
│ Base: alpine:3.19   │       │ Layer 1: FROM node  │
└─────────────────────┘       └─────────────────────┘
```

## Level 2 — Practical

### Installing Docker

```bash
# Linux (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # logout/login after

# Verify
docker version
docker info
```

### Your First Container

```bash
docker run hello-world
```
What happened:
1. Client sent `run hello-world` to daemon
2. Daemon checked local cache for `hello-world` image — not found
3. Daemon pulled `hello-world:latest` from Docker Hub
4. Daemon created a container, attached stdout, ran it
5. Container printed "Hello from Docker!" and exited

### Core Commands

```bash
# List running containers
docker ps
docker ps -a          # include stopped

# Run interactively
docker run -it ubuntu bash
#  -i = keep stdin open    -t = allocate a pseudo-TTY

# Run in background (detached)
docker run -d --name mynginx -p 8080:80 nginx
#  -d = detached    --name = friendly name    -p = port mapping (host:container)

# Inspect
docker inspect mynginx       # JSON metadata dump
docker logs mynginx          # stdout/stderr from container
docker exec -it mynginx bash # run command in running container

# Lifecycle
docker stop mynginx          # SIGTERM, then SIGKILL after grace period
docker start mynginx         # restart stopped container
docker rm mynginx            # delete container (must be stopped first)
docker rm -f mynginx         # force-delete running container
```

### Viewing Layers

```bash
docker image history nginx:latest  # shows each layer and its size
docker system df                   # disk usage of images/containers/volumes
docker system df -v                # per-image breakdown
```

### Container Lifecycle

```
pull --> create --> start --> running --> stop --> (restart --> running) --> rm
               \                                    \
                --> start                            --> kill --> rm
```

## Level 3 — Systems

### Namespaces: The "Container" Part

Linux namespaces isolate what a process can **see**:

| Namespace | Isolates |
|-----------|----------|
| PID | Process tree — container sees only its own processes |
| NET | Network interfaces, iptables rules |
| MNT | Filesystem mount points |
| UTS | Hostname and domain name |
| IPC | Inter-process communication (shared memory, semaphores) |
| USER | UID/GID mapping (root in container ≠ root on host) |
| CGROUP | Unified cgroup hierarchy for resource limits |

### Cgroups: The "Limit" Part

Control groups limit what a container can **use**:

```bash
docker run -d --memory="256m" --cpus="1.5" --name limited nginx

# Inside the container:
# /sys/fs/cgroup/memory/memory.limit_in_bytes → 268435456
# cat /proc/cpuinfo → shows only the allowed cores
```

### Overlay2 Storage Driver

Copy-on-write at the filesystem level:

```
Merged view (what container "sees")
┌────────────────────────────────────┐
│  Upper Dir  (R/W, container diff)  │  -- writes go here
├────────────────────────────────────┤
│  Lower Dir 1 (Layer 4)             │
│  Lower Dir 2 (Layer 3)             │  -- shared, read-only
│  Lower Dir 3 (Layer 2)             │
│  Lower Dir 4 (Layer 1)             │
└────────────────────────────────────┘
```

When you write to an existing file: Docker copies the file UP from the lower layer to the upper layer (copy-on-write), then applies your write. This is why container filesystems are fast but writing to dense layers can be slow.

## Level 4 — Expert

### Security Boundaries

Containers are NOT security sandboxes by default. The root user in a container IS the root user on the host (unless user namespaces are configured).

```bash
# NEVER do this:
docker run -v /:/host -it ubuntu bash
# Now you can rm -rf /host from inside the container

# Good practices:
docker run --read-only --cap-drop=ALL --cap-add=NET_BIND_SERVICE nginx
docker run --user 1000:1000 myapp       # run as non-root
docker run --tmpfs /tmp:rw,noexec       # temp space with restrictions
```

### Rootless Docker

Docker 20.10+ supports rootless mode — the daemon runs as a non-privileged user via `user_namespaces(7)` and `rootlesskit`:

```bash
# Install (separate package on most distros)
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix:///run/user/1000/docker.sock
docker run hello-world  # runs without root on the host
```

### OCI Standards

Docker images and runtimes follow OCI (Open Container Initiative) specs:
- **OCI Image Spec**: Defines image format (manifests, configs, layer tarballs)
- **OCI Runtime Spec**: Defines how to run a "bundle" (config.json + rootfs)
- Any OCI-compliant runtime (`runc`, `crun`, `gVisor`, `Kata`) can run Docker images

---

## Exercises

### Ex 1: Explore With Ports
```bash
docker run -d --name web1 -p 8080:80 nginx
docker run -d --name web2 -p 8081:80 -e NGINX_HOST=myhost nginx
curl localhost:8080
curl localhost:8081
docker logs web1
docker logs web2
```

### Ex 2: Interactive Experiment
```bash
docker run -it --name playground ubuntu bash
# Inside: apt update && apt install -y htop && htop
# Exit: Ctrl+D
# Check: docker ps -a | grep playground
docker start playground && docker exec -it playground bash
# Container preserved state! apt install persisted.
docker rm playground
```

### Ex 3: Inspection Mastery
```bash
docker run -d --name inspectme nginx
docker inspect inspectme | jq '.[0].NetworkSettings.IPAddress'
docker inspect inspectme | jq '.[0].Mounts'
docker top inspectme
docker stats --no-stream inspectme
docker port inspectme
docker rm -f inspectme
```

---

## Quiz

**Q1.** When you `docker run nginx`, what three things happen sequentially?
> (A) Pull → Create → Start
> (B) Start → Pull → Create
> (C) Create → Pull → Start
> (D) Pull → Start → Create

**A1:** (A) The daemon pulls the image if not cached, creates a container from it, then starts it.

**Q2.** Which Linux kernel feature limits a container's memory usage?
> (A) Namespaces (B) Cgroups (C) OverlayFS (D) iptables

**A2:** (B) Cgroups enforce resource limits (memory, CPU, I/O). Namespaces provide isolation of visibility.

**Q3.** True or False: A running container has a writable filesystem layer.
> (A) True (B) False

**A3:** True. Every running container has a thin R/W layer on top of the image's read-only layers. Writes go here and are lost when the container is removed (unless volumes are used).

**Q4.** What does `docker exec -it web bash` do?
> (A) Runs a new container called bash from the web image
> (B) Starts a bash shell inside the running web container
> (C) Attaches to the web container's PID 1 process
> (D) Exports the web container's filesystem

**A4:** (B) `exec` runs a new process inside an already-running container. `-it` allocates a terminal for interactive use.

**Q5.** You run `docker rm mycontainer` and get an error. Why?
> (A) The image doesn't exist (B) The container is still running (C) Docker daemon is stopped (D) You're not root

**A5:** (B) You cannot `rm` a running container. Use `docker stop mycontainer` first, or `docker rm -f mycontainer` to force-remove.

---

## Navigation

**Parent**: [[000_DOCKER_MOC|DOCKER]]

**Synapses**:
- [[001_Mental_Models|CORE 001]] — Stack model maps perfectly to Docker layers
- [[002_Dockerfiles_And_Images|DOCKER 002]] — Building custom images
- [[003_Volumes_And_Networking|DOCKER 003]] — Persistent data and pod-to-pod networking
- [[002_Linux_Fundamentals|LINUX 002]] — Namespaces and cgroups deep dive
