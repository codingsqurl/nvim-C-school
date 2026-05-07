// Command dispatch table.
// Each handler: run(args, ctx) -> { output?: string[], cwd?: string, clear?: true }
//   ctx = { vfs, cwd }
// The shell loop applies any returned cwd/clear and prints output lines.

import { resolve, isDir, isFile, listDir, readFile } from "./vfs.ts";
import type { VfsDir } from "./vfs.ts";

export interface CommandContext {
  vfs: VfsDir;
  cwd: string;
  cols?: number;
}

export interface CommandResult {
  output?: string[];
  cwd?: string;
  clear?: true;
}

export interface CommandHandler {
  help: string;
  run: (args: string[], ctx: CommandContext) => CommandResult;
}

export const commands: { [name: string]: CommandHandler } = {
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
      if (isFile(node)) return { output: [abs.split("/").pop() ?? ""] };
      return { output: columnize(listDir(node) ?? [], ctx.cols ?? 80) };
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
      const out: string[] = [];
      for (const target of args) {
        const { node } = resolve(ctx.vfs, target, ctx.cwd);
        if (!node)         { out.push(`cat: ${target}: no such file or directory`); continue; }
        if (isDir(node))   { out.push(`cat: ${target}: is a directory`);             continue; }
        const text = readFile(node) ?? "";
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

// Lay out names column-major (the way real `ls` does), padded to fit `cols`.
// Returns one string per row.
function columnize(names: string[], cols: number): string[] {
  if (names.length === 0) return [];
  const gap = 2;
  const maxName = Math.max(...names.map(n => n.length));
  const cellWidth = maxName + gap;
  const nCols = Math.max(1, Math.floor(cols / cellWidth));
  const nRows = Math.ceil(names.length / nCols);
  const rows: string[] = [];
  for (let r = 0; r < nRows; r++) {
    const cells: string[] = [];
    for (let c = 0; c < nCols; c++) {
      const idx = c * nRows + r;
      if (idx >= names.length) break;
      const isLast = c === nCols - 1 || (c * nRows + r + nRows) >= names.length;
      cells.push(isLast ? names[idx] : names[idx].padEnd(cellWidth));
    }
    rows.push(cells.join(""));
  }
  return rows;
}

// Tokenizer: dumb whitespace split. Quotes/escapes can come later.
export function tokenize(line: string): string[] {
  return line.trim().split(/\s+/).filter(Boolean);
}

// Run one input line. Returns the same shape as a handler, plus an `echo`
// line representing the prompt+input so the renderer can replay it.
export function execute(line: string, ctx: CommandContext): CommandResult {
  const tokens = tokenize(line);
  if (tokens.length === 0) return { output: [] };
  const [name, ...args] = tokens;
  const cmd = commands[name];
  if (!cmd) return { output: [`${name}: command not found`] };
  return cmd.run(args, ctx);
}
