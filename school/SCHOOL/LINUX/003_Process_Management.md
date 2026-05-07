# 003_Process_Management

> ps, top, signals, job control, daemons, and systemd units.

## Level 1 — Intuition

### Concept

Everything running on Linux is a process. Your shell, your editor, background services — all processes. Understanding them means knowing how they start, stop, talk to each other, and what to do when they misbehave.

### Process Lifecycle

```
┌─────────┐     fork()     ┌─────────┐     exec()     ┌──────────┐
│  Parent │ ───────────→   │  Child   │ ──────────→   │  New     │
│ Process │                │ (clone)  │               │ Program  │
└─────────┘                └─────────┘               └──────────┘
     │                          │
     │                    exit() │ → SIGCHLD to parent
     │                          │ → becomes ZOMBIE until parent wait()s
     │                          │ → if parent dies first, reparented to init (PID 1)
     │  wait()                  │
     └──────────────────────────┘
```

## Level 2 — Practical

### Process Inspection

```bash
# Quick view
ps aux                          # All processes, user format
ps aux | grep nginx             # Find a specific process
pidof nginx                     # Get PID by name
pgrep -f "python app.py"        # Search by command line

# Tree view
pstree -p                       # Process tree with PIDs
ps -eo pid,ppid,cmd --forest    # ASCII tree

# Detailed info
ps -p 1234 -o pid,ppid,user,%cpu,%mem,etime,cmd
cat /proc/1234/status           # Full process info
cat /proc/1234/cmdline | tr '\0' ' '  # Command line
ls -la /proc/1234/fd            # Open file descriptors

# Real-time monitoring
top                             # Interactive process viewer
  # Within top: P (sort by CPU), M (sort by memory), k (kill)
  #            1 (per-CPU view), c (full command), H (threads)
htop                            # Nicer, color, mouse support
atop                            # Advanced system/process monitor
```

### Signals

```bash
# Signal reference
# SIGTERM (15) — "Please stop" (graceful, can be caught)
# SIGKILL (9)  — "Die now" (forced, cannot be caught)
# SIGINT  (2)  — Ctrl+C (keyboard interrupt)
# SIGQUIT (3)  — Ctrl+\ (quit + core dump)
# SIGHUP  (1)  — Hangup (often used to reload config)
# SIGSTOP (19) — Pause (cannot be caught)
# SIGCONT (18) — Resume after SIGSTOP
# SIGUSR1/2    — User-defined signals

# Sending signals
kill 1234                       # Send SIGTERM (15) to PID 1234
kill -9 1234                    # SIGKILL (force)
kill -HUP 1234                  # SIGHUP (reload config)
kill -USR1 1234                 # Custom signal
killall nginx                   # Signal all processes named nginx
pkill -f "python.*server"       # Signal by command pattern

# Signal handling in scripts
trap 'echo "Caught SIGINT"; cleanup; exit' INT
trap 'echo "Reloading config"' HUP
```

### Job Control

```bash
# Foreground vs Background
sleep 100                        # Running in foreground (blocks terminal)
# Ctrl+Z to suspend

jobs                             # List background jobs
# [1]+ Stopped   sleep 100

bg %1                            # Resume job 1 in background
fg %1                            # Bring job 1 to foreground

# Start directly in background
sleep 100 &                      # Runs in background, prints [2] PID
# If you close terminal, background jobs get SIGHUP
nohup sleep 100 &                # immune to SIGHUP, output to nohup.out

# Disown: remove from shell's job table
disown %1                        # Won't get SIGHUP when shell exits

# Modern alternative: tmux/screen
tmux new -s mysession            # Start named session
tmux detach                      # Ctrl+B d — detach, keeps running
tmux attach -t mysession         # Reattach later
```

## Level 3 — Systems

### Daemons and systemd

```bash
# Daemon = background process that runs independently of any terminal
# Modern daemons are managed by systemd

# systemd unit types:
# .service  — A daemon or service
# .socket   — Socket activation
# .timer    — Scheduled tasks (cron replacement)
# .mount    — Filesystem mount points
# .target   — Group of units (runlevel replacement)

# Service management
systemctl status nginx
systemctl start|stop|restart|reload nginx
systemctl enable|disable nginx          # Start at boot
systemctl mask nginx                    # Prevent starting
systemctl list-units --type=service
systemctl list-units --state=failed
systemctl list-dependencies nginx

# Analyze boot
systemd-analyze                         # Boot time
systemd-analyze blame                   # What slowed boot?
systemd-analyze critical-chain          # Bottleneck chain
```

### Writing a systemd Service

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Custom Application
Documentation=https://example.com/docs
After=network.target postgresql.service
Requires=postgresql.service
Wants=redis.service                     # Start redis too, but don't fail if unavailable

[Service]
Type=simple                             # simple|forking|oneshot|notify|idle
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/python3 /opt/myapp/app.py
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID
Restart=on-failure                      # no|always|on-success|on-failure|on-abnormal
RestartSec=5
TimeoutStopSec=30
Environment="DATABASE_URL=postgresql://localhost/mydb"
EnvironmentFile=-/etc/myapp/env         # '-' means ignore if missing
LimitNOFILE=65536                       # Max open files
PrivateTmp=true                         # Private /tmp namespace
ProtectSystem=full                      # Read-only access to /usr, /etc
NoNewPrivileges=true                    # No privilege escalation

[Install]
WantedBy=multi-user.target              # Start in multi-user runlevel
```

```bash
# After creating service file:
sudo systemctl daemon-reload
sudo systemctl enable --now myapp
sudo systemctl status myapp

# Check logs
journalctl -u myapp -f
journalctl -u myapp --since "10 minutes ago"
```

### systemd Timers (Cron Replacement)

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=daily                        # or: Mon..Fri 02:00
Persistent=true                         # Run missed jobs after boot
RandomizedDelaySec=600                  # Spread load (±10 min)

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Run backup script

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
User=backup
```

```bash
sudo systemctl enable --now backup.timer
systemctl list-timers
systemctl status backup.timer
```

## Level 4 — Expert

### cgroups (Control Groups)

```bash
# cgroups v2: limit resources for groups of processes
# Foundation of containers (Docker, Podman), systemd uses them

# View current cgroups
ls /sys/fs/cgroup/
systemd-cgls                         # Tree view

# systemd resource control via drop-in:
sudo systemctl set-property nginx MemoryMax=512M
sudo systemctl set-property nginx CPUQuota=200%  # 2 CPU cores max

# Drop-in file method:
sudo mkdir -p /etc/systemd/system/nginx.service.d/
sudo tee /etc/systemd/system/nginx.service.d/limits.conf << 'EOF'
[Service]
MemoryMax=512M
MemoryHigh=400M           # Throttle before hitting max
CPUQuota=200%
TasksMax=100
EOF
sudo systemctl daemon-reload
sudo systemctl restart nginx

# Manual cgroup creation
sudo cgcreate -g cpu,memory:/mygroup
sudo cgset -r memory.max=256M /mygroup
sudo cgset -r cpu.max="50000 100000"  # 50% of one CPU
cgexec -g cpu,memory:/mygroup my_program
```

### Process Tracing

```bash
# strace: trace system calls
strace ls                          # Every syscall ls makes
strace -c ls                       # Summary counts
strace -p 1234                     # Attach to running process
strace -e open,read,write ls       # Filter specific calls
strace -f -p 1234                  # Follow child processes

# Example: What files does vim open?
strace -e openat vim test.txt 2>&1 | grep -v ENOENT

# ltrace: trace library calls
ltrace ls                          # See what libc functions are called

# perf: performance profiling
perf record -g -p 1234 -- sleep 10 # Sample for 10 seconds
perf report                         # Interactive flame graph
perf top                           # Like top, but for functions
perf stat -p 1234                  # Hardware counters

# bpftrace: dynamic tracing (eBPF)
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat
                   { printf("%s %s\n", comm, str(args->filename)); }'
```

### Process Limits and Security

```bash
# View limits
ulimit -a                          # Current user limits
cat /proc/1234/limits              # Limits for specific process

# Set limits for a service (in systemd unit):
# LimitNOFILE=65536
# LimitNPROC=4096
# LimitCORE=infinity
# LimitMEMLOCK=65536

# /etc/security/limits.conf — system-wide
# *    soft    nofile    65536
# *    hard    nofile    65536

# Nice and priority
nice -n 10 python heavy_task.py    # Lower priority (+19 = lowest, -20 = highest)
renice -n 5 -p 1234                # Change priority of running process

# I/O priority (ionice)
ionice -c 2 -n 7 dd if=/dev/zero of=test bs=1M count=1000
# -c 1=realtime, 2=best-effort, 3=idle
# -n 0-7 (0=highest for class 1/2)
```

---

## Exercises

1. Write a systemd service file for a Python/Node.js app you have. Include resource limits (MemoryMax, CPUQuota) and a PrivateTmp directive.
2. Write a systemd timer that runs a backup script every Sunday at 2 AM. Test it by setting the calendar to a near-future time.
3. Use `strace` on a command you run daily (like `ls` or `curl`). Identify 5 different syscalls it makes and explain what each does.

## Quiz

1. What happens when a parent process dies before its child?
2. What's the difference between SIGTERM and SIGKILL?
3. What is a zombie process and how is it reaped?
4. What does `systemctl mask` do vs `systemctl disable`?
5. How do cgroups enable containerization?

---

## Navigation

**Parent**: [[000_LINUX_MOC|LINUX]]

**Synapses**:
- [[002_Shell_Scripting|LINUX 002]] — Signal handling in scripts
- [[002_Linux_Administration|DEVOPS 002]] — systemd service management
- [[005_Operating_Systems|CORE 005]] — Process and thread theory
