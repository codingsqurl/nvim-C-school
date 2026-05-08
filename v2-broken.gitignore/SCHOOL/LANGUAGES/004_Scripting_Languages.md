# 004_Scripting_Languages

> Python, JavaScript, Ruby, Lua — rapid development, glue code, and tradeoffs.

## Level 1 — Intuition

### Concept

Scripting languages prioritize developer velocity over runtime performance. They trade compilation for runtime interpretation (or JIT), static types for dynamic dispatch, and manual memory for garbage collection.

### When Scripting Wins

```
Development Speed vs Execution Speed

  Fast Dev                    Balanced                    Fast Exec
┌────────────┐          ┌─────────────┐          ┌──────────────┐
│  Python    │          │    Java     │          │    Rust       │
│  Ruby      │          │    Go       │          │    C          │
│  JS        │          │    C#       │          │    Zig        │
│  Lua       │          │             │          │              │
└────────────┘          └─────────────┘          └──────────────┘
     ↑                                                 ↑
  Prototypes,                                       Kernels,
  scripts,                                          game engines,
  data analysis                                     embedded
```

---

## Level 2 — Practical

### Same Task, Four Languages

*Task: Read a CSV, filter rows, compute sum*

```python
# Python — readability first
import csv

def process_csv(path):
    with open(path) as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader if int(r['qty']) > 0]
        total = sum(int(r['price']) * int(r['qty']) for r in rows)
    return total
```

```javascript
// JavaScript — async by default in Node
const fs = require('fs');

function processCsv(path) {
    const lines = fs.readFileSync(path, 'utf8').split('\n');
    const [header, ...data] = lines;
    return data
        .map(l => l.split(','))
        .filter(([, qty]) => parseInt(qty) > 0)
        .reduce((sum, [, price, qty]) => sum + price * qty, 0);
}
```

```ruby
# Ruby — elegant method chaining
require 'csv'

def process_csv(path)
  CSV.read(path, headers: true)
     .select { |r| r['qty'].to_i > 0 }
     .sum  { |r| r['price'].to_i * r['qty'].to_i }
end
```

```lua
-- Lua — minimal and embeddable
function process_csv(path)
  local total, line = 0, io.lines(path)
  line() -- skip header
  for l in line do
    local _, _, price, qty = string.find(l, "([^,]+),([^,]+)")
    total = total + tonumber(price) * tonumber(qty)
  end
  return total
end
```

### Package Ecosystems

| Language | Manager | Registry | Key Package |
|----------|---------|----------|-------------|
| Python | pip/poetry/uv | PyPI | numpy, pandas, flask |
| JavaScript | npm/yarn/pnpm | npmjs.com | react, express, lodash |
| Ruby | bundler | rubygems.org | rails, rspec, devise |
| Lua | luarocks | luarocks.org | lpeg, busted, luasocket |

---

## Level 3 — Systems

### Performance Landscape

```
                    Python CPython  ########──── (1x baseline)
                    Python PyPy     ########──── (2-5x faster)
                    Ruby MRI        ####─────── (0.8x)
                    LuaJIT          ############──── (10-50x faster)
                    Node.js (V8)    ############──── (10-30x faster)
                    C (compiled)    ########################──── (50-200x)
```

*LuaJIT's tracing JIT can approach C speeds for numeric-heavy code. V8's optimizing compiler (TurboFan) is similarly aggressive.*

### GIL vs Event Loop

```python
# Python GIL — one thread executes Python at a time
# Workaround: multiprocessing or async I/O
import asyncio

async def fetch(url):
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as resp:
            return await resp.text()

async def main(urls):
    tasks = [fetch(u) for u in urls]
    return await asyncio.gather(*tasks)
```

```javascript
// JS Event Loop — single-threaded, non-blocking I/O
async function fetchUrls(urls) {
    const promises = urls.map(u =>
        fetch(u).then(r => r.text())
    );
    return Promise.all(promises);
}
```

---

## Level 4 — Expert

### Embedding and Extending

```c
// Lua as embedded scripting engine in C
#include <lua.h>
#include <lauxlib.h>
#include <lualib.h>

int main(void) {
    lua_State *L = luaL_newstate();
    luaL_openlibs(L);

    // Run Lua from C
    luaL_dostring(L, "print('Hello from Lua')");

    // Call Lua function from C
    lua_getglobal(L, "my_lua_func");
    lua_pushinteger(L, 42);
    lua_pcall(L, 1, 1, 0);
    printf("Lua returned: %lld\n", lua_tointeger(L, -1));

    lua_close(L);
    return 0;
}
```

*Lua is designed for embedding. Python can be embedded too via `Py_Initialize()`. This is how games (World of Warcraft, Roblox) use Lua for modding.*

---

## EXERCISES

1. Write a program that parses a JSON file and prints formatted output in Python, JS, and Ruby. Compare error handling.
2. Benchmark a tight loop (e.g., Fibonacci) in Python, Ruby, and Lua. Record results.
3. Embed Lua in a C program: expose a C function to Lua, call it, and return the result.
4. Build the same REST API endpoint in Python (Flask) and JS (Express). Count lines of code for each.
5. Pipe data between a Python script and a Node.js script using stdin/stdout. Parse the exchanged JSON.

## QUIZ

1. What is the Python GIL, and when does it NOT matter?
2. Why does Node.js use an event loop instead of threads?
3. Name a scenario where Lua is the best choice among scripting languages.
4. What is JIT compilation and which scripting languages use it?
5. How does `pip`, `npm`, and `bundler` differ in dependency resolution?

---

## Navigation

**Parent**: [[000_LANGUAGES_MOC|LANGUAGES]]

**Synapses**:
- [[001_Language_Paradigms|LANGUAGES 001]] - Compiled vs interpreted
- [[002_C_Deep_Dive|LANGUAGES 002]] - Systems programming
- [[000_PYTHON_MOC|PYTHON]] - Python deep dive
- [[000_WEDEV_MOC|WEDEV]] - JavaScript in context
