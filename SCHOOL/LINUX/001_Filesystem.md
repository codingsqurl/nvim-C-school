# 001_Filesystem

> Linux filesystem hierarchy - understanding the single root tree.

## Level 1 — Intuition

### Concept

Linux has ONE single directory tree starting at `/` (root). Every file and directory traces back to this origin.

### The Tree Visualized

```
/
├── bin        (essential commands)
├── boot      (boot files)
├── dev       (device files)
├── etc       (configuration)
├── home      (user directories)
├── lib       (libraries)
├── media    (removable media)
├── mnt       (temporary mounts)
├── opt       (optional software)
├── proc      (system info)
├── root      (root user home)
├── sbin      (system binaries)
├── srv       (service data)
├── sys       (system files)
├── tmp       (temporary files)
├── usr       (user programs)
└── var       (variable data)
```

### Key Directories to Know

| Directory | Purpose | Example |
|----------|---------|---------|
| /home/user | Your files | ~/Documents |
| /etc | Config files | /etc/nginx |
| /var/log | Log files | /var/log/syslog |
| /tmp | Temporary files | /tmp/backup |
| /usr/bin | User programs | /usr/bin/python |

### Memory Trick

**FABLES**: Boot, Etc, Home, Log, Media, Mnt, Opt, Proc, Root, Sbin, Sys, Tmp, Usr, Var

## Level 2 — Practical

### Navigation Commands

```bash
# Where am I?
pwd

# List files
ls -la

# Change directory
cd /etc

# Go home
cd ~
cd

# Go up one level
cd ..

# Go up two levels
cd ../..
```

### File Operations

```bash
# Create file
touch filename

# Create directory
mkdir dirname

# Copy file
cp source destination

# Move/rename
mv source destination

# Remove file
rm filename

# Remove directory
rm -r dirname
```

## Level 3 — Systems

### Permissions Model

```
Each file has three permission sets:
┌─────────┬─────────┬─────────┐
│  Owner  │  Group  │  Other  │
├─────────┼─────────┼─────────┤
│  rwx    │  r-x    │  r-x    │
└─────────┴─────────┴─────────┘
         │         │
         │         └── Read (4) + Execute (1) = 5
         └── Read (4) + Write (2) + Execute (1) = 7

chmod 755 file  # rwxr-xr-x
chmod +x file  # Add execute
chmod 644 file  # rw-r--r--
```

### Special Permissions

| Permission | Effect | Example |
|------------|--------|---------|
| SUID | Run as owner | -rw**s**r-xr-x |
| SGID | Run as group | -rw-r-sr-x |
| Sticky | Delete protected | -rw-r--r-t |

## Level 4 — Expert

### Filesystem Types

| Filesystem | Use Case |
|------------|----------|
| ext4 | Default Linux |
| xfs | High performance, large files |
| btrfs | Snapshot support |
| tmpfs | RAM-based, fast |
| nfs | Network filesystems |

### Virtual Filesystems

```
/proc - Process information (ls /proc → PIDs)
/sys  - Kernel objects (ls /sys → devices)
/dev  - Device files (ls /dev → sda, tty, null)
```

---

## Navigation

**Parent**: [[000_LINUX_MOC|LINUX]]

**Synapses**:
- [[001_Shell_Basics|LINUX 002]] - Commands in shell
- [[001_Mental_Models|CORE 001]] - Filesystem model
- [[001_Containers|DEVOPS 001]] - Docker filesystem