import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { writeDetailShards, writeHashedAsset } from "./lib/runtime-assets.mjs";
import { classifyCatalogSubject } from "./lib/category-rules.mjs";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public", "datasets", "nasa");
const ATLAS_DIR = path.join(PUBLIC, "atlas");
const FULL_DIR = path.join(PUBLIC, "media");
const DETAILS_DIR = path.join(PUBLIC, "details");
const CACHE_DIR = path.join(ROOT, ".cache", "nasa");
const CURATION_PATH = path.join(ROOT, "data", "nasa-curation.json");
const REPORT_DIR = path.join(ROOT, "reports");
const API = "https://images-api.nasa.gov";
const URL_PREFIX = "/datasets/nasa";

const COUNT = Number(process.env.NASA_CATALOG_COUNT ?? 1000);
const SECTOR_SIZE = 500;
const COLUMNS = COUNT <= 100 ? 10 : 25;
const TILE_W = 128;
const TILE_H = 96;
const DOWNLOAD_FULL = process.env.NASA_DOWNLOAD_FULL === "1";
const REFRESH_CACHE = process.env.NASA_REFRESH === "1";
const CONCURRENCY = Math.max(1, Number(process.env.NASA_CONCURRENCY ?? 5));
const SHARD_SIZE = Number(
  process.env.NASA_SHARD_SIZE ?? (COUNT <= 100 ? 10 : 50),
);

const curation = JSON.parse(await fs.readFile(CURATION_PATH, "utf8"));
const editorial = curation.assets ?? {};

const QUERIES = [
  { query: "Webb galaxy", category: "GALAXIES", weight: 0.08 },
  { query: "Webb nebula", category: "NEBULAE", weight: 0.08 },
  { query: "Hubble galaxy", category: "GALAXIES", weight: 0.08 },
  { query: "Hubble nebula", category: "NEBULAE", weight: 0.08 },
  { query: "spiral galaxy", category: "GALAXIES", weight: 0.08 },
  { query: "galaxy cluster", category: "GALAXIES", weight: 0.08 },
  { query: "nebula", category: "NEBULAE", weight: 0.14 },
  { query: "deep field", category: "DEEP SPACE", weight: 0.08 },
  { query: "jupiter saturn mars", category: "SOLAR SYSTEM", weight: 0.08 },
  { query: "moon moons", category: "SOLAR SYSTEM", weight: 0.06 },
  { query: "sun solar observatory", category: "SOLAR SYSTEM", weight: 0.04 },
  { query: "earth from space", category: "EARTH", weight: 0.06 },
  {
    query: "spacecraft mission photograph",
    category: "MISSIONS",
    weight: 0.06,
  },
  { query: "supernova remnant", category: "DEEP SPACE", weight: 0.08 },
  { query: "star cluster telescope", category: "DEEP SPACE", weight: 0.08 },
  { query: "planetary nebula telescope", category: "NEBULAE", weight: 0.08 },
  { query: "star forming region", category: "NEBULAE", weight: 0.08 },
  { query: "interacting galaxies", category: "GALAXIES", weight: 0.08 },
  {
    query: "comet asteroid spacecraft",
    category: "SOLAR SYSTEM",
    weight: 0.08,
  },
  { query: "solar flare sun", category: "SOLAR SYSTEM", weight: 0.06 },
  { query: "exoplanet observatory", category: "DEEP SPACE", weight: 0.06 },
  { query: "Milky Way telescope", category: "DEEP SPACE", weight: 0.06 },
  { query: "stellar nursery", category: "NEBULAE", weight: 0.05 },
  { query: "brown dwarf telescope", category: "DEEP SPACE", weight: 0.05 },
  { query: "aurora earth from space", category: "EARTH", weight: 0.05 },
  { query: "astronomical observation", category: "DEEP SPACE", weight: 0.2 },
];

const REJECT_PATTERN =
  /\b(logo|insignia|poster|brochure|infographic|chart|graph|diagram|illustration|concept art|artist'?s? concept|press conference|portrait|headshot|awards?|ceremony|competition|administrator|meeting|classroom|museum|building|facility|setup|activities|crew photo|patch|history of|montage|mirrors?|revealed|hangout|animation|engineering model|technician|measurement system|facility testing|containerized server|baseball game|public event)\b/i;

// Every audited member encountered from these photographic series carries
// unresolved third-party rights metadata, so the series remain unpublished.
const REJECT_NASA_ID_PATTERN =
  /^(?:20031028_exp7_|AFRC2017-0233-|KSC-07PD-|KSC-20251111-PH-JBS01_)/i;

function titleFingerprint(value) {
  return clean(value)
    .toLowerCase()
    .replace(
      /\b(nasa|hubble|webb|space telescope|image|view|sees?|spies|peers? at|of the|the|a|an)\b/g,
      "",
    )
    .replace(/[^a-z0-9]/g, "");
}

function isEditorialCandidate(data) {
  const haystack = [data.title, data.description, ...(data.keywords ?? [])]
    .map(clean)
    .join(" ");
  const override = editorial[data.nasa_id];
  if (override?.include === false) return false;
  return (
    haystack.length > 30 &&
    !REJECT_PATTERN.test(haystack) &&
    !REJECT_NASA_ID_PATTERN.test(data.nasa_id)
  );
}

function refineCategory(data, fallbackCategory) {
  // Classify the depicted subject, not the broad search that discovered it.
  return classifyCatalogSubject(data, fallbackCategory);
}

function slugify(value, fallback) {
  return (
    clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || fallback
  );
}

async function makeThumbnail(buffer, focalPoint) {
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? TILE_W;
  const height = metadata.height ?? TILE_H;
  const [fx, fy] = Array.isArray(focalPoint)
    ? focalPoint.map((value) => Math.min(1, Math.max(0, Number(value))))
    : [0.5, 0.5];
  const targetRatio = TILE_W / TILE_H;
  let cropWidth = width;
  let cropHeight = height;
  if (width / height > targetRatio)
    cropWidth = Math.round(height * targetRatio);
  else cropHeight = Math.round(width / targetRatio);
  const left = Math.round(
    Math.min(width - cropWidth, Math.max(0, fx * width - cropWidth / 2)),
  );
  const top = Math.round(
    Math.min(height - cropHeight, Math.max(0, fy * height - cropHeight / 2)),
  );
  return image
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(TILE_W, TILE_H)
    .removeAlpha()
    .jpeg({ quality: 74, mozjpeg: true })
    .toBuffer();
}

function inferScienceFields(data) {
  const text = [data.title, data.description, ...(data.keywords ?? [])]
    .map(clean)
    .join(" ")
    .toLowerCase();
  const telescope =
    text.includes("james webb") || /\bjwst\b/.test(text)
      ? "James Webb Space Telescope"
      : text.includes("hubble")
        ? "Hubble Space Telescope"
        : text.includes("chandra")
          ? "Chandra X-ray Observatory"
          : undefined;
  const instrumentMatch = text.match(
    /\b(nircam|miri|niriss|nirspec|wide field camera 3|wfc3|advanced camera for surveys|acs)\b/i,
  );
  return {
    telescope,
    mission: telescope || clean(data.center) || undefined,
    instrument: instrumentMatch?.[1]?.toUpperCase(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKey(url) {
  return crypto.createHash("sha1").update(url).digest("hex");
}

async function readCache(file) {
  if (REFRESH_CACHE) return null;
  try {
    return await fs.readFile(file);
  } catch {
    return null;
  }
}

async function fetchWithRetry(url, retries = 4) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "deep-archive-catalog-builder/0.3" },
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("retry-after")) || 0;
        await sleep(Math.max(retryAfter * 1000, 650 * (attempt + 1)));
        continue;
      }
      throw new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) await sleep(650 * (attempt + 1));
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  await fs.mkdir(path.join(CACHE_DIR, "json"), { recursive: true });
  const file = path.join(CACHE_DIR, "json", `${cacheKey(url)}.json`);
  const cached = await readCache(file);
  if (cached) return JSON.parse(cached.toString("utf8"));

  const response = await fetchWithRetry(url);
  const text = await response.text();
  await fs.writeFile(file, text);
  return JSON.parse(text);
}

async function fetchPreviewBuffer(url) {
  await fs.mkdir(path.join(CACHE_DIR, "previews"), { recursive: true });
  const file = path.join(CACHE_DIR, "previews", `${cacheKey(url)}.bin`);
  const cached = await readCache(file);
  if (cached) return cached;

  const response = await fetchWithRetry(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(file, buffer);
  return buffer;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function clean(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function decodeHtmlEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi,
    (entity, code) => {
      if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
      const numeric =
        code[1].toLowerCase() === "x"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity;
    },
  );
}

function cleanDescription(value) {
  const withoutMarkup = decodeHtmlEntities(clean(value))
    .replace(/<[^>]*>/g, " ")
    .replace(
      /\bRead more(?: at|:)?\s+(?:https?:\/\/\S+|(?:www\.)?nasa\.gov(?:\/\S*)?)/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  const boilerplate = [
    /\bhref\s*=/i,
    /\brel\s*=/i,
    /\bNASA image use policy\b/i,
    /\bNASA Goddard Space Flight Center enables NASA(?:'s|’s) mission\b/i,
    /\bFollow us on Twitter\b/i,
    /\bLike us on Facebook\b/i,
    /\bFind us on Instagram\b/i,
  ];
  const cutoff = boilerplate.reduce((earliest, pattern) => {
    const index = withoutMarkup.search(pattern);
    return index >= 0 ? Math.min(earliest, index) : earliest;
  }, withoutMarkup.length);
  return withoutMarkup.slice(0, cutoff).trim();
}

function rightsFromMetadata(metadata, override) {
  const note = [
    metadata?.["AVAIL:Copyright"],
    metadata?.["IPTC:CopyrightNotice"],
    metadata?.["XMP:Rights"],
  ]
    .map(clean)
    .filter(Boolean)
    .join(" / ");
  const approved = override?.rightsStatus === "approved";
  return {
    rightsNote: note || undefined,
    rightsStatus: approved ? "approved" : note ? "pending" : "not-flagged",
    rightsReviewNote: approved ? clean(override.rightsNote) : undefined,
    reviewRequired: Boolean(note) && !approved,
  };
}

function pickCredit(data, metadata) {
  const candidates = [
    metadata?.["AVAIL:Credit"],
    metadata?.["IPTC:Credit"],
    metadata?.["XMP:Credit"],
    metadata?.["AVAIL:Creator"],
    data.photographer,
    data.secondary_creator,
    data.center,
  ]
    .map(clean)
    .filter(Boolean);
  return (
    [...new Set(candidates)].join(" / ") ||
    "NASA — verify credit on original source page."
  );
}

async function fetchMetadata(nasaId) {
  try {
    const locationPayload = await fetchJson(
      `${API}/metadata/${encodeURIComponent(nasaId)}`,
    );
    if (!locationPayload?.location) return null;
    return await fetchJson(locationPayload.location);
  } catch (error) {
    console.warn(`Metadata unavailable for ${nasaId}:`, error.message);
    return null;
  }
}

async function collectSearchResults() {
  const seen = new Set();
  const seenTitles = new Set();
  const results = [];

  for (const { query, category, weight } of QUERIES) {
    const quota = Math.max(1, Math.round(COUNT * weight));
    let accepted = 0;
    for (
      let page = 1;
      page <= 15 && results.length < COUNT && accepted < quota;
      page++
    ) {
      const params = new URLSearchParams({
        q: query,
        media_type: "image",
        page: String(page),
        page_size: "100",
      });
      const payload = await fetchJson(`${API}/search?${params}`);
      const items = payload?.collection?.items ?? [];
      if (!items.length) break;

      for (const item of items) {
        const data = item?.data?.[0];
        const preview = item?.links?.find(
          (link) => link.rel === "preview" && link.render === "image",
        )?.href;
        const fingerprint = titleFingerprint(data?.title);
        if (
          !data?.nasa_id ||
          !preview ||
          seen.has(data.nasa_id) ||
          !fingerprint ||
          seenTitles.has(fingerprint) ||
          !isEditorialCandidate(data)
        )
          continue;
        seen.add(data.nasa_id);
        seenTitles.add(fingerprint);
        results.push({ data, preview, category });
        accepted++;
        if (results.length >= COUNT || accepted >= quota) break;
      }
    }
    if (results.length >= COUNT) break;
  }

  if (results.length < COUNT)
    throw new Error(
      `Only ${results.length} curated unique NASA images were collected; required ${COUNT}.`,
    );
  return results.slice(0, COUNT);
}

async function chooseFullAsset(nasaId) {
  try {
    const manifest = await fetchJson(
      `${API}/asset/${encodeURIComponent(nasaId)}`,
    );
    const hrefs = (manifest?.collection?.items ?? [])
      .map((item) => item.href)
      .filter(Boolean);
    const selected =
      hrefs.find((href) => /~medium\./i.test(href)) ||
      hrefs.find((href) => /~large\./i.test(href)) ||
      hrefs.find((href) => /~orig\./i.test(href)) ||
      hrefs.find((href) => /\.(jpg|jpeg|png|webp)$/i.test(href)) ||
      null;
    return selected?.replace(/^http:\/\//i, "https://") ?? null;
  } catch {
    return null;
  }
}

console.log(`Collecting ${COUNT} NASA image records...`);
await fs.mkdir(ATLAS_DIR, { recursive: true });
await fs.mkdir(DETAILS_DIR, { recursive: true });
if (DOWNLOAD_FULL) await fs.mkdir(FULL_DIR, { recursive: true });

const searchResults = await collectSearchResults();

const processed = await mapLimit(
  searchResults,
  CONCURRENCY,
  async (entry, index) => {
    const id = index + 1;
    const { data, preview, category } = entry;
    const [metadata, previewBuffer, remoteFull] = await Promise.all([
      fetchMetadata(data.nasa_id),
      fetchPreviewBuffer(preview),
      chooseFullAsset(data.nasa_id),
    ]);

    const override = editorial[data.nasa_id] ?? {};
    const thumb = await makeThumbnail(previewBuffer, override.focalPoint);

    let fullImageUrl = remoteFull || preview;
    if (DOWNLOAD_FULL && remoteFull) {
      try {
        const response = await fetchWithRetry(remoteFull);
        const buffer = Buffer.from(await response.arrayBuffer());
        const fileName = `${String(id).padStart(3, "0")}.webp`;
        await sharp(buffer)
          .rotate()
          .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 78, effort: 5 })
          .toFile(path.join(FULL_DIR, fileName));
        fullImageUrl = `${URL_PREFIX}/media/${fileName}`;
      } catch (error) {
        console.warn(`Full image skipped for ${data.nasa_id}:`, error.message);
      }
    }

    const rights = rightsFromMetadata(metadata, override);
    const science = inferScienceFields(data);
    return {
      thumb,
      record: {
        id,
        nasaId: data.nasa_id,
        slug: slugify(
          override.shortTitle || data.title,
          data.nasa_id.toLowerCase(),
        ),
        title:
          clean(override.shortTitle) ||
          clean(data.title) ||
          `NASA IMAGE ${String(id).padStart(3, "0")}`,
        subtitle: [clean(data.center), data.date_created?.slice(0, 10)]
          .filter(Boolean)
          .join(" / "),
        description:
          cleanDescription(data.description) ||
          cleanDescription(data.description_508) ||
          "No description supplied.",
        category:
          clean(override.category) || refineCategory(data, category),
        date: data.date_created?.slice(0, 10),
        year: data.date_created?.slice(0, 4),
        center: clean(data.center),
        photographer: clean(data.photographer) || clean(data.secondary_creator),
        credit: pickCredit(data, metadata),
        sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id)}`,
        fullImageUrl,
        keywords: Array.isArray(data.keywords)
          ? data.keywords.slice(0, 20)
          : [],
        featured: Boolean(override.featured),
        focalPoint: override.focalPoint,
        editorialNote: clean(override.note) || undefined,
        ...science,
        ...rights,
      },
    };
  },
);

const atlases = [];
for (let startIndex = 0; startIndex < processed.length; startIndex += SECTOR_SIZE) {
  const sector = processed.slice(startIndex, startIndex + SECTOR_SIZE);
  const sectorRows = Math.ceil(sector.length / COLUMNS);
  const composites = sector.map(({ thumb }, index) => ({
    input: thumb,
    left: (index % COLUMNS) * TILE_W,
    top: Math.floor(index / COLUMNS) * TILE_H,
  }));
  const atlasBuffer = await sharp({
    create: {
      width: COLUMNS * TILE_W,
      height: sectorRows * TILE_H,
      channels: 3,
      background: "#03050a",
    },
  })
    .composite(composites)
    .webp({ quality: 68, effort: 6, smartSubsample: true })
    .toBuffer();
  const asset = await writeHashedAsset({
    directory: ATLAS_DIR,
    prefix: `nasa-atlas-${String(atlases.length + 1).padStart(2, "0")}`,
    extension: "webp",
    buffer: atlasBuffer,
  });
  atlases.push({
    url: `${URL_PREFIX}/atlas/${asset.fileName}`,
    columns: COLUMNS,
    rows: sectorRows,
    tileWidth: TILE_W,
    tileHeight: TILE_H,
    bytes: asset.bytes,
    startIndex,
    itemCount: sector.length,
  });
}

const records = processed.map(({ record }) => record);
const { shardById, assets: detailShards } = await writeDetailShards({
  directory: DETAILS_DIR,
  records,
  shardSize: SHARD_SIZE,
  publicUrlPrefix: URL_PREFIX,
});
const indexItems = records.map((record) => ({
  id: record.id,
  nasaId: record.nasaId,
  title: record.title,
  slug: record.slug,
  subtitle: record.subtitle,
  category: record.category,
  date: record.date,
  year: record.year,
  mission: record.mission,
  keywords: record.keywords.slice(0, 6),
  detailShard: shardById.get(record.id),
}));

const catalog = {
  generatedAt: new Date().toISOString(),
  source: "nasa",
  atlas: atlases[0],
  atlases,
  items: indexItems,
};

await fs.writeFile(path.join(PUBLIC, "catalog.json"), JSON.stringify(catalog));
await fs.mkdir(REPORT_DIR, { recursive: true });
const reviewItems = records
  .filter((record) => record.reviewRequired)
  .map(({ nasaId, title, credit, rightsNote, sourceUrl }) => ({
    nasaId,
    title,
    credit,
    copyright: rightsNote,
    sourceUrl,
    reason: "Source metadata contains a copyright or rights field.",
  }));
await fs.writeFile(
  path.join(REPORT_DIR, "media-review.json"),
  `${JSON.stringify({ generatedAt: catalog.generatedAt, items: reviewItems }, null, 2)}\n`,
);
console.log(
  `Done. ${records.length} records, ${detailShards.length} detail shards, ${atlases.length} atlas sectors (${Math.round(atlases.reduce((sum, atlas) => sum + atlas.bytes, 0) / 1024)} KB).`,
);
console.log(
  `Detail media: ${DOWNLOAD_FULL ? "optimized local files" : "NASA medium/large asset loaded only on click"}.`,
);
console.log(
  "Run npm run check:catalog, then manually review every source/credit before publishing.",
);
