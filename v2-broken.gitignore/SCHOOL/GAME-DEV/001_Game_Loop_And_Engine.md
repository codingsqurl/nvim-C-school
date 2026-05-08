# 001_Game_Loop_And_Engine

> Game loop architecture, delta time, rendering pipeline, and engine overview.

## Level 1 — Intuition

### Concept

Every game is a loop. A game engine is just a program that runs this loop 30, 60, or 144 times per second. Each iteration: process input → update state → render frame → repeat.

```
┌──────────────────────────────────────────┐
│              GAME LOOP                    │
│                                           │
│   ┌──────────┐    ┌──────────┐           │
│   │ Process  │ →  │  Update  │           │
│   │  Input   │    │  State   │           │
│   └──────────┘    └──────────┘           │
│         ↑               ↓                │
│         │        ┌──────────┐            │
│         └─────── │  Render  │            │
│                  │  Frame   │            │
│                  └──────────┘            │
│                                           │
│   Runs 60 times/second (16.6ms budget)   │
└──────────────────────────────────────────┘
```

### The Time Budget (60 FPS)

```
16.6 ms per frame
├── Input:    ~0.5ms  (keyboard, mouse, controller)
├── Update:   ~8ms    (physics, AI, game logic)
├── Render:   ~7ms    (draw calls, GPU work)
└── Spare:    ~1ms    (buffer for spikes)
```

## Level 2 — Practical

### Basic Game Loop in C

```c
#include <stdio.h>
#include <time.h>
#include <unistd.h>

#define TARGET_FPS 60
#define FRAME_DURATION (1000000000 / TARGET_FPS) // nanoseconds

typedef struct {
    float x, y;
    float velocity_x, velocity_y;
} Player;

void process_input(Player *p) {
    // In real code: poll SDL/GLFW events
    // Simplified: just move right
    p->velocity_x = 0.1f;
}

void update(Player *p, float dt) {
    p->x += p->velocity_x * dt;
    p->y += p->velocity_y * dt;
}

void render(Player *p) {
    printf("\rPlayer at (%.1f, %.1f)", p->x, p->y);
    fflush(stdout);
}

int main() {
    Player player = {0, 0, 0, 0};
    struct timespec prev, curr;

    clock_gettime(CLOCK_MONOTONIC, &prev);

    while (1) {
        clock_gettime(CLOCK_MONOTONIC, &curr);

        // Delta time in seconds
        float dt = (curr.tv_sec - prev.tv_sec)
                 + (curr.tv_nsec - prev.tv_nsec) / 1e9f;

        if (dt >= FRAME_DURATION / 1e9f) {
            process_input(&player);
            update(&player, dt);
            render(&player);
            prev = curr;
        } else {
            // Sleep remaining time (crude, but illustrative)
            usleep(1000);
        }
    }
    return 0;
}
```

### Game Loop in Python (Pygame)

```python
import pygame

pygame.init()
screen = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

x, y = 400, 300
running = True

while running:
    dt = clock.tick(60) / 1000.0  # delta time in seconds

    # Process input
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:  x -= 300 * dt
    if keys[pygame.K_RIGHT]: x += 300 * dt

    # Update
    # (physics, AI, animation would go here)

    # Render
    screen.fill((0, 0, 0))
    pygame.draw.circle(screen, (255, 0, 0), (int(x), int(y)), 20)
    pygame.display.flip()

pygame.quit()
```

### Fixed vs Variable Timestep

```c
// Fixed timestep — prevents physics instability
const double DT = 1.0 / 60.0;
double accumulator = 0.0;

while (running) {
    double frame_time = get_delta_time();
    accumulator += frame_time;

    while (accumulator >= DT) {
        update_physics(DT);    // Always 1/60s step
        accumulator -= DT;
    }

    double alpha = accumulator / DT;
    render(alpha);  // Interpolate for smooth visuals
}
```

## Level 3 — Systems

### Rendering Pipeline

```
┌─────────────────────────────────────────────────────┐
│              RENDERING PIPELINE                      │
│                                                      │
│  Vertices → Vertex Shader → Rasterizer → Fragment   │
│             (transform)      (triangles   Shader     │
│                               → pixels)   (color)    │
│                                                      │
│  3D Model:            Vertex Shader:    Fragment:    │
│  (0,0,0)              world * view      pixel RGB    │
│  (1,0,0)              * projection →                 │
│  (0,1,0)              screen coords                  │
└─────────────────────────────────────────────────────┘
```

### Engine Architecture

```
┌──────────────────────────────────────────────┐
│              GAME ENGINE LAYERS              │
├──────────────────────────────────────────────┤
│  Game Logic (your code)                      │
├──────────────────────────────────────────────┤
│  Scripting (Lua, C#, Python)                │
├──────────────────────────────────────────────┤
│  AI | Physics | Audio | Animation | Network  │
├──────────────────────────────────────────────┤
│  Rendering (OpenGL/Vulkan/DirectX)           │
├──────────────────────────────────────────────┤
│  Platform (Windows, Linux, console, mobile)  │
└──────────────────────────────────────────────┘
```

### Engine Comparison

| Engine | Language | Best For | Notable |
|--------|----------|----------|---------|
| Unity | C# | 2D/3D, mobile, indie | Largest community |
| Unreal | C++/Blueprints | 3D AAA, high fidelity | Source available |
| Godot | GDScript/C# | 2D/3D, open source | Lightweight, FOSS |
| Raylib | C | Learning, 2D/3D | No dependencies |
| SDL2 | C | 2D, cross-platform | Valve uses it |

## Level 4 — Expert

### Entity Component System (ECS)

```c
// ECS: Data-oriented design for game objects
// Instead of: class Player : GameObject (inheritance hell)
// Do this:

typedef struct { float x, y; } Position;
typedef struct { float dx, dy; } Velocity;
typedef struct { int hp, max_hp; } Health;

// Entity is just an ID. Components are pure data. Systems are logic.
void movement_system(Position *pos, Velocity *vel, float dt, int count) {
    for (int i = 0; i < count; i++) {
        pos[i].x += vel[i].dx * dt;
        pos[i].y += vel[i].dy * dt;
    }
}
// Why? Cache-friendly, easy parallelism, no diamond inheritance
```

### Frame Pacing and GPU Sync

```c
// Triple buffering + VSync for smooth frames
// Problem: Screen tearing (GPU writes while display reads)
// Solution: Wait for vertical blank (vsync)
//          But vsync causes input lag and stutter if frames drop
//
// Modern solution: Adaptive sync (FreeSync/G-Sync)
// Display refresh rate matches GPU output dynamically

// Frame pacing: Ensure consistent frame delivery
// Not just "high FPS" but "consistent frame times"
// Measure: 99th percentile frame time < target
// Tool: PresentMon (Windows), MangoHud (Linux)
```

---

## Exercises

1. Implement a game loop in C or Python that moves a rectangle with arrow keys. Use delta time to ensure consistent speed regardless of frame rate.
2. Add a fixed timestep physics loop to your game. Compare behavior with and without it when framerate fluctuates.
3. Research three game engines (Unity, Godot, Raylib). Write down one strength and one weakness of each. Install one and run its "hello world" template.

## Quiz

1. Why is delta time critical in a game loop?
2. What's the difference between a fixed and variable timestep?
3. Name the main stages of the rendering pipeline.
4. What problem does ECS (Entity Component System) solve?
5. Why do monitors tear, and what does VSync do?

---

## Navigation

**Parent**: [[000_GAME_DEV_MOC|GAME-DEV]]

**Synapses**:
- [[002_2D_Graphics_And_Sprites|GAME-DEV 002]] — Rendering 2D
- [[001_Mental_Models|CORE 001]] — State machine pattern
- [[004_Computer_Architecture|CORE 004]] — CPU/GPU pipeline
