# 000_ARDUINO_MOC

> Arduino and embedded systems programming - from breadboard to firmware.

## Overview

ARDUINO covers microcontroller programming and embedded systems:

- [[001_Embedded_Fundamentals]] - Microcontroller architecture, GPIO, and registers
- [[002_Circuit_Basics]] - Breadboarding, resistors, LEDs, and Ohm's law
- [[003_Arduino_Toolchain]] - IDE setup, compilation, uploading sketches
- [[004_Digital_IO]] - Digital read/write, buttons, debouncing, sensors
- [[005_Analog_IO]] - ADC, PWM, analog sensors, signal conditioning
- [[006_Serial_Protocols]] - UART, I2C, SPI communication protocols
- [[007_Interrupts_Timers]] - Hardware interrupts, timer peripherals, ISRs
- [[008_Power_Management]] - Sleep modes, battery optimization, low-power design

## Prerequisites

| Requirement | Source |
|-------------|--------|
| Basic programming | [[000_CORE_MOC|CORE]] |
| CLI comfort | [[000_LINUX_MOC|LINUX]] (optional) |

## Learning Path

```
Level 1 — Intuition
    001_Embedded_Fundamentals
    002_Circuit_Basics
        ↓
    ⚑ MILESTONE: Blink an LED; read a button state

Level 2 — Practical
    003_Arduino_Toolchain
    004_Digital_IO
    005_Analog_IO
        ↓
    ⚑ MILESTONE: Build a sensor + actuator circuit with serial output

Level 3 — Systems
    006_Serial_Protocols
    007_Interrupts_Timers
        ↓
    ⚑ MILESTONE: I2C/SPI peripheral integration with interrupts

Level 4 — Expert
    008_Power_Management
        ↓
    ⚑ MILESTONE: Battery-powered sensor node with sleep/wake cycles
```

## Neural Links

- ARDUINO → [[000_CORE_MOC|CORE]] - Engineering mindset and debugging
- ARDUINO → [[000_PYTHON_MOC|PYTHON]] - Serial data processing scripts
- ARDUINO → [[000_LINUX_MOC|LINUX]] - Cross-compilation toolchains

## Progression

```
001_Embedded_Fundamentals
    ↓
002_Circuit_Basics
    ↓
003_Arduino_Toolchain
    ↓
004_Digital_IO
    ↓
005_Analog_IO
    ↓ ├─→ 006_Serial_Protocols
    │          ↓
    │       007_Interrupts_Timers
    │          ↓
    └────→ 008_Power_Management
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Embedded Fundamentals | 1 | None |
| 002 | Circuit Basics | 1 | None |
| 003 | Arduino Toolchain | 2 | 001, 002 |
| 004 | Digital I/O | 2 | 003 |
| 005 | Analog I/O | 2 | 003, 004 |
| 006 | Serial Protocols | 3 | 004, 005 |
| 007 | Interrupts & Timers | 3 | 006 |
| 008 | Power Management | 4 | 007 |

---

**Parent**: [[000_SCHOOL_MOC|SCHOOL]]
**Synapses**: CORE, PYTHON, LINUX, DOCKER
