# 001_Syntax_Basics

> Python fundamentals - syntax, data types, and control flow.

## Level 1 — Intuition

### Concept

Python reads like English. The language is designed to be readable and minimal.

### First Program

```python
print("Hello, World!")
```

### Variables and Data Types

```python
# Numbers
age = 5              # integer
price = 3.99         # float
is_student = True     # boolean

# Strings
name = "Alice"
message = 'Hello'

# Collections
fruits = ["apple", "banana", "cherry"]     # list
point = (10, 20)                       # tuple
settings = {"dark": True}                # dict
```

### Type Checking

```python
type(age)          # <class 'int'>
type(name)         # <class 'str'>
type(fruits)      # <class 'list'>
```

## Level 2 — Practical

### Control Flow

```python
# If/Elif/Else
if age < 5:
    print("Toddler")
elif age < 13:
    print("Child")
else:
    print("Teenager")

# For loops
for fruit in fruits:
    print(fruit)

# While loops
count = 0
while count < 5:
    print(count)
    count += 1

# Comprehensions (Pythonic)
squares = [x**2 for x in range(5)]  # [0, 1, 4, 9, 16]
```

### Functions

```python
def greet(name):
    return f"Hello, {name}!"

message = greet("Alice")  # "Hello, Alice!"
```

## Level 3 — Systems

### Scope and Namespaces

```python
# LEGB Rule: Local → Enclosing → Global → Built-in

x = "global"

def outer():
    x = "enclosing"
    
    def inner():
        x = "local"
        print(x)  # Prints "local"
    
    inner()

# Modifying global
counter = 0
def increment():
    global counter
    counter += 1
```

### Classes (Object-Oriented)

```python
class Student:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hi, I'm {self.name}"

student = Student("Alice", 10)
print(student.greet())  # "Hi, I'm Alice"
```

## Level 4 — Expert

### Magic Methods

```python
class Number:
    def __init__(self, value):
        self.value = value
    
    def __add__(self, other):
        return self.value + other.value
    
    def __str__(self):
        return str(self.value)

a = Number(5)
b = Number(3)
print(a + b)  # 8 (uses __add__)
print(str(a))  # 5 (uses __str__)
```

---

## Navigation

**Parent**: [[000_PYTHON_MOC|PYTHON]]

**Synapses**:
- [[001_Functions|PYTHON 002]] - Deep dive on functions
- [[001_Mental_Models|CORE 001]] - Python mental model
- [[001_Game_Loops|GAME-DEV 001]] - Game loop