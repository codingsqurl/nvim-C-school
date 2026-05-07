# 006_Software_Defined_Networking

> SDN architecture, network automation, and cloud networking.

## Level 1 — Intuition

### Concept

Traditional networking: each router/switch makes its own decisions. SDN (Software-Defined Networking): a central controller tells all devices what to do. Like moving from individual traffic cops to a centralized traffic control center.

### The SDN Paradigm

```
Traditional Network:               SDN:
┌──────────────────┐         ┌──────────────────────┐
│ ┌──────┐┌──────┐ │         │   SDN CONTROLLER      │
│ │Ctrl  ││Ctrl  │ │         │  (brain of network)   │
│ │Plane ││Plane │ │         └──┬────────┬────────┬──┘
│ ├──────┤├──────┤ │           │        │        │
│ │Data  ││Data  │ │      ┌────┴──┐ ┌──┴────┐ ┌──┴────┐
│ │Plane ││Plane │ │      │Switch │ │Switch │ │Switch │
│ └──────┘└──────┘ │      │(dumb) │ │(dumb) │ │(dumb) │
│  Switch  Switch  │      └───────┘ └───────┘ └───────┘
└──────────────────┘
Control + data     Control plane centralized
plane bundled      Data plane stays on device
```

## Level 2 — Practical

### OpenFlow Basics

```
OpenFlow: First standard SDN protocol
Controller communicates with switches via OpenFlow protocol

Flow Table (on switch):
┌────────────────────────────────────────────────────────┐
│ Match Fields           │ Priority │ Counters │ Actions │
├────────────────────────┼──────────┼──────────┼─────────┤
│ src=10.0.0.1,          │   100    │  45000   │ OUTPUT: │
│ dst=10.0.0.2,          │          │          │ port 3  │
│ tcp_port=80            │          │          │         │
├────────────────────────┼──────────┼──────────┼─────────┤
│ arp, *                 │    10    │   1200   │ FLOOD   │
├────────────────────────┼──────────┼──────────┼─────────┤
│ *                      │    0     │   8500   │ CONTROLLER│
│ (table-miss)           │          │          │ (send to│
│                        │          │          │  ctrl)  │
└────────────────────────┴──────────┴──────────┴─────────┘

Match fields: Ingress Port, Src/Dst MAC, EtherType, VLAN ID,
              Src/Dst IP, IP Proto, TCP/UDP Src/Dst Port
Actions: Output, Drop, Flood, Modify Field, Group, Controller
```

### Mininet — SDN Simulation

```bash
# Install: sudo apt install mininet
# Mininet creates virtual networks on one machine

# Simple topology: 1 switch, 3 hosts
sudo mn --topo single,3 --mac --controller remote

# Inside mininet CLI:
mininet> nodes          # h1 h2 h3 s1
mininet> net            # Show topology
mininet> h1 ping h2     # Ping between hosts
mininet> h1 ifconfig    # Host network config
mininet> xterm h1       # Open terminal on h1

# Custom topology (Python):
# sudo mn --custom topo.py --topo mytopo

# Python API example:
from mininet.topo import Topo

class MyTopo(Topo):
    def build(self):
        s1 = self.addSwitch('s1')
        for h in range(4):
            host = self.addHost(f'h{h+1}')
            self.addLink(host, s1)

# Start with: sudo mn --custom mytopo.py --topo mytopo
```

## Level 3 — Systems

### Network Automation

```python
# Automating network devices with Python

# Option 1: netmiko (SSH-based, multi-vendor)
from netmiko import ConnectHandler

router = {
    'device_type': 'cisco_ios',
    'host': '192.168.1.1',
    'username': 'admin',
    'password': 'password',
}

net_connect = ConnectHandler(**router)
output = net_connect.send_command('show ip interface brief')
print(output)

config_commands = [
    'interface GigabitEthernet0/1',
    'description CONFIGURED_BY_PYTHON',
    'ip address 10.0.0.1 255.255.255.0',
    'no shutdown',
]
net_connect.send_config_set(config_commands)
net_connect.disconnect()

# Option 2: NAPALM (unified API across vendors)
from napalm import get_network_driver

driver = get_network_driver('ios')
device = driver('192.168.1.1', 'admin', 'password')
device.open()

print(device.get_facts())
print(device.get_interfaces())
print(device.get_bgp_neighbors())

device.close()
```

### Infrastructure as Code for Networks

```yaml
# Ansible playbook for network configuration
- name: Configure VLANs on switches
  hosts: switches
  gather_facts: no

  tasks:
    - name: Create VLAN 100
      ios_vlan:
        vlan_id: 100
        name: engineering
        state: present

    - name: Assign VLAN to interface
      ios_config:
        lines:
          - switchport mode access
          - switchport access vlan 100
        parents: interface GigabitEthernet0/5

# Terraform for Cloud Networking
# resource "aws_vpc" "main" {
#   cidr_block = "10.0.0.0/16"
# }
# resource "aws_subnet" "public" {
#   vpc_id     = aws_vpc.main.id
#   cidr_block = "10.0.1.0/24"
# }
```

### Cloud Networking Concepts

```
AWS VPC Architecture:
┌─────────────────────────────────────────────────────┐
│ VPC (10.0.0.0/16)                                   │
│ ┌──────────────────────┐ ┌──────────────────────┐  │
│ │ Public Subnet         │ │ Private Subnet       │  │
│ │ 10.0.1.0/24          │ │ 10.0.2.0/24          │  │
│ │                      │ │                      │  │
│ │ ┌─────┐ ┌─────┐     │ │ ┌─────┐ ┌─────┐     │  │
│ │ │Web1 │ │Web2 │     │ │ │DB1  │ │DB2  │     │  │
│ │ └──┬──┘ └──┬──┘     │ │ └──┬──┘ └──┬──┘     │  │
│ │    │       │        │ │    │       │        │  │
│ └────┼───────┼────────┘ └────┼───────┼────────┘  │
│      │       │              │       │            │
│   ┌──┴───────┴──────────────┴───────┴──┐         │
│   │        Internet Gateway            │         │
│   └────────────────┬──────────────────┘         │
│                    │                             │
└────────────────────┼─────────────────────────────┘
                     │
                 Internet

Key components:
- VPC: Virtual Private Cloud (isolated network)
- Subnet: CIDR block within VPC (AZ-specific)
- Internet Gateway: Public internet access
- NAT Gateway: Outbound-only internet for private subnets
- Security Group: Stateful instance firewall
- NACL: Stateless subnet firewall
- Route Table: Where traffic goes
```

## Level 4 — Expert

### Network Function Virtualization (NFV)

```
NFV: Replace hardware appliances with software
Traditional:                        NFV:
┌────────┐ ┌────────┐ ┌────────┐    ┌─────────────────────┐
│Firewall│ │Router  │ │LB      │    │  Commodity Server    │
│   $5k  │ │  $3k   │ │  $8k   │    │ ┌────┐┌────┐┌────┐ │
└────────┘ └────────┘ └────────┘    │ │FW  ││VPN ││LB  │ │
                                    │ │ VM ││ VM ││ VM │ │
                                    │ └────┘└────┘└────┘ │
                                    └─────────────────────┘

Service Chaining:
Traffic → FW VM → IDS VM → LB VM → App Server
Defined in software, easily reordered/modified

Tools:
- DPDK (Data Plane Development Kit): Fast packet processing
- VPP (Vector Packet Processing): Cisco's open-source router
- OVS (Open vSwitch): Virtual switch
- SR-IOV: Direct hardware access from VMs
```

### eBPF for Networking

```c
// eBPF: Run sandboxed programs in kernel without kernel modules
// Use case: Custom packet filtering, load balancing, DDoS mitigation

// Cilium: Container networking with eBPF
// Replaces kube-proxy with eBPF for Kubernetes networking
// Per-endpoint identity, L7-aware security policies
// No iptables rules → massive scalability improvement

// Example: Drop all packets from a specific IP (XDP program)
// Attached to network driver, runs BEFORE kernel stack
// Can handle millions of packets per second per core

// Key eBPF networking projects:
// - Cilium: CNI for Kubernetes
// - Katran: Facebook's L4 load balancer
// - Cloudflare's DDoS protection (gatebot)
```

### IPv6 Deep Dive

```
IPv6 Address: 128 bits
2001:0db8:85a3:0000:0000:8a2e:0370:7334
→ 2001:db8:85a3::8a2e:370:7334  (compressed)

Types:
- Global Unicast (2000::/3): Public internet addresses
- Link-Local (fe80::/10): Auto-configured, never routed
- Unique Local (fc00::/7): Private (like 10.x.x.x)
- Multicast (ff00::/8): One-to-many

Benefits over IPv4:
- No NAT needed (finally)
- Stateless auto-configuration (SLAAC)
- Built-in IPsec (optional)
- Simplified header (40 bytes fixed, no checksum)
- No broadcast (multicast instead)
- Jumbograms (up to 4GB packets)
```

---

## Exercises

1. Install Mininet. Create a topology with 2 switches and 4 hosts. Run `pingall` to verify connectivity. Dump flow tables with `ovs-ofctl dump-flows s1`.
2. Write a Python script using netmiko (or mock it) to configure a VLAN and assign it to an interface on a network device.
3. Design a VPC architecture for a 3-tier web application (web, app, DB). Draw the subnets, security groups, route tables, and gateways.

## Quiz

1. What problem does SDN solve compared to traditional networking?
2. What is the OpenFlow protocol used for?
3. What's the difference between a Security Group and a NACL in AWS?
4. What is NFV and how does it differ from traditional appliance-based networking?
5. What advantages does IPv6 have over IPv4?

---

## Navigation

**Parent**: [[000_NETWORKING_MOC|NETWORKING]]

**Synapses**:
- [[003_Routing_And_Switching|NETWORKING 003]] — Routing fundamentals
- [[002_OSI_Model_Deep_Dive|NETWORKING 002]] — Layer model
- [[005_Networking_In_Linux|LINUX 005]] — Linux network internals
