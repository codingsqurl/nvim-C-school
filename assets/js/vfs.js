// Virtual filesystem: pure path-resolution functions.
// The VFS itself is a tree of nodes shaped like:
//   { type: "dir", children: { name: node, ... } }
//   { type: "file", content: "..." }

export function normalizePath(input, cwd = "/") {
  const start = input.startsWith("/") ? "/" : cwd;
  const parts = (start + "/" + input).split("/").filter(Boolean);
  const stack = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") { if (stack.length > 0) stack.pop(); continue; }
    stack.push(part);
  }
  return "/" + stack.join("/");
}

export function lookup(root, absPath) {
  if (absPath === "/" || absPath === "") return root;
  const parts = absPath.split("/").filter(Boolean);
  let node = root;
  for (const part of parts) {
    if (node.type !== "dir") return null;
    const next = node.children[part];
    if (!next) return null;
    node = next;
  }
  return node;
}

export function isDir(node)  { return !!node && node.type === "dir";  }
export function isFile(node) { return !!node && node.type === "file"; }

export function listDir(node) {
  if (!isDir(node)) return null;
  return Object.keys(node.children).sort();
}

export function readFile(node) {
  if (!isFile(node)) return null;
  return node.content;
}

export function resolve(root, input, cwd) {
  const abs = normalizePath(input, cwd);
  return { abs, node: lookup(root, abs) };
}
