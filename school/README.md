# C-SCHOOL(1)

> A futuristic Linux-style programming school. Master low-level programming from bits to kernels.

## Overview

C-SCHOOL is a browser-based programming school styled as an Arch Linux desktop environment. It teaches low-level computing concepts through a terminal-centric UI — no abstractions, no hand-holding, just real code in a real shell.

Students interact with a real bash PTY session rendered via xterm.js, navigate course content through a command-line interface, and progress through structured learning tracks spanning systems engineering, cybersecurity, networking, game development, and DevOps.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  index.html       │  │  WebSocket (xterm.js) │ │
│  │  vanilla HTML/CSS │  │  PTY I/O              │ │
│  │  + terminal UI    │  │                       │ │
│  └──────────────────┘  └──────────┬────────────┘ │
└────────────────────────────────────┼──────────────┘
                                     │
┌────────────────────────────────────┼──────────────┐
│                         Rust Backend              │
│  ┌─────────────────────────────────┐              │
│  │  actix-web HTTP + WebSocket     │              │
│  │  /api/session     POST          │              │
│  │  /api/ws/{id}     WS            │              │
│  │  /api/profile/*   GET/POST      │              │
│  │  /assets/{path}   GET           │              │
│  ├─────────────────────────────────┤              │
│  │  portable-pty → bash --login -i │              │
│  │  Profiles → ~/.c-school/        │              │
│  └─────────────────────────────────┘              │
└───────────────────────────────────────────────────┘
```

### Frontend
- **Vanilla HTML/CSS/JS** — no build step, no framework
- **xterm.js 5.3.0** — terminal emulator rendering the PTY session
- **Leader key system** — `w` + `h/j/k/l` for vim-style focus navigation, `w` + `,` for settings
- **Color themes** — 15 curated colorschemes (One Dark, Monokai Pro, Dracula, Nord, Catppuccin, etc.)
- **Mobile-responsive** — sidebar navigation on small screens, optimized layout

### Backend
- **Rust + actix-web 4** — async HTTP and WebSocket server
- **portable-pty 0.8** — spawns real `bash --login -i` processes per session
- **Uses actix-ws** for WebSocket upgrade handling
- **Profile persistence** — JSON files in `~/.c-school/profiles/`

## Features

| Feature | Description |
|---------|-------------|
| **Real PTY terminal** | Each web session gets a real bash shell — not a fake JavaScript interpreter |
| **Dual terminals** | `term1` for the main shell, `term2` (exercises terminal) for guided exercises |
| **Vim-style navigation** | Leader key `w` + `h/j/k/l` moves focus between terminals; `w` + `,` opens settings |
| **Command language** | `:` prefix commands for course navigation (`:help`, `:ls`, `:cd linux`, etc.) |
| **User profiles** | Persistent profiles with stats, history, and colorscheme preferences (localStorage + backend) |
| **15 colorschemes** | One Dark, Monokai Pro, Night Owl, Tokyo Night, Dracula, Gruvbox, Nord, Everforest, Catppuccin, Rosé Pine, Andromeda, Hybrid, Paper, Pencil, Tomorrow Night |
| **Hard mode** | Toggle that disables mouse, shows a timer, and removes hints |
| **Course MOC system** | Hierarchical "Map of Content" nodes with cross-domain synapses and level progression |
| **Man pages** | `man(1)` style reference pages for cschool, linux, school, and terminal keybindings |
| **Auto-reconnect** | WebSocket automatically reconnects if the backend restarts |

## Prerequisites

- **Rust toolchain** (rustc 1.70+, cargo)
- **Bash** (the backend spawns real bash shells)
- **Web browser** with JavaScript enabled
- Linux/macOS (portable-pty backend requires a Unix PTY system)

## Quick Start

```bash
cd cschool-term
cargo build --release
./target/release/cschool-term
# Open http://localhost:8080
```

The server binds to `127.0.0.1:8080` and starts on the `/` route serving the full desktop interface.

Standalone terminal-only page available at `http://localhost:8080/terminal`.

## Usage Guide

### Terminal 1 — Main Shell
The upper (larger) terminal connects to a real bash PTY. You get a full Linux shell with a custom green prompt (`c-school@academy:~/ $`). Run any bash command, edit files, compile code, etc.

### Terminal 2 — Exercises Terminal
The lower (smaller) terminal provides a fallback command interface with built-in commands (`ls`, `cd`, `pwd`, `whoami`, `date`, `echo`, `clear`, `man`, `stats`, `logout`, `cat`, `vim`, `help`). Designed for guided exercises when the PTY isn't needed.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `w` + `h` | Focus previous terminal |
| `w` + `l` | Focus next terminal |
| `w` + `j` | Focus terminal below |
| `w` + `k` | Focus terminal above |
| `w` + `,` | Toggle settings panel |
| `Ctrl+a` | Jump to line start |
| `Ctrl+e` | Jump to line end |
| `Ctrl+l` | Clear screen |

### Navigating Courses

From the main terminal, use standard bash commands to explore the `SCHOOL/` directory:

```bash
ls SCHOOL/          # List all departments
ls SCHOOL/LINUX/    # List Linux course nodes
cat SCHOOL/CORE/001_Mental_Models.md  # Read a lesson
man cschool         # View the cschool manual
```

## Command Language Reference

The `:` prefix command system (available in term2 and the welcome panel):

| Command | Description |
|---------|-------------|
| `:help` | Show available commands |
| `:ls` | List courses/departments |
| `:cd <topic>` | Navigate to a topic directory |
| `:cat <file>` | View course material |
| `:vim` | Open integrated editor |
| `:man <topic>` | View manual pages |
| `:stats` | Show user statistics (commands run, time spent) |
| `:whoami` | Display current username |
| `:pwd` | Print working directory |
| `:clear` | Clear terminal output |
| `:logout` | End session |
| `:theme <name>` | Change colorscheme |
| `:timing <pct>` | Set animation timing (10–200%) |

## Course Structure

```
SCHOOL/
├── 000_SCHOOL_MOC.md         # Master hub — all departments unified
├── CORE/                     # Engineering fundamentals
│   ├── 000_CORE_MOC.md       # MOC: Mental models, problem solving, git, I/O
│   └── 001_Mental_Models.md  # IPO, Stack, State Machine, Contract models
├── LINUX/                    # Operating system mastery
│   ├── 000_LINUX_MOC.md      # MOC: Filesystem, shell, admin, networking, kernel
│   └── 001_Filesystem.md     # Linux FHS, permissions, navigation
├── PYTHON/                   # Programming language track
│   ├── 000_PYTHON_MOC.md
│   └── 001_Syntax_Basics.md
├── DEVOPS/                   # CI/CD and containers
│   └── 000_DEVOPS_MOC.md
├── NETWORKING/               # Network fundamentals
│   ├── 000_NETWORKING_MOC.md
│   └── 001_TCP_IP.md
├── CYBERSECURITY/            # Security concepts
│   ├── 000_CYBERSECURITY_MOC.md
│   └── 001_Threat_Modeling.md
└── GAME-DEV/                 # Game programming
    └── 000_GAME_DEV_MOC.md
```

### MOC System

Each department has a **Map of Content** (`000_*_MOC.md`) that serves as a hub page:
- Lists all nodes in the department with titles, depth levels, and prerequisites
- Shows progression graphs (`001 → 002 → ...`)
- Defines **neural links** (cross-domain synapses) to related departments
- Includes status tables tracking which nodes are populated

### Learning Tracks

Pre-defined paths through the school:

| Track | Path |
|-------|------|
| Software Engineer | CORE → PYTHON → LINUX → DEVOPS |
| Systems Engineer | CORE → LINUX → NETWORKING → DEVOPS |
| Security Engineer | CORE → LINUX → NETWORKING → CYBERSECURITY |
| Game Developer | CORE → PYTHON → GAME-DEV |

### Level Depth

Each lesson node is organized into four levels:
1. **Intuition** — Conceptual understanding with diagrams
2. **Practical** — Hands-on commands and examples
3. **Systems** — Deeper technical details and architecture
4. **Expert** — Advanced patterns and edge cases

## Configuration

### Settings Panel

The `settings.conf` panel (styled after Hyprland's config) exposes:

```ini
# C-SCHOOL Configuration
# Hyprland-style config

[general]
$TERM = wezterm
$FILEMANAGER = nnn
$EDITOR = vim
$BROWSER = firefox
$SHELL = zsh
$DISTRO = arch

[display]
timing = 50%
theme = random
animations = true
blur = true
transparent = true

[keybindings]
$W = SUPER
bind = $W, h, movefocus, l
bind = $W, j, movefocus, d
bind = $W, k, movefocus, u
bind = $W, l, movefocus, r
...

[modes]
# Hard Mode: Disables mouse, shows timer, no hints

[colorscheme]
colorschemes = [
    "One Dark", "Monokai Pro", "Night Owl", "Tokyo Night",
    "Dracula", "Gruvbox", "Nord", "Everforest",
    "Catppuccin", "Rose Pine", "Andromeda", "Hybrid",
    "Paper", "Pencil", "Tomorrow Night"
]
```

### Hardcore Mode

Toggle hardcore mode from the settings panel:
- Disables mouse input
- Shows a timer for exercises
- Hides hints and helper text
- Persists via `localStorage`

## User Profiles

Profiles are stored in two layers:

- **localStorage** — immediate state in the browser (`c-school-profile` key)
- **Backend** — JSON files in `~/.c-school/profiles/{id}.json`, synced via `POST /api/profile/save`

Profile schema:

```json
{
  "id": "abc123def",
  "username": "c-student",
  "created": 1715000000000,
  "last_active": 1715100000000,
  "colorscheme_index": 4,
  "stats": {
    "commands_executed": 42,
    "sessions_started": 3,
    "time_spent": 3600,
    "topics_completed": ["001_Filesystem"],
    "command_history": [
      { "cmd": "ls -la", "timestamp": 1715000001000, "dir": "~" }
    ],
    "current_dir": "~",
    "login_time": 1715100000000
  }
}
```

Each user gets a random colorscheme on first visit. Time tracking runs in 1-second intervals while the page is open.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Main desktop interface |
| `GET` | `/terminal` | Standalone terminal page |
| `GET` | `/assets/{path}` | Static files (CSS, JS, etc.) |
| `POST` | `/api/session` | Create a new PTY session, returns session `id` |
| `GET` | `/api/status` | List all active sessions |
| `DELETE` | `/api/session/{id}` | Kill a session (sends Ctrl+C, then `exit`) |
| `WS` | `/api/ws/{id}` | WebSocket for PTY I/O streaming |
| `POST` | `/api/profile/save` | Persist user profile to disk |
| `GET` | `/api/profile/{id}` | Load a user profile from disk |

## Man Pages

Reference documentation in traditional `man(1)` format:

| Page | Section | Description |
|------|---------|-------------|
| `cschool(1)` | General Commands | Overview, options, tracks, topics, colorschemes |
| `school(1)` | General Commands | Full command reference for the `school` CLI |
| `linux(1)` | General Commands | Linux OS topics, filesystem hierarchy, permissions |
| `school(420)` | Education | Mouse-free terminal guide, vim keybinding cheat sheet |

## Development

### Project Structure

```
nvim-c-school/
├── index.html                  # Main application entry point
├── terminal.html               # Static terminal page (legacy)
├── assets/
│   └── css/
│       └── styles.css          # Complete styling (854 lines)
├── cschool-term/
│   ├── Cargo.toml              # Rust dependencies
│   ├── main.rs                 # Backend server (538 lines)
│   └── frontend.html           # Standalone terminal page (bundled in binary)
├── SCHOOL/                     # Course content (markdown)
│   ├── 000_SCHOOL_MOC.md
│   ├── CORE/
│   ├── LINUX/
│   ├── PYTHON/
│   ├── DEVOPS/
│   ├── NETWORKING/
│   ├── CYBERSECURITY/
│   └── GAME-DEV/
└── man/
    └── cschool/
        ├── cschool.1
        ├── school.1
        ├── linux.1
        └── school.420
```

### Adding New Courses

1. Create a new department directory under `SCHOOL/`:
   ```bash
   mkdir SCHOOL/NEW_TOPIC/
   ```

2. Add a MOC file (`000_NEW_TOPIC_MOC.md`):
   ```markdown
   # 000_NEW_TOPIC_MOC
   > Description of the department.
   ## Overview
   - [[001_Lesson_One]] - Description
   - [[002_Lesson_Two]] - Description
   ## Neural Links
   - NEW_TOPIC → [[000_CORE_MOC|CORE]]
   ## Progression
   ## Status
   | Node | Title | Depth | Prerequisites |
   ```

3. Create lesson files following the 4-level depth pattern:
   ```markdown
   # 001_Lesson_One
   > Tagline
   ## Level 1 — Intuition
   ## Level 2 — Practical
   ## Level 3 — Systems
   ## Level 4 — Expert
   ```

4. Register the department in `SCHOOL/000_SCHOOL_MOC.md`

### Building

```bash
# Debug build
cd cschool-term
cargo run

# Release build
cargo build --release
./target/release/cschool-term

# With logging
RUST_LOG=debug cargo run
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend UI | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Terminal emulation | xterm.js 5.3.0 (CDN) |
| Backend HTTP/WS | Rust, actix-web 4, actix-ws 0.3 |
| PTY management | portable-pty 0.8 |
| Async runtime | tokio (full features) |
| Serialization | serde + serde_json |
| Session IDs | uuid v4 |
| Logging | log + env_logger |
| Course content | Markdown with WikiLinks (`[[link]]`) |

## Credits

### Colorschemes
- **One Dark** — [jasonhamster](https://github.com/jasonhamster) (onedark theme)
- **Monokai Pro** — [RisingTide](https://monokai.pro)
- **Night Owl** — [oxalorg](https://github.com/oxalorg/night-owl.vim)
- **Tokyo Night** — [folke](https://github.com/folke/tokyonight.nvim)
- **Dracula** — [zenorocha](https://draculatheme.com)
- **Gruvbox** — [sainnhe](https://github.com/sainnhe/gruvbox-material)
- **Nord** — [arcticicestudio](https://www.nordtheme.com)
- **Everforest** — [sainnhe](https://github.com/sainnhe/everforest)
- **Catppuccin** — [catppuccin](https://github.com/catppuccin/nvim)
- **Rosé Pine** — [rose-pine](https://rosepinetheme.com)
- **Andromeda** — [yorickpeterse](https://github.com/yorickpeterse/andromeda)

### Inspiration
- Arch Linux desktop environment aesthetic
- Hyprland compositor configuration syntax
- Neovim ecosystem and editor philosophy
- Map of Content (MOC) knowledge organization pattern

---

*C-SCHOOL v0.2.0 — No abstractions. No hand-holding. Just real code.*
