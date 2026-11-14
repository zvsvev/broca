import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const targetDir = resolve(here, "../public");

const assets = [
  { name: "skill.md", source: resolve(here, "../../skill/skill.md") },
  { name: "join.sh", source: resolve(here, "../../skill/join.sh") },
  { name: "broca-tokenomics.md", source: resolve(here, "../../broca-tokenomics.md") },
];

mkdirSync(targetDir, { recursive: true });

for (const { name, source } of assets) {
  if (!existsSync(source)) {
    console.error(`source not found: ${source}`);
    process.exit(1);
  }
  const target = resolve(targetDir, name);
  copyFileSync(source, target);
  console.log(`copied ${source} -> ${target}`);
}
