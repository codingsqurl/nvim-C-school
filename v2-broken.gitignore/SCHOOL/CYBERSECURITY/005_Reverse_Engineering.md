# 005_Reverse_Engineering

> Disassembly, debuggers, binary analysis, and Ghidra introduction.

## Level 1 — Intuition

### Concept

Reverse engineering is understanding how something works by taking it apart. For software, this means reading compiled machine code to understand what the program does — without source code.

### The RE Toolchain

```
Binary (compiled program)
      │
      ├──→ Static Analysis: Read without running
      │    - disassemblers (objdump, Ghidra, IDA)
      │    - strings, hex dump, file headers
      │
      └──→ Dynamic Analysis: Observe while running
           - debuggers (gdb, x64dbg, lldb)
           - strace (syscalls), ltrace (library calls)
           - frida (instrumentation)
```

## Level 2 — Practical

### Static Analysis Basics

```bash
# What kind of file is it?
file mystery_binary
# ELF 64-bit LSB executable, x86-64, dynamically linked

# What's inside? (print readable strings)
strings mystery_binary | head -20

# What libraries does it need?
ldd mystery_binary

# What symbols (functions) are exported?
nm mystery_binary | grep ' T '  # Text (code) symbols

# Disassemble with objdump
objdump -d mystery_binary | head -50
objdump -d -M intel mystery_binary  # Intel syntax (easier to read)

# Check the ELF header
readelf -h mystery_binary
readelf -S mystery_binary          # Sections
readelf -l mystery_binary          # Segments
```

### x86-64 Assembly Quick Reference

```asm
; Registers (64-bit → 32-bit → 16-bit → 8-bit)
; rax → eax → ax → al    (accumulator / return value)
; rbx → ebx → bx → bl    (base)
; rcx → ecx → cx → cl    (counter)
; rdx → edx → dx → dl    (data)
; rsi, rdi               (source/destination index)
; rbp, rsp               (base/stack pointer)

; Common instructions:
mov rax, rbx        ; rax = rbx
mov rax, [rbx]      ; rax = *rbx (load from memory)
mov [rbx], rax      ; *rbx = rax (store to memory)
lea rax, [rbx+8]    ; rax = rbx + 8 (address calculation, no memory access)
add rax, 5          ; rax += 5
sub rax, rcx        ; rax -= rcx
cmp rax, 5          ; Compare rax with 5 (sets flags)
je  label           ; Jump if equal (ZF=1)
jne label           ; Jump if not equal
jmp label           ; Unconditional jump
call func           ; Push return address, jump to func
ret                 ; Pop return address, jump to it
push rax            ; Push onto stack
pop rax             ; Pop from stack
xor rax, rax        ; rax = 0 (optimized zero)
nop                 ; No operation (padding)
int3                ; Breakpoint (0xCC)
```

### Debugging with gdb

```bash
# Start debugging
gdb ./mystery_binary

# Inside gdb:
(gdb) break main               # Set breakpoint at main
(gdb) break *0x401234           # Break at specific address
(gdb) run                       # Run the program
(gdb) continue                  # Continue after breakpoint
(gdb) stepi                     # Step one instruction
(gdb) nexti                     # Step over (don't enter calls)
(gdb) info registers            # Show all registers
(gdb) x/s $rdi                  # Examine string at address in rdi
(gdb) x/10gx $rsp               # Examine 10 quadwords on stack
(gdb) p $rax                    # Print rax value
(gdb) disas main                # Disassemble main function
(gdb) set $rax = 42             # Change register value
(gdb) info break                # List breakpoints
(gdb) delete 1                  # Delete breakpoint 1
(gdb) backtrace                 # Show call stack
(gdb) quit

# GDB with TUI (text user interface)
gdb -tui ./binary
# Ctrl+x then a to toggle TUI
```

## Level 3 — Systems

### Ghidra Basics

```
Ghidra Workflow (NSA's open-source RE tool):

1. Create Project → Import binary
2. Analyze (auto-analysis identifies functions, strings, data)
3. Explore:
   - Symbol Tree: functions, imports, exports, strings
   - Listing View: disassembly + decompiled C
   - Decompiler: C-like reconstruction of assembly
   - Function Graph: control flow visualization
   - Data Type Manager: define structs, enums

4. Common Tasks:
   - Rename variables (click + L)
   - Set function signatures
   - Define data types (click + T)
   - Find cross-references (Ctrl+Shift+F)
   - Search for strings (Search → For Strings)
   - Patch bytes (right click → Patch Instruction)
   - Export program (File → Export Program)
```

### Calling Conventions

```c
// Understanding function calls in assembly
// x86-64 System V ABI (Linux):
// Arguments: rdi, rsi, rdx, rcx, r8, r9, then stack
// Return: rax
// Caller-saved: rax, rcx, rdx, rsi, rdi, r8-r11
// Callee-saved: rbx, rbp, r12-r15

// C code:
int calculate(int a, int b, int c) {
    return (a + b) * c;
}

// Equivalent assembly pattern:
// calculate:
//     lea  eax, [rdi + rsi]    ; eax = a + b (rdi=a, rsi=b)
//     imul eax, edx            ; eax *= c (edx=c)
//     ret
```

### Binary Patching

```bash
# Patch a binary to change behavior

# 1. Find instruction to patch (e.g., change je → jmp)
objdump -d binary | grep -A2 "function_of_interest"

# 2. Note the hex at that address
# Example: 74 0A → EB 0A (je → jmp)
# 74 = je, EB = jmp (short)

# 3. Patch with Python
python3 << 'EOF'
with open('binary', 'rb') as f:
    data = bytearray(f.read())

# Change JE (0x74) to JMP (0xEB) at offset 0x1234
offset = 0x1234
data[offset] = 0xEB  # Always jump (remove branch condition)

with open('binary_patched', 'wb') as f:
    f.write(data)
EOF

chmod +x binary_patched

# Or use xxd + sed for simple patches:
# xxd binary > binary.hex
# sed -i 's/74 0a/eb 0a/' binary.hex
# xxd -r binary.hex > binary_patched
```

## Level 4 — Expert

### Anti-Reverse Engineering Techniques

```
1. Anti-Debugging
   ptrace(PTRACE_TRACEME, 0, 0, 0)  ; if debugger attached, fails
   Check /proc/self/status for "TracerPid"
   Timing checks (RDPMC, RDTSC) — debugger makes execution slower

2. Obfuscation
   Control flow flattening: all basic blocks → one switch statement
   Opaque predicates: always-true conditions that look complex
   Dead code insertion: junk instructions that never execute

3. Packing
   UPX, custom packers: compress/encrypt real code, unpack at runtime
   Entry point unpacks → transfers to OEP (Original Entry Point)
   Detect: high entropy sections, small .text, unusual section names

4. Anti-Disassembly
   Overlapping instructions: same bytes, different offset → different meaning
   Return-oriented junk: push addr; ret → jump without using jmp

5. Virtualization (VMProtect, Themida)
   Convert x86 to custom bytecode → run inside custom VM interpreter
   Each build has unique VM → no generic unpacking possible
```

### Frida — Dynamic Instrumentation

```python
# Frida: inject JavaScript into running processes
# Great for bypassing checks, hooking functions, dumping memory

import frida
import sys

session = frida.attach("target_app")

script = session.create_script("""
// Hook a function
Interceptor.attach(Module.findExportByName(null, "strcmp"), {
    onEnter(args) {
        console.log("strcmp(" +
            Memory.readUtf8String(args[0]) + ", " +
            Memory.readUtf8String(args[1]) + ")");
    },
    onLeave(retval) {
        console.log("  → returned: " + retval);
        // retval.replace(0); // Force "strings equal"
    }
});

// Hook a specific address
var base = Module.findBaseAddress("target_app");
Interceptor.attach(base.add(0x1234), {
    onEnter(args) {
        console.log("Critical function called!");
        console.log("  arg0 = " + args[0]);
        this.original_arg0 = args[0];
    }
});
""")

script.on('message', lambda msg, data: print(msg))
script.load()
sys.stdin.read()
```

---

## Exercises

1. Compile a simple C program with `gcc -O0`. Use `objdump -d` to find `main`. Trace through the assembly and identify where a function call happens and where the return value is stored.
2. Open the compiled binary in gdb. Set a breakpoint at `main`, step through 5 instructions, inspect register values. Change `rax` with `set $rax = 42` and continue.
3. Install Ghidra. Import a simple binary. Find the `main` function, rename variables, and copy the decompiled C output. Compare with the original source.

## Quiz

1. What's the difference between static and dynamic analysis?
2. What register holds the return value on x86-64 Linux?
3. What does `objdump -d` do?
4. How do anti-debugging techniques detect a debugger?
5. What is control flow flattening and why is it used?

---

## Navigation

**Parent**: [[000_CYBERSECURITY_MOC|CYBERSECURITY]]

**Synapses**:
- [[001_Threat_Modeling|CYBERSECURITY 001]] — Understanding attacker tools
- [[004_Computer_Architecture|CORE 004]] — Assembly language
- [[006_Compilers_And_Interpreters|CORE 006]] — How compilation works
