import { describe, it, expect } from "vitest";
import { tokenize, execute } from "./commands.ts";
import type { VfsDir } from "./vfs.ts";

const fixture: VfsDir = { type: "dir", children: {
  home: { type: "dir", children: {
    student: { type: "dir", children: {
      "readme.txt": { type: "file", content: "hello\nworld" },
    }},
  }},
}};

describe("tokenize", () => {
  it("splits on whitespace", () => {
    expect(tokenize("ls /home")).toEqual(["ls", "/home"]);
  });

  it("collapses runs of whitespace", () => {
    expect(tokenize("  ls   /home  ")).toEqual(["ls", "/home"]);
  });

  it("returns empty array for empty input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("execute", () => {
  it("pwd returns cwd", () => {
    const r = execute("pwd", { vfs: fixture, cwd: "/home" });
    expect(r).toEqual({ output: ["/home"] });
  });

  it("ls lists directory contents", () => {
    const r = execute("ls /home", { vfs: fixture, cwd: "/" });
    expect(r.output).toBeDefined();
    expect(r.output!.some(line => line.includes("student"))).toBe(true);
  });

  it("cd to nonexistent returns error", () => {
    const r = execute("cd /nonexistent", { vfs: fixture, cwd: "/" });
    expect(r.output).toBeDefined();
    expect(r.output![0]).toMatch(/no such file or directory/);
    expect(r.cwd).toBeUndefined();
  });

  it("cd to dir updates cwd", () => {
    const r = execute("cd /home", { vfs: fixture, cwd: "/" });
    expect(r.cwd).toBe("/home");
  });

  it("clear returns { clear: true }", () => {
    const r = execute("clear", { vfs: fixture, cwd: "/" });
    expect(r).toEqual({ clear: true });
  });

  it("unknown command returns command not found", () => {
    const r = execute("unknown_cmd", { vfs: fixture, cwd: "/" });
    expect(r.output).toBeDefined();
    expect(r.output![0]).toMatch(/command not found/);
  });

  it("empty input returns empty output", () => {
    const r = execute("", { vfs: fixture, cwd: "/" });
    expect(r).toEqual({ output: [] });
  });
});
