# 005_Backend_With_Node

> The server is where data lives, business logic runs, and security is enforced.

## Level 1 — Intuition

Node.js = JavaScript outside the browser via V8. Non-blocking I/O via the event loop lets one thread handle thousands of concurrent connections.

```
Timers → Pending → Poll (I/O) → Check → Close → loop
```

```javascript
// BLOCKING — event loop halts
fs.readFileSync('/big/file.txt');

// NON-BLOCKING — event loop continues
fs.readFile('/big/file.txt', (err, data) => { /* runs later */ });
```

## Level 2 — Practical

### Express — Routes and Middleware

```javascript
const express = require('express');
const app = express();
app.use(express.json());

// Routes: params + query
app.get('/api/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id);
  user ? res.json({ data: user }) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/posts', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const posts = await db.getPosts({ page: +page, limit: +limit });
  res.json({ data: posts, meta: { page: +page, limit: +limit } });
});

app.listen(3000);
```

## Level 3 — Systems

### REST API CRUD

```javascript
const router = express.Router();

router.get('/',    async (req, res) => res.json({ data: await Item.find() }));
router.get('/:id', async (req, res) => {
  const item = await Item.findById(req.params.id);
  item ? res.json({ data: item }) : res.status(404).json({ error: 'Not found' });
});
router.post('/',   async (req, res) => res.status(201).json({ data: await Item.create(req.body) }));
router.put('/:id', async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  item ? res.json({ data: item }) : res.status(404).json({ error: 'Not found' });
});
router.delete('/:id', async (req, res) => {
  await Item.findByIdAndDelete(req.params.id) ? res.status(204).send()
    : res.status(404).json({ error: 'Not found' });
});
```

### Middleware

```javascript
// Auth: extract token → verify JWT → attach user to req
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(403).json({ error: 'Invalid token' }); }
}

// Logger: log method, path, status, and duration for every request
function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now()-start}ms`));
  next();
}

// Error handler — 4 params, must be LAST in middleware chain
function errorHandler(err, req, res, next) {
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message
  });
}

app.use(logger);
app.use('/api', authenticate);
app.use(errorHandler);
```

### Database (SQLite)

```javascript
const Database = require('better-sqlite3');
const db = new Database('app.db');

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Prepared statements prevent SQL injection
const insertUser = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
const findByEmail = db.prepare('SELECT * FROM users WHERE email = ?');

app.post('/api/register', async (req, res) => {
  if (findByEmail.get(req.body.email))
    return res.status(409).json({ error: 'Email taken' });
  const hash = await bcrypt.hash(req.body.password, 10);
  const { lastInsertRowid } = insertUser.run(req.body.email, hash);
  res.status(201).json({ data: { id: lastInsertRowid, email: req.body.email } });
});
```

Response: `{"data": {...}, "meta": {}}` or `{"error": {"code": "...", "message": "..."}}`

---

## Exercises

1. **Books API** — Full CRUD: id, title, author, year, genre. In-memory array then SQLite.
2. **Notes CRUD** — id, title, content, timestamps. Search by title. Pagination. Logger middleware.
3. **Auth System** — Register + login with JWT. bcrypt hashing. Protected `/api/me` endpoint.

---

## Quiz

1. What is the event loop, why is blocking it dangerous? Example of blocking code.
2. `app.use()` vs `app.get()` — difference and when each?
3. Creating a resource — correct HTTP status code and response header?
4. Write middleware that checks `x-api-key` header against `process.env.API_KEY`.
5. SQL injection in `db.query("SELECT * FROM users WHERE name LIKE '%" + q + "%'")` — fix?

---

## Navigation

**Parent**: [[000_WEDEV_MOC|WEDEV]]
**Synapses**: [[003_JavaScript_Essentials|WEDEV 003]] — Same language, server-side, [[006_Full_Stack_Project|WEDEV 006]] — Full stack integration
