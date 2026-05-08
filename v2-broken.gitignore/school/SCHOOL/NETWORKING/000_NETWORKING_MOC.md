# 000_NETWORKING_MOC

> Networking fundamentals - protocols to infrastructure.

## Overview

NETWORKING covers network fundamentals:

- [[001_TCP_IP]] - IP addressing, subnetting, routing
- [[002_DNS]] - DNS resolution and records
- [[003_HTTP]] - HTTP/HTTPS protocols
- [[004_Firewalls]] - iptables, ufw, network security
- [[005_VPN]] - VPN protocols and tunneling
- [[006_Load_Balancing]] - HAProxy, nginx load balancing

## Neural Links

- NETWORKING → [[000_LINUX_MOC|LINUX]] - Network tools
- NETWORKING → [[000_CYBERSECURITY_MOC|CYBERSECURITY]] - Network defense
- NETWORKING → [[000_DEVOPS_MOC|DEVOPS]] - Load balancing

## Progression

```
001_TCP_IP
    ↓
002_DNS
    ↓
003_HTTP
    ↓ ├─→ 004_Firewalls
    │          ↓
    │       005_VPN
    │          ↓
    └────→ 006_Load_Balancing
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | TCP/IP | 1 | None |
| 002 | DNS | 2 | 001 |
| 003 | HTTP | 2 | 001 |
| 004 | Firewalls | 3 | 001 |
| 005 | VPN | 3 | 004 |
| 006 | Load Balancing | 4 | 003 |