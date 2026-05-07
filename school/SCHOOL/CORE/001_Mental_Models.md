# 001_Mental_Models

> Engineering thinking frameworks - how to think like a systems architect.

## Level 1 — Intuition

### Concept

A mental model is a simplified representation of how a system works in your mind. Engineers use mental models to:

- Predict system behavior without running code
- Debug issues by tracing through expected vs actual behavior  
- Design solutions by composing known patterns

### Core Mental Models

**1. Input → Process → Output (IPO)**
```
Every program: receives input, transforms it, produces output

Example: cat file.txt → reads file → displays content
         echo "hi" → prints to terminal → shows "hi"
```

**2. Stack Model**
```
Applications sit on layers:
┌─────────────────────────────────┐
│     Your Code                    │
├─────────────────────────────────┤
│     Language Runtime            │
├─────────────────────────────────┤
│     Operating System            │
├─────────────────────────────────┤
│     Hardware                    │
└─────────────────────────────────┘

Bugs can exist at ANY layer
```

**3. State Machine**
```
Systems move between discrete states:
IDLE → PROCESSING → COMPLETE → ERROR

Understanding: what state am I in? What triggers transitions?
```

**4. Contract Model**
```
Functions promise:
- What inputs they accept (preconditions)
- What outputs they produce (postconditions)
- What side effects occur (guarantees)

Breaking contracts → unexpected behavior → bugs
```

### Visualization

```
     ┌──────────────┐
     │  Mental     │
     │  Model     │
     │  Library   │
     └──────┬──────┘
            │
      ┌─────┼─────┐
      │     │     │
    IPO  Stack State  Contract
    Model Model   Model
```

## Level 2 — Practical

### Building Your Model Library

1. **For every system you use, ask:**
   - What inputs does it take?
   - What outputs does it produce?
   - What can go wrong?
   - How does it handle failure?

2. **Trace through before debugging:**
   - What SHOULD happen?
   - What IS happening?
   - Where do they diverge?

## Level 3 — Systems

### Advanced Models

**Distributed Systems:**
- CAP Theorem: Consistency, Availability, Partition Tolerance - pick 2
- Eventual Consistency: Accept temporary inconsistency for availability
- Leader Election: How nodes agree on a coordinator

**Concurrency:**
- Race Condition: Timing-dependent bugs
- Deadlock: Circular waiting
- Livelock: Continuously responding but making no progress

## Level 4 — Expert

### Pattern Recognition

Expert engineers recognize which mental model applies:

| Problem Type | Model |
|-------------|-------|
| "Why did this crash?" | State machine - what state triggered crash? |
| "Why is it slow?" | Stack model - which layer is bottleneck? |
| "Why did it return wrong?" | Contract model - what was the input? |
| "Why did behavior change?" | Dependency model - what changed upstream? |

---

## Navigation

**Parent**: [[000_CORE_MOC|CORE]]

**Synapses**:
- [[001_Filesystem|LINUX 001]] - Filesystem mental model
- [[001_TCP_IP|NETWORKING 001]] - Network stack model
- [[001_Game_Loops|GAME-DEV 001]] - Game loop state machine