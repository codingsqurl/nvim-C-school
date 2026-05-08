# 006_Shipping_A_Game

> Polish, optimization, publishing, and marketing basics for indie developers.

## Level 1 — Intuition

### Concept

The last 10% of development is 90% of the work. Shipping means cutting features, fixing the right bugs, optimizing what matters, and actually releasing. A shipped game > a perfect game that never ships.

### The Shipping Mindset

```
Pre-Production → Production → Polish → Ship → Post-Launch
      │               │          │        │         │
   "Fun idea"    "It works"  "It feels  "It's   "Updates &
                              good"      out!"    community"

Most developers quit during Polish.
This is where games become great.
```

### Minimum Viable Product (MVP) for Games

```
Core loop MUST work:
┌──────────────────────────────────────┐
│  Player Action → System Response →   │
│  Feedback → Next Player Action       │
└──────────────────────────────────────┘

Everything else is polish:
- Main menu        ← Nice, not essential
- Settings screen  ← Nice, not essential
- Particle effects ← Nice, not essential
- Sound design     ← Important, but can layer
- Save system      ← Essential for long games
```

## Level 2 — Practical

### Performance Profiling

```bash
# Linux profiling tools for game dev
perf record -g ./my_game            # CPU sampling
perf report                          # View flame graph data
perf stat ./my_game                  # Hardware counters

# GPU profiling
# NVIDIA: nvidia-smi, nvtop
# AMD: radeontop
# Vulkan: RenderDoc (frame capture)

# Memory
valgrind --tool=massif ./my_game     # Heap profiler
heaptrack ./my_game                  # GUI memory profiler
```

```python
# Simple frame timer for profiling
import time
from collections import deque

class FrameProfiler:
    def __init__(self, window_size=120):
        self.times = {name: deque(maxlen=window_size)
                      for name in ['input', 'update', 'render', 'total']}
        self.current = {}

    def start(self, section):
        self.current[section] = time.perf_counter()

    def end(self, section):
        elapsed = (time.perf_counter() - self.current[section]) * 1000
        self.times[section].append(elapsed)

    def report(self):
        for name, samples in self.times.items():
            if samples:
                avg = sum(samples) / len(samples)
                print(f"  {name:10s}: {avg:5.1f}ms avg")
```

### Common Optimization Targets

```c
// 1. Reduce draw calls — batch sprites (texture atlas)
// Before: 500 glDrawArrays = 500 draw calls
// After: 1 glMultiDrawArrays = 1 draw call

// 2. Object pooling — reuse instead of malloc/free
#define MAX_BULLETS 100

typedef struct { float x, y, vx, vy; bool active; } Bullet;
Bullet bullet_pool[MAX_BULLETS] = {0};

Bullet* bullet_spawn(float x, float y) {
    for (int i = 0; i < MAX_BULLETS; i++) {
        if (!bullet_pool[i].active) {
            bullet_pool[i] = (Bullet){x, y, 0, -400, true};
            return &bullet_pool[i];
        }
    }
    return NULL;  // Pool exhausted
}

void bullet_despawn(Bullet *b) {
    b->active = false;  // Just mark inactive, no free()
}

// 3. Spatial partitioning — don't check everything vs everything
// Use grid, quadtree, or spatial hash (see 003_Physics_And_Collision)

// 4. LOD (Level of Detail) — simpler models at distance
// Far away = low-poly mesh, low-res texture, simpler shader

// 5. Culling — don't render what's off-screen
// Frustum culling: discard objects outside camera view
// Occlusion culling: discard objects hidden behind walls
```

### Build and Release Pipeline

```yaml
# .github/workflows/release.yml — Automated game builds
name: Build and Release

on:
  push:
    tags: ['v*']

jobs:
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: |
          mkdir build && cd build
          cmake .. -DCMAKE_BUILD_TYPE=Release
          cmake --build . -j$(nproc)
      - name: Package
        run: |
          tar -czf mygame-linux-x64.tar.gz build/mygame assets/
      - uses: softprops/action-gh-release@v1
        with:
          files: mygame-linux-x64.tar.gz
```

## Level 3 — Systems

### Game Polish Checklist

```
□ Juice — feedback for every action
  □ Screen shake on explosions
  □ Flash white on damage
  □ Squash-and-stretch on jumps
  □ Sound effects for every interaction

□ Game Feel
  □ Input buffer (accept input slightly before landing)
  □ Coyote time (allow jump briefly after leaving platform)
  □ Jump apex hang time
  □ Acceleration curves (not instant start/stop)

□ UI/UX
  □ Button hover states
  □ Transition animations between screens
  □ Loading screen (not a freeze)
  □ Tutorial (show, don't tell)

□ Accessibility
  □ Remappable controls
  □ Subtitle support
  □ Colorblind modes
  □ Adjustable text size
```

### Save Systems

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    int level;
    int health;
    int score;
    float playtime;
    // NEVER store pointers in save data!
} SaveData;

// Binary save (compact, fast)
int save_game(const char *path, SaveData *data) {
    FILE *f = fopen(path, "wb");
    if (!f) return -1;

    // Version header for forward compatibility
    uint32_t version = 1;
    fwrite(&version, sizeof(version), 1, f);
    fwrite(data, sizeof(SaveData), 1, f);

    // Checksum for integrity
    uint32_t checksum = crc32(data, sizeof(SaveData));
    fwrite(&checksum, sizeof(checksum), 1, f);

    fclose(f);
    return 0;
}

int load_game(const char *path, SaveData *data) {
    FILE *f = fopen(path, "rb");
    if (!f) return -1;

    uint32_t version;
    fread(&version, sizeof(version), 1, f);
    fread(data, sizeof(SaveData), 1, f);

    uint32_t checksum, expected;
    fread(&checksum, sizeof(checksum), 1, f);
    expected = crc32(data, sizeof(SaveData));

    fclose(f);
    return (checksum == expected) ? 0 : -2;  // -2 = corrupt
}
```

## Level 4 — Expert

### Publishing Platforms

| Platform | Cut | Best For | Requirements |
|----------|-----|----------|--------------|
| Steam | 30% | PC, largest audience | $100 fee, Steamworks SDK |
| itch.io | 0-10% | Indie, web games | None (open revenue share) |
| Epic Store | 12% | PC, curated | Invitation or submission |
| GOG | 30% | DRM-free PC | Curation process |
| Google Play | 15-30% | Mobile | $25 one-time fee |
| App Store | 15-30% | iOS | $99/year, Mac required |

### Marketing Fundamentals

```
Marketing Timeline:
6 months before launch:
  □ Create Steam page (wishlists = algorithm boost)
  □ Start devlog (YouTube, blog, TIGSource)
  □ Post GIFs on Twitter/Reddit weekly
  □ Build mailing list (landing page + newsletter)

3 months before:
  □ Send keys to press/YouTubers
  □ Steam Next Fest (demo festival)
  □ Discord server for community

1 month before:
  □ Launch trailer
  □ Press release to gaming sites
  □ Streamers/Let's Play outreach

Launch week:
  □ Be online 24/7 for bug reports
  □ Post launch announcement everywhere
  □ Respond to EVERY Steam review
```

### Post-Launch

```python
# Analytics you should track
post_launch_metrics = {
    "wishlist_conversion": "Wishlists → purchases ratio (target: >15%)",
    "median_playtime": "If < 1 hour → tutorial/onboarding issue",
    "refund_rate": "If > 15% → serious problems, investigate",
    "review_score": "Respond to negative reviews, fix complaints fast",
    "daily_active_users": "Track retention curve (D1, D7, D30)",
    "crash_rate": "% of sessions ending in crash (target: <1%)",
}
```

---

## Exercises

1. Profile a game (or a simple program you've written) with `perf` or `valgrind`. Identify the top 3 functions by CPU time and suggest optimizations.
2. Write a save/load system for a game that stores player position, inventory (array of item IDs), and current level. Include versioning and a checksum.
3. Create a marketing checklist for a hypothetical indie game. Draft 3 social media posts (one GIF, one screenshot, one dev update) targeting different platforms.

## Quiz

1. What's the difference between a game that "works" and one that's "polished"?
2. Why is object pooling important in game development?
3. What is "game feel" and name two techniques for improving it.
4. Why include a version number in save files?
5. What's the most important thing to have on Steam before launch day?

---

## Navigation

**Parent**: [[000_GAME_DEV_MOC|GAME-DEV]]

**Synapses**:
- [[005_Game_AI|GAME-DEV 005]] — AI optimization
- [[002_Data_Structures|CORE 002]] — Object pooling with data structures
- [[006_Platform_Engineering|DEVOPS 006]] — Build pipeline automation
