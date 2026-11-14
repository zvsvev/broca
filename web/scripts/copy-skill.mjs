import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const assets = ["skill.md", "join.sh"];
const targetDir = resolve(here, "../public");

mkdirSync(targetDir, { recursive: true });

for (const name of assets) {
  const source = resolve(here, `../../skill/${name}`);
  if (!existsSync(source)) {
    console.error(`source not found: ${source}`);
    process.exit(1);
  }
  const target = resolve(targetDir, name);
  copyFileSync(source, target);
  console.log(`copied ${source} -> ${target}`);
}
