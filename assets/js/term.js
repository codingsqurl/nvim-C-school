// Terminal simulation: input loop + renderer.
// Wires the pure layers (vfs.js, commands.js) to the DOM in terminal.html.

import { execute } from "./commands.js";

const state = {
  vfs: null,
  cwd: "/home/student",
  buffer: "",
  cursor: 0,                 // index within buffer
  lines: [],                 // rendered scrollback
  history: [],               // submitted command strings, oldest first
  historyIndex: null,        // null = not browsing; otherwise index into history
  savedBuffer: "",           // buffer at the moment history browsing began
};

const HOME = "/home/student";

async function boot() {
  state.vfs = await fetch("assets/js/vfs.json").then(r => r.json());
  document.addEventListener("keydown", onKey);
  // Click anywhere in the terminal body to ensure focus stays on the page.
  document.querySelector(".arch-term-body")?.addEventListener("click", () => window.focus());
  render();
}

function shortCwd(cwd) {
  if (cwd === HOME) return "~";
  if (cwd.startsWith(HOME + "/")) return "~" + cwd.slice(HOME.length);
  return cwd;
}

function onKey(e) {
  // Ignore modified shortcuts so browser hotkeys (refresh, devtools) still work.
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  switch (e.key) {
    case "Enter":
      e.preventDefault();
      submit();
      return;
    case "Backspace":
      e.preventDefault();
      if (state.cursor > 0) {
        state.buffer = state.buffer.slice(0, state.cursor - 1) + state.buffer.slice(state.cursor);
        state.cursor--;
        render();
      }
      return;
    case "Delete":
      e.preventDefault();
      if (state.cursor < state.buffer.length) {
        state.buffer = state.buffer.slice(0, state.cursor) + state.buffer.slice(state.cursor + 1);
        render();
      }
      return;
    case "ArrowLeft":
      e.preventDefault();
      if (state.cursor > 0) { state.cursor--; render(); }
      return;
    case "ArrowRight":
      e.preventDefault();
      if (state.cursor < state.buffer.length) { state.cursor++; render(); }
      return;
    case "ArrowUp":
      e.preventDefault();
      historyPrev();
      return;
    case "ArrowDown":
      e.preventDefault();
      historyNext();
      return;
    case "Home":
      e.preventDefault();
      state.cursor = 0; render();
      return;
    case "End":
      e.preventDefault();
      state.cursor = state.buffer.length; render();
      return;
  }

  // Single printable character.
  if (e.key.length === 1) {
    e.preventDefault();
    state.buffer = state.buffer.slice(0, state.cursor) + e.key + state.buffer.slice(state.cursor);
    state.cursor++;
    render();
  }
}

function submit() {
  const line = state.buffer;
  state.lines.push({ kind: "submitted", cwd: state.cwd, text: line });

  const result = execute(line, { vfs: state.vfs, cwd: state.cwd });
  if (result.clear) {
    state.lines = [];
  } else if (result.output) {
    for (const out of result.output) state.lines.push({ kind: "output", text: out });
  }
  if (result.cwd) state.cwd = result.cwd;

  // Record non-empty commands; collapse consecutive duplicates (bash-style).
  const trimmed = line.trim();
  if (trimmed && state.history[state.history.length - 1] !== trimmed) {
    state.history.push(trimmed);
  }
  state.historyIndex = null;
  state.savedBuffer = "";

  state.buffer = "";
  state.cursor = 0;
  render();
}

function historyPrev() {
  if (state.history.length === 0) return;
  if (state.historyIndex === null) {
    state.savedBuffer = state.buffer;
    state.historyIndex = state.history.length - 1;
  } else if (state.historyIndex > 0) {
    state.historyIndex--;
  } else {
    return; // already at oldest
  }
  state.buffer = state.history[state.historyIndex];
  state.cursor = state.buffer.length;
  render();
}

function historyNext() {
  if (state.historyIndex === null) return;
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.buffer = state.history[state.historyIndex];
  } else {
    state.historyIndex = null;
    state.buffer = state.savedBuffer;
    state.savedBuffer = "";
  }
  state.cursor = state.buffer.length;
  render();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function promptHTML(cwd) {
  const path = escapeHtml(shortCwd(cwd));
  return `<span class="arch-term-prompt">c-school@academy</span>:<span style="color:#00d4aa;">${path}</span>$ `;
}

function currentLineHTML() {
  const before = escapeHtml(state.buffer.slice(0, state.cursor));
  const after  = escapeHtml(state.buffer.slice(state.cursor));
  return `${promptHTML(state.cwd)}${before}<span class="arch-term-cursor"></span>${after}`;
}

function render() {
  const body = document.querySelector(".arch-term-body");
  if (!body) return;
  const parts = [];
  for (const l of state.lines) {
    if (l.kind === "submitted") {
      parts.push(`<div>${promptHTML(l.cwd)}${escapeHtml(l.text)}</div>`);
    } else {
      parts.push(`<div>${escapeHtml(l.text)}</div>`);
    }
  }
  parts.push(`<div>${currentLineHTML()}</div>`);
  body.innerHTML = parts.join("");
  body.scrollTop = body.scrollHeight;
}

boot();
