# 006_Building_LFS

> Linux From Scratch concepts, boot process, and init systems.

## Level 1 — Intuition

### Concept

Linux From Scratch (LFS) is a project that teaches you how to build a Linux system from source code. You compile the toolchain, kernel, coreutils, and init system yourself. The goal is understanding, not daily use — but the knowledge gained explains everything else.

### What Makes a Linux System

```
A minimal Linux system needs:
┌──────────────────────────────────────────────┐
│ 1. Kernel          → Talks to hardware       │
│ 2. Init            → First process (PID 1)   │
│ 3. Shell           → Command interpreter     │
│ 4. Core utilities  → ls, cp, mv, cat, etc.   │
│ 5. C library       → glibc or musl          │
│ 6. Toolchain       → gcc, binutils, make     │
└──────────────────────────────────────────────┘
With these six, you have a bootable, usable system.
```

## Level 2 — Practical

### The Boot Process

```
Power On
    │
    ▼
┌─────────────┐
│ BIOS / UEFI │  Firmware initializes hardware
│ (POST)      │  Finds bootable device
└──────┬──────┘
       ▼
┌─────────────┐
│ Bootloader  │  GRUB2 / systemd-boot
│             │  Loads kernel + initramfs into memory
└──────┬──────┘
       ▼
┌─────────────┐
│ Linux Kernel│  Initializes hardware, mounts root filesystem
│             │  Starts init (PID 1)
└──────┬──────┘
       ▼
┌─────────────┐
│ Init System │  systemd / OpenRC / runit / s6
│  (PID 1)    │  Starts services, manages system state
└──────┬──────┘
       ▼
┌─────────────┐
│   Login     │  getty → login → shell
│   Prompt    │
└─────────────┘
```

### GRUB and Boot Configuration

```bash
# GRUB configuration
cat /boot/grub/grub.cfg              # Auto-generated
sudo cat /etc/default/grub           # User configuration

# /etc/default/grub example:
GRUB_DEFAULT=0                       # Default boot entry
GRUB_TIMEOUT=5                       # Seconds before auto-boot
GRUB_CMDLINE_LINUX="quiet splash"    # Kernel parameters
GRUB_CMDLINE_LINUX_DEFAULT="ipv6.disable=1"  # Extra params

# After editing, regenerate:
sudo grub-mkconfig -o /boot/grub/grub.cfg

# Alternative: systemd-boot (simpler, UEFI only)
ls /boot/loader/entries/             # Boot entries
cat /boot/loader/loader.conf         # Bootloader config
bootctl status                       # Show status
bootctl update                       # Update after changes
```

### Building a Minimal System (Conceptual)

```bash
# LFS is typically built in a chroot from a host system
# Here's the conceptual workflow (NOT run as-is):

# 1. Partition and mount
# mkfs.ext4 /dev/sdb1
# mount /dev/sdb1 /mnt/lfs
# mkdir -p /mnt/lfs/{boot,etc,home,usr,var,tmp,tools}

# 2. Build cross-toolchain (binutils, gcc, linux-headers, glibc)
#   - First pass: build tools that run on host but target LFS
#   - Second pass: rebuild tools inside chroot for LFS

# 3. Enter chroot and build base system
# chroot /mnt/lfs /tools/bin/bash
# Build: glibc, gcc, binutils, coreutils, bash, util-linux, etc.

# 4. Build kernel
# make menuconfig
# make -j$(nproc)
# make modules_install
# cp arch/x86/boot/bzImage /boot/vmlinuz-6.x-lfs

# 5. Install bootloader
# grub-install /dev/sdb
# grub-mkconfig -o /boot/grub/grub.cfg

# 6. Configure system
# /etc/fstab, /etc/hostname, /etc/hosts, /etc/resolv.conf
# /etc/inittab (sysvinit) or systemd units
```

### Cross-Compilation Basics

```bash
# Cross-compilation: build on one architecture for another
# Common in LFS, embedded (ARM/RISC-V), and custom distros

# Target triplet: ARCH-VENDOR-OS-LIBC
# x86_64-linux-gnu       (native 64-bit Linux)
# aarch64-linux-musl     (ARM64 with musl libc)
# riscv64-unknown-elf    (RISC-V bare metal)

# Configure GCC as cross-compiler
# export TARGET=x86_64-lfs-linux-gnu
# ../configure --target=$TARGET --prefix=/tools \
#     --with-sysroot=/mnt/lfs --disable-nls --disable-multilib

# Make: compile for target
# make -j$(nproc)
# make install

# Set up environment for cross-compiling
# export CC="$TARGET-gcc"
# export CXX="$TARGET-g++"
# export AR="$TARGET-ar"
# export RANLIB="$TARGET-ranlib"
```

## Level 3 — Systems

### Init Systems Comparison

```
┌───────────────┬──────────────┬───────────────┬──────────────┐
│               │ systemd       │ OpenRC        │ runit / s6   │
├───────────────┼──────────────┼───────────────┼──────────────┤
│ Philosophy    │ Monolithic    │ Modular       │ Minimalist   │
│ Config        │ Unit files    │ Shell scripts │ Shell scripts│
│ Dependencies  │ Built-in      │ rc_need       │ Run scripts  │
│ Parallel boot │ Yes           │ Yes           │ Sequential   │
│ cgroups       │ Native        │ Via scripts   │ Via scripts  │
│ Logging       │ journald      │ syslog        │ stdout/err   │
│ Socket activ. │ Yes           │ No            │ No           │
│ Size/Dept     │ Complex       │ Moderate      │ Tiny         │
│ Used by       │ Most distros  │ Gentoo, Alpine│ Void, Artix  │
└───────────────┴──────────────┴───────────────┴──────────────┘
```

### Alternative Init: runit

```bash
# runit: Minimal init, three stages, shell scripts + symlinks
# Used by Void Linux, some Artix spins

# Service structure:
# /etc/sv/<service>/run    — executable that starts the daemon

# Example: /etc/sv/nginx/run
cat << 'EOF' | sudo tee /etc/sv/nginx/run
#!/bin/sh
exec nginx -g 'daemon off;' 2>&1
EOF
sudo chmod +x /etc/sv/nginx/run

# Optional: /etc/sv/nginx/finish  — runs when service stops
cat << 'EOF' | sudo tee /etc/sv/nginx/finish
#!/bin/sh
echo "nginx stopped at $(date)"
EOF

# Optional: /etc/sv/nginx/log/run  — service-specific logger
cat << 'EOF' | sudo tee /etc/sv/nginx/log/run
#!/bin/sh
exec svlogd -tt /var/log/nginx
EOF

# Enable service: create symlink in /var/service
sudo ln -s /etc/sv/nginx /var/service/

# Management:
sudo sv status nginx                 # Service status
sudo sv up nginx                     # Start
sudo sv down nginx                   # Stop
sudo sv restart nginx                # Restart
sudo sv status /var/service/*        # All services
```

### Building with Buildroot/Yocto

```
Buildroot: Build embedded Linux systems
- Menuconfig interface (like kernel)
- Builds: toolchain → rootfs → kernel → bootloader
- Output: complete bootable image (SD card, flash)
- Use case: Raspberry Pi, router firmware, IoT devices

Yocto/OpenEmbedded:
- Industrial-grade build system for embedded Linux
- Layer-based: poky (core) + meta-* layers (hw, sw)
- Recipes: .bb files → packages
- Images: define what packages go in
- Use case: Automotive, medical devices, set-top boxes

Key difference from LFS:
LFS = learning exercise, manual
Buildroot/Yocto = production systems, automated, reproducible
```

## Level 4 — Expert

### Building a Custom Distro

```
Minimal custom distro recipe:
1. Choose libc: glibc (compatible) or musl (small, static)
2. Choose package manager: none (static), apk (Alpine), pacman (Arch), xbps (Void)
3. Choose init: systemd (feature-rich) or runit/s6 (minimal)
4. Build base: kernel + busybox OR kernel + coreutils + util-linux
5. Package: write build scripts, set up repository
6. Installer: shell script, calamares, or manual

Tools:
- busybox: Swiss army knife (300+ commands in one binary)
- toybox: Android's busybox alternative (BSD license)
- musl-cross-make: Cross compiler targeting musl
- apk-tools: Alpine's package manager (standalone, static binary)
- kiss: Minimal package manager (POSIX shell)
```

### Kernel Configuration Deep Dive

```bash
# Kernel config: choose what goes IN the kernel vs as modules

# make menuconfig — interactive TUI
# make config    — line-by-line prompts
# make oldconfig — update old .config to new kernel version
# make defconfig — default for architecture

# Key categories:
# General setup:
#   CONFIG_LOCALVERSION="-custom"     # Name your kernel
#   CONFIG_CGROUPS=y                  # Container support
#   CONFIG_NAMESPACES=y               # Container isolation
#
# Processor type:
#   CONFIG_SMP=y                      # Multi-core
#   CONFIG_PREEMPT=y                  # Low-latency desktop
#
# Networking:
#   CONFIG_NETFILTER=y                # Firewall
#   CONFIG_BPF=y                      # eBPF
#   CONFIG_BRIDGE=y                   # Docker networking
#
# File systems:
#   CONFIG_EXT4_FS=y                  # ext4 support
#   CONFIG_BTRFS_FS=m                 # btrfs as module
#   CONFIG_OVERLAY_FS=y               # Docker storage driver

# Build time: ~5-20 min on modern CPU (with -j$(nproc))
# Resulting binary: ~10-15 MB compressed (vmlinuz)
# Modules: ~150 MB in /lib/modules/
```

---

## Exercises

1. Create a simple runit service for a Python HTTP server. Test starting, stopping, and checking status.
2. Examine your system's boot process: run `dmesg | head -50` to see early kernel messages. Run `systemd-analyze plot > boot.svg` and inspect the visualization.
3. Compile a custom kernel from your distro's source package. Change the local version string (`CONFIG_LOCALVERSION`). Boot into it (or just complete the build).

## Quiz

1. What is PID 1 and why is it special?
2. Name the six essential components of a minimal Linux system.
3. What's the difference between a bootloader and an init system?
4. Why would someone use musl instead of glibc?
5. What is busybox and why is it popular in embedded systems?

---

## Navigation

**Parent**: [[000_LINUX_MOC|LINUX]]

**Synapses**:
- [[004_Kernel_Internals|LINUX 004]] — Kernel architecture
- [[003_Process_Management|LINUX 003]] — Init and services
- [[001_Filesystem|LINUX 001]] — Filesystem setup
