import { describe, it, expect } from "vitest";
import { normalizePath, lookup, resolve, isDir, isFile } from "./vfs.ts";
import type { VfsDir } from "./vfs.ts";

const fixture: VfsDir = { type: "dir", children: {
  home: { type: "dir", children: {
    student: { type: "dir", children: {
      "readme.txt": { type: "file", content: "hello\nworld" },
    }},
  }},
}};

describe("normalizePath", () => {
  it("resolves leading slash as absolute", () => {
    expect(normalizePath("/home/student", "/")).toBe("/home/student");
  });

  it("resolves relative paths against cwd", () => {
    expect(normalizePath("student", "/home")).toBe("/home/student");
  });

  it("resolves '..' segments", () => {
    expect(normalizePath("../..", "/home/student")).toBe("/");
  });

  it("resolves '.' segments", () => {
    expect(normalizePath("./readme.txt", "/home/student")).toBe("/home/student/readme.txt");
  });

  it("returns / for empty stack", () => {
    expect(normalizePath("/", "/")).toBe("/");
  });
});

describe("lookup", () => {
  it("finds a nested file", () => {
    const node = lookup(fixture, "/home/student/readme.txt");
    expect(node).not.toBeNull();
    expect(node?.type).toBe("file");
  });

  it("returns root for /", () => {
    expect(lookup(fixture, "/")).toBe(fixture);
  });

  it("returns null for missing path", () => {
    expect(lookup(fixture, "/home/nobody")).toBeNull();
  });

  it("returns null when descending into a file", () => {
    expect(lookup(fixture, "/home/student/readme.txt/extra")).toBeNull();
  });
});

describe("resolve", () => {
  it("returns abs and node", () => {
    const r = resolve(fixture, "student", "/home");
    expect(r.abs).toBe("/home/student");
    expect(isDir(r.node)).toBe(true);
  });

  it("returns null node for missing path", () => {
    const r = resolve(fixture, "ghost", "/home");
    expect(r.abs).toBe("/home/ghost");
    expect(r.node).toBeNull();
  });
});

describe("isDir / isFile", () => {
  it("discriminates dir", () => {
    const dir = lookup(fixture, "/home");
    expect(isDir(dir)).toBe(true);
    expect(isFile(dir)).toBe(false);
  });

  it("discriminates file", () => {
    const file = lookup(fixture, "/home/student/readme.txt");
    expect(isFile(file)).toBe(true);
    expect(isDir(file)).toBe(false);
  });

  it("handles null", () => {
    expect(isDir(null)).toBe(false);
    expect(isFile(null)).toBe(false);
  });
});
