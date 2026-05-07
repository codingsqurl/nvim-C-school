# 003_JavaScript_Essentials

> JavaScript is the nervous system of the web — it makes pages think, react, and remember.

## Level 1 — Intuition

JS is single-threaded but non-blocking — the event loop delegates I/O to Web APIs, then processes callbacks when the stack is clear.

```
Call Stack ←→ Web APIs → Callback Queue → Event Loop → Call Stack
```

## Level 2 — Practical

### Variables, Scope, Hoisting

```javascript
var x = 10;    // function-scoped, hoisted with undefined
let y = 20;    // block-scoped, TDZ (temporal dead zone)
const z = 30;  // block-scoped, cannot reassign

function demo() {
  if (true) {
    var a = 'function scoped';  // accessible outside block
    let b = 'block scoped';     // only inside this block
  }
  console.log(a); // works
  // console.log(b); // ReferenceError
}
```

### Functions

```javascript
// Declaration — hoisted fully
function add(a, b) { return a + b; }

// Expression — NOT hoisted
const multiply = function(a, b) { return a * b; };

// Arrow — lexical `this`, shorter
const divide = (a, b) => a / b;

// `this` difference
const obj = {
  name: 'test',
  regular() { console.log(this.name); },   // this = obj
  arrow: () => { console.log(this.name); } // this = outer scope
};
```

### Arrays and Objects

```javascript
// Destructuring
const [first, ...rest] = ['red', 'green', 'blue'];
const { name, age } = { name: 'Alice', age: 30 };

// Spread — copy and merge
const merged = [...arr1, 4, 5];
const extended = { ...user, country: 'US' };

// Key array methods
nums.map(n => n * 2);                         // transform
nums.filter(n => n % 2 === 0);                // filter
nums.reduce((sum, n) => sum + n, 0);          // aggregate
```

### Promises and Async/Await

```javascript
// Promise chain
fetch('/api/data')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Async/await — cleaner control flow
async function getData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Parallel: fire requests simultaneously
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
]);

// Create your own
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
```

### DOM Manipulation

```javascript
// Selecting
const heading = document.querySelector('h1');
const items = document.querySelectorAll('.item');

// Creating and inserting
const card = document.createElement('div');
card.className = 'card';
card.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
document.body.appendChild(card);

// Events
button.addEventListener('click', (e) => {
  e.preventDefault();
  console.log(e.target);
});

// Form handling
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  // validate and submit...
});
```

---

## Exercises

1. **Todo App** — Add, toggle complete (strikethrough), delete items. Store in array, re-render on change. No libraries.
2. **Fetch and Display** — Fetch posts from `jsonplaceholder.typicode.com/posts`. Show as cards. Search filter by title. Loading/error states.
3. **Form Validation** — Registration: name, email, password, confirm. Validate all required, email format, password ≥ 8, passwords match. Inline errors on blur.

---

## Quiz

1. `console.log(x)` before `let x = 5` vs before `var x = 5` — what happens each time? Name the concept.
2. Swap a regular function for arrow in `{ name: 'me', greet() { ... } }` — what `this` bug occurs?
3. One-liner: filter odd numbers from `[1,2,3,4,5]`, then square them. Result: `[4,16,36]`.
4. Loop calls `fetch()` without `await` — late response overwrites early one. How to fix?
5. Button inside `<form>` refreshes page on click. Why and how to prevent?

---

## Navigation

**Parent**: [[000_WEDEV_MOC|WEDEV]]
**Synapses**: [[002_CSS_Mastery|WEDEV 002]] — Style what you manipulate, [[004_React_Fundamentals|WEDEV 004]] — React builds on JS fundamentals
