import fs from "node:fs/promises";
import path from "node:path";
import { classifyCatalogSubject } from "./lib/category-rules.mjs";

const root = process.cwd();
const catalogPath = path.join(root, "public", "datasets", "nasa", "catalog.json");
const fix = process.argv.includes("--fix");
const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const changes = catalog.items
  .map((item) => ({ item, expected: classifyCatalogSubject(item, item.category) }))
  .filter(({ item, expected }) => item.category !== expected);

if (!changes.length) {
  console.log(`Category audit passed: ${catalog.items.length} records.`);
  process.exit(0);
}

for (const { item, expected } of changes)
  console.log(`${String(item.id).padStart(4, "0")} ${item.category} -> ${expected} | ${item.title}`);

if (!fix) {
  console.error(`Category audit found ${changes.length} strong subject conflicts.`);
  process.exitCode = 1;
} else {
  for (const { item, expected } of changes) item.category = expected;
  await fs.writeFile(catalogPath, `${JSON.stringify(catalog)}\n`);
  console.log(`Category audit corrected ${changes.length} records.`);
}
