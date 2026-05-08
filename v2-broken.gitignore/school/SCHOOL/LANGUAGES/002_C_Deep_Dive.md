# 002_C_Deep_Dive

> C: the lingua franca of systems programming — pointers, memory, and the metal.

## Level 1 — Intuition

### Concept

C is the lowest-level portable language. It maps nearly 1:1 to assembly while providing structured programming. It powers operating systems (Linux, Windows), databases, and embedded firmware.

### Where C Lives

```
┌──────────────────────────────────┐
│  Application Layer (Python/JS)   │
├──────────────────────────────────┤
│  Library Layer                    │
│  ┌────────────┐  ┌────────────┐  │
│  │   CPython  │  │   Node.js  │  │   ← WRITTEN IN C
│  └────────────┘  └────────────┘  │
├──────────────────────────────────┤
│  Operating System (Linux Kernel)  │   ← WRITTEN IN C
├──────────────────────────────────┤
│  Hardware                         │
└──────────────────────────────────┘
```

## Level 2 — Practical

### Pointers and Memory

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    // Stack allocation — automatic lifetime
    int stack_var = 42;
    int *sp = &stack_var;        // & → address of
    printf("Stack: %d\n", *sp);  // * → dereference

    // Heap allocation — manual lifetime
    int *hp = malloc(sizeof(int));
    if (hp == NULL) {
        fprintf(stderr, "malloc failed\n");
        return 1;
    }
    *hp = 99;
    printf("Heap:  %d\n", *hp);
    free(hp);                    // MUST free heap memory

    return 0;
}
```

### Structs, Unions, Enums

```c
#include <stdint.h>

typedef enum { ERROR, WARN, INFO } LogLevel;

typedef union {
    int   i;
    float f;
    char  bytes[4];
} Value;

typedef struct {
    const char *msg;
    LogLevel    level;
    Value       data;
} LogEntry;

int main(void) {
    LogEntry e = {
        .msg   = "Sensor reading",
        .level = WARN,
        .data  = { .i = 42 }
    };
    printf("[%d] %s: %d\n", e.level, e.msg, e.data.i);
    return 0;
}
```

### The Preprocessor

```c
// Macros — text substitution, no type safety
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// Conditional compilation
#ifdef DEBUG
    #define LOG(msg) fprintf(stderr, "[DEBUG] %s\n", msg)
#else
    #define LOG(msg) ((void)0)
#endif

// Include guards (traditional) — use #pragma once where supported
#ifndef CONFIG_H
#define CONFIG_H
// ... declarations
#endif
```

---

## Level 3 — Systems

### Stack vs Heap Visualized

```
High Address
┌────────────┐
│   Stack    │  ← Grows DOWNWARD (LIFO frames)
│   ↓↓↓↓↓    │     int x;          (fast, automatic)
│   (gap)    │
│   ↑↑↑↑↑    │
│   Heap     │  ← Grows UPWARD (malloc/free)
├────────────┤     int *p = malloc(...)
│  Data/BSS  │  ← Globals, statics
├────────────┤
│   Text     │  ← Executable code
└────────────┘
Low Address
```

### Common Pitfalls

```c
// BUFFER OVERFLOW — the #1 C vulnerability
char buf[8];
strcpy(buf, "this string is way too long"); // WRITES PAST buf[7]

// USE-AFTER-FREE
int *p = malloc(sizeof(int));
free(p);
*p = 42;  // UNDEFINED BEHAVIOR — memory may be reused

// DANGLING POINTER
int *get_local(void) {
    int x = 5;
    return &x;  // x dies when function returns — DANGER
}

// MEMORY LEAK
void leak(void) {
    int *p = malloc(1000);
    // forgot free(p) — memory lost forever
}

// INTEGER OVERFLOW
int a = INT_MAX;
a++;  // wraps to INT_MIN — undefined for signed
```

---

## Level 4 — Expert

### Memory Allocator Design

```c
// Simple bump allocator — arena pattern
typedef struct {
    char  *buffer;
    size_t capacity;
    size_t offset;
} Arena;

Arena arena_create(size_t size) {
    return (Arena){
        .buffer   = malloc(size),
        .capacity = size,
        .offset   = 0
    };
}

void *arena_alloc(Arena *a, size_t size) {
    if (a->offset + size > a->capacity) return NULL;
    void *ptr = a->buffer + a->offset;
    a->offset += size;
    return ptr;
}

void arena_reset(Arena *a) { a->offset = 0; }
void arena_destroy(Arena *a) { free(a->buffer); }
```

---

## EXERCISES

1. Implement a singly linked list with `push`, `pop`, `insert_at`, and `free_list`. Use `malloc/free` and handle null cases.
2. Write a simple bump allocator (arena) that allocates from a fixed buffer. Add `arena_reset`.
3. Write a program that intentionally creates a buffer overflow, then fix it with `snprintf`/bounds checking.
4. Implement a tagged union using `enum` + `union` + `struct`. Write a function that dispatches on the tag.
5. Compile with `-Wall -Wextra -fsanitize=address` and fix all warnings and sanitizer errors.

## QUIZ

1. What is the difference between `malloc` and `calloc`?
2. Why is `sizeof(array)` inside a function not the same as outside?
3. What is undefined behavior, and why does C rely on it?
4. Explain the "strict aliasing" rule and when `char*` is an exception.
5. What does `restrict` keyword promise to the compiler?

---

## Navigation

**Parent**: [[000_LANGUAGES_MOC|LANGUAGES]]

**Synapses**:
- [[001_Language_Paradigms|LANGUAGES 001]] - Language paradigms
- [[003_Rust_Ownership|LANGUAGES 003]] - Rust's answer to C's problems
- [[001_Filesystem|LINUX 001]] - C runs Linux
- [[001_Mental_Models|CORE 001]] - Stack model in C
