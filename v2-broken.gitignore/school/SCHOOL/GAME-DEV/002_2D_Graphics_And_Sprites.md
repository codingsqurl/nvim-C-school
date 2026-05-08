# 002_2D_Graphics_And_Sprites

> Sprites, animation, tilemaps, and parallax scrolling.

## Level 1 — Intuition

### Concept

A sprite is a 2D image that moves on screen. Think of it as a sticker you can slide around. Animation is just showing different sprites in sequence — like a flipbook.

```
Sprite Sheet (frames packed in one image):
┌────┬────┬────┬────┐
│  0 │  1 │  2 │  3 │  ← Run animation (4 frames)
├────┼────┼────┼────┤
│  4 │  5 │  6 │  7 │  ← Jump animation
├────┼────┼────┼────┤
│  8 │  9 │ 10 │ 11 │  ← Idle animation
└────┴────┴────┴────┘

At 60 FPS, show each frame for ~100ms = 10 FPS animation
```

### Coordinate Systems

```
Screen coordinates:           World coordinates:
(0,0)──→ x increases      (-∞,-∞)
 │                          │
 ↓ y increases              ├──→ x
                         (0,0)  world origin

The camera translates between them:
screen_x = world_x - camera_x
screen_y = world_y - camera_y
```

## Level 2 — Practical

### Sprite Rendering with Pygame

```python
import pygame

pygame.init()
screen = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

# Load sprite sheet
spritesheet = pygame.image.load("player.png").convert_alpha()
# Assume: 32x32 frames, 4 columns, running animation in row 0
FRAME_W, FRAME_H = 32, 32

def get_frame(sheet, col, row):
    """Extract a single frame from the sprite sheet."""
    rect = pygame.Rect(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H)
    return sheet.subsurface(rect)

# Animation state
frames = [get_frame(spritesheet, i, 0) for i in range(4)]
current_frame = 0
frame_timer = 0
FRAME_DURATION = 100  # ms per frame
player_x, player_y = 400, 300
facing_right = True

running = True
while running:
    dt = clock.tick(60)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    moving = False
    if keys[pygame.K_LEFT]:
        player_x -= 200 * dt / 1000
        moving = True
        facing_right = False
    if keys[pygame.K_RIGHT]:
        player_x += 200 * dt / 1000
        moving = True
        facing_right = True

    # Animate only when moving
    if moving:
        frame_timer += dt
        if frame_timer >= FRAME_DURATION:
            frame_timer = 0
            current_frame = (current_frame + 1) % len(frames)
    else:
        current_frame = 0  # idle frame

    screen.fill((50, 50, 80))

    # Draw with flip
    frame = frames[current_frame]
    if not facing_right:
        frame = pygame.transform.flip(frame, True, False)
    screen.blit(frame, (player_x - FRAME_W//2, player_y - FRAME_H//2))

    pygame.display.flip()

pygame.quit()
```

### Tilemap Rendering

```python
# Tilemap: A grid of tile indices mapping to a tileset image
TILE_SIZE = 32

tileset = pygame.image.load("tileset.png").convert_alpha()

# Map data: 0=grass, 1=dirt, 2=stone, 3=water
level_map = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 2, 0, 0, 0],
    [0, 3, 3, 0, 0, 0, 0, 3, 3, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

def get_tile(tileset, index, size):
    """Extract tile from tileset by index (row-major)."""
    cols = tileset.get_width() // size
    col = index % cols
    row = index // cols
    rect = pygame.Rect(col * size, row * size, size, size)
    return tileset.subsurface(rect)

def draw_map(screen, tilemap, tileset, camera_x=0, camera_y=0):
    for row in range(len(tilemap)):
        for col in range(len(tilemap[0])):
            tile_index = tilemap[row][col]
            if tile_index < 0:  # -1 = empty
                continue
            tile = get_tile(tileset, tile_index, TILE_SIZE)
            screen.blit(tile, (
                col * TILE_SIZE - camera_x,
                row * TILE_SIZE - camera_y
            ))
```

## Level 3 — Systems

### Parallax Scrolling

```python
# Parallax: Far layers move slower than near layers
# Creates depth illusion (used since 1980s arcade games)

class ParallaxLayer:
    def __init__(self, image, speed_factor):
        self.image = image
        self.speed_factor = speed_factor  # 0.0 = static, 1.0 = moves with camera
        self.x = 0

    def update(self, camera_dx):
        self.x -= camera_dx * self.speed_factor

    def draw(self, screen):
        # Wrap around for infinite scrolling
        w = self.image.get_width()
        x = self.x % w
        screen.blit(self.image, (x - w, 0))  # Left copy
        screen.blit(self.image, (x, 0))      # Center
        screen.blit(self.image, (x + w, 0))  # Right copy

# Usage:
# background = ParallaxLayer(bg_img, 0.1)   # Sky — moves very slow
# mountains  = ParallaxLayer(mt_img, 0.3)   # Mountains — medium
# foreground = ParallaxLayer(fg_img, 0.7)   # Trees — fast
```

### Sprite Batching

```c
// Sprite batching: group draw calls to reduce GPU state changes
// Without batching: 1000 draw calls = slow
// With batching: 1 draw call for 1000 sprites = fast

// Concept (pseudocode):
typedef struct {
    float x, y;         // position
    float u, v;         // texture coordinates
    float r, g, b, a;   // color tint
} SpriteVertex;

// Pack all sprites into one vertex buffer
// One draw call renders everything
// GPU state change (bind texture) happens once per texture atlas
```

### Animation State Machine

```python
from enum import Enum

class AnimState(Enum):
    IDLE = 1
    RUNNING = 2
    JUMPING = 3
    FALLING = 4

class AnimationController:
    def __init__(self, animations):
        # animations = {AnimState: [frames]}
        self.animations = animations
        self.state = AnimState.IDLE
        self.frame = 0
        self.timer = 0

    def set_state(self, new_state):
        if new_state != self.state:
            self.state = new_state
            self.frame = 0
            self.timer = 0

    def update(self, dt):
        self.timer += dt
        frames = self.animations[self.state]
        if self.timer >= frames.frame_duration:
            self.timer = 0
            self.frame = (self.frame + 1) % len(frames)

    def current_frame(self):
        return self.animations[self.state][self.frame]
```

## Level 4 — Expert

### Texture Atlases and Packing

```
┌──────────────────────────────────────────┐
│ TEXTURE ATLAS (Packed sheet)             │
│ ┌────┐┌────┐┌──────┐                    │
│ │tree││rock││player│ ┌─────┐            │
│ │32x ││16x ││ 64x  │ │house│            │
│ │ 32 ││ 16 ││  64  │ │128x │            │
│ └────┘└────┘│      │ │ 128 │            │
│ ┌──────────┐│      │ └─────┘            │
│ │  ground  │└──────┘                    │
│ │  96 x 16 │                            │
│ └──────────┘                            │
│ One texture bind = all sprites          │
└──────────────────────────────────────────┘

Binary packing algorithms (bin-packing) optimize atlas space.
Tools: TexturePacker, ShoeBox (free)
```

### GPU Skinning for 2D

```c
// Skeletal animation for 2D (Spine, DragonBones)
// Instead of frame-by-frame, define BONES and animate them
// Bone hierarchy: spine → arm → hand
// Each bone has: position, rotation, scale
// Vertices weighted to bones → smooth, memory-efficient animation

// Vertex shader (GLSL) for 2D skeletal animation:
/*
layout(location=0) in vec2 position;
layout(location=1) in vec2 texcoord;
layout(location=2) in vec4 bone_weights;  // 4 bones max
layout(location=3) in ivec4 bone_indices;

uniform mat4 bone_transforms[64];  // Up to 64 bones

void main() {
    mat4 skin = bone_weights.x * bone_transforms[bone_indices.x]
              + bone_weights.y * bone_transforms[bone_indices.y]
              + bone_weights.z * bone_transforms[bone_indices.z]
              + bone_weights.w * bone_transforms[bone_indices.w];
    gl_Position = projection * view * skin * vec4(position, 0.0, 1.0);
}
*/
```

---

## Exercises

1. Load a sprite sheet, extract frames, and create a running animation that plays when arrow keys are held. Flip the sprite when changing direction.
2. Build a tilemap level with at least 3 tile types (grass, dirt, water). Implement camera scrolling that follows a player sprite.
3. Create a parallax background with 3 layers (sky, mountains, ground) that scroll at different speeds as the camera moves.

## Quiz

1. What is a sprite sheet and why is it used?
2. How does a tilemap represent a game level?
3. What is parallax scrolling and how does it create depth?
4. Why is sprite batching important for performance?
5. What is the advantage of skeletal animation over frame-by-frame sprite animation?

---

## Navigation

**Parent**: [[000_GAME_DEV_MOC|GAME-DEV]]

**Synapses**:
- [[001_Game_Loop_And_Engine|GAME-DEV 001]] — Game loop
- [[003_Physics_And_Collision|GAME-DEV 003]] — Sprite collision
- [[004_3D_Graphics_Basics|GAME-DEV 004]] — Texture mapping in 3D
