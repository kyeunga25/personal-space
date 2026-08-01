import { readdir, readFile, realpath, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const workspacePath = "/workspace/personal-space";
const projectRoot = resolve(process.cwd());
const canonicalRoot = await realpath(projectRoot);
const privateRoots = [...new Set([projectRoot, canonicalRoot])].filter(
  (root) => root !== workspacePath,
);
const serverOutput = resolve(projectRoot, "dist/server");
const textExtensions = new Set([".css", ".html", ".js", ".map", ".mjs"]);

async function listTextArtifacts(directory) {
  const artifacts = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      artifacts.push(...(await listTextArtifacts(path)));
    } else if (entry.isFile() && textExtensions.has(extname(entry.name))) {
      artifacts.push(path);
    }
  }
  return artifacts;
}

let changedFiles = 0;
let replacementCount = 0;
for (const artifact of await listTextArtifacts(serverOutput)) {
  const source = await readFile(artifact, "utf8");
  let sanitized = source;
  for (const root of privateRoots) {
    const parts = sanitized.split(root);
    replacementCount += parts.length - 1;
    sanitized = parts.join(workspacePath);
  }
  if (sanitized !== source) {
    await writeFile(artifact, sanitized);
    changedFiles += 1;
  }
}

for (const artifact of await listTextArtifacts(serverOutput)) {
  const source = await readFile(artifact, "utf8");
  if (privateRoots.some((root) => source.includes(root))) {
    throw new Error("Build artifact still contains the local project path");
  }
}

console.log(
  `Sanitized ${replacementCount} local path references in ${changedFiles} build artifacts.`,
);
