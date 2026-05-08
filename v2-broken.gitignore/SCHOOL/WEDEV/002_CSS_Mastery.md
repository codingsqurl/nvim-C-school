# 002_CSS_Mastery

> CSS is the paintbrush — control every pixel of the user's visual experience.

## Level 1 — Intuition

### The Cascade, Specificity, Inheritance

```css
/* Inheritance — children inherit from parents */
body { font-family: sans-serif; color: #333; }

/* Specificity — more specific wins */
a { color: blue; }            /* 0,0,1 */
.nav-link { color: green; }   /* 0,1,0 — wins */
#logo { color: red; }         /* 1,0,0 — wins over class */

/* Cascade — later overrides earlier */
p { color: black; }
p { color: gray; } /* this wins */
```

**Hierarchy:** `!important` > inline > `#id` > `.class` > `tag` > `*`

### Box Model

```
┌──────────────────────────────────┐
│             margin               │
│  ┌────────────────────────────┐  │
│  │      border               │  │
│  │  ┌──────────────────────┐  │  │
│  │  │     padding         │  │  │
│  │  │  ┌───────────────┐  │  │  │
│  │  │  │   content    │  │  │  │
│  │  │  └───────────────┘  │  │  │
│  │  └──────────────────────┘  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

```css
*, *::before, *::after {
  box-sizing: border-box; /* padding+border inside width */
  margin: 0; padding: 0;
}
```

## Level 2 — Practical

### Flexbox

```css
.container {
  display: flex;
  justify-content: space-between; /* main axis */
  align-items: center;            /* cross axis */
  gap: 16px;
  flex-wrap: wrap;
}
.item { flex: 1; } /* grow | shrink | basis */

/* Real navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}
.nav-links { display: flex; gap: 24px; list-style: none; }
```

### CSS Grid

```css
/* Full page layout */
.page {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  grid-template-areas:
    "header  header  header"
    "sidebar content aside"
    "footer  footer  footer";
  min-height: 100vh;
}
.header { grid-area: header; }
.sidebar { grid-area: sidebar; }

/* Responsive card grid */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```

| Flexbox (1D) | Grid (2D) |
|---------------|-----------|
| Row OR column | Rows AND columns |

### Responsive Design & Custom Properties

```css
/* Mobile-first */
.card { padding: 16px; }
@media (min-width: 768px) { .card { padding: 24px; } }
@media (min-width: 1024px) { .card { padding: 32px; } }

/* Design tokens */
:root {
  --color-primary: #3b82f6;
  --radius: 8px;
  --spacing: 8px;
}

.button {
  background: var(--color-primary);
  border-radius: var(--radius);
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 4);
}

[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-text: #e2e8f0;
}
```

---

## Exercises

1. **Three Layouts** — Sticky header + two-column + footer (Grid), centered hero + CTA (Flexbox), masonry gallery (Grid).
2. **Responsive Navbar** — Horizontal on desktop, hamburger on mobile. CSS only.
3. **Card Grid** — 3 cols → 2 → 1 with breakpoints. Image, title, text, button per card. Custom properties for theming.

---

## Quiz

1. `#x` vs `.y` — which wins and why?
2. Parent `color: red`. Child has no color set. What color is child text? Name the mechanism.
3. `width: 200px; padding: 20px; border: 5px solid` — rendered width with default vs `border-box`?
4. Difference between `justify-content` and `align-items` in Flexbox?
5. Write a media query for viewports between 768px and 1024px.

---

## Navigation

**Parent**: [[000_WEDEV_MOC|WEDEV]]
**Synapses**: [[001_HTML_Foundations|WEDEV 001]], [[003_JavaScript_Essentials|WEDEV 003]]
