# 004_Kernel_Internals

> Kernel architecture, modules, syscalls, /proc, and /sys.

## Level 1 — Intuition

### Concept

The kernel is the core of the operating system. It sits between hardware and userspace, enforcing security, managing resources, and providing a stable API (system calls). Your programs never touch hardware directly — they ask the kernel.

### Kernel Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    USERSPACE                              │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐                 │
│  │   bash   │  │  nginx  │  │  Python  │                │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │ syscalls    │             │                      │
├───────┼─────────────┼─────────────┼──────────────────────┤
│       ▼             ▼             ▼                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │              LINUX KERNEL                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │    │
│  │  │ Process  │ │ Memory   │ │ Filesystem       │ │    │
│  │  │ Manager  │ │ Manager  │ │ (VFS)            │ │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │    │
│  │  │ Network  │ │ Device   │ │ Security (LSM)   │ │    │
│  │  │ Stack    │ │ Drivers  │ │                  │ │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Level 2 — Practical

### Kernel Version and Configuration

```bash
# Kernel info
uname -a                 # Full system info
uname -r                 # Kernel release: 6.8.0-45-generic
cat /proc/version        # Kernel build info

# Boot config (if enabled)
cat /boot/config-$(uname -r) | grep CONFIG_BPF=y
# Or:
zcat /proc/config.gz | grep CONFIG

# Kernel command line (boot parameters)
cat /proc/cmdline

# Loaded modules
lsmod                    # List all loaded modules
modinfo ext4             # Info about a module
sudo modprobe vfio-pci   # Load a module
sudo modprobe -r vfio-pci # Remove a module
sudo rmmod module_name   # Force remove (dangerous!)
```

### Kernel Modules

```c
// Simplest kernel module
// hello.c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("You");
MODULE_DESCRIPTION("Hello World Module");

static int __init hello_init(void) {
    printk(KERN_INFO "Hello, kernel!\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye, kernel!\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

```makefile
# Makefile for kernel module
obj-m += hello.o

all:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
```

```bash
# Build and test
make
sudo insmod hello.ko        # Insert module
sudo dmesg | tail           # See: "Hello, kernel!"
sudo rmmod hello            # Remove module
sudo dmesg | tail           # See: "Goodbye, kernel!"
```

### procfs and sysfs

```bash
# /proc — Virtual filesystem for process and kernel info

# Process-specific:
ls /proc/$$                  # Info for current shell's PID
cat /proc/$$/status          # Memory, threads, signals
cat /proc/$$/maps            # Memory mappings
cat /proc/$$/limits          # Resource limits
ls -l /proc/$$/fd            # Open file descriptors

# System-wide:
cat /proc/cpuinfo            # CPU details
cat /proc/meminfo            # Memory statistics
cat /proc/mounts             # All mounted filesystems
cat /proc/uptime             # Seconds since boot
cat /proc/loadavg            # Load average (1, 5, 15 min)
cat /proc/filesystems        # Supported filesystem types

# /sys — Kernel objects (devices, buses, drivers)
ls /sys/class/net/           # Network interfaces
cat /sys/class/net/eth0/address  # MAC address
ls /sys/block/               # Block devices
cat /sys/block/sda/size      # Disk size in 512-byte sectors
ls /sys/kernel/              # Kernel parameters
```

## Level 3 — Systems

### System Calls

```c
// System call: the interface between userspace and kernel
// glibc wraps raw syscalls in friendly C functions
// write(fd, buf, count) → syscall(SYS_write, fd, buf, count)

#include <unistd.h>
#include <sys/syscall.h>

int main() {
    // Using glibc wrapper
    write(1, "Hello via libc\n", 15);

    // Direct syscall (no wrapper)
    syscall(SYS_write, 1, "Hello via syscall\n", 18);
    return 0;
}
```

```bash
# List syscalls available
man syscalls

# Trace syscalls (strace)
strace ls                    # All syscalls
strace -e trace=file ls      # File-related syscalls
strace -c ls                 # Summary with counts and times

# Common syscall families:
# File:      open, read, write, close, lseek, stat, mmap
# Process:   fork, execve, exit, wait4, clone
# Network:   socket, bind, listen, accept, connect, sendto, recvfrom
# Memory:    brk, mmap, mprotect, madvise
# IPC:       pipe, shmget, semop, msgget
```

### Kernel Synchronization

```c
// Kernel concurrency primitives (kernel space only)

// 1. Spinlock: busy-waits, for SHORT critical sections
spinlock_t lock;
spin_lock(&lock);
// Critical section (cannot sleep while holding spinlock!)
spin_unlock(&lock);

// 2. Mutex: can sleep, for longer critical sections
struct mutex my_mutex;
mutex_lock(&my_mutex);
// Critical section (OK to sleep)
mutex_unlock(&my_mutex);

// 3. RCU (Read-Copy-Update): Optimized for read-heavy data
// Readers: lock-free! Just read.
rcu_read_lock();
value = shared_ptr->data;  // Safe read
rcu_read_unlock();
// Writer: copy, modify, then swap pointer
new = kmalloc(...);
*new = *old;
new->data = 42;
rcu_assign_pointer(shared_ptr, new);
synchronize_rcu();          // Wait for all readers to finish
kfree(old);

// 4. Atomic operations: lock-free counters
atomic_t counter;
atomic_inc(&counter);
atomic_dec(&counter);
int val = atomic_read(&counter);
```

### The Virtual Filesystem (VFS)

```
VFS Layer: Uniform interface for all filesystems
┌────────────────────────────────────────────────────┐
│              USERSPACE                              │
│   open() / read() / write() / close()             │
├────────────────────────────────────────────────────┤
│                  VFS                                │
│  Common file model (inode, dentry, file, superblock)│
├──────────┬──────────┬──────────┬───────────────────┤
│   ext4   │   xfs    │   btrfs  │   tmpfs / proc    │
│  driver   │  driver  │  driver  │   driver          │
└──────────┴──────────┴──────────┴───────────────────┘

Key VFS objects:
- super_block: One per mounted filesystem
- inode: One per file (metadata + data pointers)
- dentry: Directory entry (maps name → inode)
- file: Open file (position, flags, credentials)
```

## Level 4 — Expert

### eBPF (Extended Berkeley Packet Filter)

```c
// eBPF: Run sandboxed programs in kernel without rebuilding
// Write in C → compile to BPF bytecode → verified → JIT to native

// Example: Count syscall invocations (bpftrace script)
// $ sudo bpftrace -e 'tracepoint:raw_syscalls:sys_enter
//     { @[comm] = count(); }'

// eBPF program types:
// - kprobe/kretprobe: Hook any kernel function
// - tracepoint: Static kernel tracepoints
// - XDP: Early packet processing (before kernel stack)
// - cgroup/skb: Socket and cgroup operations
// - USDT: Userspace static probes

// Linux kernel provides bpf() syscall + libbpf for loading programs
// Key tools built on eBPF:
// - bpftrace: Dynamic tracing (like DTrace)
// - Cilium: Container networking
// - Falco: Security monitoring
// - Parca: Continuous profiling
```

### Kernel Debugging

```bash
# Kernel logs (dmesg / journalctl)
dmesg -w                          # Follow kernel messages
dmesg -l err                      # Errors only
journalctl -k                     # Kernel messages from journald

# Dynamic debugging
sudo mount -t debugfs none /sys/kernel/debug
echo 'file driver.c +p' | sudo tee /sys/kernel/debug/dynamic_debug/control

# KGDB: Kernel debugger (requires second machine via serial)
# KDB: Built-in kernel debugger (simpler)
echo t > /proc/sysrq-trigger     # Show stack traces of all tasks

# Kernel crash dump (kdump)
# Configure kdump to capture vmcore on panic
# Analyze with crash tool:
crash /usr/lib/debug/vmlinux /var/crash/vmcore

# ftrace: Function tracer
sudo mount -t tracefs none /sys/kernel/tracing
echo function > /sys/kernel/tracing/current_tracer
echo schedule > /sys/kernel/tracing/set_ftrace_filter
cat /sys/kernel/tracing/trace
```

### Namespaces and cgroups (Container Foundations)

```
Linux namespaces = what a process can SEE
┌───────────────┬──────────────────────────────┐
│ Namespace     │ Isolates                     │
├───────────────┼──────────────────────────────┤
│ PID           │ Process IDs                  │
│ Network       │ Network interfaces, routes   │
│ Mount         │ Filesystem mount points      │
│ UTS           │ Hostname, domain name        │
│ IPC           │ SysV IPC, POSIX msg queues   │
│ User          │ UID/GID mapping              │
│ Cgroup        │ Cgroup hierarchy view        │
│ Time          │ System clock (boot/monotonic)│
└───────────────┴──────────────────────────────┘

cgroups = how much a process can USE
(Memory, CPU, I/O, PIDs limits)

Together: namespaces + cgroups = containers
Docker, Podman, LXC all build on these kernel features
```

---

## Exercises

1. Write a "hello world" kernel module. Build it, insert it, verify with `dmesg`, and remove it.
2. Explore `/proc` and `/sys`: find your CPU model, total memory, MAC address of your primary interface, and list all mounted filesystems.
3. Use `strace` on a simple program and identify the write(), open(), and close() syscalls. Count how many total syscalls it makes.

## Quiz

1. What is the difference between procfs and sysfs?
2. What happens during a system call (context switch)?
3. What is eBPF and how is it different from kernel modules?
4. What Linux features make containers possible?
5. What is the VFS and why is it important?

---

## Navigation

**Parent**: [[000_LINUX_MOC|LINUX]]

**Synapses**:
- [[003_Process_Management|LINUX 003]] — Process management
- [[005_Operating_Systems|CORE 005]] — OS internals theory
- [[005_Networking_In_Linux|LINUX 005]] — Network stack internals
