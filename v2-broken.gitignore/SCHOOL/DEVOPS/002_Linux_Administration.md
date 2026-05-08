# 002_Linux_Administration

> Systemd, user management, permissions, cron, and log management.

## Level 1 — Intuition

### Concept

Linux administration is the craft of keeping systems running. Think of yourself as the caretaker of a living system: you manage who enters (users), what they can touch (permissions), what runs automatically (services), and how you know when something breaks (logs).

### The Admin's Dashboard

```
┌──────────────────────────────────────────┐
│              LINUX SYSTEM                 │
├────────────┬────────────┬────────────────┤
│   USERS    │  SERVICES  │   SCHEDULING   │
│  whoami    │  systemd   │   cron/timers  │
│  /etc/passwd│ systemctl  │   crontab -e   │
├────────────┴────────────┴────────────────┤
│              LOGGING                      │
│  /var/log/ → journalctl → grep | tail    │
└──────────────────────────────────────────┘
```

## Level 2 — Practical

### User Management

```bash
# Who am I?
whoami
id                          # uid, gid, groups

# List users
cat /etc/passwd             # all users
cat /etc/group              # all groups
w                           # who's logged in

# Create user
sudo useradd -m -s /bin/bash alice
sudo passwd alice

# Create group, add user
sudo groupadd developers
sudo usermod -aG developers alice

# Delete user
sudo userdel -r alice       # -r removes home dir too

# Switch user
su - alice                  # login shell
sudo -u alice whoami        # run one command
```

### Permissions Deep Dive

```bash
# View permissions
ls -l file.txt              # -rw-r--r-- 1 user group 0 Jan 1 file.txt

#       │  owner│group│other
#       │  rw-  │r--  │r--
#       │  6    │ 4   │ 4    = 644

# Permission numbers:
# r=4, w=2, x=1
# 7 = rwx, 6 = rw-, 5 = r-x, 4 = r--, 0 = ---

chmod 755 script.sh         # rwxr-xr-x (owner can do everything)
chmod 600 secret.key        # rw------- (only owner)
chmod 644 public.html       # rw-r--r-- (owner writes, world reads)

# Change ownership
chown alice:developers file.txt
chown -R alice:developers /project/
```

### Systemd — The Service Manager

```bash
# Service lifecycle
systemctl status nginx
systemctl start nginx
systemctl stop nginx
systemctl restart nginx
systemctl enable nginx       # start on boot
systemctl disable nginx      # don't start on boot

# List all services
systemctl list-units --type=service
systemctl list-units --type=service --state=failed

# Write a simple service unit
sudo tee /etc/systemd/system/myapp.service << 'EOF'
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
User=myapp
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/start.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now myapp
```

### Cron — Scheduled Tasks

```bash
# Format: min hour day month weekday command
# ┌─────────── minute (0-59)
# │ ┌───────── hour (0-23)
# │ │ ┌─────── day of month (1-31)
# │ │ │ ┌───── month (1-12)
# │ │ │ │ ┌─── weekday (0-6, 0=Sun)
# │ │ │ │ │
# * * * * * command

# Edit user crontab
crontab -e

# Examples:
0 2 * * * /usr/bin/backup.sh          # Daily at 2 AM
*/5 * * * * /usr/bin/healthcheck.sh   # Every 5 minutes
0 0 1 * * /usr/bin/monthly-report.sh  # First of month
@reboot /usr/bin/startup.sh           # At boot

# List crontab
crontab -l

# System-wide cron
ls /etc/cron.d/
ls /etc/cron.daily/
```

## Level 3 — Systems

### Log Management

```bash
# journald (systemd's logging)
journalctl                          # all logs
journalctl -u nginx                 # specific service
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx -f              # follow (like tail -f)
journalctl -p err                   # errors only
journalctl --since today            # today only
journalctl --disk-usage             # log size

# Traditional syslog
tail -f /var/log/syslog
tail -f /var/log/auth.log           # auth attempts
tail -f /var/log/nginx/access.log

# Log rotation: /etc/logrotate.conf and /etc/logrotate.d/
cat /etc/logrotate.d/nginx

# Search logs aggressively
grep "ERROR" /var/log/syslog
journalctl | grep -i "failed password"
```

### Process Monitoring

```bash
# Live process view
htop                                # interactive (install: apt install htop)
top                                 # built-in

# List processes
ps aux                              # all processes, user format
ps aux | grep nginx
pgrep nginx                         # find by name

# Resource usage
free -h                             # memory
df -h                               # disk space
du -sh /var/log/*                   # dir sizes
iostat                              # disk I/O (install sysstat)
sar -u 1 5                          # CPU usage over 5 seconds

# Kill processes
kill PID                            # graceful (SIGTERM)
kill -9 PID                         # force (SIGKILL)
killall nginx                       # kill by name
pkill -f "python app.py"            # kill by pattern
```

### Environment Variables and PATH

```bash
# Show all env vars
env
echo $PATH                          # where commands are found
echo $HOME
echo $USER

# Set temporarily
export MY_VAR="hello"
echo $MY_VAR

# Set permanently: add to ~/.bashrc or ~/.profile
echo 'export MY_VAR="hello"' >> ~/.bashrc
source ~/.bashrc
```

## Level 4 — Expert

### Security Hardening

```bash
# Check failed login attempts
sudo lastb | head -20
sudo grep "Failed password" /var/log/auth.log | wc -l

# Lock down SSH: /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no  (use keys only)
# Port 2222                   (non-standard port)

# Fail2ban — block brute force
sudo apt install fail2ban
sudo systemctl enable --now fail2ban

# List open ports
sudo ss -tlnp                    # listening TCP
sudo ss -ulnp                    # listening UDP

# Firewall basics (ufw)
sudo ufw enable
sudo ufw allow 22/tcp           # SSH
sudo ufw allow 80,443/tcp       # HTTP/HTTPS
sudo ufw status
```

### Audit and Compliance

```bash
# File integrity monitoring
sudo apt install aide
sudo aideinit
sudo aide --check

# Check for world-writable files
find / -type f -perm -o+w 2>/dev/null

# Find SUID binaries (potential privesc)
find / -perm -4000 -type f 2>/dev/null

# Check running services
systemctl list-units --type=service --state=running
```

---

## Exercises

1. Create a new user `bob`, add them to a group `webdevs`, set up a cron job that appends "hello" to `/tmp/bob.log` every minute, then clean it all up.
2. Write a systemd service unit for a Python script. Enable it, start it, check status, view logs with journalctl, then stop and disable it.
3. Simulate a security incident: check auth.log for failed SSH attempts, configure fail2ban, and verify it blocks after 3 failed attempts.

## Quiz

1. What does `chmod 750` mean in human-readable form?
2. How do you view logs for a specific systemd service from the last 30 minutes?
3. What's the cron syntax for a job that runs every Monday at 3 PM?
4. What's the difference between `kill PID` and `kill -9 PID`?
5. How do you make an environment variable permanent (survive shell restarts)?

---

## Navigation

**Parent**: [[000_DEVOPS_MOC|DEVOPS]]

**Synapses**:
- [[001_Filesystem|LINUX 001]] — Permissions model
- [[003_Process_Management|LINUX 003]] — Process deep dive
- [[004_Monitoring_And_Observability|DEVOPS 004]] — Log aggregation
