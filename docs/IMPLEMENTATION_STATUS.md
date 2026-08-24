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
- first source-checked educational Trail with introduction, observation-first reveal and 12 steps
- restorable Trail/step URLs and copyable step links
- floating Trail navigation, direct progress controls and arrow-key support
- independent on-demand editorial and HD loading with stale-request protection
- Trail loading, retry, completion, touch and reduced-motion states

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
- editorial records remain outside the initial bundle and load as independent static JSON

### Build/data

- synthetic 500-record local dataset
- NASA discovery/metadata pipeline
- bounded concurrency/retry policy
- local API/preview cache
- optional optimized local detail media
- catalog integrity validator
- rights-review flags when source metadata contains explicit copyright fields
- category-balanced NASA discovery quotas and automated rejection of common non-editorial results
- editorial object/Trail schema, source files, delivery builder and catalog/rights validator
- automated 500-record publication audit for credits, source/media hosts and unresolved rights state
- stable NASA-ID editorial references that survive catalog regeneration

## Validation performed here

- `npm run check:catalog` passes;
- `npm run build` passes with TypeScript checks and a production Vite bundle;
- `npm run check:editorial` passes for 12 English objects and one Trail;
- demo catalog contains exactly 500 records;
- all 500 demo details resolve exactly once across 10 shards;
- demo atlas exists and matches its catalog byte count;
- initial demo index is ~86 KB raw;
- regenerated demo atlas is 110 KB;
- demo detail shards are approximately 22 KB each before transfer compression.

## Validation still required on release hardware

The current environment did not expose the in-app browser runtime, so the Trail was inspected through local headless Edge captures at 1440×1000 and 500×844. Desktop/mobile composition and reduced motion passed the bounded visual review. Real-device touch, Safari and WebGL console behavior should still receive a final release pass.

## REAL NASA CATALOG

- 500 real NASA records across galaxies, nebulae, deep space, Solar System, Earth and missions;
- independently retained 500-record demo dataset;
- 4800×2880, 1,429,678-byte WebP atlas with 192×144 focal-point-aware crops;
- ten on-demand content-hashed metadata shards;
- explicit curation manifest and media rights review report;
- index-only search, slug deep linking and filter-aware detail navigation;
- velocity-sensitive lens dispersion with clamped, smoothed pointer input;
- progressive HD fallback and retry over the atlas placeholder.

Administrative events, crew portraits, diagrams, historical series and unrelated technical documentation were rejected. The explicit rights-review queue and automated 500-record media audit now pass with zero blockers and zero editorial spot checks. Final mobile/Safari/Lighthouse measurements remain pending.

## Next production milestone

- run the real NASA builder and freeze an approved NASA ID manifest;
- continue visual curation as the catalog evolves;
- profile real atlas quality/weight;
- adjust thumbnail dimensions/compression from measured results;
- add automated Lighthouse/performance-budget checks in CI.
