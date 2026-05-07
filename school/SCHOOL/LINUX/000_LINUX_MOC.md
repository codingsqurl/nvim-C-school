# 000_LINUX_MOC

> Linux operating system mastery - kernel to shell.

## Overview

LINUX covers all aspects of the Linux operating system:

- [[001_Filesystem]] - File hierarchy, permissions, and navigation
- [[002_Shell_Basics]] - Bash fundamentals and scripting
- [[003_System_Admin]] - Users, services, and process management
- [[004_Networking]] - Network configuration and tools
- [[005_Package_Management]] - apt, yum, dnf, pacman
- [[006_Kernel_Concepts]] - Kernel internals and modules

## Neural Links

- LINUX → [[000_CORE_MOC|CORE]] - System fundamentals
- LINUX → [[000_DEVOPS_MOC|DEVOPS]] - Server deployment
- LINUX → [[000_CYBERSECURITY_MOC|CYBERSECURITY]] - Linux hardening

## Progression

```
001_Filesystem
    ↓
002_Shell_Basics
    ↓ ├─→ 003_System_Admin
    │          ↓
    │       004_Networking
    │          ↓
    │       005_Package_Management
    │          ↓
    └────→ 006_Kernel_Concepts
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Filesystem | 1 | None |
| 002 | Shell Basics | 2 | 001 |
| 003 | System Admin | 3 | 002 |
| 004 | Networking | 3 | 002 |
| 005 | Package Management | 2 | 001 |
| 006 | Kernel Concepts | 4 | 003 |