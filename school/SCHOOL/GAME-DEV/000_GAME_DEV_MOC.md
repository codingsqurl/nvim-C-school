# 000_GAME_DEV_MOC

> Game development - from 2D to 3D engines.

## Overview

GAME-DEV covers game programming:

- [[001_Game_Loops]] - Game loop architecture and timing
- [[002_2D_Graphics]] - Pygame, sprite rendering
- [[003_Collision_Detection]] - AABB, circle, physics basics
- [[004_State_Machines]] - Game states and AI behavior
- [[005_3D_Basics]] - Three.js, OpenGL concepts
- [[006_Asset_Management]] - Sprites, audio, tilemaps

## Neural Links

- GAME-DEV → [[000_PYTHON_MOC|PYTHON]] - Pygame
- GAME-DEV → [[000_CORE_MOC|CORE]] - Performance optimization
- GAME-DEV → [[000_LINUX_MOC|LINUX]] - Game server Linux

## Progression

```
001_Game_Loops
    ↓
002_2D_Graphics
    ↓ ├─→ 003_Collision_Detection
    │          ↓
    │       004_State_Machines
    │          ↓
    └────→ 005_3D_Basics
            ↓
        006_Asset_Management
```

## Status

| Node | Title | Depth | Prerequisites |
|------|-------|-------|--------------|
| 001 | Game Loops | 1 | None |
| 002 | 2D Graphics | 2 | 001 |
| 003 | Collision Detection | 3 | 002 |
| 004 | State Machines | 3 | 002 |
| 005 | 3D Basics | 4 | 003 |
| 006 | Asset Management | 3 | 002 |