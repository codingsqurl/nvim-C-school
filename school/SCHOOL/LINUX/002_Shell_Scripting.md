# 002_Shell_Scripting

> Bash scripting, variables, loops, functions, and common automation patterns.

## Level 1 — Intuition

### Concept

Shell scripting is automating the command line. Every command you type interactively can be put in a file and replayed. Scripts are the glue that connects programs together.

### The Unix Philosophy in Scripts

```
1. Do one thing well (each program)
2. Expect text input, produce text output
3. Chain programs together (pipes)

ls -la | grep ".log" | sort -k5 -n | tail -5
  │         │             │            │
  List   Filter for   Sort by      Show last
  files   .log files   size         5 results

Each command is independent. The pipe is the connector.
```

## Level 2 — Practical

### Script Template

```bash
#!/bin/bash
# SCRIPT: script_name.sh
# PURPOSE: What this script does
# USAGE: ./script_name.sh [options] <args>

set -euo pipefail  # Fail fast!
# -e: exit on error
# -u: error on undefined variable
# -o pipefail: pipeline fails if any command fails

# Constants
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly CONFIG_FILE="${SCRIPT_DIR}/config.env"

# Functions
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "ERROR: $*"; exit 1; }

# Main
main() {
    log "Starting script..."
    # ... your logic here ...
    log "Done."
}

main "$@"
```

### Variables and Control Flow

```bash
#!/bin/bash

# Variables
name="Alice"                      # No spaces around =
readonly PI=3.14159               # Constant
count=$((5 + 3))                  # Arithmetic
path="$HOME/Documents"            # Variable expansion
current_date=$(date +%Y-%m-%d)    # Command substitution

# Arrays
fruits=("apple" "banana" "cherry")
echo "${fruits[0]}"               # First element
echo "${fruits[@]}"               # All elements
echo "${#fruits[@]}"              # Array length

# Conditionals
if [[ -f "$file" ]]; then         # File exists?
    echo "File exists"
elif [[ -d "$dir" ]]; then        # Directory exists?
    echo "Directory exists"
else
    echo "Not found"
fi

# String comparisons
[[ "$a" == "$b" ]]               # Equal
[[ "$a" != "$b" ]]               # Not equal
[[ -z "$str" ]]                  # Empty string?
[[ -n "$str" ]]                  # Non-empty?

# Numeric comparisons
[[ $a -eq $b ]]                  # Equal
[[ $a -lt $b ]]                  # Less than
[[ $a -gt $b ]]                  # Greater than

# File tests
[[ -f file ]]                    # Regular file?
[[ -d dir ]]                     # Directory?
[[ -x file ]]                    # Executable?
[[ -r file ]]                    # Readable?
[[ -s file ]]                    # Non-empty?

# Loops
for i in {1..5}; do echo "$i"; done
for file in *.txt; do wc -l "$file"; done
while read -r line; do echo "$line"; done < input.txt
until [[ -f /tmp/done ]]; do sleep 1; done
```

### Functions and Arguments

```bash
#!/bin/bash

# Function with arguments
greet() {
    local name="$1"               # Local variable (not global)
    local greeting="${2:-Hello}"  # Default value if $2 unset
    echo "$greeting, $name!"
}

greet "Alice"                     # "Hello, Alice!"
greet "Bob" "Hi"                  # "Hi, Bob!"

# Return values (0=success, 1-255=failure)
is_root() {
    [[ "$(id -u)" -eq 0 ]]
}

# Check return with if
if is_root; then
    echo "Running as root"
else
    echo "Not root — exit" && exit 1
fi

# Function that returns a value via stdout
get_timestamp() {
    date +%s
}
ts=$(get_timestamp)

# Command-line arguments
echo "Script: $0"                 # Script name
echo "Arg 1: ${1:-none}"          # First argument
echo "All args: $@"               # All arguments
echo "Count: $#"                  # Number of arguments

# Shift through arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)   show_help; exit;;
        -v|--verbose) verbose=1;;
        -o|--output)  output="$2"; shift;;
        *)            echo "Unknown: $1"; exit 1;;
    esac
    shift
done
```

### Common Patterns

```bash
#!/bin/bash

# Pattern 1: Process a file line by line
while IFS= read -r line; do
    echo "Line: $line"
done < "/etc/passwd"

# Pattern 2: Trap for cleanup
cleanup() {
    rm -f /tmp/mytemp.*
    echo "Cleaned up."
}
trap cleanup EXIT INT TERM

# Pattern 3: Retry with backoff
retry() {
    local attempts=5
    local delay=1
    for ((i=1; i<=attempts; i++)); do
        if "$@"; then return 0; fi
        echo "Attempt $i failed, retrying in ${delay}s..."
        sleep "$delay"
        delay=$((delay * 2))      # Exponential backoff
    done
    return 1
}
retry curl -s https://api.example.com/health

# Pattern 4: Log to file AND stdout
exec > >(tee -a /var/log/myscript.log) 2>&1

# Pattern 5: Check required commands
require() {
    for cmd in "$@"; do
        command -v "$cmd" >/dev/null || die "Required: $cmd"
    done
}
require curl jq tar
```

## Level 3 — Systems

### Text Processing Pipeline

```bash
#!/bin/bash
# Parse Apache access log: top 10 IPs by request count

LOG_FILE="${1:-/var/log/apache2/access.log}"

cat "$LOG_FILE" \
    | awk '{print $1}' \                    # Extract IP (first field)
    | sort \                                # Sort (required for uniq -c)
    | uniq -c \                             # Count occurrences
    | sort -rn \                            # Sort by count, descending
    | head -10 \                            # Top 10
    | while read -r count ip; do
        printf "%6d  %s\n" "$count" "$ip"
    done

# Same thing, more efficient:
# awk '{count[$1]++} END {for (ip in count) print count[ip], ip}' \
#     "$LOG_FILE" | sort -rn | head -10
```

### sed and awk Essentials

```bash
# sed: Stream editor
sed 's/foo/bar/g' file.txt             # Replace all foo with bar
sed '/pattern/d' file.txt               # Delete lines matching pattern
sed -n '5,10p' file.txt                 # Print lines 5-10
sed -i 's/^#//' file.txt                # In-place: uncomment lines
sed '/^$/d' file.txt                    # Remove empty lines

# awk: Pattern scanning and processing
# Structure: pattern { action }
awk '{print $1, $3}' file.txt           # Print columns 1 and 3
awk -F: '{print $1, $7}' /etc/passwd    # Custom delimiter (:)
awk '$3 > 1000' file.txt                # Filter: column 3 > 1000
awk '{sum+=$1} END {print sum}' file.txt # Sum column 1
awk '{count[$1]++} END {for (k in count) print k, count[k]}' file.txt

# Advanced: Process JSON with jq
curl -s https://api.github.com/users/torvalds | jq '.name'
jq '.[] | {name: .name, stars: .stargazers_count}' repos.json
jq '[.[] | select(.language == "Rust")]' repos.json
```

### Parallel Execution

```bash
#!/bin/bash
# Run tasks in parallel with xargs

# Sequential: process 100 files
for f in *.log; do gzip "$f"; done   # Slow! One at a time

# Parallel: 4 at a time
find . -name "*.log" -print0 | xargs -0 -P 4 -I {} gzip {}

# GNU parallel (more powerful)
parallel gzip ::: *.log                                     # All .log files
parallel --bar gzip ::: *.log                               # With progress
parallel -j 4 "sleep {} && echo Done {}" ::: 1 2 3 4 5      # Limit jobs

# Background jobs in script
for ip in 192.168.1.{1..254}; do
    (ping -c1 -W1 "$ip" >/dev/null 2>&1 && echo "$ip up") &
done
wait  # Wait for all background jobs to finish
```

## Level 4 — Expert

### Writing Robust Scripts

```bash
#!/bin/bash
# Production-grade script patterns

# 1. Strict mode
set -euo pipefail
IFS=$'\n\t'                      # Safer word splitting

# 2. Temp files with cleanup
readonly TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# 3. Lock file (prevent concurrent runs)
readonly LOCKFILE="/var/run/$(basename "$0").lock"
exec 200>"$LOCKFILE"
flock -n 200 || { echo "Already running"; exit 1; }

# 4. Signal handling
trap 'echo "Interrupted at line $LINENO"; exit 1' INT TERM

# 5. Configuration file
readonly CONFIG="${HOME}/.myscript.conf"
if [[ -f "$CONFIG" ]]; then
    # shellcheck source=/dev/null
    source "$CONFIG"
fi

# 6. Validate input
readonly INPUT="${1:?Usage: $0 <file>}"  # Exit if not provided
[[ -f "$INPUT" ]] || { echo "$INPUT: not found"; exit 1; }
[[ -r "$INPUT" ]] || { echo "$INPUT: not readable"; exit 1; }

# 7. Atomic file writes (write to temp, then mv)
echo "data" > "$TMPDIR/output.tmp"
mv "$TMPDIR/output.tmp" "final_output.txt"  # Atomic on same filesystem

# 8. Logging with levels
readonly LOGFILE="/var/log/$(basename "$0").log"
log()  { echo "[$(date -Iseconds)] $*" >> "$LOGFILE"; }
debug(){ [[ "${DEBUG:-0}" -ge 1 ]] && log "DEBUG: $*"; }
info() { log "INFO: $*"; echo "$*"; }
warn() { log "WARN: $*"; echo "WARN: $*" >&2; }
error(){ log "ERROR: $*"; echo "ERROR: $*" >&2; }
```

### Bash Gotchas

```bash
# GOTCHA 1: Word splitting
files="file1.txt file2.txt"
# WRONG:
ls $files       # Splits on spaces: treats file2.txt as separate arg
# RIGHT:
ls "$files"     # But this doesn't work for multiple files either
# BETTER: Use arrays
files=(file1.txt "file with spaces.txt")
ls "${files[@]}"

# GOTCHA 2: [ vs [[
# [ is a command (test), [[ is bash syntax — USE [[ ]]
[[ $a == $b ]]                    # Patten matching, regex
[[ $str =~ ^[0-9]+$ ]]            # Regex match in [[ ]]

# GOTCHA 3: Subshells
cat file.txt | while read line; do
    count=$((count + 1))          # This count is LOST (in subshell)!
done
# FIX: Use process substitution
while read line; do
    count=$((count + 1))
done < file.txt

# GOTCHA 4: Local and errexit don't mix
set -e
myfunc() {
    local result=$(false)      # Doesn't trigger -e because local masks it!
    echo "This still runs"
}
```

---

## Exercises

1. Write a script that finds all files modified in the last 24 hours, computes total size, and emails a report (or prints it). Use functions, trap, and error handling.
2. Parse `/var/log/syslog` (or any text log) and find the top 5 most common error messages. Use awk, sort, uniq.
3. Write a backup script that: accepts source and destination args, creates a timestamped archive, verifies the archive with checksums, and logs everything.

## Quiz

1. What does `set -euo pipefail` do?
2. What's the difference between `$@` and `$*`?
3. Why use `local` for variables inside functions?
4. What does `2>&1` mean?
5. Why prefer `[[ ]]` over `[ ]` in bash?

---

## Navigation

**Parent**: [[000_LINUX_MOC|LINUX]]

**Synapses**:
- [[001_Filesystem|LINUX 001]] — File operations
- [[003_Process_Management|LINUX 003]] — Job control, signals
- [[003_Infrastructure_As_Code|DEVOPS 003]] — Automation scripts
