# 004_DNS_And_HTTP

> DNS resolution, HTTP/2/3, REST, gRPC, and WebSockets.

## Level 1 — Intuition

### Concept

DNS is the internet's phonebook. HTTP is the language browsers speak to servers. Every time you type a URL, DNS resolves the name to an IP, and HTTP fetches the page.

### The Request Journey Revisited

```
Browser: "Show me https://example.com/page"

1. DNS:  example.com → 93.184.216.34
2. TCP:  Connect to 93.184.216.34:443
3. TLS:  Verify certificate, establish encrypted tunnel
4. HTTP: GET /page HTTP/2 → 200 OK + HTML

Total: ~100-500ms depending on distance
```

## Level 2 — Practical

### DNS Resolution: Step by Step

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Browser │    │  OS Resolver│    │ DNS Infra │
└────┬─────┘    └─────┬──────┘    └─────┬─────┘
     │                │                │
     │ getaddrinfo()   │                │
     │──→             │                │
     │                │   A? example.com│
     │                │──→ DNS query ──→│
     │                │                │
     │                │  1. Check local cache
     │                │  2. Check /etc/hosts
     │                │  3. Check /etc/resolv.conf nameservers
     │                │  4. Ask recursive resolver (e.g., 8.8.8.8)
     │                │                │
     │                │  Root:    "Ask .com NS"
     │                │  .com:    "Ask ns1.example.com"
     │                │  example: "93.184.216.34"
     │                │                │
     │                │←── Answer ────│
     │   ← 93.184.216.34               │
     │                │                │
```

```bash
# DNS tools
dig example.com                    # Full DNS query
dig example.com +short             # Just the answer
dig example.com A                  # IPv4 address
dig example.com AAAA               # IPv6 address
dig example.com MX                 # Mail servers
dig example.com NS                 # Nameservers
dig example.com TXT                # SPF, DKIM, verification
dig example.com ANY                # All records
dig -x 93.184.216.34               # Reverse lookup (PTR)

# Trace full resolution
dig example.com +trace

# Specific nameserver
dig example.com @8.8.8.8

# nslookup (simpler alternative)
nslookup example.com
```

### HTTP Methods and Status Codes

```
Methods:
GET     — Read resource
POST    — Create resource
PUT     — Update/replace resource
PATCH   — Partial update
DELETE  — Remove resource
HEAD    — Like GET but no body (check existence)
OPTIONS — What methods are supported? (CORS preflight)

Status Codes:
1xx Informational: 100 Continue, 101 Switching Protocols
2xx Success:       200 OK, 201 Created, 204 No Content
3xx Redirect:      301 Permanent, 302 Found, 304 Not Modified
4xx Client Error:  400 Bad Request, 401 Unauthorized, 403 Forbidden,
                   404 Not Found, 429 Too Many Requests
5xx Server Error:  500 Internal Server Error, 502 Bad Gateway,
                   503 Service Unavailable, 504 Gateway Timeout
```

## Level 3 — Systems

### HTTP/2 and HTTP/3

```
HTTP/1.1:                  HTTP/2:                  HTTP/3:
┌─────┐ ┌─────┐           ┌─────────────────┐      ┌──────────────────┐
│ TCP │ │ TCP │           │      TCP        │      │      QUIC        │
│Conn1│ │Conn2│           │  ┌──┬──┬──┬──┐  │      │  (UDP-based)     │
└──┬──┘ └──┬──┘           │  │S1│S2│S3│S4│  │      │  ┌──┬──┬──┬──┐  │
   │       │              │  └──┴──┴──┴──┘  │      │  │S1│S2│S3│S4│  │
   ↓       ↓              │    MULTIPLEXED   │      │  └──┴──┴──┴──┘  │
 6 conns,                 │ streams over 1   │      │ No head-of-line  │
 head-of-line             │ connection       │      │ blocking!        │
 blocking                 └─────────────────┘      └──────────────────┘

HTTP/2 Features:
- Multiplexing: Many requests over one TCP connection
- Header compression (HPACK)
- Server push: Server can send resources before client asks
- Stream prioritization

HTTP/3 (QUIC) Features:
- Built on UDP (not TCP)
- 0-RTT connection establishment (for returning visitors)
- No head-of-line blocking (independent streams)
- Connection migration (survive IP change — Wi-Fi → mobile)
- Mandatory TLS 1.3 encryption
```

### REST API Design

```python
# REST conventions
# Resource-oriented, stateless, uses HTTP methods semantically

# GET    /api/users          → List users
# GET    /api/users/42       → Get user 42
# POST   /api/users          → Create user
# PUT    /api/users/42       → Replace user 42
# PATCH  /api/users/42       → Partial update user 42
# DELETE /api/users/42       → Delete user 42

# Good REST design:
@app.get("/api/users")
async def list_users(limit: int = 20, offset: int = 0):
    """GET /api/users?limit=20&offset=0"""
    return db.query(User).limit(limit).offset(offset).all()

@app.post("/api/users", status_code=201)
async def create_user(user: UserCreate):
    """POST /api/users — returns 201 Created"""
    new_user = db.add(User(**user.dict()))
    return new_user

# Nested resources:
# GET /api/users/42/posts       → List user 42's posts
# POST /api/users/42/posts      → Create post for user 42

# HATEOAS (Hypermedia — advanced):
# {
#   "id": 42,
#   "name": "Alice",
#   "_links": {
#     "self": {"href": "/api/users/42"},
#     "posts": {"href": "/api/users/42/posts"}
#   }
# }
```

### gRPC

```protobuf
// service.proto — Define API contract
syntax = "proto3";

service UserService {
  rpc GetUser(UserRequest) returns (UserResponse);
  rpc ListUsers(ListRequest) returns (stream UserResponse);  // Server streaming
  rpc CreateUser(stream UserRequest) returns (UserResponse); // Client streaming
}

message UserRequest {
  int32 id = 1;
}

message UserResponse {
  int32 id = 1;
  string name = 2;
  string email = 3;
}
```

```
gRPC vs REST:
┌───────────────┬─────────────────────┬─────────────────────┐
│ Aspect        │ REST + JSON         │ gRPC + Protobuf     │
├───────────────┼─────────────────────┼─────────────────────┤
│ Format        │ JSON (text)         │ Protobuf (binary)   │
│ Speed         │ Slower (parsing)    │ Faster (compact)    │
│ Readability   │ Human-readable      │ Machine-readable    │
│ Streaming     │ Manual (SSE/WS)     │ Built-in, bi-directional│
│ Schema        │ Optional (OpenAPI)  │ Required (.proto)   │
│ Browser       │ Native support      │ Needs gRPC-web      │
│ Best for      │ Public APIs, web    │ Microservices, mobile│
└───────────────┴─────────────────────┴─────────────────────┘
```

## Level 4 — Expert

### WebSockets

```python
# WebSocket: Persistent, bidirectional connection
# Upgrade from HTTP → WebSocket protocol

# Client (JavaScript):
# const ws = new WebSocket("wss://example.com/ws");
# ws.onmessage = (event) => console.log(event.data);
# ws.send("Hello server!");

# Server (Python with websockets library):
import asyncio
import websockets

async def handler(websocket):
    async for message in websocket:
        await websocket.send(f"Echo: {message}")

asyncio.run(websockets.serve(handler, "0.0.0.0", 8765))
```

```
WebSocket vs HTTP:
┌────────────────┬──────────────────┬──────────────────┐
│                │ HTTP             │ WebSocket        │
├────────────────┼──────────────────┼──────────────────┤
│ Direction      │ Client → Server  │ Bidirectional    │
│ Connection     │ Stateless (new)  │ Persistent       │
│ Overhead       │ Headers per msg  │ 2 bytes per frame│
│ Use case       │ Request/response │ Real-time (chat, │
│                │                  │  games, live)    │
└────────────────┴──────────────────┴──────────────────┘
```

### DNS over HTTPS (DoH) and DNS over TLS (DoT)

```
Traditional DNS: Plaintext, visible to ISP
DoT (DNS over TLS):  Port 853, encrypted DNS
DoH (DNS over HTTPS): Port 443, encrypted + hidden in HTTPS traffic

DoH curl example:
curl -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=example.com&type=A'

Benefits: Privacy (ISP can't see what sites you visit)
Controversy: Centralization (focus on few providers),
             bypasses enterprise DNS filtering
```

---

## Exercises

1. Use `dig +trace example.com` and trace each step. Identify the root servers, the TLD servers, and the authoritative nameservers.
2. Design a REST API for a blog platform. Write the endpoints, HTTP methods, status codes, and example JSON responses for CRUD operations on posts and comments.
3. Create a simple WebSocket echo server and client. Test bidirectional communication. Observe the HTTP upgrade in Wireshark.

## Quiz

1. What is the difference between an A record and a CNAME record?
2. What is the main improvement of HTTP/2 over HTTP/1.1?
3. How does HTTP/3 (QUIC) solve head-of-line blocking?
4. When would you use gRPC instead of REST?
5. How does a WebSocket connection start, and how does it differ from HTTP?

---

## Navigation

**Parent**: [[000_NETWORKING_MOC|NETWORKING]]

**Synapses**:
- [[001_TCP_IP|NETWORKING 001]] — Transport layer
- [[002_OSI_Model_Deep_Dive|NETWORKING 002]] — Layer 7 details
- [[006_Building_APIs_With_FastAPI|PYTHON 006]] — Building REST APIs
