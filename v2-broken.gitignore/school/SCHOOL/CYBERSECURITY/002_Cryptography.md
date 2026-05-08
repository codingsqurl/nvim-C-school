# 002_Cryptography

> Symmetric and asymmetric encryption, hashing, TLS, and certificates.

## Level 1 — Intuition

### Concept

Cryptography is the mathematics of secrets. It answers three questions:
1. **Confidentiality** — Can only the right person read this? (encryption)
2. **Integrity** — Has this been tampered with? (hashing, MACs)
3. **Authenticity** — Who sent this? (digital signatures)

### The Big Three

```
┌─────────────────────────────────────────────────────────┐
│                                                     │
│  SYMMETRIC ENCRYPTION    ASYMMETRIC ENCRYPTION    HASHING│
│  (shared secret key)     (public + private key)   (one-way)│
│                                                     │
│  ┌───┐     ┌───┐         ┌───┐      ┌───┐        "hello" │
│  │ P │ ──→ │ C │         │ P │ ──→  │ C │           │     │
│  │   │ ←── │   │         │   │      │   │        ┌──┴──┐  │
│  └───┘     └───┘         └───┘      └───┘        │2cf24│  │
│    Same key both ways    Encrypt w/ public       │dba5f│  │
│    Fast (AES, ChaCha)    Decrypt w/ private      └─────┘  │
│                          Slow (RSA, ECC)         Can't reverse│
└─────────────────────────────────────────────────────────┘
```

## Level 2 — Practical

### Symmetric Encryption (AES)

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
import os

def aes_encrypt(key: bytes, plaintext: bytes) -> bytes:
    """Encrypt using AES-256 in CBC mode."""
    iv = os.urandom(16)  # Initialization vector — must be random!
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plaintext) + padder.finalize()

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    return iv + ciphertext  # Prepend IV for decryption

def aes_decrypt(key: bytes, data: bytes) -> bytes:
    iv = data[:16]
    ciphertext = data[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    decryptor = cipher.decryptor()
    padded = decryptor.update(ciphertext) + decryptor.finalize()

    unpadder = padding.PKCS7(128).unpadder()
    return unpadder.update(padded) + unpadder.finalize()

# Usage
key = os.urandom(32)  # 256-bit key
encrypted = aes_encrypt(key, b"Top secret message")
decrypted = aes_decrypt(key, encrypted)
```

### Hashing (SHA-256)

```python
import hashlib

def hash_password(password: str, salt: bytes = None) -> tuple:
    """Hash password with salt. NEVER store plaintext passwords."""
    if salt is None:
        salt = os.urandom(32)
    # Use PBKDF2, bcrypt, or Argon2 in production, NOT sha256 directly
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt, hashed

def verify_password(password: str, salt: bytes, stored_hash: bytes) -> bool:
    new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return new_hash == stored_hash

# Usage
salt, hashed = hash_password("hunter2")
assert verify_password("hunter2", salt, hashed)
assert not verify_password("wrong", salt, hashed)
```

### Asymmetric Encryption (RSA)

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

# Generate key pair
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

# Encrypt with PUBLIC key (anyone can do this)
message = b"Only the private key holder can read this"
ciphertext = public_key.encrypt(
    message,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None)
)

# Decrypt with PRIVATE key (only holder can do this)
plaintext = private_key.decrypt(
    ciphertext,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None)
)

# Sign with PRIVATE key (proves YOU sent it)
signature = private_key.sign(
    b"Sign this document",
    padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH),
    hashes.SHA256()
)

# Verify with PUBLIC key (anyone can verify)
public_key.verify(
    signature, b"Sign this document",
    padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH),
    hashes.SHA256()
)
```

## Level 3 — Systems

### TLS 1.3 Handshake

```
Client                                    Server
  │                                         │
  │── ClientHello ──────────────────────→   │
  │   (supported ciphers, key_share)       │
  │                                         │
  │   ←── ServerHello ────────────────────│
  │       (chosen cipher, key_share,      │
  │        certificate, finished)         │
  │                                         │
  │── Finished ────────────────────────→   │
  │   (encrypted application data)        │
  │                                         │
  │   ←── Application Data ──────────────│
  │                                         │

1 RTT (Round Trip Time) — TLS 1.3 is FAST
(down from 2 RTT in TLS 1.2)

Key Exchange: ECDHE (Elliptic Curve Diffie-Hellman Ephemeral)
- Forward secrecy: past sessions safe even if long-term key compromised
```

### Certificate Chain

```
Root CA (trusted, in browser/OS trust store)
  │  Self-signed certificate
  │  e.g., Let's Encrypt ISRG Root X1
  ▼
Intermediate CA
  │  Signed by Root CA
  │  e.g., Let's Encrypt R3
  ▼
Leaf Certificate (your website)
  │  Signed by Intermediate CA
  │  Contains: domain, public key, validity period
```

```bash
# Inspect a TLS certificate
openssl s_client -connect example.com:443 -servername example.com \
  </dev/null 2>/dev/null | openssl x509 -text -noout

# Generate a self-signed certificate (for local dev)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
  -days 365 -nodes -subj "/CN=localhost"
```

## Level 4 — Expert

### Cryptographic Attacks and Defenses

```
1. Padding Oracle Attack (CBC mode)
   Attacker modifies ciphertext, observes server error response
   Defense: Encrypt-then-MAC, use AEAD (GCM, ChaCha20-Poly1305)

2. Timing Attack
   Measure time for operations → deduce secret
   string_compare("aaaa", secret) vs string_compare("zzzz", secret)
   Defense: Constant-time comparison, constant-time algorithms

3. Birthday Attack (Hash Collision)
   Find two inputs with same hash → O(2^(n/2)) not O(2^n)
   SHA-256 → 128-bit security against collisions
   Defense: Use strong hash (SHA-256+, NOT MD5/SHA-1)

4. Side-Channel Attacks
   Measure power consumption, EM radiation, CPU cache timing
   Defense: Constant-time code, hardware security modules (HSM)
```

### Modern Cryptography Choices

| Need | Use | Avoid |
|------|-----|-------|
| Symmetric encryption | AES-256-GCM, ChaCha20-Poly1305 | DES, RC4, AES-ECB |
| Hashing | SHA-256, SHA-3, BLAKE3 | MD5, SHA-1 |
| Password hashing | Argon2id, bcrypt, scrypt | SHA-256, MD5 |
| Key exchange | ECDHE with Curve25519 | RSA key exchange |
| Signatures | Ed25519, ECDSA (P-256) | RSA-PKCS#1 v1.5 |
| Asymmetric encryption | ECIES, RSA-OAEP | RSA-PKCS#1 v1.5 |

---

## Exercises

1. Write a program that encrypts a file with AES-256-GCM and decrypts it. Verify the ciphertext differs on each run (random IV).
2. Implement a password hash and verify function using bcrypt or Argon2. Time the hash operation and explain why it's intentionally slow.
3. Generate an RSA key pair, sign a message with the private key, and verify with the public key. Tamper with the message and observe verification failure.

## Quiz

1. What's the difference between symmetric and asymmetric encryption?
2. Why do you use salt when hashing passwords?
3. What is forward secrecy and why does it matter?
4. How does the TLS certificate chain work?
5. Why should you use AES-GCM instead of AES-CBC?

---

## Navigation

**Parent**: [[000_CYBERSECURITY_MOC|CYBERSECURITY]]

**Synapses**:
- [[001_Threat_Modeling|CYBERSECURITY 001]] — What you're protecting
- [[003_Network_Security|CYBERSECURITY 003]] — Network encryption
- [[004_DNS_And_HTTP|NETWORKING 004]] — HTTPS foundations
