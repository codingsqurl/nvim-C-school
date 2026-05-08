# 003_Network_Security

> Firewalls, IDS/IPS, packet analysis, Wireshark, and nmap.

## Level 1 — Intuition

### Concept

Network security is a layered defense. No single tool stops everything. Think of it as security checkpoints: border (firewall), surveillance (IDS), investigation (packet analysis), and reconnaissance (scanning).

### Defense Layers

```
Internet
    │
┌───┴──────────────────────────────┐
│  L1: Border Router (ACLs)        │  ← Basic filtering
├──────────────────────────────────┤
│  L2: Firewall (stateful)        │  ← Allow/deny by port, IP, protocol
├──────────────────────────────────┤
│  L3: IDS/IPS (detect/intrusion) │  ← Spot attack patterns
├──────────────────────────────────┤
│  L4: WAF (web app firewall)     │  ← Block SQLi, XSS at HTTP level
├──────────────────────────────────┤
│  L5: Application (your code)    │  ← Input validation, auth
└──────────────────────────────────┘
    │
   Server
```

## Level 2 — Practical

### nmap — Network Scanning

```bash
# Basic host discovery (ping scan)
nmap -sn 192.168.1.0/24

# Scan common ports
nmap 192.168.1.1

# Scan specific ports
nmap -p 22,80,443 192.168.1.1

# Scan all ports (slow but thorough)
nmap -p- 192.168.1.1

# Service version detection
nmap -sV 192.168.1.1

# OS detection
nmap -O 192.168.1.1

# Aggressive scan (OS, version, scripts, traceroute)
nmap -A 192.168.1.1

# Scan with default scripts
nmap -sC 192.168.1.1

# Stealth SYN scan (needs root, faster)
sudo nmap -sS 192.168.1.1

# Output formats
nmap -oA scan_results 192.168.1.1   # All formats (.nmap, .xml, .gnmap)
```

### Firewall with iptables/nftables

```bash
# iptables fundamentals (legacy, but widely used)
# Three chains: INPUT, OUTPUT, FORWARD
# Three actions: ACCEPT, DROP, REJECT

# Default: drop everything, allow only what's needed
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT    # Allow outbound by default

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow established connections back in
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Rate limiting: max 5 SSH connections per minute
sudo iptables -A INPUT -p tcp --dport 22 -m recent \
  --set --name ssh_limit
sudo iptables -A INPUT -p tcp --dport 22 -m recent \
  --update --seconds 60 --hitcount 6 --name ssh_limit -j DROP

# Save rules (persist across reboot)
sudo iptables-save > /etc/iptables/rules.v4

# List rules with line numbers
sudo iptables -L -v -n --line-numbers

# Delete rule by number
sudo iptables -D INPUT 3
```

### tcpdump — Packet Capture

```bash
# Capture all on eth0
sudo tcpdump -i eth0

# Capture specific port
sudo tcpdump -i eth0 port 80
sudo tcpdump -i eth0 port 443

# Capture specific host
sudo tcpdump -i eth0 host 192.168.1.100

# Verbose, don't resolve names (faster)
sudo tcpdump -i eth0 -nn -v

# Capture and save to file for Wireshark
sudo tcpdump -i eth0 -w capture.pcap

# Read from file
tcpdump -r capture.pcap

# Filter HTTP GET requests
sudo tcpdump -i eth0 -A 'tcp port 80 and (tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420)'

# Count packets
sudo tcpdump -i eth0 -c 100
```

## Level 3 — Systems

### Wireshark Filters

```
Capture Filters (BPF — Berkeley Packet Filter):
  port 80                    HTTP only
  host 10.0.0.1              From/to this host
  tcp port 443               HTTPS only
  net 192.168.1.0/24         Subnet traffic
  not arp                    Exclude ARP noise

Display Filters (Wireshark-specific, richer):
  http                       HTTP packets
  http.request               Only HTTP requests
  tls.handshake.type == 1    TLS Client Hello
  dns                        DNS queries
  ip.src == 10.0.0.1         From this IP
  tcp.port == 80             TCP port 80
  tcp.flags.syn == 1         TCP SYN packets (connection start)
  tcp.analysis.retransmission  Detect retransmissions
  http.response.code == 404  Only 404 responses
  frame contains "password"   Search packet contents (slow)

TCP Stream Analysis:
  Right-click → Follow → TCP Stream
  Reconstructs full conversation
  See HTTP request + response in plain text
```

### IDS/IPS with Snort/Suricata

```bash
# Snort basic usage
# Mode 1: Sniffer (just print packets)
sudo snort -v -i eth0

# Mode 2: Packet Logger
sudo snort -l /var/log/snort -i eth0

# Mode 3: NIDS (Network Intrusion Detection)
sudo snort -c /etc/snort/snort.conf -i eth0 -A console

# Example Snort rule
# alert tcp $EXTERNAL_NET any -> $HOME_NET 22
#   (msg:"SSH Brute Force Attempt";
#    flow:to_server,established;
#    detection_filter:track by_src, count 5, seconds 60;
#    sid:1000001;)

# Suricata (multi-threaded Snort alternative)
sudo suricata -c /etc/suricata/suricata.yaml -i eth0
```

### ARP Spoofing and MITM

```
Normal ARP:
Host A (10.0.0.5) asks: "Who has 10.0.0.1 (gateway)?"
Gateway responds: "10.0.0.1 is at MAC aa:bb:cc:dd:ee:ff"

ARP Spoofing Attack:
Attacker (10.0.0.99) continuously sends:
  "10.0.0.1 is at MAC 11:22:33:44:55:66" (attacker's MAC)
→ All traffic to gateway goes through attacker
→ Attacker can read/modify/drop traffic

Defense:
- Static ARP entries (small networks)
- DHCP Snooping + Dynamic ARP Inspection (switches)
- ARP monitoring tools (arpwatch)
```

## Level 4 — Expert

### Network Forensics

```python
# Extract files from pcap with Python (scapy)
from scapy.all import rdpcap, IP, TCP, Raw
import os

def extract_files(pcap_path, output_dir):
    """Extract data from TCP streams and reassemble files."""
    packets = rdpcap(pcap_path)
    streams = {}  # (src_ip, src_port, dst_ip, dst_port) → bytes

    for pkt in packets:
        if IP in pkt and TCP in pkt and Raw in pkt:
            key = (pkt[IP].src, pkt[TCP].sport,
                   pkt[IP].dst, pkt[TCP].dport)
            streams.setdefault(key, b'')
            streams[key] += bytes(pkt[Raw])

    for i, ((src, sport, dst, dport), data) in enumerate(streams.items()):
        fname = f"{src}_{sport}_{dst}_{dport}.bin"
        with open(os.path.join(output_dir, fname), 'wb') as f:
            f.write(data)
        print(f"Extracted {len(data)} bytes → {fname}")

# Find file signatures in pcap data (magic bytes)
# e.g., JPEG: FF D8 FF, PNG: 89 50 4E 47, PDF: 25 50 44 46
```

### DDoS Mitigation

```
Attack Types:
1. SYN Flood — Send many SYN, never ACK → fill connection table
   Defense: SYN cookies (encode state in sequence number)

2. UDP Amplification — Small request → large response to victim
   DNS (x28-54), NTP (x556), Memcached (x50,000!)
   Defense: Block source ports, rate limiting, BCP38 (anti-spoofing)

3. HTTP Flood — Many legitimate-looking HTTP requests
   Defense: CAPTCHA, JS challenge (Cloudflare), rate limiting

4. Slowloris — Hold connections open with partial HTTP requests
   Defense: Timeouts, max connections per IP, reverse proxy

Mitigation Architecture:
┌─────────┐     ┌────────────┐     ┌──────────────┐
│ Anycast │ →   │ Scrubbing  │ →   │ Origin Server │
│ DNS     │     │ Center     │     │ (hidden IP)   │
└─────────┘     └────────────┘     └──────────────┘
(Cloudflare, Akamai, AWS Shield)
```

---

## Exercises

1. Scan your local network with nmap: identify all hosts, open ports, and OS guesses. Document your findings.
2. Capture 30 seconds of your own traffic with tcpdump, open in Wireshark. Filter for DNS queries and HTTP requests. Follow a TCP stream.
3. Write 3 iptables rules: allow SSH from your IP only, rate-limit new connections to 10/minute, and log all dropped packets.

## Quiz

1. What's the difference between a stateful and stateless firewall?
2. What does a SYN scan (`-sS`) do differently from a TCP connect scan?
3. What is ARP spoofing and how can it be detected?
4. What's the difference between an IDS and an IPS?
5. How do SYN cookies mitigate SYN flood attacks?

---

## Navigation

**Parent**: [[000_CYBERSECURITY_MOC|CYBERSECURITY]]

**Synapses**:
- [[001_TCP_IP|NETWORKING 001]] — Network protocols
- [[005_Networking_In_Linux|LINUX 005]] — Linux network tools
- [[002_Cryptography|CYBERSECURITY 002]] — TLS encryption
