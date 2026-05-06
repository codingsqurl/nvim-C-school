# 000_SCHOOL_MOC

> The single school - all departments unified.

## Overview

This is the master hub connecting all departments:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SCHOOL                          │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│  CORE    │  LINUX   │  PYTHON  │ DEVOPS   │ NETWORKING │
│          │          │          │          │            │
└──────────┴──────────┴──────────┴──────────┴────────────┘
         │                       │
    CYBERSECURITY           GAME-DEV
```

## Department MOCs

| Path | Department | Description |
|------|------------|-------------|
| [[000_CORE_MOC|CORE]] | Core | Engineering fundamentals |
| [[000_LINUX_MOC|LINUX]] | Linux | Operating system mastery |
| [[000_PYTHON_MOC|PYTHON]] | Python | Programming language |
| [[000_DEVOPS_MOC|DEVOPS]] | DevOps | CI/CD and containers |
| [[000_NETWORKING_MOC|NETWORKING]] | Networking | Network fundamentals |
| [[000_CYBERSECURITY_MOC|CYBERSECURITY]] | Cybersecurity | Security concepts |
| [[000_GAME_DEV_MOC|GAME-DEV]] | Game Dev | Game programming |

## Neural Mesh (Cross-Domain Links)

| Domain | Links To |
|--------|----------|
| CORE | LINUX, PYTHON, DEVOPS |
| LINUX | CORE, DEVOPS, CYBERSECURITY |
| PYTHON | CORE, DEVOPS, GAME-DEV |
| DEVOPS | LINUX, PYTHON, CYBERSECURITY |
| NETWORKING | LINUX, CYBERSECURITY, DEVOPS |
| CYBERSECURITY | CORE, LINUX, NETWORKING |
| GAME-DEV | PYTHON, CORE, LINUX |

## Start Points

For beginners, recommended paths:

1. **Software Engineer**: CORE → PYTHON → LINUX → DEVOPS
2. **Systems Engineer**: CORE → LINUX → NETWORKING → DEVOPS
3. **Security Engineer**: CORE → LINUX → NETWORKING → CYBERSECURITY
4. **Game Developer**: CORE → PYTHON → GAME-DEV

## Status

| Department | Nodes | Status |
|------------|-------|--------|
| CORE | 5 | Framework defined |
| LINUX | 6 | Framework defined |
| PYTHON | 6 | Framework defined |
| DEVOPS | 6 | Framework defined |
| NETWORKING | 6 | Framework defined |
| CYBERSECURITY | 6 | Framework defined |
| GAME-DEV | 6 | Framework defined |

## Next Actions

1. Populate each 001 node with foundational content
2. Link levels to React game world map
3. Create learning paths for each domain

---

**Parent**: None (this is root)
**Synapses**: All departments interlinked