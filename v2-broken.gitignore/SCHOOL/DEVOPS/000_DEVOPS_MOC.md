# 000_DEVOPS_MOC

> DevOps practices - CI/CD, containers, and infrastructure as code.

## Overview

DEVOPS covers deployment, automation, and infrastructure:

- [[001_Containers]] - Docker fundamentals and Dockerfile
- [[002_Container_Orchestration]] - Docker Compose and basics
- [[003_CI_CD]] - GitHub Actions, GitLab CI pipelines
- [[004_Infrastructure_As_Code]] - Terraform, Ansible basics
- [[005_Monitoring]] - Logging, metrics, alerting
- [[006_Cloud_Providers]] - AWS, GCP, Azure fundamentals

## Neural Links

- DEVOPS → [[000_LINUX_MOC|LINUX]] - Server management
- DEVOPS → [[000_PYTHON_MOC|PYTHON]] - Automation scripts
- DEVOPS → [[000_CYBERSECURITY_MOC|CYBERSECURITY]] - Cloud security

## Progression

```
001_Containers
    ↓
002_Container_Orchestration
    ↓
003_CI_CD
    ↓ ├─→ 004_Infrastructure_As_Code
    │          ↓
    │       006_Cloud_Providers
    │          ↓
    └────→ 005_Monitoring
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Containers | 2 | LINUX 002 |
| 002 | Container Orchestration | 3 | 001 |
| 003 | CI/CD | 3 | 002 |
| 004 | Infrastructure as Code | 4 | 003 |
| 005 | Monitoring | 4 | 003 |
| 006 | Cloud Providers | 3 | 002 |