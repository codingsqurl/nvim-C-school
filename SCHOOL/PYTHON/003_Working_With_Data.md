# 003_Working_With_Data

> File I/O, JSON, CSV, SQLite, and pandas intro.

## Level 1 — Intuition

### Concept

Data is everywhere — in files, databases, APIs, and spreadsheets. Python's ecosystem makes reading, transforming, and writing data remarkably concise. The pattern is always: load → transform → save.

### Data Formats at a Glance

```
┌─────────────┬────────────────┬───────────────────────┐
│ Format      │ Human-readable │ Use Case              │
├─────────────┼────────────────┼───────────────────────┤
│ JSON        │ Yes            │ APIs, config, web     │
│ CSV         │ Yes            │ Spreadsheets, export  │
│ Parquet     │ No (binary)    │ Big data, analytics   │
│ SQLite      │ No (binary)    │ Local databases       │
│ Pickle      │ No (binary)    │ Python objects only   │
│ YAML/TOML   │ Yes            │ Configuration files   │
└─────────────┴────────────────┴───────────────────────┘
```

## Level 2 — Practical

### File I/O

```python
# Reading
with open("data.txt", "r") as f:
    content = f.read()              # Entire file as string

with open("data.txt", "r") as f:
    lines = f.readlines()           # List of lines (keeps \n)

with open("data.txt", "r") as f:
    for line in f:                  # Iterate (efficient for large files)
        print(line.strip())

# Writing
with open("output.txt", "w") as f:
    f.write("Hello\n")
    f.write("World\n")

# Append
with open("log.txt", "a") as f:
    f.write(f"[{datetime.now()}] Event\n")

# Binary mode
with open("image.png", "rb") as f:
    raw_bytes = f.read()

# Path operations (pathlib — modern, cross-platform)
from pathlib import Path

home = Path.home()
data_dir = home / "data" / "project"
data_dir.mkdir(parents=True, exist_ok=True)

for f in data_dir.glob("*.json"):
    print(f.name, f.stat().st_size)
```

### JSON

```python
import json

# Python → JSON (serialize)
data = {
    "name": "Alice",
    "age": 30,
    "skills": ["Python", "Linux"],
    "active": True,
    "metadata": None,
}

json_str = json.dumps(data, indent=2)  # Pretty string
print(json_str)

with open("output.json", "w") as f:
    json.dump(data, f, indent=2)       # Write to file

# JSON → Python (deserialize)
with open("output.json", "r") as f:
    loaded = json.load(f)

from_json = json.loads('{"key": "value"}')

# Custom serialization
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

data = {"timestamp": datetime.now()}
print(json.dumps(data, cls=DateTimeEncoder))
```

### CSV

```python
import csv

# Reading
with open("data.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["Name"], row["Age"])

# Writing
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Age", "City"])
    writer.writeheader()
    writer.writerow({"Name": "Alice", "Age": 30, "City": "NYC"})
    writer.writerows([
        {"Name": "Bob", "Age": 25, "City": "LA"},
        {"Name": "Charlie", "Age": 35, "City": "Chicago"},
    ])

# Handling messy CSVs
# csv.Sniffer for auto-detecting delimiter
sniffer = csv.Sniffer()
dialect = sniffer.sniff(open("data.csv").readline())
reader = csv.reader(open("data.csv"), dialect)
```

### SQLite

```python
import sqlite3

# Connect (creates file if not exists)
conn = sqlite3.connect("app.db")
conn.row_factory = sqlite3.Row  # Access columns by name
cursor = conn.cursor()

# Create table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

# Insert (always use parameters — never string formatting!)
cursor.execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ("Alice", "alice@example.com")
)

# Insert many
users = [("Bob", "bob@example.com"), ("Charlie", "charlie@example.com")]
cursor.executemany("INSERT INTO users (name, email) VALUES (?, ?)", users)
conn.commit()

# Query
cursor.execute("SELECT * FROM users WHERE name LIKE ?", ("A%",))
for row in cursor.fetchall():
    print(dict(row))  # {'id': 1, 'name': 'Alice', ...}

# Using context manager (auto-commit on success, rollback on error)
with conn:
    conn.execute("UPDATE users SET email = ? WHERE name = ?",
                 ("new@example.com", "Alice"))

conn.close()
```

## Level 3 — Systems

### pandas Introduction

```python
import pandas as pd
import numpy as np

# From CSV
df = pd.read_csv("data.csv")

# From dict
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [30, 25, 35],
    "salary": [75000, 65000, 85000],
})

# Basic exploration
print(df.head())           # First 5 rows
print(df.describe())       # Statistical summary
print(df.info())           # Dtypes, memory usage
print(df["age"].mean())    # 30.0

# Filtering
high_earners = df[df["salary"] > 70000]
experienced = df[(df["age"] >= 30) & (df["salary"] > 70000)]

# Transformations
df["salary_k"] = df["salary"] / 1000
df["senior"] = df["age"].apply(lambda x: "Senior" if x >= 30 else "Junior")

# Grouping and aggregation
grouped = df.groupby("senior").agg({
    "salary": ["mean", "min", "max"],
    "name": "count",
}).round(2)
print(grouped)

# Merge (like SQL JOIN)
left = pd.DataFrame({"id": [1, 2, 3], "name": ["A", "B", "C"]})
right = pd.DataFrame({"id": [1, 2, 4], "score": [90, 85, 88]})
merged = left.merge(right, on="id", how="left")
print(merged)
#    id name  score
# 0   1    A   90.0
# 1   2    B   85.0
# 2   3    C    NaN  ← no match in right

# Write output
df.to_csv("output.csv", index=False)
df.to_parquet("output.parquet")   # Efficient binary format
df.to_sql("users", sqlite_engine, if_exists="replace")
```

### Working with Large Files

```python
# Problem: file is 10 GB, RAM is 8 GB
# Solution: process in chunks

# pandas chunked reading
chunk_size = 100000
results = []
for chunk in pd.read_csv("large.csv", chunksize=chunk_size):
    # Process chunk
    filtered = chunk[chunk["value"] > 100]
    results.append(filtered.groupby("category")["value"].sum())

final = pd.concat(results).groupby("category").sum()

# Lazy evaluation with Dask (~pandas API, out-of-core)
# import dask.dataframe as dd
# df = dd.read_csv("large-*.csv")  # Glob pattern
# result = df[df.value > 100].groupby("category").value.sum()
# result.compute()  # Only NOW does work happen
```

## Level 4 — Expert

### Efficient Data Processing

```python
# Parquet: columnar format — read only needed columns
# Orders of magnitude faster than CSV for analytics
df = pd.read_parquet("data.parquet", columns=["name", "age"])

# Apache Arrow: in-memory columnar format
# Zero-copy between Python, R, Java, C++
import pyarrow as pa
table = pa.Table.from_pandas(df)
# Pass table to other processes without serialization

# DuckDB: embedded analytical database (like SQLite for analytics)
import duckdb
result = duckdb.sql("""
    SELECT category, AVG(value), COUNT(*)
    FROM 'data.parquet'
    WHERE date >= '2026-01-01'
    GROUP BY category
    HAVING COUNT(*) > 100
""").df()

# Polars: fast DataFrame library (Rust backend, lazy API)
# import polars as pl
# df = pl.scan_csv("large.csv")  # Lazy — nothing read yet
# result = (df.filter(pl.col("value") > 100)
#            .group_by("category")
#            .agg(pl.col("value").mean())
#            .collect())  # Everything optimized and executed
```

### Data Validation

```python
# Pydantic: validate data at runtime
from pydantic import BaseModel, Field, validator

class UserRecord(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=0, le=150)
    email: str

    @validator("email")
    def email_must_contain_at(cls, v):
        if "@" not in v:
            raise ValueError("Invalid email")
        return v

# Validate a batch
invalid_count = 0
valid_data = []
for row in csv_rows:
    try:
        valid_data.append(UserRecord(**row))
    except Exception as e:
        invalid_count += 1
print(f"Valid: {len(valid_data)}, Invalid: {invalid_count}")
```

---

## Exercises

1. Read a CSV file with pandas. Filter rows by a condition, compute group statistics, and save the result as a new CSV and a Parquet file.
2. Create a SQLite database with two related tables (e.g., `users` and `orders`). Insert sample data and write a JOIN query.
3. Write a script that reads a large JSON file line by line (JSON Lines format), validates each record with Pydantic, and writes only valid records to a new file.

## Quiz

1. What is the difference between `json.dumps()` and `json.dump()`?
2. Why should you always use parameterized queries with SQL?
3. What's the advantage of Parquet over CSV for large datasets?
4. What does `chunksize` do in `pd.read_csv()`?
5. What is the difference between pandas and Polars?

---

## Navigation

**Parent**: [[000_PYTHON_MOC|PYTHON]]

**Synapses**:
- [[001_Syntax_Basics|PYTHON 001]] — Dict and list basics
- [[002_OOP_In_Python|PYTHON 002]] — Dataclasses for records
- [[004_Monitoring_And_Observability|DEVOPS 004]] — Log data processing
