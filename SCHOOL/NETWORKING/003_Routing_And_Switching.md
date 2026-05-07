# 003_Routing_And_Switching

> IP routing, subnets, VLANs, and routing protocols.

## Level 1 — Intuition

### Concept

Switches connect devices in the same network (Layer 2, MAC addresses). Routers connect different networks (Layer 3, IP addresses). Together they form the internet.

### Switch vs Router

```
┌────────────────────────────────────────────────────────┐
│ SWITCH (L2)          │ ROUTER (L3)                     │
├──────────────────────┼─────────────────────────────────┤
│ Forward by MAC addr  │ Forward by IP addr              │
│ Same subnet only     │ Between subnets                │
│ Learning: MAC table  │ Learning: routing table        │
│ Broadcast domain     │ Breaks broadcast domains       │
│ Flood unknown MACs   │ Drop unknown destinations      │
│ No TTL               │ Decrements TTL                 │
│ e.g., 192.168.1.x    │ e.g., connect 192.168.1.x      │
│        within LAN    │       to 10.0.0.x              │
└──────────────────────┴─────────────────────────────────┘
```

### How a Packet Travels Between Networks

```
Your PC (192.168.1.100) → google.com (142.250.1.100)

Step 1: Your PC checks: is 142.250.1.100 in my subnet?
        No → Send to default gateway (router)
Step 2: ARP for gateway MAC. Send frame to router.
Step 3: Router checks routing table: where to send 142.x.x.x?
        → Forward to next hop router
Step 4: ... (repeat across 5-20 routers) ...
Step 5: Last router: 142.250.1.100 is in my subnet!
        → ARP for destination, deliver directly

Each router: decrements TTL, changes src/dst MAC
             (IP addresses stay the SAME)
```

## Level 2 — Practical

### Subnet Calculation

```
CIDR Notation:
192.168.1.0/24 means:
- Network:   192.168.1.0
- First host: 192.168.1.1
- Last host:  192.168.1.254
- Broadcast:  192.168.1.255
- Subnet mask: 255.255.255.0

Quick Math:
/8  = 255.0.0.0       (16,777,214 hosts)
/16 = 255.255.0.0     (65,534 hosts)
/24 = 255.255.255.0   (254 hosts)
/28 = 255.255.255.240 (14 hosts)
/30 = 255.255.255.252 (2 hosts — point-to-point links)

Formula:
Hosts = 2^(32 - prefix) - 2
/28 → 2^(32-28) - 2 = 2^4 - 2 = 14 usable hosts

Subnet division example:
Given 10.0.0.0/16, split into /20 subnets:
Each /20 has 2^(32-20) = 4096 addresses (4094 usable)
First subnet:  10.0.0.0/20   (10.0.0.0 - 10.0.15.255)
Second subnet: 10.0.16.0/20  (10.0.16.0 - 10.0.31.255)
Third subnet:  10.0.32.0/20  (10.0.32.0 - 10.0.47.255)
... etc (256/16 = 16 subnets total)
```

### Linux as a Router

```bash
# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
# Permanent: add to /etc/sysctl.conf

# View routing table
ip route show
route -n

# Add a static route
sudo ip route add 10.0.0.0/24 via 192.168.1.1
sudo ip route add 10.0.0.0/24 via 192.168.1.1 dev eth0

# Add default gateway
sudo ip route add default via 192.168.1.1

# Delete a route
sudo ip route del 10.0.0.0/24

# NAT (masquerade) — share internet with internal network
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# View NAT table
sudo iptables -t nat -L -v -n
```

### Common Routing Table Entries

```bash
$ ip route show
default via 192.168.1.1 dev eth0            # Default gateway
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100  # Local LAN
10.0.0.0/8 via 192.168.1.254 dev eth0       # Static route to 10.x.x.x
172.17.0.0/16 dev docker0 proto kernel scope link  # Docker bridge
```

## Level 3 — Systems

### Routing Protocols

```
┌──────────────────────────────────────────────────────┐
│              ROUTING PROTOCOLS                       │
├────────────────┬─────────────────────────────────────┤
│  INTERIOR (IGP)│  EXTERIOR (EGP)                    │
│  Inside an AS  │  Between autonomous systems         │
├────────────────┼─────────────────────────────────────┤
│  RIP (legacy)  │  BGP (the internet's backbone!)     │
│  OSPF (common) │                                     │
│  EIGRP (Cisco) │                                     │
│  IS-IS (SPs)   │                                     │
└────────────────┴─────────────────────────────────────┘

OSPF (Open Shortest Path First):
- Link-state protocol: each router knows full topology
- Dijkstra's algorithm → shortest path tree
- Fast convergence, supports areas for scalability
- Metric: cost (inversely proportional to bandwidth)

BGP (Border Gateway Protocol):
- Path-vector protocol: advertises full AS path
- Internet's glue: connects ISPs, cloud providers, enterprises
- Policy-based: AS path prepending, local preference, MED
- Peering: Public (IXPs), Private (direct connections)
- Example BGP route:
  8.8.8.0/24 → AS 64500 → AS 15169 (Google) → origin
```

### BGP in Practice

```
Internet routing is about AS paths:

Your ISP (AS 65001) → Tier 2 Provider (AS 65002) → Tier 1 (AS 3356 Level3)
                                                         │
                                                    AS 15169 (Google)

Traceroute + BGP lookup:
$ traceroute -n 8.8.8.8
 1  192.168.1.1
 2  10.0.0.1       ← Your ISP's router
 3  203.0.113.1     ← ISP's upstream
 4  72.14.237.134   ← Google's network
 5  8.8.8.8

$ whois -h whois.radb.net 8.8.8.8
route:      8.8.8.0/24
origin:     AS15169
```

### VLAN Configuration Example

```bash
# Linux VLAN setup (802.1Q trunk)
sudo ip link add link eth0 name eth0.10 type vlan id 10
sudo ip link add link eth0 name eth0.20 type vlan id 20
sudo ip addr add 10.0.10.1/24 dev eth0.10
sudo ip addr add 10.0.20.1/24 dev eth0.20
sudo ip link set eth0.10 up
sudo ip link set eth0.20 up

# Cisco-style VLAN config (for reference):
# interface GigabitEthernet0/1
#   switchport mode trunk
#   switchport trunk allowed vlan 10,20,30
#
# interface GigabitEthernet0/2
#   switchport mode access
#   switchport access vlan 10
```

## Level 4 — Expert

### Anycast Routing

```
Anycast: Same IP advertised from multiple locations
BGP picks the "closest" (shortest AS path, lowest metric)

Example: 8.8.8.8 (Google DNS) is anycast
New York: AS 15169 announces 8.8.8.0/24
London:   AS 15169 announces 8.8.8.0/24
Tokyo:    AS 15169 announces 8.8.8.0/24
→ Users automatically routed to nearest instance

Benefits: Load distribution, lower latency, DDoS resilience
Used by: DNS root servers, CDNs, Cloudflare
```

### ECMP and Load Balancing

```
ECMP (Equal Cost Multi-Path):
Router A ──→ Router C (cost 10)
    │
    └──────→ Router D (cost 10)
→ Hashes (src_ip, dst_ip, src_port, dst_port) to pick path
→ Same flow = same path (avoids packet reordering)

Layer 3: Per-packet or per-flow with ECMP
Layer 4: LVS (Linux Virtual Server), IPVS, HAProxy — TCP/UDP
Layer 7: Nginx, Envoy — HTTP routing, content-based

Consistent hashing important for:
- Adding/removing backends → minimal redistribution
- Session affinity without sticky sessions
```

### MPLS (Multi-Protocol Label Switching)

```
Traditional IP routing: Each router does full IP lookup → slow
MPLS: Edge router adds label, core routers switch by label → fast

MPLS Header (32 bits):
┌──────────┬───────┬───────┬─────┐
│ Label    │  TC   │   S   │ TTL │
│ (20 bit) │ (3 b) │ (1 b) │ (8) │
└──────────┴───────┴───────┴─────┘

Use cases: VPNs (L3VPN, L2VPN), traffic engineering, QoS
```

---

## Exercises

1. Given the network 172.16.0.0/16, divide it into subnets that each support 1000 hosts. Write the CIDR notation and subnet masks.
2. Set up a Linux box as a router between two networks (use network namespaces or VMs). Configure IP forwarding and static routes. Ping across networks.
3. Look up your ISP's AS number and the AS path to 1.1.1.1 or 8.8.8.8 using `whois -h whois.radb.net` and a BGP looking glass.

## Quiz

1. What's the difference between a switch and a router?
2. How many usable hosts in a /26 subnet?
3. What is the difference between OSPF and BGP?
4. What is anycast and how is it different from unicast?
5. Why does ECMP require consistent hashing?

---

## Navigation

**Parent**: [[000_NETWORKING_MOC|NETWORKING]]

**Synapses**:
- [[001_TCP_IP|NETWORKING 001]] — IP addressing
- [[002_OSI_Model_Deep_Dive|NETWORKING 002]] — Layer 2 and 3 details
- [[005_Networking_In_Linux|LINUX 005]] — Linux routing commands
