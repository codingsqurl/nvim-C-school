# 006_Full_Stack_Project

> The final layer — connecting everything into a production-grade application.

## Level 1 — Intuition

```
Client (React) ← JSON API → Server (Node.js) ← Queries → DB (PostgreSQL)
                                   │
                             File Store (S3)
```

Production pipeline: request → authenticate → validate → process → persist → respond.

## Level 2 — Practical

### MVC Architecture

```
src/
├── models/        // Data shapes
├── controllers/   // Request handlers
├── routes/        // URL mapping
├── middleware/     // Auth, logging
└── services/      // Business logic
```

```javascript
// Service: business logic
class UserService {
  static async createUser(email, password) {
    if (await UserModel.findByEmail(email)) throw new AppError(409, 'Taken');
    return UserModel.create({ email, password_hash: await bcrypt.hash(password, 12) });
  }
}
// Controller: thin, delegates to service
class UserController {
  static async register(req, res) {
    res.status(201).json({ data: await UserService.createUser(req.body.email, req.body.password) });
  }
}
```

## Level 3 — Systems

### JWT Authentication

```javascript
app.post('/api/auth/login', async (req, res) => {
  const user = await db.findByEmail(req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = jwt.sign({ userId: user.id, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id },
    process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie('refreshToken', refreshToken,
    { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7*24*60*60*1000 });
  res.json({ accessToken });
});
```

### File Upload

```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  const key = `uploads/${req.user.userId}/${Date.now()}-${req.file.originalname}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET, Key: key,
    Body: req.file.buffer, ContentType: req.file.mimetype,
  }));
  res.status(201).json({ url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}` });
});
```

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment: [DATABASE_URL=postgresql://user:pass@db:5432/myapp]
    depends_on: [db]
  db:
    image: postgres:16-alpine
    environment: [POSTGRES_USER=user, POSTGRES_PASSWORD=pass, POSTGRES_DB=myapp]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes: {pgdata:}
```

## Level 4 — Expert

### Performance

```javascript
// N+1: batch query instead of per-record loop
const authors = await db.findUsers(posts.map(p => p.authorId));
const authorMap = new Map(authors.map(a => [a.id, a]));
posts.forEach(p => { p.author = authorMap.get(p.authorId); });

// Caching: check cache first, populate on miss
const post = JSON.parse(await cache.get(`post:${id}`))
  || (await db.findPost(id));
await cache.set(`post:${id}`, JSON.stringify(post), 'EX', 300);

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

---

## Exercises — Capstone Project

### Build a Team Task Manager (SaaS)

**Features:** User registration + email verify, JWT auth + refresh tokens, teams (create/join), task CRUD + assignments, file attachments, dashboard with stats.

**Stack:** React + Router, Express MVC, SQLite/PostgreSQL, Multer/S3, Docker.

---

## Quiz

1. 20 posts + 20 author queries = 21 DB calls. Name the anti-pattern and the fix.
2. Access token expires (15min), refresh valid (7d). Describe the client→server refresh flow.
3. Three security concerns for file upload endpoints and how to address each.
4. `ECONNREFUSED 127.0.0.1:5432` in production — cause and docker-compose fix?
5. Dashboard takes 3s from 5 queries. Two strategies without schema changes?

---

## Navigation

**Parent**: [[000_WEDEV_MOC|WEDEV]]
**Synapses**: [[005_Backend_With_Node|WEDEV 005]] — Backend details, [[000_SCHOOL_MOC|HOME]] — Full curriculum
