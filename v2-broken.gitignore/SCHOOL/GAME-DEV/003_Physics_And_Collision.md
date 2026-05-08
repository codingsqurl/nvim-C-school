# 003_Physics_And_Collision

> AABB, circle collision, velocity/acceleration, and basic game physics.

## Level 1 — Intuition

### Concept

Game physics is not real physics — it's simplified enough to run 60 times per second. Collision detection answers "do these things touch?" and collision resolution answers "what happens when they do?"

### Motion Basics

```
Position → Velocity → Acceleration

position += velocity * dt
velocity += acceleration * dt

Example: Gravity
acceleration.y = 9.8  (m/s² downward)
Each frame: velocity.y += 9.8 * dt
             position.y += velocity.y * dt
```

### Collision Types

```
┌──────────────────┐  ┌──────────────────┐
│   AABB           │  │   Circle          │
│ (Axis-Aligned    │  │ (Radius-based)    │
│  Bounding Box)   │  │                   │
│ ┌──────────┐     │  │     ╭─────╮       │
│ │  ▄▄▄▄▄▄  │     │  │    ╱       ╲      │
│ │  ██████  │     │  │   │    ●    │     │
│ │  ▀▀▀▀▀▀  │     │  │    ╲       ╱      │
│ └──────────┘     │  │     ╰─────╯       │
│  (x,y,w,h)       │  │  (cx,cy,radius)  │
└──────────────────┘  └──────────────────┘
```

## Level 2 — Practical

### Velocity and Acceleration

```c
#include <math.h>
#include <stdbool.h>

typedef struct {
    float x, y;
} Vec2;

typedef struct {
    Vec2 position;
    Vec2 velocity;
    Vec2 acceleration;
} Body;

void integrate(Body *body, float dt) {
    // Semi-implicit Euler (stable enough for games)
    body->velocity.x += body->acceleration.x * dt;
    body->velocity.y += body->acceleration.y * dt;
    body->position.x += body->velocity.x * dt;
    body->position.y += body->velocity.y * dt;
}

// Usage: apply gravity
void apply_gravity(Body *body, float gravity) {
    body->acceleration.y = gravity;  // e.g., 980 pixels/s²
}

// Apply friction to slow things down
void apply_friction(Body *body, float friction) {
    body->velocity.x *= (1.0f - friction * dt);
    body->velocity.y *= (1.0f - friction * dt);
}
```

### AABB Collision Detection

```c
typedef struct {
    float x, y;     // top-left corner
    float w, h;     // width, height
} AABB;

bool aabb_overlap(AABB a, AABB b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

// Collision resolution: push out along shortest overlap axis
typedef struct {
    bool hit;
    float overlap_x, overlap_y;
} Collision;

Collision aabb_resolve(AABB a, AABB b) {
    Collision result = {false, 0, 0};

    if (!aabb_overlap(a, b)) return result;

    float overlap_left   = (a.x + a.w) - b.x;
    float overlap_right  = (b.x + b.w) - a.x;
    float overlap_top    = (a.y + a.h) - b.y;
    float overlap_bottom = (b.y + b.h) - a.y;

    // Find smallest overlap
    float min_x = fminf(overlap_left, overlap_right);
    float min_y = fminf(overlap_top, overlap_bottom);

    result.hit = true;
    if (min_x < min_y) {
        result.overlap_x = (overlap_left < overlap_right)
                           ? -overlap_left : overlap_right;
    } else {
        result.overlap_y = (overlap_top < overlap_bottom)
                          ? -overlap_top : overlap_bottom;
    }
    return result;
}
```

### Circle Collision

```c
typedef struct {
    float x, y;     // center
    float radius;
} Circle;

bool circle_overlap(Circle a, Circle b) {
    float dx = a.x - b.x;
    float dy = a.y - b.y;
    float dist_sq = dx * dx + dy * dy;
    float radii = a.radius + b.radius;
    return dist_sq < radii * radii;
}

// Resolution: push circles apart along collision normal
void circle_resolve(Circle *a, Circle *b) {
    float dx = a->x - b->x;
    float dy = a->y - b->y;
    float dist = sqrtf(dx * dx + dy * dy);
    float min_dist = a->radius + b->radius;

    if (dist >= min_dist || dist == 0.0f) return;

    // Push apart proportionally
    float overlap = min_dist - dist;
    float nx = dx / dist;  // normal
    float ny = dy / dist;

    a->x += nx * overlap * 0.5f;
    a->y += ny * overlap * 0.5f;
    b->x -= nx * overlap * 0.5f;
    b->y -= ny * overlap * 0.5f;
}
```

## Level 3 — Systems

### Platformer Physics

```c
// Common platformer physics constants
#define GRAVITY        980.0f   // pixels/s²
#define JUMP_VELOCITY  -400.0f  // negative = upward
#define MAX_FALL_SPEED  600.0f
#define MOVE_SPEED      200.0f

typedef struct {
    Vec2 pos, vel;
    bool on_ground;
} Player;

void platformer_update(Player *p, float dt, bool move_left,
                       bool move_right, bool jump_pressed) {
    // Horizontal movement
    if (move_left)  p->vel.x = -MOVE_SPEED;
    else if (move_right) p->vel.x = MOVE_SPEED;
    else p->vel.x *= 0.8f;  // friction

    // Jump
    if (jump_pressed && p->on_ground) {
        p->vel.y = JUMP_VELOCITY;
        p->on_ground = false;
    }

    // Gravity
    p->vel.y += GRAVITY * dt;
    if (p->vel.y > MAX_FALL_SPEED)
        p->vel.y = MAX_FALL_SPEED;

    // Integrate
    p->pos.x += p->vel.x * dt;
    p->pos.y += p->vel.y * dt;
}
```

### Broad Phase vs Narrow Phase

```c
// Checking every object against every other = O(n²) = SLOW
// Solution: Two-phase collision detection

// BROAD PHASE: Quick rejection of far-away objects
// Use spatial partitioning (grid):

#define GRID_SIZE 64
#define MAX_OBJECTS 1024

typedef struct {
    int object_ids[256];
    int count;
} GridCell;

GridCell grid[100][100]; // 100x100 cells

void broad_phase_insert(int obj_id, AABB bounds) {
    int min_cx = (int)(bounds.x / GRID_SIZE);
    int min_cy = (int)(bounds.y / GRID_SIZE);
    int max_cx = (int)((bounds.x + bounds.w) / GRID_SIZE);
    int max_cy = (int)((bounds.y + bounds.h) / GRID_SIZE);

    for (int cy = min_cy; cy <= max_cy; cy++)
        for (int cx = min_cx; cx <= max_cx; cx++)
            grid[cy][cx].object_ids[grid[cy][cx].count++] = obj_id;
}

// NARROW PHASE: Precise collision on pairs from broad phase
// (Use AABB, Circle, or pixel-perfect from above)
```

### Verlet Integration (Alternative to Euler)

```c
// Verlet: Better energy conservation than Euler
// Good for: ragdolls, cloth, rope physics
typedef struct {
    Vec2 position;
    Vec2 prev_position;  // position from last frame
} VerletPoint;

void verlet_integrate(VerletPoint *p, Vec2 acceleration, float dt) {
    Vec2 velocity = {
        p->position.x - p->prev_position.x,
        p->position.y - p->prev_position.y
    };
    p->prev_position = p->position;
    p->position.x += velocity.x + acceleration.x * dt * dt;
    p->position.y += velocity.y + acceleration.y * dt * dt;
}
```

## Level 4 — Expert

### Collision Response with Impulses

```c
// Impulse-based collision for rigid body physics
// Based on conservation of momentum and coefficient of restitution

typedef struct {
    Vec2 position, velocity;
    float mass;
    float restitution;  // bounciness: 0=clay, 1=superball
} RigidBody;

void resolve_collision(RigidBody *a, RigidBody *b,
                       Vec2 normal, float penetration) {
    // Relative velocity
    Vec2 rv = {a->velocity.x - b->velocity.x,
               a->velocity.y - b->velocity.y};

    // Velocity along normal
    float vel_along_normal = rv.x * normal.x + rv.y * normal.y;

    // Don't resolve if separating
    if (vel_along_normal > 0) return;

    // Restitution
    float e = fminf(a->restitution, b->restitution);

    // Impulse scalar
    float inv_mass_sum = (1.0f / a->mass) + (1.0f / b->mass);
    float j = -(1.0f + e) * vel_along_normal / inv_mass_sum;

    // Apply impulse
    Vec2 impulse = {j * normal.x, j * normal.y};
    a->velocity.x += impulse.x / a->mass;
    a->velocity.y += impulse.y / a->mass;
    b->velocity.x -= impulse.x / b->mass;
    b->velocity.y -= impulse.y / b->mass;

    // Positional correction (push apart)
    float slop = 0.01f;  // penetration tolerance
    float correction = fmaxf(penetration - slop, 0.0f)
                       / inv_mass_sum * 0.2f;
    a->position.x += correction * normal.x / a->mass;
    a->position.y += correction * normal.y / a->mass;
    b->position.x -= correction * normal.x / b->mass;
    b->position.y -= correction * normal.y / b->mass;
}
```

---

## Exercises

1. Implement gravity and jumping for a player rectangle. The rectangle should fall, stop on the "ground" (bottom of screen), and jump when space is pressed.
2. Add AABB collision between the player and 5 static platforms. The player should land on top of platforms and be pushed out when overlapping.
3. Implement a grid-based broad phase collision system. Compare performance with and without it for 500 objects.

## Quiz

1. What's the difference between collision detection and collision resolution?
2. Why is semi-implicit Euler preferred over explicit Euler for game physics?
3. What is broad phase collision detection and why is it needed?
4. How does coefficient of restitution affect collision response?
5. What does Verlet integration do better than Euler integration?

---

## Navigation

**Parent**: [[000_GAME_DEV_MOC|GAME-DEV]]

**Synapses**:
- [[001_Game_Loop_And_Engine|GAME-DEV 001]] — Delta time
- [[002_2D_Graphics_And_Sprites|GAME-DEV 002]] — Sprite positions
- [[003_Algorithms|CORE 003]] — Spatial partitioning
