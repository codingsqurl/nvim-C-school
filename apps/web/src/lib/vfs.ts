// Virtual filesystem: pure path-resolution functions.
// The VFS itself is a tree of nodes shaped like:
//   { type: "dir", children: { name: node, ... } }
//   { type: "file", content: "..." }

export interface VfsDir {
  type: "dir";
  children: { [name: string]: VfsNode };
}

export interface VfsFile {
  type: "file";
  content: string;
}

export type VfsNode = VfsDir | VfsFile;

export function normalizePath(input: string, cwd: string = "/"): string {
  const start = input.startsWith("/") ? "/" : cwd;
  const parts = (start + "/" + input).split("/").filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") { stack.pop(); continue; }
    stack.push(part);
  }
  return "/" + stack.join("/");
}

export function lookup(root: VfsNode, absPath: string): VfsNode | null {
  if (absPath === "/" || absPath === "") return root;
  const parts = absPath.split("/").filter(Boolean);
  let node: VfsNode = root;
  for (const part of parts) {
    if (node.type !== "dir") return null;
    const next: VfsNode | undefined = node.children[part];
    if (!next) return null;
    node = next;
  }
  return node;
}

export function isDir(node: VfsNode | null | undefined): node is VfsDir {
  return !!node && node.type === "dir";
}
export function isFile(node: VfsNode | null | undefined): node is VfsFile {
  return !!node && node.type === "file";
}

export function listDir(node: VfsNode | null | undefined): string[] | null {
  if (!isDir(node)) return null;
  return Object.keys(node.children).sort();
}

export function readFile(node: VfsNode | null | undefined): string | null {
  if (!isFile(node)) return null;
  return node.content;
}

export interface ResolveResult {
  abs: string;
  node: VfsNode | null;
}

export function resolve(root: VfsNode, input: string, cwd: string): ResolveResult {
  const abs = normalizePath(input, cwd);
  return { abs, node: lookup(root, abs) };
}
