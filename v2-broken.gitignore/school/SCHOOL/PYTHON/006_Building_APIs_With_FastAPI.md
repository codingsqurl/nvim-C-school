# 006_Building_APIs_With_FastAPI

> FastAPI, Pydantic validation, async endpoints, and deployment.

## Level 1 — Intuition

### Concept

FastAPI is a modern Python web framework for building APIs. It's fast (async, Starlette-based), self-documenting (auto OpenAPI), and validates data automatically (Pydantic). Think of it as Flask with superpowers.

### Why FastAPI?

```
┌──────────────────────────────────────────────────────────┐
│ Feature              │ FastAPI │ Flask   │ Django REST   │
├──────────────────────┼─────────┼─────────┼───────────────┤
│ Async support        │ Native  │ Plugin  │ Partial       │
│ Data validation      │ Built-in│ Manual  │ Serializers   │
│ Auto docs (Swagger)  │ Built-in│ Plugin  │ Plugin        │
│ Performance          │ Fastest │ Middle  │ Slower        │
│ Type hints           │ First-class│ Optional│ Optional  │
│ Best for             │ APIs    │ Simple  │ Full-stack    │
└──────────────────────┴─────────┴─────────┴───────────────┘
```

## Level 2 — Practical

### Your First API

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

app = FastAPI(title="User API", version="1.0.0")

# --- Models (what data looks like) ---
class User(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=100)
    email: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str
    is_active: bool = True

# --- Fake database ---
users_db: dict[int, User] = {}
next_id = 1

# --- Endpoints ---
@app.get("/")
async def root():
    return {"message": "Welcome to the User API"}

@app.get("/users", response_model=list[User])
async def list_users(active_only: bool = False):
    """List all users. Query param: ?active_only=true"""
    if active_only:
        return [u for u in users_db.values() if u.is_active]
    return list(users_db.values())

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    """Get a single user by ID."""
    if user_id not in users_db:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

@app.post("/users", response_model=User, status_code=201)
async def create_user(user: UserCreate):
    """Create a new user. Returns 201 Created."""
    global next_id
    new_user = User(id=next_id, **user.model_dump())
    users_db[next_id] = new_user
    next_id += 1
    return new_user

@app.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: int):
    """Delete a user. Returns 204 No Content."""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[user_id]

# Run: uvicorn main:app --reload
# Docs: http://localhost:8000/docs (Swagger)
#       http://localhost:8000/redoc (ReDoc)
```

### Path, Query, and Body Parameters

```python
from fastapi import Path, Query
from enum import Enum

class ItemCategory(str, Enum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    FOOD = "food"

@app.get("/items/{item_id}")
async def get_item(
    item_id: int = Path(ge=1, description="The item ID"),
    category: Optional[ItemCategory] = None,
    q: Optional[str] = Query(None, min_length=3, max_length=50),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    """Example: /items/42?category=electronics&q=laptop&page=1&size=20"""
    return {
        "item_id": item_id,
        "category": category,
        "query": q,
        "page": page,
        "size": size,
    }
```

## Level 3 — Systems

### Dependency Injection

```python
from fastapi import Depends
from typing import Annotated

# Dependency: get the database
async def get_db():
    db = Database()               # Connect
    try:
        yield db                  # Provide to endpoint
    finally:
        await db.close()          # Cleanup (runs after response)

# Dependency: verify API key
async def verify_api_key(
    x_api_key: str = Header(alias="X-API-Key")
):
    if x_api_key != "secret-key":
        raise HTTPException(401, "Invalid API key")
    return x_api_key

# Dependency: get current user from token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db = Depends(get_db),
):
    user = decode_token(token)
    if not user:
        raise HTTPException(401, "Invalid token")
    return user

# Use dependencies in endpoints
@app.get("/items")
async def list_items(
    db = Depends(get_db),
    current_user = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    items = await db.query(Item).filter(
        Item.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return items

# Annotated shorthand (Python 3.9+)
# CommonDeps = Annotated[Database, Depends(get_db)]
# @app.get("/items")
# async def list_items(db: CommonDeps):
```

### Middleware and CORS

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time

# CORS: allow frontend from different origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myfrontend.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware: log request time
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    process_time = time.time() - start
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Background tasks
from fastapi import BackgroundTasks

def send_welcome_email(email: str):
    print(f"Sending welcome email to {email}")

@app.post("/users")
async def create_user(
    user: UserCreate,
    background_tasks: BackgroundTasks,
):
    # ... create user ...
    background_tasks.add_task(send_welcome_email, user.email)
    return new_user
```

### Error Handling and Responses

```python
from fastapi import Request
from fastapi.responses import JSONResponse

# Custom exception
class ItemNotFound(Exception):
    def __init__(self, item_id: int):
        self.item_id = item_id

# Exception handler
@app.exception_handler(ItemNotFound)
async def item_not_found_handler(request: Request, exc: ItemNotFound):
    return JSONResponse(
        status_code=404,
        content={"error": f"Item {exc.item_id} not found"},
    )

# Use different response models for create vs read
class UserResponse(BaseModel):
    id: int
    name: str

class UserCreate(BaseModel):
    name: str
    password: str  # NEVER in response!

@app.post("/users", response_model=UserResponse)
# password is accepted but excluded from response — auto!
```

## Level 4 — Expert

### Production Deployment

```dockerfile
# Dockerfile for FastAPI
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run with multiple workers (per CPU core)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "4", "--proxy-headers", "--forwarded-allow-ips", "*"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### Performance Tuning

```python
# 1. Use async database drivers
# Instead of: psycopg2 (sync)
# Use: asyncpg or psycopg (v3+ async mode)
# With SQLAlchemy 2.0 async:
# engine = create_async_engine("postgresql+asyncpg://...")

# 2. Connection pooling
# Connection pool keeps connections ready
# pool_size = 20  # Concurrent DB connections
# max_overflow = 10  # Extra connections under load

# 3. Response compression
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 4. Caching
# Use Redis for frequently-read data
# from fastapi_cache import FastAPICache
# from fastapi_cache.decorator import cache
# @cache(expire=60)
# @app.get("/expensive-query")

# 5. Streaming large responses
from fastapi.responses import StreamingResponse

@app.get("/large-file")
async def download_large():
    def iterfile():
        with open("large.zip", "rb") as f:
            while chunk := f.read(65536):
                yield chunk
    return StreamingResponse(iterfile(), media_type="application/zip")
```

### Testing FastAPI Applications

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_user():
    response = client.post("/users", json={
        "name": "Alice",
        "email": "alice@test.com"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice"
    assert "id" in data

def test_get_user_not_found():
    response = client.get("/users/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

def test_list_users():
    response = client.get("/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

---

## Exercises

1. Build a CRUD API for a "Task" resource with fields: id, title, completed, due_date. Implement GET, POST, PUT, DELETE endpoints with validation.
2. Add dependency injection for an API key check. Protect all POST/PUT/DELETE endpoints with it. Test with curl.
3. Containerize your API with Docker. Run it with docker-compose alongside a PostgreSQL database. Test connectivity.

## Quiz

1. What does `response_model` do in FastAPI?
2. How does FastAPI generate documentation automatically?
3. What is dependency injection in FastAPI and why is it useful?
4. How do you handle CORS in FastAPI?
5. What's the difference between a background task and a streaming response?

---

## Navigation

**Parent**: [[000_PYTHON_MOC|PYTHON]]

**Synapses**:
- [[004_Concurrency|PYTHON 004]] — Async fundamentals
- [[005_Testing_And_Packaging|PYTHON 005]] — Testing APIs
- [[004_DNS_And_HTTP|NETWORKING 004]] — HTTP and REST
