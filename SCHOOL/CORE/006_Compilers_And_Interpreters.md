# 006_Compilers_And_Interpreters

> Lexing, parsing, AST construction, code generation, and building a toy language.

## Level 1 — Intuition

### Concept

A compiler translates source code into machine code. An interpreter executes source code directly. But the front half is the same: both read text, understand structure, and build a tree representation.

### The Compiler Pipeline

```
Source Code (text)
      │
      ▼
┌─────────────┐
│  LEXER      │  "x = 3 + y"  →  [ID(x), EQ, NUM(3), PLUS, ID(y)]
│  (Tokenizer) │  Characters → Tokens
└──────┬──────┘
       ▼
┌─────────────┐
│  PARSER     │  Tokens → AST (Abstract Syntax Tree)
│             │        =
│             │       / \
│             │      x   +
│             │         / \
│             │        3   y
└──────┬──────┘
       ▼
┌─────────────┐
│  SEMANTIC   │  Type checking, scope resolution
│  ANALYSIS   │  "Is x defined? Are types compatible?"
└──────┬──────┘
       ▼
┌─────────────┐     ┌─────────────┐
│  CODE GEN   │     │  INTERPRET  │
│  → machine  │     │  → walk AST │
│    code     │     │    execute  │
└─────────────┘     └─────────────┘
```

## Level 2 — Practical

### Building a Lexer (Tokenizer)

```python
from enum import Enum, auto

class TokenType(Enum):
    NUMBER = auto(); PLUS = auto(); MINUS = auto()
    MUL = auto(); DIV = auto(); LPAREN = auto()
    RPAREN = auto(); EOF = auto()

class Token:
    def __init__(self, type_, value=None):
        self.type = type_
        self.value = value
    def __repr__(self):
        return f"Token({self.type.name}, {self.value!r})"

class Lexer:
    def __init__(self, text):
        self.text = text
        self.pos = 0

    def lex(self):
        tokens = []
        while self.pos < len(self.text):
            ch = self.text[self.pos]

            if ch.isspace():
                self.pos += 1
                continue
            if ch.isdigit():
                num = ''
                while self.pos < len(self.text) and self.text[self.pos].isdigit():
                    num += self.text[self.pos]
                    self.pos += 1
                tokens.append(Token(TokenType.NUMBER, int(num)))
                continue
            if ch == '+': tokens.append(Token(TokenType.PLUS)); self.pos += 1; continue
            if ch == '-': tokens.append(Token(TokenType.MINUS)); self.pos += 1; continue
            if ch == '*': tokens.append(Token(TokenType.MUL)); self.pos += 1; continue
            if ch == '/': tokens.append(Token(TokenType.DIV)); self.pos += 1; continue
            if ch == '(': tokens.append(Token(TokenType.LPAREN)); self.pos += 1; continue
            if ch == ')': tokens.append(Token(TokenType.RPAREN)); self.pos += 1; continue

            raise SyntaxError(f"Unknown character: {ch!r}")

        tokens.append(Token(TokenType.EOF))
        return tokens

# test = Lexer("3 + 4 * (2 - 1)").lex()
```

### Building a Parser (Recursive Descent)

```python
class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos]

    def consume(self):
        tok = self.tokens[self.pos]
        self.pos += 1
        return tok

    def expect(self, type_):
        tok = self.consume()
        if tok.type != type_:
            raise SyntaxError(f"Expected {type_}, got {tok.type}")
        return tok

    def parse(self):
        """expr := term (('+' | '-') term)*"""
        return self.expr()

    def expr(self):
        left = self.term()
        while self.peek().type in (TokenType.PLUS, TokenType.MINUS):
            op = self.consume()
            right = self.term()
            left = ('binop', op.type, left, right)
        return left

    def term(self):
        """term := factor (('*' | '/') factor)*"""
        left = self.factor()
        while self.peek().type in (TokenType.MUL, TokenType.DIV):
            op = self.consume()
            right = self.factor()
            left = ('binop', op.type, left, right)
        return left

    def factor(self):
        """factor := NUMBER | '(' expr ')'"""
        tok = self.peek()
        if tok.type == TokenType.NUMBER:
            return ('num', self.consume().value)
        elif tok.type == TokenType.LPAREN:
            self.consume()
            node = self.expr()
            self.expect(TokenType.RPAREN)
            return node
        raise SyntaxError(f"Unexpected token: {tok}")

# tree = Parser(Lexer("3 + 4 * 2").lex()).parse()
# → ('binop', PLUS, ('num', 3),
#              ('binop', MUL, ('num', 4), ('num', 2)))
```

## Level 3 — Systems

### AST Interpreter

```python
class Interpreter:
    def __init__(self, parser):
        self.parser = parser

    def eval(self, node):
        if node[0] == 'num':
            return node[1]
        elif node[0] == 'binop':
            op = node[1]
            left = self.eval(node[2])
            right = self.eval(node[3])
            if op == TokenType.PLUS:   return left + right
            if op == TokenType.MINUS:  return left - right
            if op == TokenType.MUL:    return left * right
            if op == TokenType.DIV:    return left // right
        raise RuntimeError(f"Unknown node: {node}")

    def run(self):
        tree = self.parser.parse()
        return self.eval(tree)

# result = Interpreter(Parser(Lexer("3 + 4 * 2").lex())).run()
# → 11
```

### Adding Variables and Statements

```python
# Extended tokens: ID, ASSIGN, SEMICOLON, PRINT
# Grammar:
#   program  := statement*
#   statement:= ID '=' expr ';' | 'print' expr ';'
#   expr     := term (('+' | '-') term)*
#   term     := factor (('*' | '/') factor)*
#   factor   := NUMBER | ID | '(' expr ')'

class Evaluator:
    def __init__(self):
        self.variables = {}

    def eval(self, node):
        if node[0] == 'num':
            return node[1]
        elif node[0] == 'var':
            name = node[1]
            if name not in self.variables:
                raise NameError(f"'{name}' is not defined")
            return self.variables[name]
        elif node[0] == 'assign':
            name, value_node = node[1], node[2]
            self.variables[name] = self.eval(value_node)
            return self.variables[name]
        elif node[0] == 'print':
            value = self.eval(node[1])
            print(value)
            return value
        elif node[0] == 'binop':
            op = node[1]
            left = self.eval(node[2])
            right = self.eval(node[3])
            if op == TokenType.PLUS:   return left + right
            if op == TokenType.MINUS:  return left - right
            if op == TokenType.MUL:    return left * right
            if op == TokenType.DIV:    return left // right
```

### Code Generation (Stack Machine)

```python
class CodeGen:
    """Generate bytecode for a stack-based VM."""
    def __init__(self):
        self.code = []

    def gen(self, node):
        if node[0] == 'num':
            self.code.append(('PUSH', node[1]))
        elif node[0] == 'binop':
            self.gen(node[2])  # left
            self.gen(node[3])  # right
            op_map = {TokenType.PLUS: 'ADD', TokenType.MINUS: 'SUB',
                      TokenType.MUL: 'MUL', TokenType.DIV: 'DIV'}
            self.code.append((op_map[node[1]],))
        return self.code

class VM:
    def run(self, bytecode):
        stack = []
        for instr in bytecode:
            op = instr[0]
            if op == 'PUSH':
                stack.append(instr[1])
            elif op == 'ADD': stack.append(stack.pop() + stack.pop())
            elif op == 'SUB': b, a = stack.pop(), stack.pop(); stack.append(a - b)
            elif op == 'MUL': stack.append(stack.pop() * stack.pop())
            elif op == 'DIV': b, a = stack.pop(), stack.pop(); stack.append(a // b)
        return stack[0]

# bc = CodeGen().gen(parser.parse())
# result = VM().run(bc)
```

## Level 4 — Expert

### LLVM IR and JIT

```
Compiling to LLVM IR:
1. Build AST (as above)
2. Walk AST, emit LLVM IR instructions
3. LLVM optimizes (constant folding, dead code elimination, inlining)
4. LLVM JIT compiles to native machine code

Example IR for "x = 3 + y":
define i32 @main() {
entry:
  %y = alloca i32               ; allocate stack slot for y
  store i32 10, i32* %y         ; y = 10
  %y_val = load i32, i32* %y    ; load y
  %result = add i32 3, %y_val   ; 3 + y
  ret i32 %result
}

Tools: llvmlite (Python), inkwell (Rust), LLVM C API
```

### Register Allocation (Graph Coloring)

```
The Problem:
- CPU has limited registers (e.g., 16 on x86-64)
- Program may use unlimited "virtual registers"
- Must map virtual → physical without conflicts

Solution: Graph Coloring
1. Build interference graph: edge between vars that are live simultaneously
2. Color with k colors (k = number of physical registers)
3. No two adjacent nodes get same color
4. If coloring fails → spill to stack (store/load)

Simplified: Linear scan allocator (used in JITs for speed)
- Sort variables by live range start
- Assign registers greedily
- Spill the one with furthest end when out of registers
```

### Garbage Collection

```c
// Mark-and-Sweep GC (conceptual)
typedef struct Object {
    int marked;
    struct Object *next;
    struct Object **fields;  // pointers to other objects
    int num_fields;
} Object;

// Roots: stack, registers, globals — starting points
void mark(Object *obj) {
    if (!obj || obj->marked) return;
    obj->marked = 1;
    for (int i = 0; i < obj->num_fields; i++)
        mark(obj->fields[i]);
}

void sweep(Object **heap_start) {
    Object **obj = heap_start;
    while (*obj) {
        if (!(*obj)->marked) {
            Object *dead = *obj;
            *obj = dead->next;  // Unlink
            free(dead);
        } else {
            (*obj)->marked = 0;  // Reset for next cycle
            obj = &(*obj)->next;
        }
    }
}

void gc(Object **heap, Object **roots, int num_roots) {
    for (int i = 0; i < num_roots; i++)
        mark(roots[i]);
    sweep(heap);
}
```

---

## Exercises

1. Build a complete arithmetic calculator: lexer → parser → interpreter that handles `+`, `-`, `*`, `/`, parentheses, and negative numbers.
2. Extend the language with variables (`x = 5; y = x + 3; print y;`). Implement assignment and print statements.
3. Add a simple `if` statement: `if (x > 0) { print x; }`. Update the lexer, parser, and interpreter/compiler.

## Quiz

1. What is the difference between a lexer and a parser?
2. What is an AST and why is it useful?
3. What's the difference between a compiler and an interpreter?
4. What is register allocation and why is it needed?
5. How does mark-and-sweep garbage collection work?

---

## Navigation

**Parent**: [[000_CORE_MOC|CORE]]

**Synapses**:
- [[003_Algorithms|CORE 003]] — Recursion and tree traversal
- [[002_Data_Structures|CORE 002]] — Trees, stacks for parsing
- [[002_OOP_In_Python|PYTHON 002]] — Visitor pattern for AST
