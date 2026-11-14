import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../../skill/skill.md");
const target = resolve(here, "../public/skill.md");

if (!existsSync(source)) {
  console.error(`skill source not found: ${source}`);
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`copied ${source} -> ${target}`);
