# 002_OOP_In_Python

> Classes, inheritance, dunder methods, dataclasses, and properties.

## Level 1 — Intuition

### Concept

Object-Oriented Programming bundles data and the functions that operate on it into "objects." Think of a class as a blueprint and an instance as the thing built from it. A `Car` class defines what a car has (color, speed) and what it does (accelerate, brake). Each individual car is an instance.

### The Four Pillars

```
┌──────────────────────────────────────────────────────────┐
│ Encapsulation  │ Bundle data + methods, hide internals   │
│ Inheritance    │ "is-a" relationship, code reuse        │
│ Polymorphism   │ Same interface, different behavior      │
│ Abstraction    │ Expose essentials, hide complexity      │
└──────────────────────────────────────────────────────────┘
```

## Level 2 — Practical

### Classes and Objects

```python
class Car:
    """A simple car class."""

    # Class variable (shared by all instances)
    total_cars = 0

    def __init__(self, color: str, speed: float = 0):
        # Instance variables (unique per instance)
        self.color = color
        self.speed = speed
        Car.total_cars += 1

    def accelerate(self, amount: float):
        self.speed += amount

    def brake(self, amount: float):
        self.speed = max(0, self.speed - amount)

    def __repr__(self):
        return f"Car(color='{self.color}', speed={self.speed})"


# Usage
car1 = Car("red")
car2 = Car("blue", 30)

car1.accelerate(20)
print(car1)          # Car(color='red', speed=20)
print(Car.total_cars) # 2
```

### Inheritance

```python
class ElectricCar(Car):
    """An electric car IS-A car with a battery."""

    def __init__(self, color: str, battery_kwh: float, speed: float = 0):
        super().__init__(color, speed)      # Call parent __init__
        self.battery_kwh = battery_kwh
        self._charge = 100                  # _ prefix = protected by convention

    def charge(self):
        self._charge = 100
        print(f"Charged to {self._charge}%")

    # Override parent method
    def accelerate(self, amount: float):
        """Electric cars accelerate faster."""
        self.speed += amount * 1.5

    @property
    def range_km(self):
        return self.battery_kwh * 6  # ~6 km per kWh

    def __repr__(self):
        return (f"ElectricCar(color='{self.color}', "
                f"speed={self.speed}, battery={self.battery_kwh}kWh)")


# Multiple inheritance
class SelfDriving:
    def enable_autopilot(self):
        print("Autopilot enabled")


class Tesla(ElectricCar, SelfDriving):
    """Inherits from both ElectricCar and SelfDriving."""

    def __init__(self, color: str):
        super().__init__(color, battery_kwh=75)
        self.brand = "Tesla"

    # MRO: Method Resolution Order
    # Tesla → ElectricCar → Car → SelfDriving → object
```

### Dunder (Magic) Methods

```python
class Vector:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __add__(self, other):
        """v1 + v2"""
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        return NotImplemented

    def __sub__(self, other):
        """v1 - v2"""
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        """v * 3"""
        return Vector(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar):
        """3 * v"""
        return self.__mul__(scalar)

    def __eq__(self, other):
        """v1 == v2"""
        if isinstance(other, Vector):
            return self.x == other.x and self.y == other.y
        return False

    def __len__(self):
        """len(v) — magnitude as integer"""
        return int((self.x**2 + self.y**2) ** 0.5)

    def __bool__(self):
        """bool(v) — False if zero vector"""
        return self.x != 0 or self.y != 0

    def __str__(self):
        return f"({self.x}, {self.y})"

    def __repr__(self):
        return f"Vector(x={self.x}, y={self.y})"


v1 = Vector(3, 4)
v2 = Vector(1, 2)
print(v1 + v2)         # (4, 6)
print(v1 * 3)          # (9, 12)
print(len(v1))         # 5 (magnitude)
print(bool(Vector(0,0))) # False
```

## Level 3 — Systems

### Dataclasses

```python
from dataclasses import dataclass, field
from typing import List

@dataclass
class Point:
    x: float
    y: float
    label: str = ""  # Default value

    # Auto-generated: __init__, __repr__, __eq__
    # No boilerplate!

@dataclass
class Player:
    name: str
    health: int = 100
    inventory: List[str] = field(default_factory=list)  # Mutable default!

    def take_damage(self, amount: int):
        self.health = max(0, self.health - amount)

    @property
    def is_alive(self):
        return self.health > 0

# Frozen (immutable) dataclass
@dataclass(frozen=True)
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

# Usage
p1 = Player("Alice", inventory=["sword"])
p2 = Player("Alice", inventory=["sword"])
print(p1 == p2)  # True — auto __eq__
print(p1)        # Player(name='Alice', health=100, inventory=['sword'])
```

### Properties and Descriptors

```python
class Temperature:
    def __init__(self, celsius: float = 0):
        self._celsius = celsius  # Private by convention

    @property
    def celsius(self):
        """Get temperature in Celsius."""
        return self._celsius

    @celsius.setter
    def celsius(self, value: float):
        """Set with validation."""
        if value < -273.15:
            raise ValueError("Below absolute zero!")
        self._celsius = value

    @property
    def fahrenheit(self):
        """Computed property — no setter needed."""
        return self._celsius * 9/5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value: float):
        self.celsius = (value - 32) * 5/9  # Reuses celsius setter validation


# Descriptor: reusable property-like behavior
class Validated:
    """Descriptor that validates numeric range."""
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def __set_name__(self, owner, name):
        self.private_name = f'_{name}'

    def __get__(self, obj, objtype=None):
        return getattr(obj, self.private_name)

    def __set__(self, obj, value):
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"Min: {self.min_value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"Max: {self.max_value}")
        setattr(obj, self.private_name, value)


class Person:
    age = Validated(min_value=0, max_value=150)
    def __init__(self, name, age):
        self.name = name
        self.age = age
```

### Abstract Base Classes and Protocols

```python
from abc import ABC, abstractmethod

class Database(ABC):
    """Abstract interface — subclasses MUST implement these."""

    @abstractmethod
    def connect(self, url: str):
        pass

    @abstractmethod
    def query(self, sql: str) -> list:
        pass

    def close(self):  # Concrete method with default
        print("Closing connection...")


class PostgresDB(Database):
    def connect(self, url: str):
        print(f"Connecting to Postgres at {url}")

    def query(self, sql: str) -> list:
        print(f"Running: {sql}")
        return []  # mock

# Cannot instantiate abstract class:
# db = Database()  # TypeError!

db = PostgresDB()
db.connect("postgresql://localhost/mydb")


# Protocol (structural subtyping) — Python 3.8+
from typing import Protocol

class Flyer(Protocol):
    def fly(self) -> None: ...

def make_it_fly(thing: Flyer):
    thing.fly()

class Bird:
    def fly(self):
        print("Flapping wings")

class Plane:
    def fly(self):
        print("Jet engines")

# Both work — no inheritance needed!
make_it_fly(Bird())   # Flapping wings
make_it_fly(Plane())  # Jet engines
```

## Level 4 — Expert

### Metaclasses

```python
# Metaclass: class of a class. Controls class creation.
# type is the default metaclass: type('MyClass', (), {}) creates a class

class SingletonMeta(type):
    """Metaclass that ensures only one instance exists."""
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class Database(metaclass=SingletonMeta):
    def __init__(self):
        self.connected = False

    def connect(self):
        self.connected = True


db1 = Database()
db2 = Database()
print(db1 is db2)  # True — same instance!


# Class decorator is usually simpler than metaclass
def add_repr(cls):
    def __repr__(self):
        attrs = ', '.join(f'{k}={v!r}'
                          for k, v in self.__dict__.items())
        return f'{cls.__name__}({attrs})'
    cls.__repr__ = __repr__
    return cls

@add_repr
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

print(Person("Alice", 30))  # Person(name='Alice', age=30)
```

### SOLID Principles in Python

```
S — Single Responsibility: A class should have ONE reason to change
O — Open/Closed: Open for extension, closed for modification
L — Liskov Substitution: Subtypes must be substitutable for base types
I — Interface Segregation: Many small interfaces > one large interface
D — Dependency Inversion: Depend on abstractions, not concretions
```

---

## Exercises

1. Create a `BankAccount` class with `deposit`, `withdraw`, and a `balance` property. Add validation (no negative balance). Implement `__str__` and `__repr__`.
2. Build a class hierarchy: `Vehicle` (base) → `Car` and `Motorcycle` (subclasses). Each has `start_engine()` with different behavior. Use `super()` properly.
3. Convert a class with boilerplate `__init__` and `__repr__` to `@dataclass`. Add a computed property and a `@staticmethod`.

## Quiz

1. What is the difference between a class method, static method, and instance method?
2. What does `super().__init__()` do and when do you use it?
3. What is the purpose of `@property`?
4. What is MRO (Method Resolution Order) and how does Python determine it?
5. When would you use a metaclass instead of a class decorator?

---

## Navigation

**Parent**: [[000_PYTHON_MOC|PYTHON]]

**Synapses**:
- [[001_Syntax_Basics|PYTHON 001]] — Python class syntax
- [[005_Testing_And_Packaging|PYTHON 005]] — Testing classes
- [[002_Data_Structures|CORE 002]] — OOP data modeling
