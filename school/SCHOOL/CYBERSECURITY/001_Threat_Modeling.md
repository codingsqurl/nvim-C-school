# 001_Threat_Modeling

> Security fundamentals - understanding attackers and building defenses.

## Level 1 — Intuition

### Concept

Security is about understanding:
1. What do you have that attackers want?
2. Who would attack you?
3. How would they attack?
4. What happens if they succeed?

### STRIDE Model

| Letter | Meaning | Example |
|--------|---------|---------|
| S | Spoofing | Pretending to be someone else |
| T | Tampering | Modifying data/code |
| R | Repudiation | Denying actions took place |
| I | Information Disclosure | Leaking data |
| D | Denial of Service | Making service unavailable |
| E | Elevation of Privilege | Gaining admin access |

### Attack Surfaces

```
┌─────────────────────────────────────┐
│          APPLICATION                 │
├─────────┬─────────┬─────────────────┤
│  Input  │  APIs   │   Database     │
│  Forms  │  Auth   │   Queries     │
├─────────┴─────────┴─────────────────┤
│         INFRASTRUCTURE              │
│    Network   │   Server   │   Code    │
└────────────┴───────────┴──────────┘
```

Every entry point is a potential attack surface.

## Level 2 — Practical

### Risk Assessment

```python
# Calculate Risk = Likelihood × Impact × Asset Value

# Example:
- Likelihood: Medium (3) -Attacker needs some skill
- Impact: High (7) - Losing customer data
- Asset Value: Critical (10) - PII, financial

Risk Score = 3 × 7 × 10 = 210 (max 300)

# Priority guidelines:
# 0-100: Monitor
# 101-200: Address in next sprint  
# 201-300: Immediate action
```

### Common Vulnerabilities

| Vulnerability | Description | Prevention |
|--------------|-------------|------------|
| SQL Injection | Malicious database queries | Use parameterized queries |
| XSS | Injecting scripts | Escape output |
| CSRF | Forged requests | Use CSRF tokens |
| Weak Auth | Easy passwords | MFA, strong password policy |
| Sensitive Data Exposure | Plaintext secrets | Encrypt at rest/transit |

## Level 3 — Systems

### Defense in Depth

```
┌────────────────────────────────────────────┐
│          MULTI-LAYER DEFENSE            │
├────────────────────────────────────────┤
│  Layer 1: Network     → Firewall      │
│  Layer 2: Host        → IDS/Antivirus │
│  Layer 3: Application → Input validation│
│  Layer 4: Data       → Encryption   │
│  Layer 5: User       → Training     │
└────────────────────────────────────────┘

Even if one layer fails, others provide protection
```

### Logging and Monitoring

```python
# What to log:
# - Authentication attempts (success + failure)
# - Authorization decisions
# - Data access (especially writes)
# - Administrative actions
# - Errors and exceptions

# Log format:
# TIMESTAMP | LEVEL | USER | ACTION | RESULT | IP
```

## Level 4 — Expert

### Incident Response

```
1. DETECT  - Identify the breach
2. CONTAIN - Limit damage (isolate systems)
3. ERADICATE - Remove attacker access
4. RECOVER - Restore from backup
5. LESSONS - Document and improve
```

### Security Frameworks

| Framework | Focus |
|-----------|-------|
| NIST | General security |
| OWASP | Web application |
| CIS | System hardening |
| ISO 27001 | Information security management |

---

## Navigation

**Parent**: [[000_CYBERSECURITY_MOC|CYBERSECURITY]]

**Synapses**:
- [[001_Mental_Models|CORE 001]] - Threat model thinking
- [[001_Cryptography|CYBERSECURITY 002]] - Encryption
- [[001_Firewalls|LINUX 004]] - Network defense