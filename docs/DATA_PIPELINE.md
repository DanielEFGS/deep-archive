# NASA data pipeline

## Goal

External APIs are content sources for the build process, not runtime dependencies for the 1,000-tile gallery.

## Command

```bash
npm run catalog:nasa
```

Environment options:

```bash
NASA_CATALOG_COUNT=1000
NASA_CONCURRENCY=5
NASA_REFRESH=1
NASA_DOWNLOAD_FULL=1
```

## Pipeline

1. Search broad astronomy terms through NASA's Image and Video Library API.
2. Deduplicate results by `nasa_id`.
3. Cache JSON/API responses under `.cache/nasa/json`.
4. Cache source previews under `.cache/nasa/previews`.
5. Fetch source metadata for credit/right hints.
6. Decode description entities, strip source HTML and remove repeated NASA/Goddard policy and social-media boilerplate.
7. Normalize preview images to 192×144 thumbnails.
8. Pack thumbnails into WebP atlas sectors of at most 500 records.
9. Hash each atlas sector and use the hash in its filename.
10. Write one lightweight index record per item.
11. Group detail metadata into content-hashed shards of approximately 50 records.
12. Optionally download and optimize local 1600×1200 detail images.
13. Run `npm run check:catalog` and `npm run audit:media`.
14. Remove obsolete detail JSON from previous builds.
15. Manually review any media audit blockers before publishing.

## Caching

Repeated catalog builds reuse `.cache/nasa` and therefore avoid unnecessarily re-requesting unchanged API records and preview media. Set `NASA_REFRESH=1` when intentionally rebuilding from fresh source responses.

## Real NASA pilot

The NASA catalog contains 1,000 records after automated rejection, deduplication and explicit editorial overrides. `data/nasa-curation.json` records include/exclude decisions, category/title overrides, featured status, notes and normalized focal points. Cropping computes a clamped 4:3 extraction around `[x, y]`, resizes to 128×96 and packs each group of 500 into a 25×20, 3200×1920 atlas. Cached API JSON, manifests and previews permit offline atlas rebuilds after the first successful collection. `npm run catalog:sectors -- --dataset=nasa` can migrate an existing monolithic catalog without another NASA download.

The catalog emits twenty shards of fifty records, `reports/media-review.json` and `reports/media-audit.json`. Automated search is discovery only; the manifest is the durable editorial layer. The audit fails production builds when a record lacks a supplied credit, an HTTPS NASA source/media URL, or a resolved rights decision. It also reports opaque or administrative records for editorial review.

## Curation

Discovery uses category quotas to avoid filling the catalog with the first broad query, rejects common administrative/graphic/portrait terms, and deduplicates NASA IDs. This is a first automated editorial pass, not publication approval. A public release should still remove:

- duplicates or near-duplicates;
- low-information mission graphics;
- badly cropped assets;
- assets with ambiguous rights/credits;
- images that weaken the visual consistency of the archive.

The eventual production workflow should add an explicit curated NASA ID manifest so builds are fully deterministic. Detail records also infer common telescope/mission/instrument fields from supplied NASA text when that evidence is present.

## Editorial content

Learning content lives separately from the gallery catalog under `content/objects/<locale>/` and `content/trails/<locale>/`. This prevents the editorial layer from increasing the initial atlas or index payload. `npm run check:editorial` verifies schema version, catalog identity, locale, source URLs, DG approval, Trail references and rights-review state against the generated NASA detail shards.

The first source-checked pilot is available in English and Spanish at `content/trails/<locale>/how-space-gets-its-colors.json`. Each locale has twelve corresponding object records that form a closed editorial subset, so every related-object link remains inside the same language edition. Editorial identity is the pair `locale + nasaId`, allowing one source object to have independently reviewed translations. Source content refers to stable NASA IDs; the editorial build resolves those identities to the current numeric catalog IDs after every regeneration. During `prebuild`, `npm run editorial:build` copies the validated records into `public/editorial/` and writes a small delivery manifest. Vite then publishes them as independent static files: they are available on demand but are not requested or included in the initial client bundle.

Three pilot objects may also define an optional `observationMap`. It uses a bounded 2–12 column/row grid and one to four source-checked features classified as `visible-feature`, `processed-signal` or `editorial-guide`. Cell references are validated at build time. These maps are fixed, approximate editorial areas navigated from the Visual Guide—not runtime image recognition, user detection or scientifically validated segmentation.
