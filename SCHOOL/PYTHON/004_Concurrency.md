# 004_Concurrency

> Threading, multiprocessing, asyncio, and the GIL explained.

## Level 1 — Intuition

### Concept

Concurrency is doing multiple things at overlapping times. Parallelism is doing multiple things simultaneously. Python gives you three tools for this, and each solves a different problem.

### The Three Approaches

```
┌──────────────────────────────────────────────────────────┐
│ Threading        │ Multiprocessing    │ Async (asyncio)  │
├──────────────────┼────────────────────┼──────────────────┤
│ Shared memory    │ Separate memory    │ Single-threaded  │
│ GIL limits CPU   │ Bypasses GIL       │ Cooperative      │
│ Good for I/O     │ Good for CPU work  │ Good for I/O     │
│ Lightweight      │ Heavy (spawn proc) │ Lightest         │
│ OS threads       │ OS processes       │ Event loop       │
└──────────────────┴────────────────────┴──────────────────┘
```

### The GIL (Global Interpreter Lock)

```
CPython has a GIL: only ONE thread executes Python bytecode at a time.
┌──────────────────────────────────────┐
│  Thread 1 │ Thread 2 │ Thread 3     │
│  ──────── │ ─────    │ ──           │
│  RUNNING  │ WAITING  │ WAITING      │
│           │          │              │
│  Thread 1 releases GIL (every ~5ms or on I/O)│
│  ─────    │ ───────  │ ──           │
│  WAITING  │ RUNNING  │ WAITING      │
└──────────────────────────────────────┘

Implication:
- CPU-bound code: threads DON'T help (GIL serializes)
- I/O-bound code: threads DO help (GIL released during I/O)
- Multi-core: use multiprocessing (each process has own GIL)
```

## Level 2 — Practical

### Threading (for I/O-bound tasks)

```python
import threading
import time
import requests
from concurrent.futures import ThreadPoolExecutor

# Sequential version
def download_all_sequential(urls):
    results = []
    for url in urls:
        results.append(requests.get(url).status_code)
    return results

# Thread pool version (parallel I/O)
def download_all_threaded(urls):
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(requests.get, url) for url in urls]
        return [f.result().status_code for f in futures]

# Example with manual threading
def worker(thread_id, results, lock):
    for i in range(100):
        with lock:  # Protect shared state
            results.append((thread_id, i))
        time.sleep(0.001)

threads = []
results = []
lock = threading.Lock()

for i in range(4):
    t = threading.Thread(target=worker, args=(i, results, lock))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print(f"Total results: {len(results)}")  # 400
```

### Multiprocessing (for CPU-bound tasks)

```python
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor
import math

# CPU-bound work: computing primes
def is_prime(n):
    if n < 2: return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0: return False
    return True

def count_primes_in_range(start, end):
    return sum(1 for n in range(start, end) if is_prime(n))

# Sequential
# count_primes_in_range(1, 1000000)  # Slow

# Parallel
def count_primes_parallel(total_range, workers=None):
    if workers is None:
        workers = mp.cpu_count()

    chunk = total_range // workers
    ranges = [(i * chunk, (i + 1) * chunk) for i in range(workers)]

    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(count_primes_in_range, s, e)
                   for s, e in ranges]
        return sum(f.result() for f in futures)

# print(count_primes_parallel(1000000))  # ~4x faster on 4 cores

# Sharing state between processes
# Use multiprocessing.Queue, Pipe, or shared memory
from multiprocessing import Process, Queue

def producer(q):
    for i in range(10):
        q.put(f"Item {i}")
    q.put(None)  # Sentinel to signal done

def consumer(q):
    while True:
        item = q.get()
        if item is None:
            break
        print(f"Consumed: {item}")

q = Queue()
p1 = Process(target=producer, args=(q,))
p2 = Process(target=consumer, args=(q,))
p1.start(); p2.start()
p1.join(); p2.join()
```

## Level 3 — Systems

### asyncio (Cooperative Multitasking)

```python
import asyncio
import aiohttp  # Async HTTP client

# Async functions: use async/await
# await yields control to event loop while waiting for I/O

async def fetch_url(session, url):
    async with session.get(url) as response:
        return url, response.status

async def download_all_async(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# Run async code
async def main():
    urls = ["https://httpbin.org/delay/1" for _ in range(10)]
    results = await download_all_async(urls)
    for url, status in results:
        print(f"{url}: {status}")

# asyncio.run(main())  # One-liner to run async code

# Common async patterns
async def timeout_example(url):
    try:
        async with asyncio.timeout(5):  # Timeout after 5s
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as resp:
                    return await resp.text()
    except asyncio.TimeoutError:
        return "Timeout!"

# Semaphore: limit concurrency
sem = asyncio.Semaphore(3)  # Max 3 concurrent requests

async def rate_limited_fetch(url):
    async with sem:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                return await resp.text()
```

### Producer-Consumer with asyncio

```python
import asyncio
from asyncio import Queue

async def producer(queue, items):
    for item in items:
        await queue.put(item)
        print(f"Produced: {item}")
        await asyncio.sleep(0.1)
    # Signal consumers to stop
    for _ in range(3):
        await queue.put(None)

async def consumer(queue, name):
    while True:
        item = await queue.get()
        if item is None:
            queue.task_done()
            break
        print(f"Consumer {name} processing: {item}")
        await asyncio.sleep(0.5)  # Simulate work
        queue.task_done()

async def main():
    queue = Queue(maxsize=10)
    items = list(range(20))

    # Run producer and consumers concurrently
    await asyncio.gather(
        producer(queue, items),
        consumer(queue, "A"),
        consumer(queue, "B"),
        consumer(queue, "C"),
    )

# asyncio.run(main())
```

### Choosing the Right Tool

```python
# Decision flowchart (simplified):
#
# Is your task I/O-bound?
#   Yes → Use asyncio (preferred) or threading
#     - Thousands of connections? → asyncio
#     - Blocking library without async API? → threading + ThreadPoolExecutor
#
# Is your task CPU-bound?
#   Yes → Use multiprocessing
#     - Simple parallel map? → ProcessPoolExecutor.map()
#     - Complex data sharing? → multiprocessing.Queue + careful design
#
# Need both?
#   → asyncio + run_in_executor() for CPU work in async context
#
# Rule of thumb:
#   async = best for networking (web servers, API calls)
#   threads = existing blocking libraries you can't rewrite
#   processes = math, image processing, data crunching
```

## Level 4 — Expert

### async/await Internals

```python
# Under the hood: coroutines, tasks, and event loop

# A coroutine function returns a coroutine object (doesn't run yet)
async def my_coro():
    await asyncio.sleep(1)
    return 42

# Creating a task SCHEDULES it on the event loop
async def main():
    task = asyncio.create_task(my_coro())  # Non-blocking!
    # Do other stuff while coroutine runs...
    result = await task  # Wait for result
    print(result)

# Running blocking code from async
async def call_blocking():
    loop = asyncio.get_running_loop()
    # Offload to thread pool — doesn't block event loop
    result = await loop.run_in_executor(
        None,  # Default ThreadPoolExecutor
        time.sleep,  # This would BLOCK if called directly!
        1
    )
```

### Advanced Patterns

```python
# Pattern: Async context manager
class AsyncDatabase:
    async def __aenter__(self):
        self.conn = await create_async_connection()
        return self

    async def __aexit__(self, *args):
        await self.conn.close()

async def use_db():
    async with AsyncDatabase() as db:
        # Auto-connects and auto-closes
        pass

# Pattern: Async generator
async def paginated_api(base_url):
    page = 1
    while True:
        data = await fetch(f"{base_url}?page={page}")
        if not data:
            break
        yield data
        page += 1

async def process_all():
    async for page in paginated_api("https://api.example.com/items"):
        print(f"Processing {len(page)} items")
```

---

## Exercises

1. Write a script that downloads 20 web pages. Time the sequential version, thread version, and async version. Compare results.
2. Implement a prime number counter that splits work across all CPU cores using multiprocessing. Show speedup vs single-core.
3. Build an async producer-consumer pattern where producers fetch URLs and consumers parse HTML. Use `asyncio.Queue` with a bounded size.

## Quiz

1. What is the GIL and how does it affect threading vs multiprocessing?
2. When would you use asyncio instead of threading?
3. What does `await` actually do?
4. How do you share state between processes safely?
5. What is `run_in_executor()` used for?

---

## Navigation

**Parent**: [[000_PYTHON_MOC|PYTHON]]

**Synapses**:
- [[001_Syntax_Basics|PYTHON 001]] — Generator and function basics
- [[005_Operating_Systems|CORE 005]] — Process and thread theory
- [[006_Building_APIs_With_FastAPI|PYTHON 006]] — FastAPI uses asyncio
