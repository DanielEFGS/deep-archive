# DEEP Archive — DEEP / 1000

A single-screen astronomical archive built as a frontend performance study. **DEEP Archive** is the scalable product/repository name; **DEEP / 1000** is the current collection edition. The visual goal is a dense field of 1,000 astronomical images with GPU-driven pointer interaction; the engineering goal is to keep network, DOM and main-thread work intentionally small.

## Stack

- React 19 + TypeScript
- Vite 8
- Three.js + custom GLSL shaders
- Sharp for offline thumbnail/atlas generation
- Cloudflare Workers Static Assets deployment

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

Cloudflare deployment:

```bash
npm run cloudflare:dry-run
npm run cloudflare:deploy
```

The production Worker is `deep`, serves the Vite SPA from `dist/` and owns
`https://deep.daniel-gs.dev`. Cache and security response headers live in
`public/_headers` and are copied into the deployment output by Vite.

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

## Responsive behavior

- Desktop keeps the full archive navigation and two-column Detail layout.
- Touch and compact viewports use a reduced DEEP header with on-demand search and an accessible navigation drawer.
- Mobile archive navigation presents each 500-record atlas as two logical 250-record pages (four pages for DEEP / 1000) without adding per-tile requests; mobile landscape uses a wider mesh to preserve thumbnail proportions.
- Light and dark interface themes follow the operating-system preference on first visit and persist an explicit visitor choice. Light mode uses warm daylight chrome, canvas clear bands, modal surrounds and navigation while astronomical imagery remains unmodified.
- Long NASA descriptions open at five lines on desktop and four on mobile, with an explicit expand/collapse control; technical metadata is collapsible on mobile while credit and source remain outside it.
- Related objects become a native horizontal, scroll-snapping rail on mobile.
- Trail Focus Mode removes nonessential UI and uses the available viewport. On portrait touch devices it requests fullscreen and landscape orientation after the user's gesture; unsupported or rejected orientation locks fall back to a non-blocking rotate hint.
- Fullscreen controls and fixed navigation respect dynamic viewport units and safe-area insets.

See `docs/RESPONSIVE.md` for the local implementation and QA notes.

## Media policy

DEEP / 1000 is an independent educational and non-commercial visual study. Production imagery/metadata should be sourced from publicly accessible NASA resources while preserving each item's supplied credit and original source. NASA-hosted third-party material may have separate rights; generated catalogs must therefore be reviewed before publication.

The project does not use NASA branding as its own identity and does not imply affiliation, sponsorship or endorsement.

## Project references

- [`PRODUCT.md`](PRODUCT.md)
- [`DESIGN.md`](DESIGN.md)
- [`AGENTS.md`](AGENTS.md) — implementation rules/context for coding agents
- [`NEXT_PHASE_PROMPT.md`](NEXT_PHASE_PROMPT.md) — archived Phase 3 implementation brief
