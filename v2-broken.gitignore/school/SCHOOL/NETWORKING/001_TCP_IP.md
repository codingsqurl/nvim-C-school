# 001_TCP_IP

> Networking fundamentals - how data flows across networks.

## Level 1 — Intuition

### Concept

TCP/IP is the language of the internet. Every device spoke to has an IP address, and data flows through packets.

### The Two Models

**TCP (Transmission Control Protocol)**
- Connection-oriented
- Ordered delivery guaranteed
- Retries on failure
- Use case: Web pages, email

**UDP (User Datagram Protocol)**
- Connectionless
- Best effort (no guarantee)
- Faster, lower overhead
- Use case: Video streaming, gaming

### IP Addresses

```
IPv4: 192.168.1.100 (32-bit, ~4 billion addresses)
IPv6: 2001:0db8::1 (128-bit, unlimited)
```

### Private vs Public

| Range | Type | Example |
|-------|-------|---------|
| 10.x.x.x | Private | 10.0.0.1 |
| 172.16.x.x | Private | 172.16.0.1 |
| 192.168.x.x | Private | 192.168.1.1 |
| Everything else | Public | 8.8.8.8 |

## Level 2 — Practical

### Subnetting Basics

```
192.168.1.0/24 means:
- Network: 192.168.1.0
- Hosts: 192.168.1.1 - 192.168.1.254
- Broadcast: 192.168.1.255
- Total: 256 - 2 = 254 usable

/24 = 255.255.255.0 (24 ones, 8 zeros)
```

### Common Tools

```bash
# Check IP
ip addr
hostname -I

# Ping test
ping 8.8.8.8

# Port scan
nmap 192.168.1.1

# Check DNS
nslookup google.com
dig google.com
```

## Level 3 — Systems

### How a Request Flows

```
Browser → DNS lookup → Get IP → TCP SYN → Server → SYN-ACK → ACK → HTTP Request → Response → ACK → Close
```

```
1. Browser resolves "google.com" via DNS
2. DNS returns 142.250.1.100
3. Browser sends TCP SYN to port 80
4. Server responds SYN-ACK  
5. Browser sends ACK (connection established)
6. Browser sends HTTP GET
7. Server sends HTTP 200 + content
8. Browser receives (ACK)
9. TCP FIN-FIN-ACK closes connection
```

### Ports

| Port | Service | Use Case |
|------|---------|----------|
| 22 | SSH | Secure shell |
| 80 | HTTP | Web (unencrypted) |
| 443 | HTTPS | Web (encrypted) |
| 53 | DNS | Domain resolution |
| 21 | FTP | File transfer |
| 25 | SMTP | Email send |

## Level 4 — Expert

### NAT (Network Address Translation)

```
Private Network ← → NAT Gateway ← → Internet

Your laptop (192.168.1.100)
    ↓ port 12345
NAT Gateway (203.0.113.50)  
    ↓ mapped
Internet

The gateway tracks which internal IP/port maps to which external port
```

### OSI Model Layers

```
7. Application    (HTTP, DNS)     ← Your code
6. Presentation  (SSL/TLS)       ← Encryption
5. Session      (TCP session)    ← Connection
4. Transport    (TCP/UDP)       ← Ports
3. Network      (IP)           ← Addresses
2. Data Link    (Ethernet)      ← MAC addresses
1. Physical    (Cables)       ← Hardware
```

---

## Navigation

**Parent**: [[000_NETWORKING_MOC|NETWORKING]]

**Synapses**:
- [[001_DNS|NETWORKING 002]] - DNS deep dive
- [[001_Firewalls|LINUX 004]] - Firewall rules
- [[001_Containers|DEVOPS 001]] - Docker networking