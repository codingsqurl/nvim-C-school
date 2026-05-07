# 005_Testing_And_Packaging

> pytest, unittest, pip, virtualenv, and publishing to PyPI.

## Level 1 — Intuition

### Concept

Testing proves your code works. Packaging makes it shareable. Together they separate toy scripts from professional software. Every line of code you write should have a test that proves it's correct — and a package that makes it installable.

### The Testing Pyramid

```
     ╱─────╲
    ╱  E2E  ╲         Few: Slow, brittle, test full system
   ╱─────────╲
  ╱ Integration╲      Some: Test components together
 ╱──────────────╲
╱   Unit Tests   ╲   Many: Fast, isolated, test single functions
───────────────────

Write lots of unit tests, some integration tests, few E2E tests.
```

## Level 2 — Practical

### pytest Fundamentals

```python
# test_calculator.py
import pytest
from calculator import add, divide, Calculator

# Basic test
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(0, 0) == 0

# Testing exceptions
def test_divide_by_zero():
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        divide(10, 0)

# Parametrized tests (test many inputs without repetition)
@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (0, 0, 0),
    (-1, 5, 4),
    (100, 200, 300),
])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected

# Fixtures (setup/teardown)
@pytest.fixture
def calculator():
    """Provide a fresh Calculator instance for each test."""
    calc = Calculator()
    calc.memory = 0
    return calc

def test_memory_add(calculator):
    calculator.memory_add(10)
    assert calculator.memory == 10

def test_memory_clear(calculator):
    calculator.memory_add(50)
    calculator.memory_clear()
    assert calculator.memory == 0

# Fixture with teardown
@pytest.fixture
def temp_file(tmp_path):
    """tmp_path is a built-in fixture for temporary directories."""
    file = tmp_path / "test.txt"
    file.write_text("hello")
    return file
    # tmp_path auto-cleaned after test

# Skipping and marking
@pytest.mark.skip(reason="Not implemented yet")
def test_future_feature():
    pass

@pytest.mark.slow
def test_heavy_computation():
    import time
    time.sleep(2)
    assert True

# Run: pytest -v -m "not slow"  # Skip slow tests
```

### Mocking

```python
from unittest.mock import Mock, patch, MagicMock
import requests

# Function that calls external API
def get_user_name(user_id):
    response = requests.get(f"https://api.example.com/users/{user_id}")
    if response.status_code == 200:
        return response.json()["name"]
    return None

# Mock the external dependency
@patch("module_name.requests.get")
def test_get_user_name(mock_get):
    # Configure mock
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"name": "Alice"}
    mock_get.return_value = mock_response

    result = get_user_name(42)
    assert result == "Alice"
    mock_get.assert_called_once_with("https://api.example.com/users/42")

# Mock an object
def test_with_magic_mock():
    service = MagicMock()
    service.get_data.return_value = {"status": "ok"}
    service.save_data.side_effect = ValueError("Disk full")

    assert service.get_data("key") == {"status": "ok"}
    with pytest.raises(ValueError):
        service.save_data({"data": 123})

    # Verify calls
    service.get_data.assert_called_with("key")
    assert service.get_data.call_count == 1
```

### Project Structure and Packaging

```
myproject/
├── pyproject.toml          # Modern build config (PEP 517/518)
├── README.md
├── LICENSE
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── core.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   ├── test_core.py
│   └── test_utils.py
└── scripts/
    └── cli.py
```

```toml
# pyproject.toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "myproject"
version = "0.1.0"
description = "A short description"
readme = "README.md"
requires-python = ">=3.9"
license = {text = "MIT"}
authors = [{name = "Your Name", email = "you@example.com"}]
keywords = ["example", "tutorial"]
classifiers = [
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
]

dependencies = [
    "requests>=2.28",
    "click>=8.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov",
    "ruff",
    "mypy",
]

[project.scripts]
mycli = "mypackage.cli:main"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=mypackage"

[tool.ruff]
line-length = 100
target-version = "py39"
```

## Level 3 — Systems

### CI/CD with GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.9", "3.10", "3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -e ".[dev]"

      - name: Lint
        run: ruff check src/ tests/

      - name: Type check
        run: mypy src/

      - name: Test with coverage
        run: pytest --cov=mypackage --cov-report=xml

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml
```

### Virtual Environments

```bash
# Built-in venv (Python 3.3+)
python -m venv .venv                  # Create
source .venv/bin/activate             # Activate (Linux/Mac)
# .venv\Scripts\activate               # Activate (Windows)
deactivate                            # Deactivate

# pip basics
pip install requests                  # Install package
pip install -r requirements.txt       # Install from requirements file
pip install -e .                      # Install current project (editable)
pip freeze > requirements.txt         # Lock current versions
pip list                              # List installed packages
pip show requests                     # Show package info
pip uninstall requests                # Remove package

# requirements.txt vs pyproject.toml
# requirements.txt = exact pins for reproducibility
# pyproject.toml = abstract dependencies for the package
# Use BOTH: pyproject.toml for the package, requirements.txt for apps

# Modern alternative: uv (faster pip/venv replacement)
# pip install uv
# uv venv                              # Create venv (fast)
# uv pip install -r requirements.txt   # Install deps (fast)
```

### Publishing to PyPI

```bash
# Build the package
pip install build
python -m build                        # Creates dist/ with .tar.gz and .whl

# Check the package
pip install twine
twine check dist/*

# Upload to TestPyPI (practice)
twine upload -r testpypi dist/*

# Upload to PyPI (real!)
twine upload dist/*

# Users can then:
# pip install myproject

# Version management (semantic versioning):
# 0.1.0 → 0.2.0  (minor: new features, backward compatible)
# 0.1.0 → 0.1.1  (patch: bug fixes)
# 0.1.0 → 1.0.0  (major: breaking changes)
```

## Level 4 — Expert

### Property-Based Testing (Hypothesis)

```python
from hypothesis import given, strategies as st, assume
from calculator import add

# Instead of hand-writing 100 test cases, describe properties:
@given(st.integers(), st.integers())
def test_add_commutative(a, b):
    """a + b == b + a for all integers."""
    assert add(a, b) == add(b, a)

@given(st.integers(), st.integers(), st.integers())
def test_add_associative(a, b, c):
    """(a + b) + c == a + (b + c)."""
    assert add(add(a, b), c) == add(a, add(b, c))

@given(st.integers())
def test_add_identity(a):
    """a + 0 == a."""
    assert add(a, 0) == a

@given(st.integers(), st.integers().filter(lambda x: x != 0))
def test_divide_then_multiply(a, b):
    """(a / b) * b == a (for exact division)."""
    assume(a % b == 0)  # Skip cases where it's not exact
    result = divide(a, b)
    assert result * b == a

# Hypothesis finds edge cases AUTOMATICALLY:
# Overflow, underflow, negative, zero, large values, etc.
```

### Test Coverage and Mutation Testing

```bash
# Coverage: which lines are executed by tests?
pytest --cov=mypackage --cov-report=html
# Open htmlcov/index.html — green=covered, red=missed

# Mutation testing: are your tests actually meaningful?
# mutmut: makes small changes to your code, checks if tests catch it
# If changing `+` to `-` doesn't break any test → your tests are weak!
pip install mutmut
mutmut run
mutmut results  # Show surviving mutants (untested code paths)
```

---

## Exercises

1. Write 5 unit tests for a function using pytest. Include a parametrized test, a test that expects an exception, and a fixture.
2. Take a Python script you've written, turn it into a package with `pyproject.toml`, and install it in editable mode (`pip install -e .`).
3. Mock an external API call in a test. Verify the mock was called with correct arguments and that your code handles the mock response correctly.

## Quiz

1. What's the difference between a unit test and an integration test?
2. What does a pytest fixture do?
3. Why use `unittest.mock.patch` instead of real API calls in tests?
4. What is the difference between `pyproject.toml` and `requirements.txt`?
5. What is property-based testing and when is it useful?

---

## Navigation

**Parent**: [[000_PYTHON_MOC|PYTHON]]

**Synapses**:
- [[001_Syntax_Basics|PYTHON 001]] — Functions to test
- [[002_OOP_In_Python|PYTHON 002]] — Testing classes
- [[003_Infrastructure_As_Code|DEVOPS 003]] — CI/CD pipelines
