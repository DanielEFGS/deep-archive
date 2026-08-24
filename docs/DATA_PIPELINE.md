# NASA data pipeline

## Goal

External APIs are content sources for the build process, not runtime dependencies for the 500-tile gallery.

## Command

```bash
npm run catalog:nasa
```

Environment options:

```bash
NASA_CATALOG_COUNT=500
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
6. Normalize preview images to 96×72 thumbnails.
7. Pack thumbnails into one WebP atlas.
8. Hash the atlas contents and use the hash in its filename.
9. Write one lightweight index record per item.
10. Group detail metadata into content-hashed shards of approximately 50 records.
11. Optionally download and optimize local 1600×1200 detail images.
12. Run `npm run check:catalog`.
13. Remove obsolete detail JSON from previous builds.
14. Manually review media credits and rights flags before publishing.

## Caching

Repeated catalog builds reuse `.cache/nasa` and therefore avoid unnecessarily re-requesting unchanged API records and preview media. Set `NASA_REFRESH=1` when intentionally rebuilding from fresh source responses.

## Real NASA pilot

The NASA catalog contains 500 records after automated rejection, deduplication and explicit editorial overrides. `data/nasa-curation.json` records include/exclude decisions, category/title overrides, featured status, notes and normalized focal points. Cropping computes a clamped 4:3 extraction around `[x, y]`, then resizes to 192×144 without distortion. Cached API JSON, manifests and previews permit offline atlas rebuilds after the first successful collection.

The catalog emits ten shards of fifty records and `reports/media-review.json`. Automated search is discovery only; the manifest is the durable editorial layer.

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

The first source-checked pilot is `content/trails/en/how-space-gets-its-colors.json`. Its twelve object records form a closed editorial subset, so every related-object link remains inside the pilot. During `prebuild`, `npm run editorial:build` copies the validated records into `public/editorial/` and writes a small delivery manifest. Vite then publishes them as independent static files: they are available on demand but are not requested or included in the initial client bundle.
