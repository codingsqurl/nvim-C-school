# 000_SCHOOL_MOC

> The single school - all departments unified.

## Overview

This is the master hub connecting all departments:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  SCHOOL                                  │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────┤
│  CORE    │  LINUX   │  PYTHON  │ DEVOPS   │ NETWORKING│  DOCKER  │ARDUINO│
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────┤
│  NEOVIM  │ LANGUAGES│  WEDEV   │  GAME-DEV│ CYBERSEC │          │       │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴───────┘
```

## Department MOCs

| Path | Department | Description |
|------|------------|-------------|
| [[000_CORE_MOC|CORE]] | Core | Engineering fundamentals |
| [[000_LINUX_MOC|LINUX]] | Linux | Operating system mastery |
| [[000_PYTHON_MOC|PYTHON]] | Python | Programming language |
| [[000_DEVOPS_MOC|DEVOPS]] | DevOps | CI/CD and infrastructure |
| [[000_NETWORKING_MOC|NETWORKING]] | Networking | Network fundamentals |
| [[000_CYBERSECURITY_MOC|CYBERSECURITY]] | Cybersecurity | Security concepts |
| [[000_GAME_DEV_MOC|GAME-DEV]] | Game Dev | Game programming |
| [[000_ARDUINO_MOC|ARDUINO]] | Arduino | Embedded systems |
| [[000_DOCKER_MOC|DOCKER]] | Docker | Containerization |
| [[000_LANGUAGES_MOC|LANGUAGES]] | Languages | PL theory and comparison |
| [[000_NEOVIM_MOC|NEOVIM]] | Neovim | Editor mastery |
| [[000_WEDEV_MOC|WEDEV]] | Web Dev | Full-stack web development |

## Neural Mesh (Cross-Domain Links)

| Domain | Links To |
|--------|----------|
| CORE | LINUX, PYTHON, DEVOPS, NEOVIM |
| LINUX | CORE, DEVOPS, CYBERSECURITY, DOCKER |
| PYTHON | CORE, DEVOPS, GAME-DEV, ARDUINO |
| DEVOPS | LINUX, PYTHON, CYBERSECURITY, DOCKER |
| NETWORKING | LINUX, CYBERSECURITY, DEVOPS |
| CYBERSECURITY | CORE, LINUX, NETWORKING |
| GAME-DEV | PYTHON, CORE, LINUX, WEDEV |
| ARDUINO | CORE, PYTHON, LINUX, WEDEV |
| DOCKER | LINUX, DEVOPS, CYBERSECURITY, WEDEV |
| LANGUAGES | CORE, PYTHON, LINUX, NEOVIM |
| NEOVIM | LINUX, CORE, LANGUAGES |
| WEDEV | CORE, DOCKER, DEVOPS, CYBERSECURITY |

## Start Points

For beginners, recommended paths:

1. **Software Engineer**: CORE → PYTHON → WEDEV → DOCKER
2. **Systems Engineer**: CORE → LINUX → NETWORKING → DEVOPS
3. **Security Engineer**: CORE → LINUX → NETWORKING → CYBERSECURITY
4. **Game Developer**: CORE → PYTHON → GAME-DEV
5. **Embedded Engineer**: CORE → ARDUINO → LINUX → DOCKER
6. **Web Developer**: CORE → WEDEV → DOCKER → DEVOPS
7. **Tool Builder**: CORE → LANGUAGES → NEOVIM → LINUX

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
| ARDUINO | 7 | Framework defined |
| DOCKER | 8 | Framework defined |
| LANGUAGES | 8 | Framework defined |
| NEOVIM | 8 | Framework defined |
| WEDEV | 8 | Framework defined |

## Next Actions

1. Populate each 001 node with foundational content
2. Link levels to React game world map
3. Create learning paths for each domain

---

**Parent**: None (this is root)
**Synapses**: All departments interlinked