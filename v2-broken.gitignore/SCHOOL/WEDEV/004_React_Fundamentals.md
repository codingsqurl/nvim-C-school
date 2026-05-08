# 004_React_Fundamentals

> React turns UI into a function of state — declarative, composable, predictable.

## Level 1 — Intuition

```
Traditional: "Change THIS when THAT happens"
React:       "UI = f(state)" — declare what it should be
```

React diffs Virtual DOM against the previous version and applies only the minimal real DOM changes needed.

## Level 2 — Practical

### Components, Props, State

```jsx
function Greeting({ name, role }) {
  return <div><h1>Welcome, {name}</h1><p>{role}</p></div>;
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}
```

### Hooks

```jsx
// useEffect — sync with external systems, with cleanup
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setUser(d); });
    return () => { cancelled = true; };
  }, [userId]);

  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}

// useContext — avoid prop drilling through intermediate components
const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
    {theme}
  </button>;
}
```

### State Management Patterns

```jsx
// 1. Lifting state up — share between siblings via common parent
function Parent() {
  const [selected, setSelected] = useState(null);
  return <><List onSelect={setSelected} /><Detail id={selected} /></>;
}

// 2. useReducer — when state has multiple interrelated transitions
function reducer(todos, action) {
  switch (action.type) {
    case 'ADD':   return [...todos, { id: Date.now(), text: action.text, done: false }];
    case 'TOGGLE': return todos.map(t => t.id === action.id ? {...t, done: !t.done} : t);
    case 'DELETE': return todos.filter(t => t.id !== action.id);
    default: return todos;
  }
}

// Usage: dispatch({ type: 'ADD', text }), dispatch({ type: 'TOGGLE', id })

// 3. Custom hooks — extract reusable stateful logic
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(url).then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading };
}
```

### JSX Rules

1. Return single root (or `<>...</>` fragment)
2. Close all tags: `<img />`, `<br />`
3. camelCase attributes: `className`, `onClick`, `htmlFor`
4. JavaScript in `{}`: `{title}`, `{isOpen && <Modal />}`
5. Lists need unique `key`: `{items.map(i => <li key={i.id}>{i.text}</li>)}`

```
Mount → Update → Unmount
useEffect []   [deps]   cleanup fn
```

---

## Exercises

1. **Counter App** — + / - / reset. Step input changes increment amount. History of last 5 values.
2. **Weather Dashboard** — Fetch by city. Temp, humidity, wind. Search input. Loading spinner. Error handling.
3. **Blog + Routing** — Home (post list), Post detail, About. React Router. Fetch from JSONPlaceholder.

---

## Quiz

1. Why does React use a Virtual DOM instead of updating the real DOM on every state change?
2. `useEffect(fn, [])` — what does `[]` mean? Why include a cleanup function?
3. Parent has `[name, setName]`. Child A displays, Child B changes. What pattern?
4. When is `useReducer` a better choice than `useState`? Give a concrete scenario.
5. Fix: `{items.map(item => <li>{item}</li>)}`. What's missing?

---

## Navigation

**Parent**: [[000_WEDEV_MOC|WEDEV]]
**Synapses**: [[003_JavaScript_Essentials|WEDEV 003]] — React's foundation, [[005_Backend_With_Node|WEDEV 005]] — APIs consumed by React
