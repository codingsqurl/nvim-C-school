# 001_Language_Paradigms

> What makes languages different and how to choose the right one.

## Level 1 — Intuition

### Concept

A programming language is a formal notation for describing computations. Every language sits at a point in a multi-dimensional design space defined by paradigm, type system, execution model, and memory management.

### Paradigm Taxonomy

```
                    Programming Languages
                            │
            ┌───────────────┼───────────────┐
            │               │               │
       Imperative      Declarative      Hybrid
            │               │               │
    ┌───────┼───────┐   ┌───┼───┐       ┌──┼──┐
Procedural  OOP  Systems  Functional  Logic  Reactive
    │        │      │        │         │       │
    C      Java    Rust    Haskell   Prolog   Elm
  Pascal   C++      C       OCaml
```

### Compiled vs Interpreted

| Trait | Compiled (C, Rust, Go) | Interpreted (Python, JS, Ruby) |
|-------|----------------------|-------------------------------|
| Translation | Ahead-of-time to machine code | At runtime by interpreter |
| Startup | Instant | Interpreter must load first |
| Speed | Faster (native instructions) | Slower (overhead per operation) |
| Portability | Recompile per target | Interpreter handles differences |
| Debugging | Separate debug symbols | Run-time introspection |
| JIT hybrid | — | JVM, V8, LuaJIT bridge the gap |

### Type Systems

```
Strong ←──────────────────────────→ Weak
(Python: "1" + 1 → TypeError)      (JS: "1" + 1 → "11")

Static ←──────────────────────────→ Dynamic
(Rust: type checked at compile)     (Python: type checked at runtime)
```

**Not the same axis.** C is statically typed but weakly typed (void* casts allowed). Python is dynamically typed but strongly typed (no implicit coercion).

### How to Choose a Language

1. Domain match: systems → C/Rust, web → JS, data → Python
2. Performance needs: latency-sensitive → compiled
3. Team expertise: existing knowledge matters
4. Ecosystem: libraries and tooling available
5. Longevity: will this language be maintained in 10 years?

---

## Level 2 — Practical

### Hello World Across Paradigms

```c
// C — procedural, compiled, static types
#include <stdio.h>
int main(void) {
    printf("Hello, World!\n");
    return EXIT_SUCCESS;
}
```

```rust
// Rust — systems, compiled, ownership model
fn main() {
    println!("Hello, World!");
}
```

```python
# Python — imperative scripting, dynamic types
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
```

```haskell
-- Haskell — purely functional, lazy evaluation
main :: IO ()
main = putStrLn "Hello, World!"
```

```javascript
// JavaScript — event-driven, prototype-based OOP
console.log("Hello, World!");
```

---

## Level 3 — Systems

### Memory Model Comparison

```
Manual (C/C++)            GC (Java/Go/C#)       Ownership (Rust)
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ malloc/free  │     │  Allocate    │     │  Borrow      │
│              │     │     ↓        │     │  Checker     │
│ You control  │     │  Mark &      │     │     ↓        │
│ everything   │     │  Sweep       │     │  Compile-    │
│              │     │     ↓        │     │  time drops  │
│ Risk: leaks  │     │  Free unused │     │              │
│        bugs  │     │              │     │  Safe + Fast │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Level 4 — Expert

### Language Design Decisions

Every language author makes deliberate tradeoffs. Understanding these reveals why languages look and behave differently:

| Design Choice | Example | Consequence |
|--------------|---------|-------------|
| Homoiconicity | Lisp: code is data | Macros transform AST directly |
| Actor model | Erlang/Elixir | Isolated processes, "let it crash" |
| Null safety | Kotlin/Swift | Option types eliminate billion-dollar mistake |
| Structural typing | TypeScript/Go | Interfaces satisfied implicitly |

---

## EXERCISES

1. Write hello world in 5 languages. For each, trace: compilation step, entry point, I/O mechanism.
2. Classify these languages by paradigm: Lisp, C, Java, Prolog, SQL, Rust, Python, Haskell.
3. Given a task (e.g., parse JSON from network, serve HTTP), pick a language and justify with 3 reasons.
4. Research one language's type system design document. List 3 deliberate tradeoffs they made.
5. Compare error handling: C (return codes), Python (exceptions), Rust (Result), Go (error values).

## QUIZ

1. What is the key difference between compiled and interpreted languages?
2. Can a language be both statically typed and weakly typed? Give an example.
3. Name one language for each of the four main paradigms.
4. Why might you choose Python over Rust for a production web service?
5. What problem does Rust's ownership model solve that C and Java each handle differently?

---

## Navigation

**Parent**: [[000_LANGUAGES_MOC|LANGUAGES]]

**Synapses**:
- [[001_Mental_Models|CORE 001]] - Stack model of compilation
- [[002_C_Deep_Dive|LANGUAGES 002]] - C systems programming
- [[003_Rust_Ownership|LANGUAGES 003]] - Ownership deep dive
- [[004_Scripting_Languages|LANGUAGES 004]] - Scripting comparison
