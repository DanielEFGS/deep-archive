# DEEP Archive — DEEP / 1000

A single-screen astronomical archive built as a frontend performance study. **DEEP Archive** is the scalable product/repository name; **DEEP / 1000** is the current collection edition. The visual goal is a dense field of 1,000 astronomical images with GPU-driven pointer interaction; the engineering goal is to keep network, DOM and main-thread work intentionally small.

## Stack

- React 19 + TypeScript
- Vite 8
- Three.js + custom GLSL shaders
- Sharp for offline thumbnail/atlas generation
- Static deployment on Netlify

Node.js 22.12+ is recommended for the pinned Vite 8 toolchain.

## Run locally

```bash
npm install
npm run dev
```

The repository includes a synthetic 500-record catalog, one local texture atlas and per-record demo details.

To regenerate the synthetic dataset after dependencies are installed:

```bash
npm run catalog:demo
```

Validate catalog integrity:

```bash
npm run check:catalog
```

Run the source quality gates:

```bash
npm run lint
npm run test
npm run check
```

`npm run check` runs lint, unit tests and the complete audited production build. Unit tests are intentionally scoped to `src/**/*.test.ts(x)` so browser profiles, generated reports and cached upstream files are never collected as project tests.

Production:

```bash
npm run build
npm run preview
```

During local development, press `D` to inspect renderer diagnostics. Detail views support `←` / `→` navigation without preloading full-resolution media.

### Dataset selection

Development defaults to the retained 500-record `demo`; production defaults to the 1,000-record NASA catalog. Override either with `VITE_DATASET=demo` or `VITE_DATASET=nasa`. Build both independently with `npm run catalog:demo` and `npm run catalog:nasa`; outputs live under `public/datasets/` and never overwrite one another. `/` focuses index-only search and `?object=<slug>` opens a shareable detail.

## Runtime architecture

Initial runtime media is deliberately small:

1. `index.html` + bundled JS/CSS
2. `catalog.json` — lightweight hover/filter index
3. one active content-hashed WebGL texture-atlas sector

The 1,000 production thumbnails are not 1,000 `<img>` elements. The catalog is split into 500-record atlas sectors. Only one sector is mounted as a combined `BufferGeometry` and GPU texture at a time; wheel/Page Up/Page Down or the sector rail loads another sector, and the old renderer disposes its GPU resources.

Detailed descriptions, credits and full-image URLs are grouped into twenty content-hashed `/details/*.json` shards. The relevant shard is requested only when the visitor opens an item, cached in memory, and reused for nearby records. The large image itself is loaded on demand.

## NASA catalog pipeline

```bash
npm run catalog:nasa
```

The build script:

- searches NASA's Image and Video Library;
- deduplicates by `nasa_id`;
- caches API responses and source previews under `.cache/nasa`;
- retries transient failures with bounded backoff;
- normalizes 128×96 production thumbnails with Sharp;
- builds content-hashed WebP atlas sectors of at most 500 records;
- creates a compact initial index;
- creates content-hashed detail shards of approximately 50 records;
- preserves source, credit and rights-review metadata when available.

To also create optimized local detail media:

```bash
NASA_DOWNLOAD_FULL=1 npm run catalog:nasa
```

By default, the detail view resolves a NASA `~medium`, `~large` or original asset and requests it only after explicit interaction. The small source preview is used only to build the atlas or as a last-resort fallback.

## Runtime performance decisions

- no SSR/backend required;
- no React state updates for pointer coordinates;
- pointer position is passed to WebGL through shader uniforms;
- animation frames run only while interpolation/ripple work remains;
- device pixel ratio is capped and may be reduced after slow frame samples;
- low-memory/low-core devices begin in an ECO quality profile;
- filters update one small GPU attribute instead of rebuilding the mesh;
- atlas-sector filenames and detail-shard filenames are content-hashed and cached as immutable;
- `prefers-reduced-motion` disables motion-heavy shader behavior;
- WebGL failure falls back to a static atlas surface;
- full media loads only after an item is opened.

## Interaction

- pointer: gravitational-lens-inspired reveal and chromatic dispersion;
- click: inspect one astronomical object;
- category controls: dim/filter the archive without new media requests;
- keyboard: focus the canvas, use arrow keys/Home/End, then Enter or Space;
- Escape closes panels or clears keyboard focus.

## Media policy

DEEP / 1000 is an independent educational and non-commercial visual study. Production imagery/metadata should be sourced from publicly accessible NASA resources while preserving each item's supplied credit and original source. NASA-hosted third-party material may have separate rights; generated catalogs must therefore be reviewed before publication.

The project does not use NASA branding as its own identity and does not imply affiliation, sponsorship or endorsement.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md)
- [`docs/DATA_PIPELINE.md`](docs/DATA_PIPELINE.md)
- [`docs/MEDIA_AND_CREDITS.md`](docs/MEDIA_AND_CREDITS.md)
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)
- [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md)
- [`docs/PRODUCT_DEFINITION.md`](docs/PRODUCT_DEFINITION.md)
- [`PRODUCT.md`](PRODUCT.md)
- [`DESIGN.md`](DESIGN.md)
- [`docs/RELEASE_V1_CHECKLIST.md`](docs/RELEASE_V1_CHECKLIST.md)
- [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md)
- [`AGENTS.md`](AGENTS.md) — implementation rules/context for coding agents
- [`NEXT_PHASE_PROMPT.md`](NEXT_PHASE_PROMPT.md) — archived Phase 3 implementation brief
