# 005_Networking_In_Linux

> ip command, iptables, network namespaces, and tcpdump.

## Level 1 — Intuition

### Concept

Linux networking is a rich toolkit. The `ip` command (and its predecessor `ifconfig`) shows and configures interfaces. `iptables`/`nftables` are the firewall. Network namespaces isolate network stacks (foundation of containers). `tcpdump` captures packets.

### The Linux Network Stack

```
┌──────────────────────────────────────────┐
│         Userspace Application            │
│         (socket API — send/recv)         │
├──────────────────────────────────────────┤
│         TCP / UDP (transport)            │
├──────────────────────────────────────────┤
│         IP (routing, forwarding)         │
├──────────────────────────────────────────┤
│         Netfilter (iptables/nftables)   │
├──────────────────────────────────────────┤
│         Device Driver (NIC)              │
└──────────────────────────────────────────┘
```

## Level 2 — Practical

### The ip Command (Modern ifconfig)

```bash
# Interface management
ip link show                          # List all interfaces
ip link show eth0                     # Show specific interface
ip link set eth0 up                   # Bring interface up
ip link set eth0 down                 # Bring interface down
ip -s link show eth0                  # Interface statistics

# IP address management
ip addr show                          # All addresses (replaces ifconfig)
ip addr add 192.168.1.100/24 dev eth0
ip addr del 192.168.1.100/24 dev eth0

# Routing
ip route show                         # Routing table
ip route add 10.0.0.0/24 via 192.168.1.1
ip route add default via 192.168.1.1
ip route del 10.0.0.0/24
ip route get 8.8.8.8                  # What route would be used?

# ARP cache
ip neigh show                         # ARP table
ip neigh add 192.168.1.1 lladdr aa:bb:cc:dd:ee:ff dev eth0
ip neigh del 192.168.1.1 dev eth0

# Socket statistics
ss -tlnp                              # TCP listening sockets
ss -ulnp                              # UDP listening sockets
ss -s                                 # Summary statistics
ss -t state established               # Established TCP connections
```

### nftables (Modern Firewall)

```bash
# nftables replaces iptables, ip6tables, arptables, ebtables
# Simpler syntax, better performance, atomic rule updates

# Check if nftables is running
sudo systemctl status nftables

# List current rules
sudo nft list ruleset

# Basic firewall: allow SSH, HTTP, HTTPS, drop rest
sudo nft add table inet filter
sudo nft add chain inet filter input { type filter hook input priority 0\; policy drop\; }
sudo nft add chain inet filter forward { type filter hook forward priority 0\; policy drop\; }
sudo nft add chain inet filter output { type filter hook output priority 0\; policy accept\; }

# Allow loopback
sudo nft add rule inet filter input iif lo accept

# Allow established connections
sudo nft add rule inet filter input ct state established,related accept

# Allow SSH (port 22)
sudo nft add rule inet filter input tcp dport 22 accept

# Allow HTTP/HTTPS
sudo nft add rule inet filter input tcp dport { 80, 443 } accept

# Rate limiting (max 5 new SSH connections per minute per IP)
sudo nft add rule inet filter input tcp dport 22 \
    ct state new limit rate 5/minute accept

# NAT (masquerade)
sudo nft add table nat
sudo nft add chain nat postrouting { type nat hook postrouting priority 100\; }
sudo nft add rule nat postrouting oif eth0 masquerade

# Persist rules
sudo nft list ruleset > /etc/nftables.conf
sudo systemctl enable nftables
```

### tcpdump Deep Dive

```bash
# Capture basics
sudo tcpdump -i eth0                   # All traffic on eth0
sudo tcpdump -i any                    # All interfaces
sudo tcpdump -i eth0 -nn               # Don't resolve names or ports
sudo tcpdump -i eth0 -w capture.pcap   # Save to file
sudo tcpdump -r capture.pcap           # Read from file

# Filters (BPF syntax)
sudo tcpdump host 192.168.1.100        # Only this host
sudo tcpdump net 192.168.1.0/24        # This subnet
sudo tcpdump port 80                   # HTTP traffic
sudo tcpdump port 443                  # HTTPS traffic
sudo tcpdump tcp port 22               # SSH only
sudo tcpdump udp                       # UDP only
sudo tcpdump icmp                      # Ping/traceroute
sudo tcpdump 'src 192.168.1.100'       # From this IP
sudo tcpdump 'dst 192.168.1.100'       # To this IP
sudo tcpdump 'tcp[tcpflags] & tcp-syn != 0'  # TCP SYN packets
sudo tcpdump 'not arp and not port 22'       # Exclude ARP and SSH

# Useful options
sudo tcpdump -A                        # Print packet in ASCII
sudo tcpdump -X                        # Print hex + ASCII
sudo tcpdump -v                        # Verbose
sudo tcpdump -vvv                      # Very verbose
sudo tcpdump -c 100                    # Capture 100 packets then stop
sudo tcpdump -s 0                      # Capture full packets (no truncation)
```

## Level 3 — Systems

### Network Namespaces

```bash
# Network namespace: isolated network stack
# Containers use this: each container has its own interfaces, routes, iptables

# Create a namespace
sudo ip netns add ns1
sudo ip netns add ns2

# List namespaces
ip netns list

# Run command in a namespace
sudo ip netns exec ns1 ip addr
sudo ip netns exec ns1 bash

# Create virtual ethernet pair (veth) to connect namespaces
sudo ip link add veth0 type veth peer name veth1
sudo ip link set veth0 netns ns1
sudo ip link set veth1 netns ns2

# Configure interfaces inside namespaces
sudo ip netns exec ns1 ip addr add 10.0.0.1/24 dev veth0
sudo ip netns exec ns1 ip link set veth0 up
sudo ip netns exec ns2 ip addr add 10.0.0.2/24 dev veth1
sudo ip netns exec ns2 ip link set veth1 up

# Test: ping from ns1 to ns2
sudo ip netns exec ns1 ping 10.0.0.2

# Connect namespace to internet (via bridge + NAT)
sudo ip link add bridge0 type bridge
sudo ip addr add 172.20.0.1/16 dev bridge0
sudo ip link set bridge0 up

# Add veth pair: namespace ↔ bridge
sudo ip link add veth-ns type veth peer name veth-br
sudo ip link set veth-ns netns ns1
sudo ip link set veth-br master bridge0
sudo ip link set veth-br up
sudo ip netns exec ns1 ip addr add 172.20.0.10/16 dev veth-ns
sudo ip netns exec ns1 ip link set veth-ns up
sudo ip netns exec ns1 ip route add default via 172.20.0.1

# Enable NAT on host
sudo iptables -t nat -A POSTROUTING -s 172.20.0.0/16 -j MASQUERADE
sudo iptables -A FORWARD -i bridge0 -j ACCEPT
sudo iptables -A FORWARD -o bridge0 -j ACCEPT
sudo sysctl -w net.ipv4.ip_forward=1

# Test: should have internet access
sudo ip netns exec ns1 ping 8.8.8.8
```

### Advanced Routing

```bash
# Policy routing: route based on source, fwmark, etc.
# Multiple routing tables

# View routing tables
cat /etc/iproute2/rt_tables

# Add custom route to a specific table
sudo ip route add 10.0.0.0/24 via 192.168.1.1 table 100

# Add rule: packets from 192.168.1.100 use table 100
sudo ip rule add from 192.168.1.100 table 100
ip rule show

# Delete rule
sudo ip rule del from 192.168.1.100 table 100

# Bonding (link aggregation): combine multiple NICs
sudo ip link add bond0 type bond mode 802.3ad  # LACP
sudo ip link set eth0 master bond0
sudo ip link set eth1 master bond0

# Bridge: software switch
sudo ip link add br0 type bridge
sudo ip link set eth0 master br0
sudo ip link set eth1 master br0
sudo ip link set br0 up
```

### Tuning TCP/IP

```bash
# View all kernel network parameters
sysctl -a | grep net.ipv4

# Common tunables:
# Increase buffer sizes for high-bandwidth connections
sudo sysctl -w net.core.rmem_max=134217728    # Max receive buffer
sudo sysctl -w net.core.wmem_max=134217728    # Max send buffer
sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"
sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"

# Enable TCP BBR congestion control (better throughput)
sudo sysctl -w net.core.default_qdisc=fq
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
# Check: sysctl net.ipv4.tcp_congestion_control

# Enable TCP Fast Open (reduce 1 RTT on connect)
sudo sysctl -w net.ipv4.tcp_fastopen=3

# Increase connection tracking table (for NAT/firewall)
sudo sysctl -w net.netfilter.nf_conntrack_max=262144

# Make permanent:
echo "net.ipv4.tcp_congestion_control = bbr" | \
    sudo tee -a /etc/sysctl.d/99-network.conf
sudo sysctl -p /etc/sysctl.d/99-network.conf
```

## Level 4 — Expert

### iproute2 tc (Traffic Control)

```bash
# tc: Quality of Service (QoS), bandwidth limiting, delay simulation

# Limit bandwidth to 1Mbit on eth0
sudo tc qdisc add dev eth0 root tbf rate 1mbit burst 32kbit latency 400ms

# Add 100ms latency (simulate long-distance)
sudo tc qdisc add dev eth0 root netem delay 100ms

# Add 5% packet loss
sudo tc qdisc add dev eth0 root netem loss 5%

# Combine: 50ms delay + 2% loss + 0.1% corruption
sudo tc qdisc add dev eth0 root netem \
    delay 50ms loss 2% corrupt 0.1%

# Show current rules
tc qdisc show dev eth0

# Remove all rules
sudo tc qdisc del dev eth0 root

# Hierarchical Token Bucket (HTB) — advanced bandwidth shaping
# Create class hierarchy:
sudo tc qdisc add dev eth0 root handle 1: htb default 30
sudo tc class add dev eth0 parent 1: classid 1:1 htb rate 100mbit
sudo tc class add dev eth0 parent 1:1 classid 1:10 htb rate 10mbit ceil 50mbit
# Interactive traffic gets 10-50 Mbit
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 \
    match ip dport 22 0xffff flowid 1:10
```

### XDP (eXpress Data Path)

```c
// XDP: Run eBPF programs at earliest possible point in networking
// Before SKB allocation, before kernel stack touches packet
// Extremely fast: millions of packets/second/core

// Simple XDP program: drop all packets from bad IPs
/*
#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <bpf/bpf_helpers.h>

SEC("xdp_drop_bad")
int xdp_drop_bad_ip(struct xdp_md *ctx) {
    void *data = (void *)(long)ctx->data;
    void *data_end = (void *)(long)ctx->data_end;

    struct ethhdr *eth = data;
    if (data + sizeof(*eth) > data_end) return XDP_PASS;

    if (eth->h_proto != __constant_htons(ETH_P_IP))
        return XDP_PASS;

    struct iphdr *ip = data + sizeof(*eth);
    if (data + sizeof(*eth) + sizeof(*ip) > data_end)
        return XDP_PASS;

    // Drop if source IP is 10.0.0.99
    if (ip->saddr == __constant_htonl(0x0a000063))
        return XDP_DROP;

    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";
*/
```

---

## Exercises

1. Create two network namespaces, connect them with a veth pair, assign IPs, and verify connectivity with ping.
2. Write an nftables ruleset that: drops all incoming by default, allows SSH, HTTP, HTTPS, allows established connections, and rate-limits new SSH connections to 3 per minute.
3. Use `tc` to simulate a 100ms delay + 2% packet loss on a test interface. Run `ping` and observe the effects.

## Quiz

1. What's the difference between `ip link` and `ip addr`?
2. How does nftables differ from iptables?
3. What is a network namespace and why is it important for containers?
4. What does `ss -tlnp` show?
5. What is XDP and why is it fast?

---

## Navigation

**Parent**: [[000_LINUX_MOC|LINUX]]

**Synapses**:
- [[004_Kernel_Internals|LINUX 004]] — Kernel networking stack
- [[003_Routing_And_Switching|NETWORKING 003]] — Routing concepts
- [[003_Network_Security|CYBERSECURITY 003]] — Firewall and packet analysis
