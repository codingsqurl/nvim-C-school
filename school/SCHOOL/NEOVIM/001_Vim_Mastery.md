# 001_Vim_Mastery

> Modal editing — why your fingers should never leave home row.

## Level 1 — Intuition

### Concept

Vim has **modes**, each optimizing for a specific task. Normal mode is for navigation and transformation, Insert mode for typing, Visual mode for selection. The key insight: you spend 80% of time editing, not typing — so Normal mode is the default.

### Modal Philosophy

```
                    Normal (default)
                    /    |       \
                   /     |        \
              Insert   Visual   Command-line
              (typing) (select)  (:/commands)

Movement is a first-class language, not an afterthought.
Operators compose with motions:

    d     +     iw     =    delete inner word
  (operator)  (motion)

    c     +     t"     =    change until "
  (operator)  (motion)

    y     +     G      =    yank to end of file
  (operator)  (motion)
```

---

## Level 2 — Practical

### Essential Motions

```
Cursor (home row):           Word:
  h ←  j ↓  k ↑  l →          w — start of next word
  0 — start of line            b — start of previous word
  $ — end of line              e — end of current word
  ^ — first non-blank          W/B/E — WORD (space-delimited)

Scrolling:                    Searching:
  gg — top of file             f<char> — find char forward
  G  — bottom of file          F<char> — find char backward
  <C-d> — half-page down       t<char> — till char forward
  <C-u> — half-page up         ; — repeat last f/F/t
  <C-f> — page down            /pattern — search
  <C-b> — page up              n/N — next/prev match

Advanced jumps:
  % — matching bracket         * — search word under cursor
  {/} — paragraph jump         g; — last change position
  <C-o>/<C-i> — jumplist       '' — last jump location
```

### Operators with Motions/Text Objects

```
Operators:        Text Objects:
  d — delete        iw/aq — inner/a word/quotes
  c — change        i(/a) — inner/a parentheses
  y — yank          ib/ab — inner/a block (brackets)
  p — paste         it/at — inner/a tag (HTML)
  >/< — indent      is/as — inner/a sentence
  = — format        ip/ap — inner/a paragraph
  ~ — toggle case
  gu/gU — lower/upper

Compose:  ci"  = change inside quotes
          da{  = delete around braces (with braces)
          yiw  = yank inner word
          >ap  = indent around paragraph
```

### Visual Mode

```
v           — character-wise visual
V           — line-wise visual
<C-v>       — block visual (columns!)

Block mode power moves:
  <C-v> j j I // <Esc>   — comment multiple lines
  <C-v> k k $ A ; <Esc>  — append to multiple lines
  <C-v> 4 j d             — delete a rectangular block
```

---

## Level 3 — Systems

### Registers and Macros

```
   Registers (clipboards):
   "" — unnamed register (default)
   "0 — yank register
   "a-"z — named registers
   "+ — system clipboard
   "* — primary selection (Linux)
   "1-"9 — numbered delete registers
   "/ — search register

   Macros:
   qa  — record macro into register a
   ... perform actions ...
   q   — stop recording
   @a  — replay macro a
   5@a — replay 5 times
   @@  — replay last macro
```

---

## Level 4 — Expert

### The Command-Line Mode

```
:help subject        — built-in documentation
:%s/foo/bar/g        — substitute globally
:%s/foo/bar/gc       — substitute with confirm
:g/pattern/d         — delete lines matching pattern
:v/pattern/d         — delete lines NOT matching
:norm @a             — run macro on all lines
:r !command          — read shell command output
:'<,'>!sort          — pipe visual selection through sort
```

---

## EXERCISES — Vim Golf (10 Tasks)

Start with cursor on first character. Count keystrokes.

1. **Delete the word under cursor** → `diw` (3)
2. **Change text inside double quotes** → `ci"` (3)
3. **Delete from cursor to end of line** → `d$` or `D` (2)
4. **Move line 5 to after line 10** → `5Gdd10Gp` (7)
5. **Replace every "foo" with "bar" in file** → `:%s/foo/bar/g` (13)
6. **Select 3 lines and indent them** → `Vjj>` (5)
7. **Delete everything inside the nearest `{}`** → `di{` (3)
8. **Comment out 5 lines with `//`** → `<C-v>4jI//<Esc>` (8)
9. **Swap two words** → `dwwP` (4)
10. **Copy current line, paste it 10 times below** → `yy10p` (5)

*Total ideal: 55 keystrokes. If over 80, practice composing operators+motions.*

## QUIZ

1. What is the difference between `w` and `W`?
2. What does `ci(` do and how is it different from `di(`?
3. How do you record and replay a macro?
4. What register do you use for the system clipboard?
5. What does `:g/^$/d` do?

---

## Navigation

**Parent**: [[000_NEOVIM_MOC|NEOVIM]]

**Synapses**:
- [[002_Configuration_And_Plugins|NEOVIM 002]] - Configuring the editor
- [[001_Mental_Models|CORE 001]] - Mental model of editing
- [[001_Shell_Basics|LINUX 002]] - Vim in terminal
