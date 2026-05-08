# 004_Computer_Architecture

> CPU design, memory hierarchy, cache, pipelining, and assembly language introduction.

## Level 1 — Intuition

### Concept

Your computer is not magic. It's a carefully orchestrated dance of electrons through transistors, organized into layers of abstraction. Understanding these layers helps you write faster, more efficient code.

### The Von Neumann Architecture

```
┌───────────────────────────────────────────────────┐
│                    CPU                             │
│  ┌─────────────┐     ┌──────────────────┐        │
│  │   Control   │ ←→  │       ALU        │        │
│  │    Unit     │     │ (Arithmetic Logic │        │
│  │             │     │       Unit)       │        │
│  └──────┬──────┘     └────────┬─────────┘        │
│         │                     │                   │
│  ┌──────┴─────────────────────┴──────────┐       │
│  │           REGISTERS                    │       │
│  │  PC | SP | AX | BX | CX | DX | ...    │       │
│  └───────────────────────────────────────┘       │
└──────────────────────┬────────────────────────────┘
                       │  BUS (address + data)
         ┌─────────────┼─────────────┐
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │  RAM    │   │   I/O   │   │  Disk   │
    │(volatile)│   │(keyboard│   │(persist)│
    │         │   │ screen) │   │         │
    └─────────┘   └─────────┘   └─────────┘
```

## Level 2 — Practical

### The Memory Hierarchy

```
Speed ↑ │ Size ↓ │ Cost ↑
────────────────────────────────────────────
Registers    │  ~100 bytes     │ 0 cycles    │ Inside CPU
L1 Cache     │  ~64 KB         │ 1-4 cycles  │ Per core
L2 Cache     │  ~512 KB        │ 10-20 cycles│ Per core
L3 Cache     │  ~8-32 MB       │ 40-70 cycles│ Shared
RAM          │  ~8-64 GB       │ 100-300 cyl │ Main memory
SSD          │  ~256 GB-2 TB   │ 10-100 μs   │ Storage
HDD          │  ~1-16 TB       │ 5-10 ms     │ Storage
────────────────────────────────────────────
Memory access is the #1 bottleneck.
L1 hit:  1ns  |  RAM miss: 100ns  |  Disk: 10,000,000ns
```

### Cache Locality

```c
#include <stdio.h>
#include <time.h>

#define SIZE 4096

// BAD: strides through memory (cache-unfriendly)
// Each access may miss cache — SLOW
void bad_access(int matrix[SIZE][SIZE]) {
    for (int col = 0; col < SIZE; col++)
        for (int row = 0; row < SIZE; row++)
            matrix[row][col] *= 2;   // Jumps by SIZE each time
}

// GOOD: sequential access (cache-friendly)
// CPU prefetcher works, cache lines reused — FAST
void good_access(int matrix[SIZE][SIZE]) {
    for (int row = 0; row < SIZE; row++)
        for (int col = 0; col < SIZE; col++)
            matrix[row][col] *= 2;   // Adjacent in memory
}

// Typical benchmark: good_access is 5-10x faster on large arrays
```

### Struct Layout Matters

```c
// BAD: Padding gaps waste cache space (24 bytes on 64-bit)
struct Bad {
    char  a;     // 1 byte + 7 bytes padding
    double b;    // 8 bytes
    char  c;     // 1 byte + 7 bytes padding
};  // sizeof = 24

// GOOD: Packed tightly (16 bytes on 64-bit)
struct Good {
    double b;    // 8 bytes
    char  a;     // 1 byte
    char  c;     // 1 byte
    // + 6 bytes padding
};  // sizeof = 16
```

## Level 3 — Systems

### Pipelining

```
Without Pipeline (1 instruction at a time):
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Fetch   ││Decode  ││Execute ││Memory  ││Write   │ → Result
│        ││        ││        ││        ││Back    │
└────────┘└────────┘└────────┘└────────┘└────────┘
  Instr 1   Instr 1   Instr 1   Instr 1   Instr 1
                                    (5 cycles per instruction)

With Pipeline (overlapping execution):
Cycle:   1        2        3        4        5        6        7
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│F │I1 ││D │I1 ││E │I1 ││M │I1 ││W │I1 ││       ││       │
├──────┤├──────┤├──────┤├──────┤├──────┤├──────┤├──────┤
│       ││F │I2 ││D │I2 ││E │I2 ││M │I2 ││W │I2 ││       │
├──────┤├──────┤├──────┤├──────┤├──────┤├──────┤├──────┤
│       ││       ││F │I3 ││D │I3 ││E │I3 ││M │I3 ││W │I3 │
├──────┤├──────┤├──────┤├──────┤├──────┤├──────┤├──────┤
│       ││       ││       ││F │I4 ││D │I4 ││E │I4 ││M │I4 │
└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
→ Throughput: ~1 instruction per cycle (5x faster!)
```

### Branch Prediction

```c
// Sorted vs unsorted: branch predictor matters
// When array is sorted, branch is predictable → FAST
// When array is random, branch is unpredictable → SLOW (pipeline flush)

// SORTED data:    if (data[i] > 128) →  F F F F F ... T T T T T
// Unsorted data:  if (data[i] > 128) →  F T F T T F T F T F ...

int sum = 0;
for (int i = 0; i < N; i++)
    if (data[i] > 128)
        sum += data[i];
// Sorted: ~2x faster due to correct branch predictions
```

### x86-64 Assembly Introduction

```asm
; AT&T syntax (GCC/GAS)
; A simple C function and its assembly

; C code:
; int add(int a, int b) { return a + b; }

; Assembly (x86-64):
add:
    pushq   %rbp              ; Save old base pointer
    movq    %rsp, %rbp        ; Set up stack frame
    movl    %edi, -4(%rbp)    ; Store first arg (a)
    movl    %esi, -8(%rbp)    ; Store second arg (b)
    movl    -4(%rbp), %edx    ; Load a into edx
    movl    -8(%rbp), %eax    ; Load b into eax
    addl    %edx, %eax        ; eax = a + b
    popq    %rbp              ; Restore old base pointer
    ret                       ; Return (result in eax)

; Key registers:
; rax, rbx, rcx, rdx  — General purpose
; rdi, rsi, rdx, rcx  — Function arguments (1st-4th)
; rax                  — Return value
; rsp                  — Stack pointer
; rbp                  — Base pointer
; rip                  — Instruction pointer
```

## Level 4 — Expert

### Out-of-Order Execution

```
Modern CPUs don't execute instructions in program order.
They:
1. Decode many instructions at once
2. Find independent instructions → execute in parallel
3. Reorder results to maintain program semantics

Code that looks sequential:
a = load(x)     ← Cache miss! (200 cycles)
b = a + 1       ← Depends on 'a', must wait
c = load(y)     ← Independent! CPU executes this DURING the wait
d = c * 2       ← Independent! Also executes during wait

This is why you can't predict performance by counting instructions.
```

### SIMD (Single Instruction, Multiple Data)

```c
#include <immintrin.h>  // SSE/AVX intrinsics

// Scalar: process one float at a time
void add_arrays_scalar(float *a, float *b, float *c, int n) {
    for (int i = 0; i < n; i++)
        c[i] = a[i] + b[i];
}

// SIMD: process 8 floats at a time (AVX)
void add_arrays_avx(float *a, float *b, float *c, int n) {
    int i;
    for (i = 0; i <= n - 8; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);  // Load 8 floats
        __m256 vb = _mm256_loadu_ps(&b[i]);
        __m256 vc = _mm256_add_ps(va, vb);   // Add all 8 in one instruction
        _mm256_storeu_ps(&c[i], vc);
    }
    // Handle remainder (n % 8)
    for (; i < n; i++) c[i] = a[i] + b[i];
}
// Typical speedup: 4-8x on large arrays
```

### Spectre and Meltdown (Speculative Execution Attacks)

```
Speculative execution: CPU guesses branch direction, executes ahead.
If guess is wrong → discard results → but CACHE state changes remain!

Attack:
1. Train branch predictor to take a path
2. Access secret data in mispredicted path
3. Secret data ends up in cache (even though result is discarded)
4. Time cache accesses → leak secret data

Defenses: KPTI (kernel page-table isolation), retpoline, hardware fixes
```

---

## Exercises

1. Write a program that accesses a 2D array in row-major vs column-major order. Time both and explain the performance difference.
2. Compile a simple C function with `gcc -S` to see the assembly. Identify the function prologue, body, and epilogue.
3. Rearrange a struct's fields to minimize its size due to padding. Verify with `sizeof()` before and after.

## Quiz

1. Why is accessing RAM 100x slower than accessing L1 cache?
2. What is pipelining and why does it improve CPU throughput?
3. What happens during a branch misprediction?
4. How does SIMD make code faster?
5. Why does cache matter in the Spectre attack?

---

## Navigation

**Parent**: [[000_CORE_MOC|CORE]]

**Synapses**:
- [[003_Algorithms|CORE 003]] — Cache-efficient algorithms
- [[005_Operating_Systems|CORE 005]] — OS manages hardware
- [[002_Data_Structures|CORE 002]] — Memory layout of structures
