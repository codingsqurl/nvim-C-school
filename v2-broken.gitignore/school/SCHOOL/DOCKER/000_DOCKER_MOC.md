# 000_DOCKER_MOC

> Docker containerization - from Dockerfile to production orchestration.

## Overview

DOCKER covers containerization and DevOps container workflows:

- [[001_Container_Concepts]] - Containerization vs virtualization, namespaces, cgroups
- [[002_Docker_Installation]] - Docker Engine, Docker Desktop, CLI basics
- [[003_Dockerfiles]] - Writing, optimizing, and multi-stage Dockerfiles
- [[004_Images_Registries]] - Docker Hub, image tagging, private registries
- [[005_Volumes_Networking]] - Persistent storage, bridge/host networks, overlay
- [[006_Docker_Compose]] - Multi-container services, environment files, profiles
- [[007_Container_Security]] - Image scanning, secrets management, rootless mode
- [[008_Production_Practices]] - Health checks, resource limits, logging drivers

## Prerequisites

| Requirement | Source |
|-------------|--------|
| CLI fundamentals | [[000_LINUX_MOC|LINUX]] |
| DevOps concepts | [[000_DEVOPS_MOC|DEVOPS]] (optional) |

## Learning Path

```
Level 1 — Intuition
    001_Container_Concepts
    002_Docker_Installation
        ↓
    ⚑ MILESTONE: Run and inspect an existing container image

Level 2 — Practical
    003_Dockerfiles
    004_Images_Registries
        ↓
    ⚑ MILESTONE: Write a Dockerfile, build, tag, and push to a registry

Level 3 — Systems
    005_Volumes_Networking
    006_Docker_Compose
        ↓
    ⚑ MILESTONE: Multi-service app with persistent data and custom network

Level 4 — Expert
    007_Container_Security
    008_Production_Practices
        ↓
    ⚑ MILESTONE: Production-ready deployment with security hardening and health checks
```

## Neural Links

- DOCKER → [[000_LINUX_MOC|LINUX]] - Namespaces, cgroups, kernel features
- DOCKER → [[000_DEVOPS_MOC|DEVOPS]] - CI/CD pipeline integration
- DOCKER → [[000_CYBERSECURITY_MOC|CYBERSECURITY]] - Container security
- DOCKER → [[000_WEDEV_MOC|WEDEV]] - Web app containerization

## Progression

```
001_Container_Concepts
    ↓
002_Docker_Installation
    ↓
003_Dockerfiles
    ↓
004_Images_Registries
    ↓ ├─→ 005_Volumes_Networking
    │          ↓
    │       006_Docker_Compose
    │          ↓
    └────→ 007_Container_Security
            ↓
         008_Production_Practices
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Container Concepts | 1 | None |
| 002 | Docker Installation | 1 | None |
| 003 | Dockerfiles | 2 | 002 |
| 004 | Images & Registries | 2 | 003 |
| 005 | Volumes & Networking | 3 | 003 |
| 006 | Docker Compose | 3 | 004, 005 |
| 007 | Container Security | 4 | 005, 006 |
| 008 | Production Practices | 4 | 006, 007 |

---

**Parent**: [[000_SCHOOL_MOC|SCHOOL]]
**Synapses**: LINUX, DEVOPS, CYBERSECURITY, WEDEV
