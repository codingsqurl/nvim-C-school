# 002_OSI_Model_Deep_Dive

> All 7 layers detailed, encapsulation, and real-world packet walkthrough.

## Level 1 — Intuition

### Concept

The OSI model is a conceptual framework for understanding how data moves through a network. Each layer adds its own header (encapsulation) — like putting a letter in an envelope, then in a mail bag, then on a truck.

### The 7 Layers at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│ Layer │ Name          │ PDU     │ Device    │ Protocol      │
├───────┼───────────────┼─────────┼───────────┼───────────────┤
│  7    │ Application   │ Data    │           │ HTTP, DNS, SSH │
│  6    │ Presentation  │ Data    │           │ TLS, JPEG, gzip│
│  5    │ Session       │ Data    │           │ NetBIOS, RPC   │
│  4    │ Transport     │ Segment │           │ TCP, UDP       │
│  3    │ Network       │ Packet  │ Router    │ IP, ICMP       │
│  2    │ Data Link     │ Frame   │ Switch    │ Ethernet, ARP  │
│  1    │ Physical      │ Bits    │ Hub/Repeater│ 1000BASE-T  │
└───────┴───────────────┴─────────┴───────────┴───────────────┘
```

## Level 2 — Practical

### Encapsulation: HTTP Request Journey

```
Your browser requests https://example.com:

Layer 7 (Application):
│ GET / HTTP/1.1
│ Host: example.com
│
│ Layer 4 + Layer 6 (TLS):  ← Encrypted payload
│ ┌─────────────────────────┐
│ │ TCP Header             │
│ │ src: 54321, dst: 443   │
│ │ flags: PSH, ACK       │
│ │ seq: 1001, ack: 500   │
│ ├─────────────────────────┤
│ │ Encrypted HTTP          │  ← Can't read without keys
│ └─────────────────────────┘
│
│ Layer 3 (IP):
│ ┌──────────────────────────────┐
│ │ IP Header                    │
│ │ src: 192.168.1.100           │
│ │ dst: 93.184.216.34          │
│ │ TTL: 64, proto: TCP         │
│ ├──────────────────────────────┤
│ │ TCP + HTTP                   │
│ └──────────────────────────────┘
│
│ Layer 2 (Ethernet):
│ ┌──────────────────────────────────────┐
│ │ Ethernet Header                      │
│ │ src MAC: 00:11:22:33:44:55          │
│ │ dst MAC: aa:bb:cc:dd:ee:ff (router) │
│ │ type: 0x0800 (IPv4)                 │
│ ├──────────────────────────────────────┤
│ │ IP + TCP + HTTP                      │
│ │ FCS (CRC32 checksum)                │
│ └──────────────────────────────────────┘

Layer 1: Bits sent as electrical/optical/radio signals
```

### Real Packet Analysis

```
Tcpdump output for a single HTTP request:
1. DNS: 192.168.1.100.54321 > 8.8.8.8.53: 12345+ A? example.com.
2. DNS: 8.8.8.8.53 > 192.168.1.100.54321: 12345 1/0/0 A 93.184.216.34
3. TCP: 192.168.1.100.45678 > 93.184.216.34.80: S, seq 1000
4. TCP: 93.184.216.34.80 > 192.168.1.100.45678: S, seq 5000, ack 1001
5. TCP: 192.168.1.100.45678 > 93.184.216.34.80: ., ack 5001
6. HTTP: 192.168.1.100.45678 > 93.184.216.34.80: P, seq 1001:1201, GET / HTTP/1.1
7. HTTP: 93.184.216.34.80 > 192.168.1.100.45678: P, seq 5001:6501, HTTP/1.1 200 OK
8. TCP: 192.168.1.100.45678 > 93.184.216.34.80: ., ack 6501
9. TCP: 192.168.1.100.45678 > 93.184.216.34.80: F, seq 1201
10.TCP: 93.184.216.34.80 > 192.168.1.100.45678: F, seq 6501, ack 1202
11.TCP: 192.168.1.100.45678 > 93.184.216.34.80: ., ack 6502

Protocols involved: DNS (L7), TCP (L4), IP (L3), Ethernet (L2)
```

## Level 3 — Systems

### Layer 1 — Physical

```
Physical layer: The actual medium

Ethernet standards:
- 10BASE-T:  10 Mbps over twisted pair (obsolete)
- 100BASE-TX: 100 Mbps (Fast Ethernet)
- 1000BASE-T: 1 Gbps (Gigabit Ethernet) — most common LAN
- 10GBASE-T:  10 Gbps (10 Gigabit)
- 40GBASE/100GBASE: Data centers

Fiber:
- Single-mode (SMF): Long distance (40+ km), expensive transceivers
- Multi-mode (MMF): Short distance (< 500m), cheaper

Wireless (Wi-Fi 802.11):
- 802.11ax (Wi-Fi 6): Up to 9.6 Gbps, OFDMA
- 802.11be (Wi-Fi 7): Up to 46 Gbps

Issues: Attenuation (signal loss), interference, crosstalk
Tools: Cable tester, OTDR (optical), spectrum analyzer (wireless)
```

### Layer 2 — Data Link: Ethernet and ARP

```
Ethernet Frame Structure:
┌─────────┬─────────┬──────────┬───────────┬──────────┬────────┐
│ Preamble │ Dest MAC│ Src MAC  │ EtherType │ Payload  │  FCS   │
│  8 bytes │ 6 bytes │ 6 bytes  │  2 bytes  │ 46-1500  │ 4 bytes│
└─────────┴─────────┴──────────┴───────────┴──────────┴────────┘

Common EtherTypes:
0x0800  IPv4
0x86DD  IPv6
0x0806  ARP
0x8100  VLAN (802.1Q)

MAC Address: 48 bits, e.g., 00:1A:2B:3C:4D:5E
First 24 bits: OUI (Organizationally Unique Identifier)
Last 24 bits: Device ID (assigned by manufacturer)

ARP (Address Resolution Protocol):
Who has 192.168.1.1? Tell 192.168.1.100
→ 192.168.1.1 is at aa:bb:cc:dd:ee:ff

ARP table on your machine:
$ arp -a
? (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0
```

### Layer 3 — Network: IP Deep Dive

```
IPv4 Header:
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┤
│Version│  IHL  │    DSCP     │ ECN │      Total Length           │
├───────┴───────┴─────────────┴─────┼─────────────────────────────┤
│        Identification             │Flags│    Fragment Offset     │
├──────────────────────────────────┼─────────────┬─────────────────┤
│  TTL             │   Protocol    │        Header Checksum        │
├──────────────────┴──────────────┼───────────────────────────────┤
│                         Source IP Address                         │
├──────────────────────────────────────────────────────────────────┤
│                      Destination IP Address                       │
└──────────────────────────────────────────────────────────────────┘

Key fields:
- TTL: Decremented by each router. Packet dropped when TTL=0.
       Prevents infinite loops. traceroute uses this!
- Protocol: 6=TCP, 17=UDP, 1=ICMP
- Fragmentation: If packet > MTU (usually 1500), split into fragments
  DF (Don't Fragment) flag: if set and > MTU → drop, send ICMP "frag needed"
  (This is how Path MTU Discovery works!)
```

## Level 4 — Expert

### MTU Discovery and Jumbo Frames

```
Path MTU Discovery:
1. Send packet with DF=1, size = local MTU
2. If router has smaller MTU → drops, sends ICMP "Frag Needed" with MTU
3. Retry with smaller size
4. Repeat until packet reaches destination

Jumbo Frames:
Standard Ethernet MTU: 1500 bytes
Jumbo Frames: 9000 bytes
Benefits: Fewer packets → less CPU overhead, better throughput
Requirements: ALL devices on path must support (NIC, switch, router)
Common in: Storage networks (iSCSI), data center backbones
```

### VLANs (802.1Q)

```
Without VLANs:
┌─────────┐     ┌─────────┐
│ Switch 1│     │ Switch 2│    Each broadcast domain = physical switch
│  ████   │     │  ████   │
│  ████   │     │  ████   │
└─────────┘     └─────────┘

With VLANs (logical separation on same hardware):
┌───────────────────────────────────┐
│         Managed Switch             │
│ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│ │ VLAN 10 │ │ VLAN 20 │ │VLAN 30│ │
│ │ (Eng)   │ │ (Sales) │ │(Guest)│ │
│ └─────────┘ └─────────┘ └───────┘ │
└───────────────────────────────────┘

802.1Q Tag (4 bytes inserted after Src MAC):
┌─────────┬─────────┬──────────┬───────────┬──────────┬────────┐
│ Dst MAC │ Src MAC │ 802.1Q   │ EtherType │ Payload  │  FCS   │
│         │         │ Tag      │           │          │        │
└─────────┴─────────┴──────────┴───────────┴──────────┴────────┘
                              ↑
                   TPID (0x8100) + PCP (3 bits) + DEI (1 bit) + VLAN ID (12 bits)
                   VLAN ID range: 1-4094
```

---

## Exercises

1. Capture a single HTTP request with tcpdump, open in Wireshark. Click through each layer: Ethernet → IP → TCP → HTTP. Identify source/destination at each layer.
2. Trace the path to google.com with `traceroute` or `mtr`. Explain what each hop represents and why TTL is involved.
3. Set up two VLANs on a managed switch (or simulate with Linux bridges + VLAN interfaces). Verify that hosts on different VLANs cannot communicate.

## Quiz

1. What is encapsulation? How many headers does an HTTP packet traveling over Ethernet have?
2. What is the purpose of the TTL field in IP?
3. What problem do VLANs solve?
4. How does ARP work, and what layer does it operate at?
5. What is Path MTU Discovery and why is it needed?

---

## Navigation

**Parent**: [[000_NETWORKING_MOC|NETWORKING]]

**Synapses**:
- [[001_TCP_IP|NETWORKING 001]] — TCP/IP fundamentals
- [[003_Routing_And_Switching|NETWORKING 003]] — Layer 3 routing
- [[005_Networking_In_Linux|LINUX 005]] — Linux VLAN setup
