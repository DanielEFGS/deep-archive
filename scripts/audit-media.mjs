import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const datasetRoot = path.join(root, "public", "datasets", "nasa");
const catalog = JSON.parse(
  await fs.readFile(path.join(datasetRoot, "catalog.json"), "utf8"),
);
const curation = JSON.parse(
  await fs.readFile(path.join(root, "data", "nasa-curation.json"), "utf8"),
);
const detailFiles = (
  await fs.readdir(path.join(datasetRoot, "details"))
).filter((file) => file.endsWith(".json"));
const details = (
  await Promise.all(
    detailFiles.map(async (file) =>
      JSON.parse(
        await fs.readFile(path.join(datasetRoot, "details", file), "utf8"),
      ),
    ),
  )
).flatMap((shard) => Object.values(shard));
const blockers = [];
const warnings = [];
const allowedSourceHosts = new Set(["images.nasa.gov"]);
const allowedMediaHosts = new Set([
  "images-assets.nasa.gov",
  "images.nasa.gov",
]);
const nonEditorialPattern =
  /\b(award|ceremony|competition|administrator|meeting|classroom|museum|facility|setup|activities|portrait|press conference|technician|measurement system)\b/i;
const opaqueTitlePattern = /^(?:ARC|GRC|KSC|MSFC|NHQ|jsc|iss)[:-]?\d/i;

function validateHttpsUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.has(url.hostname);
  } catch {
    return false;
  }
}

for (const detail of details) {
  const identity = {
    id: detail.id,
    nasaId: detail.nasaId,
    title: detail.title,
  };
  if (!detail.credit?.trim() || /verify credit/i.test(detail.credit))
    blockers.push({ ...identity, reason: "Missing or placeholder credit." });
  if (!validateHttpsUrl(detail.sourceUrl, allowedSourceHosts))
    blockers.push({
      ...identity,
      reason: "Source URL is missing, non-HTTPS or outside images.nasa.gov.",
    });
  if (
    !validateHttpsUrl(detail.fullImageUrl, allowedMediaHosts) &&
    !detail.fullImageUrl?.startsWith("/datasets/nasa/media/")
  )
    blockers.push({
      ...identity,
      reason:
        "Full media URL is missing or outside the approved NASA delivery hosts.",
    });
  if (detail.reviewRequired || detail.rightsStatus === "pending")
    blockers.push({ ...identity, reason: "Rights review remains pending." });
  if (detail.rightsStatus === "approved") {
    const decision = curation.assets?.[detail.nasaId];
    if (
      decision?.rightsStatus !== "approved" ||
      !decision?.rightsNote?.trim() ||
      !detail.rightsReviewNote?.trim()
    )
      blockers.push({
        ...identity,
        reason: "Approved rights metadata has no durable curation rationale.",
      });
  }
  if (nonEditorialPattern.test(`${detail.title} ${detail.description ?? ""}`))
    warnings.push({
      ...identity,
      reason:
        "Administrative/non-editorial language requires a visual spot check.",
    });
  else if (opaqueTitlePattern.test(detail.title))
    warnings.push({
      ...identity,
      reason:
        "Opaque identifier-style title requires an editorial title check.",
    });
}

const expectedCount = Number(process.env.NASA_CATALOG_COUNT ?? 1000);
if (catalog.items.length !== expectedCount || details.length !== expectedCount)
  blockers.push({
    reason: `Expected ${expectedCount} catalog and detail records; found ${catalog.items.length}/${details.length}.`,
  });

const report = {
  schemaVersion: 1,
  catalogGeneratedAt: catalog.generatedAt,
  auditedRecords: details.length,
  blockers,
  editorialWarnings: warnings,
};
await fs.writeFile(
  path.join(root, "reports", "media-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(`Media records audited: ${details.length}`);
console.log(`Publication blockers: ${blockers.length}`);
console.log(`Editorial spot checks: ${warnings.length}`);
console.log("Report: reports/media-audit.json");
if (blockers.length) {
  blockers
    .slice(0, 30)
    .forEach((blocker) =>
      console.error(`- ${blocker.nasaId ?? "catalog"}: ${blocker.reason}`),
    );
  process.exitCode = 1;
} else {
  console.log("\nMedia publication audit passed.");
}
