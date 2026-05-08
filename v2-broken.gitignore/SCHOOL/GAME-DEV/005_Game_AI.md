# 005_Game_AI

> Pathfinding (A*), behavior trees, state machines, and NPC logic.

## Level 1 — Intuition

### Concept

Game AI is not real AI — it's a set of techniques to make NPCs seem intelligent. The bar is "suspension of disbelief": the player should feel like enemies are making decisions, not just following scripts.

### AI Techniques by Complexity

```
Simple ←──────────────────────────────→ Complex
  │                │               │
Finite State    Behavior        GOAP
  Machine        Trees       (Goal-Oriented
 (FSM)         (BT)          Action Planning)

Games use the SIMPLEST technique that works.
FSM covers 80% of game AI needs.
```

## Level 2 — Practical

### Finite State Machine (FSM)

```python
from enum import Enum, auto

class EnemyState(Enum):
    IDLE = auto()
    PATROL = auto()
    CHASE = auto()
    ATTACK = auto()
    DEAD = auto()

class Enemy:
    def __init__(self, x, y):
        self.x, self.y = x, y
        self.state = EnemyState.IDLE
        self.target = None
        self.attack_range = 30
        self.detect_range = 200

    def update(self, player, dt):
        dist = self.distance_to(player)

        if self.state == EnemyState.IDLE:
            if dist < self.detect_range:
                self.state = EnemyState.CHASE
            elif self.wait_timer <= 0:
                self.state = EnemyState.PATROL

        elif self.state == EnemyState.PATROL:
            self.move_to_patrol_point(dt)
            if dist < self.detect_range:
                self.state = EnemyState.CHASE
            elif self.reached_patrol_point():
                self.state = EnemyState.IDLE

        elif self.state == EnemyState.CHASE:
            self.move_toward(player, dt)
            if dist < self.attack_range:
                self.state = EnemyState.ATTACK
            elif dist > self.detect_range * 1.5:
                self.state = EnemyState.IDLE
            elif self.lost_sight_timer > 5.0:
                self.state = EnemyState.PATROL

        elif self.state == EnemyState.ATTACK:
            if dist > self.attack_range:
                self.state = EnemyState.CHASE
            else:
                self.attack()
```

### A* Pathfinding

```python
import heapq

def heuristic(a, b):
    """Manhattan distance on a grid."""
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def a_star(grid, start, goal):
    """A* pathfinding on a 2D grid. 0=walkable, 1=blocked."""
    rows, cols = len(grid), len(grid[0])
    open_set = []
    heapq.heappush(open_set, (0, start))

    came_from = {}
    g_score = {start: 0}    # Cost from start
    f_score = {start: heuristic(start, goal)}  # Estimated total

    neighbors = [(0,1), (1,0), (0,-1), (-1,0)]  # 4-directional

    while open_set:
        _, current = heapq.heappop(open_set)

        if current == goal:
            # Reconstruct path
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            return path[::-1]

        for dx, dy in neighbors:
            nx, ny = current[0] + dx, current[1] + dy
            if not (0 <= nx < cols and 0 <= ny < rows):
                continue
            if grid[ny][nx] == 1:  # Blocked
                continue

            tentative_g = g_score[current] + 1
            neighbor = (nx, ny)

            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None  # No path found

# Example:
grid = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
]
path = a_star(grid, (0, 0), (4, 4))
print(path)  # [(0,0), (0,1), (0,2), (0,3), (1,3), (2,3), (3,3), (3,4), (4,4)]
```

## Level 3 — Systems

### Behavior Trees

```
Behavior Tree for an Enemy Guard:
                    ┌────?────┐  (Selector: try children left→right)
                    │         │
             ┌──────┘         └──────┐
          ┌──?──┐                 ┌──→──┐ (Sequence: all must succeed)
          │     │                 │     │
     ┌────┘   ┌─┴─┐        ┌─────┤     └────┐
  ┌──?──┐  ┌─?──┐│     ┌──?──┐ ┌──?──┐ ┌──?──┐
  │     │  │    ││     │     │ │     │ │     │
┌─┴─┐ ┌─┴─┐ │  ││   ┌─┴─┐ ┌─┴─┐  │  ┌─┴─┐ ┌─┴─┐
│Is │ │See│ │  ││   │Go │ │Atk│  │  │Rtn │ │Rpt│
│HP │ │En?│ │  ││   │To │ │Ene│  │  │To  │ │ 5s│
│<20│ │   │ │  ││   │Ene│ │my │  │  │Post│ │   │
└───┘ └───┘ │  ││   └───┘ └───┘  │  └───┘ └───┘
  ↓     ↓   │  ││     ↓     ↓    │    ↓     ↓
 FLEE  CHASE│  ││   MOVE  ATTACK │  PATROL  WAIT
            │  ││                │
     ┌──────┘  ││                │
   ┌─┴─┐     ┌─┴┴─┐        ┌─────┘
   │Go │     │Hear│        │
   │To │     │Nois│        │
   │Hlth│    │e?  │        │
   └───┘     └────┘        │
     ↓         ↓           │
   HEAL    INVESTIGATE     │
                          │
              COMBAT BRANCH      PATROL BRANCH
```

```python
# Minimal behavior tree implementation
class Node:
    def tick(self, context):
        raise NotImplementedError

class Selector(Node):
    """Returns SUCCESS on first child that succeeds."""
    def __init__(self, children):
        self.children = children
    def tick(self, ctx):
        for child in self.children:
            if child.tick(ctx) == "SUCCESS":
                return "SUCCESS"
        return "FAILURE"

class Sequence(Node):
    """Succeeds only if ALL children succeed."""
    def __init__(self, children):
        self.children = children
    def tick(self, ctx):
        for child in self.children:
            if child.tick(ctx) == "FAILURE":
                return "FAILURE"
        return "SUCCESS"

class Condition(Node):
    def __init__(self, check_fn):
        self.check = check_fn
    def tick(self, ctx):
        return "SUCCESS" if self.check(ctx) else "FAILURE"

class Action(Node):
    def __init__(self, action_fn):
        self.action = action_fn
    def tick(self, ctx):
        self.action(ctx)
        return "SUCCESS"
```

### Navigation Meshes (NavMesh)

```
Instead of grid-based pathfinding, use a polygon mesh:

┌────────────────────────┐
│  ┌──┐    ┌─────────┐   │
│  │  │    │         │   │  Gray = walkable polygons
│  │  │    │         │   │  White = obstacles
│  └──┘    └────┬────┘   │
│  ┌───────────┼────┐    │
│  │           │    │    │
│  │    ┌──────┘    │    │
│  │    │           │    │
│  └────┴───────────┘    │
└────────────────────────┘

Pathfinding: find polygon path, then smooth corners.
A* on the polygon adjacency graph (not grid cells).
Much fewer nodes → faster, smoother paths.
```

## Level 4 — Expert

### Steering Behaviors

```python
# Steering: Combine simple forces for emergent behavior
class Steering:
    @staticmethod
    def seek(agent, target):
        """Move toward target."""
        desired = (target - agent.pos).normalize() * agent.max_speed
        return desired - agent.velocity

    @staticmethod
    def flee(agent, threat):
        """Move away from threat."""
        desired = (agent.pos - threat).normalize() * agent.max_speed
        return desired - agent.velocity

    @staticmethod
    def pursuit(agent, target):
        """Predict where target will be."""
        # If target is ahead and facing us, seek target
        # Otherwise, seek a point ahead of target
        look_ahead = target.velocity.magnitude() * 2.0
        future_pos = target.pos + target.velocity.normalize() * look_ahead
        return Steering.seek(agent, future_pos)

    @staticmethod
    def separation(agent, neighbors):
        """Steer away from nearby agents."""
        force = Vec2(0, 0)
        for other in neighbors:
            diff = agent.pos - other.pos
            dist = diff.magnitude()
            if dist < agent.separation_radius and dist > 0:
                force += diff.normalize() / dist
        return force

    # Combine: flocking = separation + alignment + cohesion
```

### Goal-Oriented Action Planning (GOAP)

```
GOAP = FSM's smarter cousin

Instead of hand-crafted transitions, define:
1. World state: {hungry: true, has_weapon: false, enemy_near: true}
2. Actions: each has preconditions and effects
   - "Eat Food": pre={has_food: true}, post={hungry: false}
   - "Pick Up Sword": pre={sword_near: true}, post={has_weapon: true}
3. Goal: {hungry: false, enemy_near: false}

AI planner chains actions to reach goal state:
Goal: not hungry → need food → need to find food → walk to kitchen
```

---

## Exercises

1. Implement a 3-state FSM for an enemy: IDLE (look around), CHASE (follow player), ATTACK (when close). Add transitions based on distance.
2. Implement A* pathfinding on a grid with walls. Visualize the path. Add diagonal movement support (8-directional).
3. Build a simple behavior tree with: a Selector root, two Sequences underneath — one for "combat" (detect enemy → chase → attack) and one for "patrol" (move to waypoint → wait → next waypoint).

## Quiz

1. When would you use a behavior tree instead of an FSM?
2. What's the time complexity of A* pathfinding?
3. How does a NavMesh differ from a grid for pathfinding?
4. What are the three steering behaviors that make up flocking?
5. How does GOAP differ from a finite state machine?

---

## Navigation

**Parent**: [[000_GAME_DEV_MOC|GAME-DEV]]

**Synapses**:
- [[001_Game_Loop_And_Engine|GAME-DEV 001]] — AI in update loop
- [[003_Algorithms|CORE 003]] — Graph algorithms (A*)
- [[005_Operating_Systems|CORE 005]] — State machines in practice
