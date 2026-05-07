# 005_Operating_Systems

> Processes, threads, scheduling, virtual memory, and file systems.

## Level 1 — Intuition

### Concept

The operating system is the referee between programs and hardware. It manages three things: CPU (who runs when), memory (who gets what space), and I/O (who talks to devices). Every program you write lives inside these abstractions.

### OS as a Resource Manager

```
┌──────────────────────────────────────────────┐
│              USER SPACE                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌───────┐          │
│  │ Vim │ │ Bash│ │ gcc │ │ Python│          │
│  └──┬──┘ └──┬──┘ └──┬──┘ └───┬───┘          │
│     │       │       │        │               │
├─────┼───────┼───────┼────────┼───────────────┤
│     │  SYSTEM CALL INTERFACE │               │
├─────┼───────┼───────┼────────┼───────────────┤
│              KERNEL SPACE                     │
│  ┌──────────────────────────────────┐        │
│  │ Process Mgr │ Memory Mgr │ FS   │ Net   ││
│  └──────────────────────────────────┘        │
│  ┌──────────────────────────────────┐        │
│  │         HARDWARE DRIVERS         │        │
│  └──────────────────────────────────┘        │
└──────────────────────────────────────────────┘
```

## Level 2 — Practical

### Processes and fork()

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main() {
    pid_t pid = fork();  // Clone this process

    if (pid == 0) {
        // CHILD process: gets PID 0 from fork()
        printf("Child:  PID=%d, Parent PID=%d\n", getpid(), getppid());
        execl("/bin/ls", "ls", "-l", NULL);  // Replace with ls
        // execl only returns on error
        perror("execl failed");
        return 1;
    } else if (pid > 0) {
        // PARENT process: fork() returns child's PID
        printf("Parent: PID=%d, Child PID=%d\n", getpid(), pid);
        int status;
        waitpid(pid, &status, 0);  // Wait for child to finish
        printf("Child exited with status %d\n", WEXITSTATUS(status));
    } else {
        perror("fork failed");
    }
    return 0;
}
```

### Threads with pthreads

```c
#include <stdio.h>
#include <pthread.h>

#define NUM_THREADS 4
#define ITERATIONS 1000000

long counter = 0;              // Shared variable (UNSAFE!)
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

void* increment(void *arg) {
    for (int i = 0; i < ITERATIONS; i++) {
        pthread_mutex_lock(&mutex);    // Critical section
        counter++;                     // Safe with lock
        pthread_mutex_unlock(&mutex);
    }
    return NULL;
}

int main() {
    pthread_t threads[NUM_THREADS];

    for (int i = 0; i < NUM_THREADS; i++)
        pthread_create(&threads[i], NULL, increment, NULL);

    for (int i = 0; i < NUM_THREADS; i++)
        pthread_join(threads[i], NULL);

    printf("Counter = %ld (expected %ld)\n",
           counter, (long)NUM_THREADS * ITERATIONS);
    // Without mutex: random value < expected (race condition)
    // With mutex: exactly 4,000,000
    return 0;
}
// Compile: gcc -pthread threads.c -o threads
```

### Process vs Thread

| Aspect | Process | Thread |
|--------|---------|--------|
| Memory | Isolated (own address space) | Shared (same address space) |
| Communication | IPC (pipes, sockets, shared mem) | Direct (shared variables) |
| Creation cost | High (copy page tables) | Low (just stack + registers) |
| Context switch | Expensive (TLB flush) | Cheap (same MMU context) |
| Crash impact | Only crashes itself | Crashes whole process |
| Use case | Isolation, security | Parallelism within one app |

## Level 3 — Systems

### Scheduling Algorithms

```
1. First-Come First-Served (FCFS)
   [P1: 24ms] [P2: 3ms] [P3: 3ms]
   Avg wait: (0 + 24 + 27) / 3 = 17ms (convoy effect!)

2. Shortest Job First (SJF)
   [P2: 3ms] [P3: 3ms] [P1: 24ms]
   Avg wait: (0 + 3 + 6) / 3 = 3ms (optimal, but needs prediction)

3. Round Robin (RR) — Time slice = 4ms
   [P1:4] [P2:3] [P3:3] [P1:4] [P1:4] [P1:4] [P1:4] [P1:4]
   Good for interactive, bad for turnaround time

4. Linux CFS (Completely Fair Scheduler)
   - Each task gets "virtual runtime" proportional to its weight
   - Red-black tree ordered by vruntime
   - Pick leftmost (least vruntime) to run next
   - vruntime advances slower for high-priority tasks

Scheduling Metrics:
- Turnaround time: submission → completion
- Response time: submission → first response
- Throughput: tasks completed per unit time
```

### Virtual Memory

```
Virtual vs Physical Memory:
┌──────────────────────────────────────────────────────────┐
│ Process A's View:                Process B's View:       │
│ 0x0000 ┌──────┐                0x0000 ┌──────┐          │
│        │ code │                       │ code │          │
│ 0x1000 ├──────┤                0x1000 ├──────┤          │
│        │ heap │                       │ heap │          │
│ 0x2000 ├──────┤                0x2000 ├──────┤          │
│        │  ↓   │                       │  ↓   │          │
│        │      │                       │      │          │
│        │  ↑   │                       │  ↑   │          │
│ 0xF000 ├──────┤                0xF000 ├──────┤          │
│        │stack │                       │stack │          │
│ 0xFFFF └──────┘                0xFFFF └──────┘          │
│                    MMU (Page Table)                      │
│         Virtual Addr ────────→ Physical Addr             │
│          0x1040     →  Page 7, offset 0x40              │
│          0x1040     →  Page 42, offset 0x40             │
└──────────────────────────────────────────────────────────┘

Page Fault: Virtual page not in physical RAM
→ OS loads from disk (swap) → slow but transparent
Thrashing: Constant page faults (RAM too small) → system crawl
```

### File System Internals

```
ext4 inode structure:
┌──────────────────────────────────────────┐
│ Inode (Index Node) — metadata for a file │
├──────────────────────────────────────────┤
│ File type:       regular                 │
│ Permissions:     rw-r--r--              │
│ Owner:           alice:developers        │
│ Size:            4096 bytes             │
│ Timestamps:      atime, mtime, ctime    │
│ Block pointers:                          │
│   Direct[0-11]:   12 data blocks (48KB) │
│   Indirect:       1 → 1024 blocks (4MB) │
│   Double indirect: 1 → 1024² blocks (4GB)│
│   Triple indirect: 1 → 1024³ blocks (4TB)│
└──────────────────────────────────────────┘

Directory = special file mapping names → inode numbers
"hello.txt" → inode 12345 → data blocks [9876, 9877, ...]
```

## Level 4 — Expert

### Concurrency Primitives

```c
// Semaphore: counter-based, good for resource pools
#include <semaphore.h>
sem_t sem;
sem_init(&sem, 0, 3);  // Allow 3 concurrent accesses
sem_wait(&sem);         // Decrement, block if 0
// ... critical section (max 3 threads) ...
sem_post(&sem);         // Increment

// Condition Variable: wait for a condition, notify others
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
int ready = 0;

// Thread A (waiter):
pthread_mutex_lock(&lock);
while (!ready)  // Loop: guard against spurious wakeups
    pthread_cond_wait(&cond, &lock);
// ... proceed when ready == 1 ...
pthread_mutex_unlock(&lock);

// Thread B (signaler):
pthread_mutex_lock(&lock);
ready = 1;
pthread_cond_signal(&cond);  // Wake one waiter
pthread_mutex_unlock(&lock);

// Read-Write Lock: many readers OR one writer
pthread_rwlock_t rwlock;
pthread_rwlock_rdlock(&rwlock);  // Shared access
pthread_rwlock_wrlock(&rwlock);  // Exclusive access
```

### Memory Management

```c
// Buddy allocator: power-of-2 sized blocks, split/merge on demand
// Used in Linux kernel for page allocation

// Slab allocator: object caches for fixed-size allocations
// Kernel caches: dentry, inode, task_struct
// Avoids fragmentation for common-sized objects

// Userspace malloc strategies:
// ptmalloc2 (glibc): arena-based, per-thread arenas reduce contention
// jemalloc (FreeBSD/Firefox): thread-cache → arena → OS
// tcmalloc (Google): per-thread cache → central heap
```

---

## Exercises

1. Write a C program that forks twice: once for `ls`, once for `wc`. Connect them with a pipe so `ls` output feeds into `wc`.
2. Create a multi-threaded program where 4 threads increment a shared counter 1M times each. Run with and without a mutex. Compare results.
3. Use `strace` on a simple program (e.g., `ls`). Identify the `open`, `read`, `write`, and `close` syscalls. Count how many syscalls `ls` makes.

## Quiz

1. What's the difference between a process and a thread?
2. What happens during a context switch?
3. What is virtual memory and why is it useful?
4. How does a page fault work?
5. What's the difference between a mutex and a semaphore?

---

## Navigation

**Parent**: [[000_CORE_MOC|CORE]]

**Synapses**:
- [[004_Computer_Architecture|CORE 004]] — Hardware the OS manages
- [[003_Process_Management|LINUX 003]] — Linux process tools
- [[001_Filesystem|LINUX 001]] — Linux file system
