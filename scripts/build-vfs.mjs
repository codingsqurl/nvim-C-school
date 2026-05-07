// Generate assets/js/vfs.json from on-disk content.
// - Preserves a small base layout (home/student/readme.txt, /etc/motd)
// - Mounts SCHOOL/ verbatim under /home/student/lessons/
//
// Run: node scripts/build-vfs.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const REPO = new URL("..", import.meta.url).pathname;
const SCHOOL = join(REPO, "SCHOOL");
const OUT = join(REPO, "assets/js/vfs.json");

function dirNode(children = {}) { return { type: "dir", children }; }
function fileNode(content)      { return { type: "file", content }; }

function buildFromDisk(absDir) {
  const node = dirNode();
  for (const name of readdirSync(absDir).sort()) {
    const full = join(absDir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      node.children[name] = buildFromDisk(full);
    } else if (st.isFile()) {
      node.children[name] = fileNode(readFileSync(full, "utf8"));
    }
  }
  return node;
}

const root = dirNode({
  home: dirNode({
    student: dirNode({
      "readme.txt": fileNode(
        "welcome to c-school.\n\n" +
        "this is a terminal simulation. try:\n" +
        "  pwd\n  ls\n  cd lessons\n  ls\n  cat MILESTONES.md\n  help\n"
      ),
      lessons: buildFromDisk(SCHOOL),
    }),
  }),
  etc: dirNode({
    motd: fileNode("c-school // keyboard-driven dev\n"),
  }),
});

writeFileSync(OUT, JSON.stringify(root, null, 2) + "\n");

// Stats
let files = 0, dirs = 0;
(function walk(n) {
  if (n.type === "dir") { dirs++; for (const c of Object.values(n.children)) walk(c); }
  else                   { files++; }
})(root);

const bytes = statSync(OUT).size;
console.log(`wrote ${relative(REPO, OUT)}: ${files} files, ${dirs} dirs, ${(bytes/1024).toFixed(1)} KiB`);
