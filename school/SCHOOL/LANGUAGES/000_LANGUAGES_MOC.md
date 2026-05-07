# 000_LANGUAGES_MOC

> Programming languages - comparison, theory, and design.

## Overview

LANGUAGES covers programming language theory and cross-language understanding:

- [[001_Programming_Paradigms]] - Imperative, functional, OOP, declarative, logic
- [[002_Type_Systems]] - Static vs dynamic, strong vs weak, gradual typing
- [[003_Memory_Management]] - Manual allocation, GC, ownership, reference counting
- [[004_Compilation_Interpretation]] - Compilers, interpreters, JIT, AOT, IR
- [[005_Concurrency_Models]] - Threads, async/await, actors, CSP, green threads
- [[006_Language_Design]] - Syntax design, ergonomics, error handling patterns
- [[007_FFI_Interop]] - Foreign function interfaces, C ABI, language bindings
- [[008_DSL_Design]] - Domain-specific languages, embedded DSLs, parser combinators

## Prerequisites

| Requirement | Source |
|-------------|--------|
| One language proficiency | [[000_PYTHON_MOC|PYTHON]] (recommended) |
| Mental models | [[000_CORE_MOC|CORE]] |

## Learning Path

```
Level 1 — Intuition
    001_Programming_Paradigms
    002_Type_Systems
        ↓
    ⚑ MILESTONE: Classify 5+ languages by paradigm and type system

Level 2 — Practical
    003_Memory_Management
    004_Compilation_Interpretation
        ↓
    ⚑ MILESTONE: Write the same small program in 3 languages; compare memory/performance

Level 3 — Systems
    005_Concurrency_Models
    006_Language_Design
        ↓
    ⚑ MILESTONE: Implement a concurrent producer-consumer in two concurrency models

Level 4 — Expert
    007_FFI_Interop
    008_DSL_Design
        ↓
    ⚑ MILESTONE: Design and implement a small DSL using parser combinators
```

## Neural Links

- LANGUAGES → [[000_CORE_MOC|CORE]] - Computational thinking
- LANGUAGES → [[000_PYTHON_MOC|PYTHON]] - Reference implementation language
- LANGUAGES → [[000_LINUX_MOC|LINUX]] - Compilation toolchains (gcc, llvm)
- LANGUAGES → [[000_NEOVIM_MOC|NEOVIM]] - Treesitter and LSP across languages

## Progression

```
001_Programming_Paradigms
    ↓
002_Type_Systems
    ↓
003_Memory_Management
    ↓
004_Compilation_Interpretation
    ↓ ├─→ 005_Concurrency_Models
    │          ↓
    │       006_Language_Design
    │          ↓
    │       007_FFI_Interop
    │          ↓
    └────→ 008_DSL_Design
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Programming Paradigms | 1 | None |
| 002 | Type Systems | 1 | 001 |
| 003 | Memory Management | 2 | 001 |
| 004 | Compilation & Interpretation | 2 | 001 |
| 005 | Concurrency Models | 3 | 003 |
| 006 | Language Design | 3 | 002, 003 |
| 007 | FFI & Interop | 4 | 003, 005 |
| 008 | DSL Design | 4 | 004, 006 |

---

**Parent**: [[000_SCHOOL_MOC|SCHOOL]]
**Synapses**: CORE, PYTHON, LINUX, NEOVIM
