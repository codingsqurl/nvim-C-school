# 000_NEOVIM_MOC

> Neovim editor mastery - from modal editing to plugin development.

## Overview

NEOVIM covers the Neovim text editor, Lua configuration, and plugin development:

- [[001_Modal_Editing]] - Modal mindset, motions, operators, and text objects
- [[002_Configuration_Lua]] - init.lua, options, keymaps, autocmds, user commands
- [[003_Plugin_Ecosystem]] - Lazy.nvim, plugin managers, plugin architecture
- [[004_LSP_Toolchain]] - Native LSP, mason.nvim, completion sources, diagnostics
- [[005_DAP_Debugging]] - nvim-dap, debugging workflows, breakpoints, watch
- [[006_Treesitter_Mastery]] - Syntax trees, text objects, folds, injections
- [[007_Plugin_Development]] - Lua API, user commands, highlights, buffer management
- [[008_Declarative_Neovim]] - Nixvim, nix-configs, reproducible editor environments

## Prerequisites

| Requirement | Source |
|-------------|--------|
| CLI comfort | [[000_LINUX_MOC|LINUX]] |
| Lua basics | External (learnxinyminutes.com/lua) |

## Learning Path

```
Level 1 — Intuition
    001_Modal_Editing
        ↓
    ⚑ MILESTONE: Edit text without touching arrow keys or mouse for 1 hour

Level 2 — Practical
    002_Configuration_Lua
    003_Plugin_Ecosystem
        ↓
    ⚑ MILESTONE: Write a custom init.lua with plugins and keymaps

Level 3 — Systems
    004_LSP_Toolchain
    005_DAP_Debugging
    006_Treesitter_Mastery
        ↓
    ⚑ MILESTONE: Full IDE experience: completion, diagnostics, debugging, syntax-aware editing

Level 4 — Expert
    007_Plugin_Development
    008_Declarative_Neovim
        ↓
    ⚑ MILESTONE: Publish a Neovim plugin; reproduce entire config declaratively
```

## Neural Links

- NEOVIM → [[000_LINUX_MOC|LINUX]] - Terminal environment
- NEOVIM → [[000_CORE_MOC|CORE]] - Editor as an engineering tool
- NEOVIM → [[000_LANGUAGES_MOC|LANGUAGES]] - Multi-language LSP and Treesitter

## Progression

```
001_Modal_Editing
    ↓
002_Configuration_Lua
    ↓
003_Plugin_Ecosystem
    ↓ ├─→ 004_LSP_Toolchain
    │          ↓
    │       005_DAP_Debugging
    │          ↓
    │       006_Treesitter_Mastery
    │          ↓
    └────→ 007_Plugin_Development
            ↓
         008_Declarative_Neovim
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Modal Editing | 1 | None |
| 002 | Configuration (Lua) | 2 | 001 |
| 003 | Plugin Ecosystem | 2 | 002 |
| 004 | LSP Toolchain | 3 | 003 |
| 005 | DAP Debugging | 3 | 004 |
| 006 | Treesitter Mastery | 3 | 003 |
| 007 | Plugin Development | 4 | 004, 006 |
| 008 | Declarative Neovim | 4 | 007 |

---

**Parent**: [[000_SCHOOL_MOC|SCHOOL]]
**Synapses**: LINUX, CORE, LANGUAGES
