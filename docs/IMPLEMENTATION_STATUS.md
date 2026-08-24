# Implementation status — v0.2

## Implemented

### Runtime

- React/TypeScript application shell
- one-canvas Three.js renderer
- 500-tile combined BufferGeometry
- one atlas texture / shader material
- responsive 25/20/16-column geometry
- gravitational-lens-inspired tile expansion/reveal
- continuous radial sheet deformation with subdivided, non-overlapping atlas cells
- tile-safe chromatic dispersion sampling
- click ripple
- category filtering through GPU visibility data
- hover HUD
- keyboard navigation
- accessible detail/about dialogs
- progressive detail image loading over atlas fallback
- previous/next detail navigation with arrow-key support
- optional mission, telescope and instrument metadata rows
- static fallback when WebGL initialization/texture fails
- searchable text-first archive index with bounded result rendering
- first-use pointer/touch field guide persisted locally after dismissal
- contained dialog focus and larger mobile interaction targets
- accurate combined category/search result count and recoverable catalog loading
- one-time field exposure and record-to-record detail transitions

### Performance

- no pointer-driven React renders
- on-demand animation frame lifecycle
- DPR caps and device heuristics
- one-time slow-frame quality downgrade
- development-only `D` diagnostics panel; sampling stops when closed
- reduced-motion support
- lightweight initial catalog index
- detail metadata sharded in groups of 50 and loaded on demand
- in-memory shard promise cache with concurrent-request deduplication and retry after failure
- content-hashed atlas/detail assets
- Netlify immutable cache headers for versioned assets

### Build/data

- synthetic 500-record local dataset
- NASA discovery/metadata pipeline
- bounded concurrency/retry policy
- local API/preview cache
- optional optimized local detail media
- catalog integrity validator
- rights-review flags when source metadata contains explicit copyright fields
- category-balanced NASA discovery quotas and automated rejection of common non-editorial results

## Validation performed here

- `npm run check:catalog` passes;
- `npm run build` passes with TypeScript checks and a production Vite bundle;
- demo catalog contains exactly 500 records;
- all 500 demo details resolve exactly once across 10 shards;
- demo atlas exists and matches its catalog byte count;
- initial demo index is ~86 KB raw;
- regenerated demo atlas is 110 KB;
- demo detail shards are approximately 22 KB each before transfer compression.

## Validation still required on release hardware

The current environment did not expose the in-app browser runtime needed for visual viewport automation. Desktop/mobile composition, reduced motion and WebGL console behavior should receive a final device/browser pass before publication.

## REAL NASA CATALOG

- 500 real NASA records across galaxies, nebulae, deep space, Solar System, Earth and missions;
- independently retained 500-record demo dataset;
- 4800×2880, 1,429,678-byte WebP atlas with 192×144 focal-point-aware crops;
- ten on-demand content-hashed metadata shards;
- explicit curation manifest and media rights review report;
- index-only search, slug deep linking and filter-aware detail navigation;
- velocity-sensitive lens dispersion with clamped, smoothed pointer input;
- progressive HD fallback and retry over the atlas placeholder.

Administrative events, crew portraits, diagrams, historical series and telescope assembly documentation were rejected. Final mobile/Safari/Lighthouse measurements and manual rights clearance remain pending.

## Next production milestone

- run the real NASA builder and freeze an approved NASA ID manifest;
- curate the 500 IDs manually;
- review credits/rights flags;
- profile real atlas quality/weight;
- adjust thumbnail dimensions/compression from measured results;
- add automated Lighthouse/performance-budget checks in CI.
