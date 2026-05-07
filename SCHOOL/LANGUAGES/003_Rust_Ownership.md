# 003_Rust_Ownership

> Rust's ownership system — memory safety without a garbage collector.

## Level 1 — Intuition

### Concept

Rust eliminates entire classes of bugs at compile time through its ownership system. Every value has exactly one owner. When the owner goes out of scope, the value is dropped. This gives C-like performance without C's memory bugs.

### The Three Rules

```
1. Each value in Rust has a variable called its OWNER
2. There can only be ONE owner at a time
3. When the owner goes out of scope, the value is DROPPED

    OWNERSHIP     →       BORROWING      →       LIFETIMES
   (who owns)          (who can use)           (how long valid)
```

## Level 2 — Practical

### Ownership in Action

```rust
fn main() {
    let s1 = String::from("hello");  // s1 owns the String
    let s2 = s1;                      // s1 MOVED to s2
    // println!("{}", s1);            // COMPILE ERROR: s1 invalid

    let s3 = s2.clone();              // deep copy — both valid
    println!("s2: {}, s3: {}", s2, s3);

    let len = calculate_length(&s2);  // borrow — s2 still valid
    println!("length of '{}' is {}", s2, len);
}

fn calculate_length(s: &String) -> usize {  // immutable borrow
    s.len()
}  // borrow ends, s2 still owns the String
```

### Borrowing Rules

```rust
fn main() {
    let mut data = vec![1, 2, 3];

    // ANY NUMBER of immutable borrows simultaneously
    let r1 = &data;
    let r2 = &data;
    println!("{} {}", r1[0], r2[0]);

    // ONLY ONE mutable borrow at a time
    let r3 = &mut data;
    r3.push(4);
    // let r4 = &data;  // ERROR: cannot borrow as immutable while mutable
    println!("{:?}", r3);
    // r1 and r2 are no longer used here — non-lexical lifetimes allow this
}
```

### Traits and Generics

```rust
trait Summary {
    fn summarize(&self) -> String;

    fn default_summary(&self) -> String {
        String::from("(Read more...)")
    }
}

struct Article {
    headline: String,
    body: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} — {}", self.headline, &self.body[..40.min(self.body.len())])
    }
}

fn notify(item: &impl Summary) {
    println!("Breaking: {}", item.summarize());
}
```

---

## Level 3 — Systems

### Error Handling

```rust
use std::fs::{self, File};
use std::io::{self, Read};

fn read_username() -> Result<String, io::Error> {
    let mut file = File::open("config.txt")?;  // ? propagates error
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username.trim().to_string())
}

fn main() {
    match read_username() {
        Ok(name) => println!("User: {}", name),
        Err(e) => eprintln!("Error reading config: {}", e),
    }

    // Option<T> handles absence of value (no null!)
    let config = fs::read_to_string("config.toml").ok();
    let port = config
        .and_then(|c| c.lines().find(|l| l.starts_with("port =")))
        .and_then(|l| l.split('=').nth(1))
        .and_then(|p| p.trim().parse::<u16>().ok())
        .unwrap_or(8080);
    println!("Port: {}", port);
}
```

### Rust vs C — Same Logic

```c
// C — manual everything, potential for bugs
void process_log(const char *path) {
    FILE *f = fopen(path, "r");
    if (!f) return;
    char *line = malloc(256);
    if (!line) { fclose(f); return; }
    while (fgets(line, 256, f)) {
        char *trimmed = trim(line);    // must free trimmed? whose job?
        printf("%s\n", trimmed);
    }
    free(line);
    fclose(f);
}
```

```rust
// Rust — ownership and RAII handle cleanup
fn process_log(path: &str) -> io::Result<()> {
    let file = File::open(path)?;
    for line in io::BufReader::new(file).lines() {
        let trimmed = line?.trim().to_string();
        println!("{}", trimmed);
        // trimmed dropped here — String freed
    }
    // file dropped here — File closed
    Ok(())
}
```

---

## Level 4 — Expert

### Lifetimes Annotated

```rust
// Without lifetime annotation, compiler can't verify safety
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// Structs holding references need lifetime params
struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    fn announce_and_return(&self, msg: &str) -> &str {
        println!("{}", msg);
        self.part
    }
}
```

---

## EXERCISES

1. Rewrite the C linked list from `002_C_Deep_Dive` in safe Rust using `Box<Node>`.
2. Implement a `Temperature` type that prevents invalid values (e.g., below absolute zero) using the type system.
3. Build a file reader that chains `Result` and `Option` with `.map()`, `.and_then()`, and `?`.
4. Write a function with explicit lifetime annotations. Remove them one by one. Which ones does the compiler infer?
5. Take a C program you've written and port it to Rust. Count: how many potential bugs did Rust catch at compile time?

## QUIZ

1. What is the difference between moving, cloning, and borrowing?
2. Why does Rust forbid both mutable and immutable borrows simultaneously?
3. What does the `?` operator do?
4. How does Rust handle the "null pointer" problem?
5. What is the purpose of lifetime elision rules?

---

## Navigation

**Parent**: [[000_LANGUAGES_MOC|LANGUAGES]]

**Synapses**:
- [[002_C_Deep_Dive|LANGUAGES 002]] - C deep dive
- [[001_Language_Paradigms|LANGUAGES 001]] - Type systems
- [[001_Mental_Models|CORE 001]] - Contract model
- [[004_Scripting_Languages|LANGUAGES 004]] - When Rust is overkill
