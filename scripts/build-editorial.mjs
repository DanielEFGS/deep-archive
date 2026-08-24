import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'content');
const outputRoot = path.join(root, 'public', 'editorial');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'public', 'datasets', 'nasa', 'catalog.json'), 'utf8'));
const catalogByNasaId = new Map(catalog.items.map((item) => [item.nasaId, item]));

async function jsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? jsonFiles(entryPath) : entry.name.endsWith('.json') ? [entryPath] : [];
  }));
  return nested.flat();
}

const objectFiles = await jsonFiles(path.join(sourceRoot, 'objects'));
const trailFiles = await jsonFiles(path.join(sourceRoot, 'trails'));
const objects = await Promise.all(objectFiles.map(async (file) => JSON.parse(await fs.readFile(file, 'utf8'))));
const trails = await Promise.all(trailFiles.map(async (file) => JSON.parse(await fs.readFile(file, 'utf8'))));
const resolvedObjects = objects.map((object) => {
  const catalogItem = catalogByNasaId.get(object.nasaId);
  return {
    ...object,
    catalogId: catalogItem.id,
    relatedIds: object.relatedNasaIds.map((nasaId) => catalogByNasaId.get(nasaId).id),
    relatedNasaIds: undefined,
  };
});
const resolvedTrails = trails.map((trail) => ({
  ...trail,
  steps: trail.steps.map((step) => ({ ...step, catalogId: catalogByNasaId.get(step.nasaId).id })),
}));

await fs.mkdir(outputRoot, { recursive: true });
for (const object of resolvedObjects) {
  const destination = path.join(outputRoot, 'objects', object.locale, `${String(object.catalogId).padStart(3, '0')}.json`);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, `${JSON.stringify(object)}\n`);
}
for (const trail of resolvedTrails) {
  const destination = path.join(outputRoot, 'trails', trail.locale, `${trail.slug}.json`);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, `${JSON.stringify(trail)}\n`);
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  locales: [...new Set([...objects, ...trails].map((entry) => entry.locale))].sort(),
  objects: resolvedObjects.map(({ catalogId, locale, slug, status }) => ({
    catalogId,
    locale,
    slug,
    status,
    url: `/editorial/objects/${locale}/${String(catalogId).padStart(3, '0')}.json`,
  })),
  trails: resolvedTrails.map(({ slug, locale, status, title, dek, estimatedMinutes, steps }) => ({
    slug,
    locale,
    status,
    title,
    dek,
    estimatedMinutes,
    stepCount: steps.length,
    url: `/editorial/trails/${locale}/${slug}.json`,
  })),
};

await fs.writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest)}\n`);
console.log(`Editorial delivery built: ${objects.length} objects, ${trails.length} trail.`);
