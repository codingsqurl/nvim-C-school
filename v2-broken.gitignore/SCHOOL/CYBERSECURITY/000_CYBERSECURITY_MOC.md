# 000_CYBERSECURITY_MOC

> Security fundamentals - offense and defense.

## Overview

CYBERSECURITY covers security concepts:

- [[001_Threat_Modeling]] - Risk assessment and threat modeling
- [[002_Cryptography]] - Encryption, hashing, digital signatures
- [[003_Authentication]] - Passwords, MFA, authentication flows
- [[004_Authorization]] - RBAC, ACLs, least privilege
- [[005_Incident_Response]] - Detection, response, forensics
- [[006_Security_Tools]] - Nmap, Burp, Wireshark basics

## Neural Links

- CYBERSECURITY → [[000_CORE_MOC|CORE]] - Security mindset
- CYBERSECURITY → [[000_LINUX_MOC|LINUX]] - Linux hardening
- CYBERSECURITY → [[000_NETWORKING_MOC|NETWORKING]] - Network security

## Progression

```
001_Threat_Modeling
    ↓
002_Cryptography
    ↓ ├─→ 003_Authentication
    │          ↓
    │       004_Authorization
    │          ↓
    │       005_Incident_Response
    │          ↓
    └────→ 006_Security_Tools
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Threat Modeling | 1 | None |
| 002 | Cryptography | 2 | 001 |
| 003 | Authentication | 3 | 002 |
| 004 | Authorization | 3 | 002 |
| 005 | Incident Response | 4 | 003 |
| 006 | Security Tools | 3 | 001 |