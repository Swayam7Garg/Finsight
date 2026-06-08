import { build } from "esbuild";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const allFiles = readdirSync("src", { recursive: true, withFileTypes: true });
const entryPoints = allFiles
  .filter((f) => f.isFile() && f.name.endsWith(".ts") && !f.parentPath.includes("__tests__"))
  .map((f) => join(f.parentPath, f.name));

await build({
  entryPoints,
  outdir: "dist",
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
});

console.log(`Built ${entryPoints.length} files to dist/`);
