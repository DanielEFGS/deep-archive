import fs from 'node:fs/promises';
import path from 'node:path';

const requestedDataset = process.argv.find((argument) => argument.startsWith('--dataset='))?.split('=')[1] ?? process.env.CATALOG_DATASET;
const DATASET = requestedDataset === 'nasa' ? 'nasa' : 'demo';
const PUBLIC = path.join(process.cwd(), 'public', 'datasets', DATASET);
const catalogPath = path.join(PUBLIC, 'catalog.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const errors = [];
const warnings = [];

if (!Array.isArray(catalog.items) || !catalog.items.length) errors.push('Catalog has no items.');
if (!catalog.atlas?.url) errors.push('Catalog atlas URL is missing.');

async function readPublicJson(url) {
  const prefix = `/datasets/${DATASET}/`;
  if (!url?.startsWith(prefix)) throw new Error(`Not a ${DATASET} public URL: ${url}`);
  return JSON.parse(await fs.readFile(path.join(PUBLIC, url.slice(prefix.length)), 'utf8'));
}

if (catalog.atlas?.url?.startsWith('/')) {
  const atlasPath = path.join(PUBLIC, catalog.atlas.url.slice(`/datasets/${DATASET}/`.length));
  try {
    const stat = await fs.stat(atlasPath);
    if (!stat.size) errors.push(`Atlas is empty: ${atlasPath}`);
    if (catalog.atlas.bytes && stat.size !== catalog.atlas.bytes) warnings.push('Atlas byte count differs from catalog metadata.');
  } catch { errors.push(`Atlas file does not exist: ${atlasPath}`); }
}

const ids = new Set();
const nasaIds = new Set();
const referencedShards = new Set();
for (const [index, item] of (catalog.items ?? []).entries()) {
  if (ids.has(item.id)) errors.push(`Duplicate id: ${item.id}`);
  ids.add(item.id);
  if (item.id !== index + 1) warnings.push(`Item position ${index} has non-sequential id ${item.id}.`);
  if (!item.title?.trim()) errors.push(`Item ${item.id} has no title.`);
  if (!item.category?.trim()) warnings.push(`Item ${item.id} has no category.`);
  if (!item.detailShard) errors.push(`Item ${item.id} has no detailShard.`);
  else referencedShards.add(item.detailShard);
}

const detailById = new Map();
for (const shardUrl of referencedShards) {
  let shard;
  try { shard = await readPublicJson(shardUrl); }
  catch { errors.push(`Detail shard cannot be read: ${shardUrl}`); continue; }
  const entries = Object.entries(shard ?? {});
  if (!entries.length) errors.push(`Detail shard is empty: ${shardUrl}`);
  for (const [key, detail] of entries) {
    const id = Number(key);
    if (!Number.isInteger(id) || detail?.id !== id) errors.push(`Invalid detail key/id in ${shardUrl}: ${key}`);
    if (detailById.has(id)) errors.push(`Detail id ${id} appears in multiple shards.`);
    detailById.set(id, { detail, shardUrl });
  }
}

const detailFiles = (await fs.readdir(path.join(PUBLIC, 'details'))).filter((entry) => entry.endsWith('.json'));
const referencedFiles = new Set([...referencedShards].map((url) => path.basename(url)));
for (const file of detailFiles) if (!referencedFiles.has(file)) errors.push(`Unreferenced detail shard file: ${file}`);
for (const file of referencedFiles) if (!detailFiles.includes(file)) errors.push(`Referenced shard is absent from details directory: ${file}`);

for (const item of catalog.items ?? []) {
  const found = detailById.get(item.id);
  if (!found) { errors.push(`Item ${item.id} references a missing detail.`); continue; }
  if (found.shardUrl !== item.detailShard) errors.push(`Item ${item.id} references ${item.detailShard} but exists in ${found.shardUrl}.`);
  if (!found.detail.credit?.trim()) errors.push(`Item ${item.id} detail has no credit.`);
  if (catalog.source === 'nasa') {
    const nasaId = item.nasaId || found.detail.nasaId;
    if (!nasaId) errors.push(`NASA item ${item.id} has no nasaId.`);
    if (!found.detail.sourceUrl) errors.push(`NASA item ${item.id} detail has no sourceUrl.`);
    if (nasaId && nasaIds.has(nasaId)) errors.push(`Duplicate NASA ID: ${nasaId}`);
    if (nasaId) nasaIds.add(nasaId);
    if (found.detail.reviewRequired) warnings.push(`Item ${item.id} (${nasaId}) is flagged for rights review.`);
  }
}

for (const id of detailById.keys()) if (!ids.has(id)) errors.push(`Orphan detail id ${id}.`);
if (detailById.size !== ids.size) errors.push(`Detail count ${detailById.size} does not match catalog count ${ids.size}.`);

const catalogBytes = (await fs.stat(catalogPath)).size;
console.log(`Catalog source: ${catalog.source}`);
console.log(`Items: ${catalog.items?.length ?? 0}`);
console.log(`Detail items: ${detailById.size}`);
console.log(`Detail shards: ${referencedShards.size}`);
console.log(`Index payload: ${Math.round(catalogBytes / 1024)} KB`);
console.log(`Atlas: ${catalog.atlas?.url ?? 'missing'}`);
if (warnings.length) {
  console.warn(`\nWarnings (${warnings.length}):`);
  warnings.slice(0, 30).forEach((warning) => console.warn(`- ${warning}`));
  if (warnings.length > 30) console.warn(`- ... ${warnings.length - 30} more`);
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else console.log('\nCatalog validation passed.');
