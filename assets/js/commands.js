// Command dispatch table.
// Each handler: run(args, ctx) -> { output?: string[], cwd?: string, clear?: true }
//   ctx = { vfs, cwd }
// The shell loop applies any returned cwd/clear and prints output lines.

import { resolve, isDir, isFile, listDir, readFile, lookup } from "./vfs.js";

export const commands = {
  pwd: {
    help: "print current directory",
    run: (_args, ctx) => ({ output: [ctx.cwd] }),
  },

  ls: {
    help: "list directory contents",
    run: (args, ctx) => {
      const target = args[0] ?? ctx.cwd;
      const { abs, node } = resolve(ctx.vfs, target, ctx.cwd);
      if (!node) return { output: [`ls: ${target}: no such file or directory`] };
      if (isFile(node)) return { output: [abs.split("/").pop()] };
      return { output: [listDir(node).join("  ")] };
    },
  },

  cd: {
    help: "change directory",
    run: (args, ctx) => {
      const target = args[0] ?? "/home/student";
      const { abs, node } = resolve(ctx.vfs, target, ctx.cwd);
      if (!node)        return { output: [`cd: ${target}: no such file or directory`] };
      if (!isDir(node)) return { output: [`cd: ${target}: not a directory`] };
      return { cwd: abs };
    },
  },

  clear: {
    help: "clear the screen",
    run: () => ({ clear: true }),
  },

  cat: {
    help: "print file contents",
    run: (args, ctx) => {
      if (args.length === 0) return { output: ["cat: missing file operand"] };
      const out = [];
      for (const target of args) {
        const { node } = resolve(ctx.vfs, target, ctx.cwd);
        if (!node)         { out.push(`cat: ${target}: no such file or directory`); continue; }
        if (isDir(node))   { out.push(`cat: ${target}: is a directory`);             continue; }
        const text = readFile(node);
        for (const line of text.split("\n")) out.push(line);
        if (text.endsWith("\n")) out.pop(); // drop the empty trailing line from final \n
      }
      return { output: out };
    },
  },

  echo: {
    help: "print arguments",
    run: (args) => ({ output: [args.join(" ")] }),
  },

  help: {
    help: "list available commands",
    run: () => {
      const names = Object.keys(commands).sort();
      const width = Math.max(...names.map(n => n.length));
      return { output: names.map(n => `  ${n.padEnd(width)}  ${commands[n].help}`) };
    },
  },
};

// Tokenizer: dumb whitespace split. Quotes/escapes can come later.
export function tokenize(line) {
  return line.trim().split(/\s+/).filter(Boolean);
}

// Run one input line. Returns the same shape as a handler, plus an `echo`
// line representing the prompt+input so the renderer can replay it.
export function execute(line, ctx) {
  const tokens = tokenize(line);
  if (tokens.length === 0) return { output: [] };
  const [name, ...args] = tokens;
  const cmd = commands[name];
  if (!cmd) return { output: [`${name}: command not found`] };
  return cmd.run(args, ctx);
}
