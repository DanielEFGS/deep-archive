import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const NASA_DATASET = path.join(ROOT, "public", "datasets", "nasa");
const errors = [];
const warnings = [];
const requiredObjectStrings = [
  "nasaId",
  "slug",
  "locale",
  "status",
  "introduction",
  "explanation",
  "colorMethod",
  "whyItMatters",
];
const allowedLocales = new Set(["en", "es", "ja"]);
const allowedStatuses = new Set(["draft", "source-checked", "reviewed"]);

async function jsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? jsonFiles(entryPath)
        : entry.name.endsWith(".json")
          ? [entryPath]
          : [];
    }),
  );
  return nested.flat();
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    errors.push(
      `${path.relative(ROOT, file)} is not valid JSON: ${error.message}`,
    );
    return null;
  }
}

const catalog = await readJson(path.join(NASA_DATASET, "catalog.json"));
const catalogById = new Map(
  (catalog?.items ?? []).map((item) => [item.id, item]),
);
const catalogByNasaId = new Map(
  (catalog?.items ?? []).map((item) => [item.nasaId, item]),
);
const detailFiles = await jsonFiles(path.join(NASA_DATASET, "details"));
const details = (await Promise.all(detailFiles.map(readJson)))
  .filter(Boolean)
  .flatMap((shard) => Object.values(shard));
const detailById = new Map(details.map((detail) => [detail.id, detail]));

const objectFiles = await jsonFiles(path.join(CONTENT, "objects"));
const objects = (await Promise.all(objectFiles.map(readJson))).filter(Boolean);
const editorialObjectKey = (locale, nasaId) => `${locale}:${nasaId}`;
const objectByLocaleAndNasaId = new Map();

for (const object of objects) {
  const label = `Editorial object ${object?.locale ?? "unknown"}:${object?.nasaId ?? "unknown"}`;
  if (object?.schemaVersion !== 1)
    errors.push(`${label} has an unsupported schemaVersion.`);
  const objectKey = editorialObjectKey(object?.locale, object?.nasaId);
  if (objectByLocaleAndNasaId.has(objectKey))
    errors.push(`${label} is duplicated.`);
  objectByLocaleAndNasaId.set(objectKey, object);
  for (const key of requiredObjectStrings)
    if (typeof object?.[key] !== "string" || !object[key].trim())
      errors.push(`${label} has no ${key}.`);
  if (!allowedLocales.has(object?.locale))
    errors.push(`${label} has unsupported locale ${object?.locale}.`);
  if (!allowedStatuses.has(object?.status))
    errors.push(`${label} has unsupported status ${object?.status}.`);
  if (
    !Array.isArray(object?.observe) ||
    object.observe.length < 1 ||
    object.observe.some((value) => typeof value !== "string" || !value.trim())
  )
    errors.push(`${label} needs at least one observation prompt.`);
  if (object?.observationMap) {
    const map = object.observationMap;
    if (map.mode !== "guided")
      errors.push(`${label} has an unsupported observation mode.`);
    if (
      !Number.isInteger(map.columns) ||
      map.columns < 2 ||
      map.columns > 12 ||
      !Number.isInteger(map.rows) ||
      map.rows < 2 ||
      map.rows > 12
    )
      errors.push(`${label} has invalid observation-grid dimensions.`);
    if (
      !Array.isArray(map.features) ||
      map.features.length < 1 ||
      map.features.length > 4
    )
      errors.push(`${label} needs 1–4 observation features.`);
    const validCells = new Set(
      Array.from(
        { length: (map.columns ?? 0) * (map.rows ?? 0) },
        (_, index) =>
          `${String.fromCharCode(65 + (index % map.columns))}-${String(Math.floor(index / map.columns) + 1).padStart(2, "0")}`,
      ),
    );
    const featureIds = new Set();
    for (const feature of map.features ?? []) {
      if (!feature?.id?.trim() || featureIds.has(feature.id))
        errors.push(
          `${label} has a missing or duplicate observation feature ID.`,
        );
      featureIds.add(feature?.id);
      if (!feature?.label?.trim() || !feature?.description?.trim())
        errors.push(`${label} has an incomplete observation feature.`);
      if (
        !["visible-feature", "processed-signal", "editorial-guide"].includes(
          feature?.kind,
        )
      )
        errors.push(`${label} has an unsupported observation feature kind.`);
      if (
        !Array.isArray(feature?.cells) ||
        !feature.cells.length ||
        feature.cells.some((cell) => !validCells.has(cell))
      )
        errors.push(`${label} has an observation feature outside its grid.`);
    }
  }
  if (!Array.isArray(object?.relatedNasaIds))
    errors.push(`${label} has no relatedNasaIds array.`);
  if (!Array.isArray(object?.sources) || !object.sources.length)
    errors.push(`${label} has no sources.`);
  for (const source of object?.sources ?? []) {
    if (!source?.label?.trim())
      errors.push(`${label} has an unlabelled source.`);
    try {
      const url = new URL(source?.url);
      if (url.protocol !== "https:")
        errors.push(`${label} source must use HTTPS: ${source?.url}`);
    } catch {
      errors.push(`${label} has an invalid source URL: ${source?.url}`);
    }
  }

  const catalogItem = catalogByNasaId.get(object?.nasaId);
  const detail = catalogItem ? detailById.get(catalogItem.id) : undefined;
  if (!catalogItem || !detail)
    errors.push(`${label} does not exist in the NASA catalog.`);
  if (catalogItem && catalogItem.slug !== object.slug)
    errors.push(`${label} slug does not match the catalog.`);
  if (detail?.reviewRequired)
    errors.push(
      `${label} is flagged for media rights review and cannot be published.`,
    );
  if (object?.status !== "draft" && object?.approvedBy !== "DG")
    errors.push(`${label} is publishable but has not been approved by DG.`);
}

for (const object of objects) {
  for (const relatedNasaId of object.relatedNasaIds ?? []) {
    if (!catalogByNasaId.has(relatedNasaId))
      errors.push(
        `Editorial object ${object.nasaId} relates to missing NASA item ${relatedNasaId}.`,
      );
    if (
      !objectByLocaleAndNasaId.has(
        editorialObjectKey(object.locale, relatedNasaId),
      )
    )
      warnings.push(
        `Editorial object ${object.locale}:${object.nasaId} relates to ${relatedNasaId}, which has no ${object.locale} editorial content yet.`,
      );
  }
}

const trailFiles = await jsonFiles(path.join(CONTENT, "trails"));
const trails = (await Promise.all(trailFiles.map(readJson))).filter(Boolean);
const trailSlugs = new Set();

for (const trail of trails) {
  const label = `Trail ${trail?.slug ?? "unknown"}`;
  if (trail?.schemaVersion !== 1)
    errors.push(`${label} has an unsupported schemaVersion.`);
  if (!trail?.slug?.trim() || trailSlugs.has(`${trail.locale}:${trail.slug}`))
    errors.push(`${label} has a missing or duplicate slug.`);
  trailSlugs.add(`${trail.locale}:${trail.slug}`);
  if (!allowedLocales.has(trail?.locale))
    errors.push(`${label} has unsupported locale ${trail?.locale}.`);
  if (!allowedStatuses.has(trail?.status))
    errors.push(`${label} has unsupported status ${trail?.status}.`);
  for (const key of ["title", "dek", "learningObjective"])
    if (!trail?.[key]?.trim()) errors.push(`${label} has no ${key}.`);
  if (!Number.isFinite(trail?.estimatedMinutes) || trail.estimatedMinutes < 1)
    errors.push(`${label} has an invalid estimatedMinutes value.`);
  if (
    !Array.isArray(trail?.steps) ||
    trail.steps.length < 5 ||
    trail.steps.length > 12
  )
    errors.push(`${label} must contain 5–12 steps.`);
  const stepIds = new Set();
  for (const step of trail?.steps ?? []) {
    if (stepIds.has(step.nasaId))
      errors.push(`${label} repeats NASA item ${step.nasaId}.`);
    stepIds.add(step.nasaId);
    const content = objectByLocaleAndNasaId.get(
      editorialObjectKey(trail.locale, step.nasaId),
    );
    if (!content)
      errors.push(
        `${label} references NASA item ${step.nasaId} without editorial content.`,
      );
    if (!catalogByNasaId.has(step.nasaId))
      errors.push(
        `${label} references NASA item ${step.nasaId}, which is absent from the catalog.`,
      );
    if (!step?.chapter?.trim() || !step?.prompt?.trim())
      errors.push(`${label} has an incomplete step for item ${step.nasaId}.`);
  }
  if (trail?.status !== "draft" && trail?.approvedBy !== "DG")
    errors.push(`${label} is publishable but has not been approved by DG.`);
}

console.log(`Editorial objects: ${objects.length}`);
console.log(`Editorial trails: ${trails.length}`);
console.log(
  `Locales: ${[...new Set(objects.map((object) => object.locale))].sort().join(", ")}`,
);
if (warnings.length) {
  console.warn(`\nWarnings (${warnings.length}):`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("\nEditorial validation passed.");
}
