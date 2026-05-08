# 004_Web_Security

> OWASP Top 10, XSS, SQLi, CSRF, and authentication security.

## Level 1 — Intuition

### Concept

Web security is about trusting nothing from the client. Every input is hostile. Every request could be forged. Every cookie could be stolen. Defense is a continuous process, not a one-time checklist.

### OWASP Top 10 (2021)

```
A01: Broken Access Control      "I can see other users' data"
A02: Cryptographic Failures     "Sensitive data in plaintext"
A03: Injection                   "DROP TABLE users;--"
A04: Insecure Design             "No threat model, no security"
A05: Security Misconfiguration   "Default admin/admin creds"
A06: Vulnerable Components       "Outdated library with known CVE"
A07: Auth Failures               "Weak password policy, no MFA"
A08: Software/Data Integrity     "Untrusted CI/CD, deserialization"
A09: Logging/Monitoring          "Breached for 6 months, no one noticed"
A10: SSRF                        "Server fetches attacker's URL"
```

## Level 2 — Practical

### SQL Injection

```python
# VULNERABLE CODE — DO NOT USE
@app.route("/user/<username>")
def get_user_vulnerable(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    # Attacker input: ' OR '1'='1' --
    # Results in: SELECT * FROM users WHERE username = '' OR '1'='1' --'
    # Returns ALL users
    return db.execute(query).fetchall()

# SAFE CODE — Parameterized queries
@app.route("/user/<username>")
def get_user_safe(username):
    query = "SELECT * FROM users WHERE username = ?"
    return db.execute(query, (username,)).fetchall()
    # Input ' OR '1'='1' -- is treated as literal string, not SQL
```

### Cross-Site Scripting (XSS)

```python
# Stored XSS: attacker posts <script>alert('xss')</script> as comment

# REFLECTED XSS — VULNERABLE
@app.route("/search")
def search():
    term = request.args.get('q', '')
    return f"<h1>Results for: {term}</h1>"             # UNSAFE
    # Attacker crafts: /search?q=<script>stealCookies()</script>

# SAFE: Escape output
from markupsafe import escape

@app.route("/search")
def search_safe():
    term = request.args.get('q', '')
    return f"<h1>Results for: {escape(term)}</h1>"     # SAFE

# Content Security Policy (CSP) header — defense in depth
# response.headers['Content-Security-Policy'] = \
#     "default-src 'self'; script-src 'self'; style-src 'self'"
```

### Cross-Site Request Forgery (CSRF)

```html
<!-- Attacker's page on evil.com -->
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker_account">
  <input type="hidden" name="amount" value="10000">
  <button>Click for free prize!</button>
</form>
<!-- If you're logged into bank.com, your browser sends your cookies -->

<!-- Defense: CSRF Token -->
<form action="/transfer" method="POST">
  <input type="hidden" name="csrf_token" value="{{ csrf_token }}">
  <!-- Server generates unique token per session, validates on POST -->
</form>

<!-- Modern defense: SameSite cookies -->
<!-- Set-Cookie: session=abc123; SameSite=Lax -->
<!-- Cookie not sent on cross-site POST requests -->
```

## Level 3 — Systems

### Authentication Security

```python
import hashlib, os, time
from dataclasses import dataclass

# NEVER store plaintext passwords
@dataclass
class User:
    username: str
    password_hash: str
    salt: str
    failed_attempts: int = 0
    locked_until: float = 0

class AuthService:
    MAX_ATTEMPTS = 5
    LOCKOUT_MINUTES = 15

    def login(self, username: str, password: str):
        user = self.db.get_user(username)
        if not user:
            # Constant-time comparison with fake hash to prevent
            # username enumeration via timing
            self._dummy_verify()
            return False

        # Check lockout
        if user.locked_until > time.time():
            return "Account locked. Try again later."

        if self._verify_password(password, user.password_hash,
                                  user.salt):
            user.failed_attempts = 0
            self.db.save(user)
            return self._generate_session(user)
        else:
            user.failed_attempts += 1
            if user.failed_attempts >= self.MAX_ATTEMPTS:
                user.locked_until = time.time() + self.LOCKOUT_MINUTES * 60
            self.db.save(user)
            return False

    def _verify_password(self, password, stored_hash, salt):
        hash = hashlib.pbkdf2_hmac('sha256', password.encode(),
                                    salt, 200000)
        return hash == stored_hash

    def _dummy_verify(self):
        """Prevent timing-based username enumeration."""
        hashlib.pbkdf2_hmac('sha256', b'dummy', os.urandom(32), 200000)
```

### JWT Security

```python
import jwt, datetime

# JWT Structure: header.payload.signature
# eyJhbGciOi... . eyJzdWIiOi... . SflKxwRJ...

SECRET = os.environ.get("JWT_SECRET", "change-me-in-production!")

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        "jti": os.urandom(16).hex(),  # Unique token ID for revocation
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

# Security considerations:
# - NEVER accept 'none' algorithm
# - Set short expiration (15-60 min) + refresh tokens
# - Keep secrets OUT of source code
# - Validate all claims (iss, aud, exp)
```

### Secure Headers

```python
# Security headers every web app should set
SECURITY_HEADERS = {
    "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; object-src 'none';",
    "X-Frame-Options": "DENY",                    # Prevent clickjacking
    "X-Content-Type-Options": "nosniff",           # Prevent MIME sniffing
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security":
        "max-age=63072000; includeSubDomains; preload",  # HSTS
}

def add_security_headers(response):
    for key, value in SECURITY_HEADERS.items():
        response.headers[key] = value
    return response
```

## Level 4 — Expert

### OAuth 2.0 and OpenID Connect

```
Authorization Code Flow (most secure for server-side apps):
┌──────────┐                              ┌──────────────┐
│  Client   │                              │ Auth Server   │
│ (your app)│                              │  (Google)     │
└─────┬─────┘                              └──────┬────────┘
      │                                           │
      │── Redirect to /authorize ─────────────→   │
      │     ?client_id, redirect_uri, scope      │
      │                                           │
      │   ←── User logs in, authorizes ────────│
      │                                           │
      │   ←── Redirect with code ──────────────│
      │     ?code=AUTH_CODE_HERE                 │
      │                                           │
      │── POST /token (code + client_secret) ──→ │
      │     (server-to-server, code never in URL) │
      │                                           │
      │   ←── {access_token, id_token} ────────│
      │                                           │
      │── API calls with access_token ─────────→  │
      │                                           │

PKCE (Proof Key for Code Exchange) — required for SPA/mobile
- Generate random code_verifier
- Send SHA-256(code_verifier) as code_challenge
- Exchange code + code_verifier for token
- Prevents authorization code interception
```

### Supply Chain Security

```bash
# Audit dependencies for known vulnerabilities
pip-audit                    # Python
npm audit                    # Node.js
cargo audit                  # Rust

# Check artifact integrity
sha256sum download.tar.gz    # Compare with published hash
gpg --verify file.sig file   # Verify GPG signature

# SBOM (Software Bill of Materials)
cyclonedx-py requirements.txt  # Generate SBOM
syft .                         # Scan directory for packages
```

---

## Exercises

1. Build a simple login page. Implement parameterized SQL queries (or prepared statements) for authentication. Test with SQL injection payloads to verify they're safe.
2. Create a form with CSRF protection. Build the attack page (a form on a different origin) and verify the CSRF token blocks it.
3. Set all 6 security headers on a web app (or a simple test server). Use `curl -I` to verify each header is present.

## Quiz

1. What's the difference between stored and reflected XSS?
2. How do parameterized queries prevent SQL injection?
3. How does a CSRF token protect against cross-site request forgery?
4. What is the purpose of the Content-Security-Policy header?
5. Why is the OAuth authorization code flow (with PKCE) more secure than the implicit flow?

---

## Navigation

**Parent**: [[000_CYBERSECURITY_MOC|CYBERSECURITY]]

**Synapses**:
- [[001_Threat_Modeling|CYBERSECURITY 001]] — Attacker perspective
- [[002_Cryptography|CYBERSECURITY 002]] — Password hashing
- [[006_Building_APIs_With_FastAPI|PYTHON 006]] — Secure API design
