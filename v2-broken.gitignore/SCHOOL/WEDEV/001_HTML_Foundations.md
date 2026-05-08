# 001_HTML_Foundations

> HTML is the skeleton of the web — every page you've ever seen starts as HTML.

## Level 1 — Intuition

### What HTML Is

HTML (HyperText Markup Language) describes document structure. Browsers parse it into the DOM tree — which CSS styles and JavaScript manipulates.

```
Browser sends GET request → Server returns HTML → Parser → DOM tree → Rendered page
```

### Document Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
</head>
<body>
  <!-- Content here -->
</body>
</html>
```

| Tag | Purpose |
|-----|---------|
| `<!DOCTYPE html>` | Declares HTML5 document |
| `<head>` | Metadata, title, styles |
| `<body>` | Visible page content |

### Semantic HTML

Semantic tags describe purpose, not appearance. They help screen readers, search engines, and other developers.

```html
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

<main>
  <article>
    <h1>Blog Post</h1>
    <section>
      <h2>Intro</h2>
      <p>Content here...</p>
    </section>
  </article>
  <aside><h3>Related</h3></aside>
</main>

<footer><p>&copy; 2026</p></footer>
```

**Tag guide:** `<header>` — top of page/article, `<nav>` — primary links, `<main>` — unique content (once per page), `<article>` — self-contained, `<section>` — thematic grouping, `<aside>` — tangential content, `<footer>` — bottom meta

### Forms and Inputs

```html
<form action="/submit" method="POST">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>

  <label for="topic">Topic:</label>
  <select id="topic" name="topic">
    <option value="support">Support</option>
    <option value="sales">Sales</option>
  </select>

  <label for="msg">Message:</label>
  <textarea id="msg" name="msg" rows="4"></textarea>

  <button type="submit">Send</button>
</form>
```

### Accessibility Basics

```html
<!-- Alt text for images -->
<img src="chart.png" alt="Revenue up 30% in Q3">

<!-- ARIA for custom elements -->
<button aria-label="Close dialog">✕</button>

<!-- Label-input pairing is mandatory -->
<label for="search">Search</label>
<input type="search" id="search">
```

**Checklist:** Every `<img>` has `alt`, forms use `<label for="id">`, exactly one `<h1>`, proper heading hierarchy (h1→h2→h3), keyboard-accessible interactive elements, use semantic HTML before reaching for ARIA.

---

## Exercises

1. **Personal Page** — Build `index.html` with your name, bio, profile image, skills list, and social links. Zero `<div>` tags — semantic only.
2. **Contact Form** — Create a form with name, email, reason dropdown, message textarea. Use `required`, `type="email"`, and `minlength` for validation.
3. **Blog Layout** — Semantic blog page with 3 article previews, a sidebar with categories, and a comment form. Use proper heading hierarchy.

---

## Quiz

1. Which DOCTYPE tells the browser the page is HTML5?
2. Name three semantic HTML5 elements that replace `<div>` and explain their purpose.
3. Write the correct `<label>` + `<input>` pair for a password field, including the `for`/`id` link.
4. What three HTML-only techniques improve screen reader experience?
5. When would you use `<section>` vs `<article>` vs `<div>`?

---

## Navigation

**Parent**: [[000_WEDEV_MOC|WEDEV]]
**Synapses**: [[002_CSS_Mastery|WEDEV 002]] — Style the HTML you built
