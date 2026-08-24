# Implementation status — current working tree

## Security and localization foundation

- Netlify sends CSP, anti-framing, HSTS, MIME, referrer and browser-permission headers.
- Runtime catalog shard paths are restricted to same-origin dataset files and external media/source links require HTTPS.
- The dependency audit currently reports zero known vulnerabilities.
- English/Spanish locale selection supports `?lang=`, browser preference and persisted choice without a runtime i18n dependency.
- Archive HUD, filters, onboarding, boot/error states, Detail, Index, About, Trail controls and the Visual Guide have Spanish UI and accessible names.
- Three Trails and 18 editorial objects have complete English and Spanish editions. Changing language while a Trail is open reloads the same introduction or step in the selected locale.
- NASA source metadata remains in its supplied language by policy.

## Implemented

### Runtime

- React/TypeScript application shell
- one-canvas Three.js renderer
- 1,000-tile combined BufferGeometry in production
- one active 500-record atlas texture / shader material, virtualized across two production sectors
- responsive 32/24/16-column production geometry
- provisional Archive Aperture tile expansion/reveal
- rigid, aspect-preserving focused tile with a short neighbour displacement field
- tile-snapped color reveal without chromatic image deformation
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
- responsive Trail index and three source-checked educational Trails with 24 total steps
- restorable Trail/step URLs and copyable step links
- floating Trail navigation, direct progress controls and arrow-key support
- persistent mobile Trail-start action that remains available in the first viewport
- reversible Observe, UI-hidden and compact reading states for Trail steps
- Reveal Context focus handoff and explicit return to observation
- independent on-demand editorial and HD loading with stale-request protection
- Trail loading, retry, completion, touch and reduced-motion states
- three-object fixed visual-guide pilot with authored, approximate areas
- explicit visible-feature, processed-signal and editorial-guide classifications
- compact related-object continuation below detail credits, including cross-sector navigation
- catalog bootstrap, detail-shard selection and pure archive selectors extracted from the React composition root
- independently lazy-loaded optional panel boundary declared under `src/app/`

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
- deterministic subject-based category correction plus a build-blocking 1,000-record category audit
- editorial object/Trail schema, source files, delivery builder and catalog/rights validator
- automated 1,000-record publication audit for credits, source/media hosts and unresolved rights state
- stable NASA-ID editorial references that survive catalog regeneration
- source linting, focused unit tests and a combined local quality command (`npm run check`)

## Validation performed here

- `npm run check:catalog` passes;
- `npm run build` passes with TypeScript checks and a production Vite bundle;
- `npm run check:editorial` passes for 18 English objects, 18 Spanish objects and six localized Trail definitions;
- `npm run audit:categories` passes for all 1,000 NASA records after 64 strong subject conflicts were corrected;
- demo catalog contains exactly 500 records;
- all 500 demo details resolve exactly once across 10 shards;
- demo atlas exists and matches its catalog byte count;
- initial demo index is ~86 KB raw;
- regenerated demo atlas is 110 KB;
- demo detail shards are approximately 22 KB each before transfer compression.

## Validation still required on release hardware

The current environment did not expose the in-app browser runtime, so the Trail was inspected through local headless Edge captures at 1440×1000 and 500×844. Desktop/mobile composition and reduced motion passed the bounded visual review. Real-device touch, Safari and WebGL console behavior should still receive a final release pass.

## REAL NASA CATALOG

- 1,000 real NASA records across galaxies, nebulae, deep space, Solar System, Earth and missions;
- independently retained 500-record demo dataset;
- two 3200×1920 WebP atlas sectors (approximately 576 KB and 619 KB) with 128×96 focal-point-aware crops;
- twenty on-demand content-hashed metadata shards;
- explicit curation manifest and media rights review report;
- index-only search, slug deep linking and filter-aware detail navigation;
- velocity-sensitive lens dispersion with clamped, smoothed pointer input;
- progressive HD fallback and retry over the atlas placeholder.

Administrative events, crew portraits, diagrams, historical series, rights-ambiguous photographic series and unrelated technical documentation were rejected. The explicit rights-review queue and automated 1,000-record media audit pass with zero publication blockers. One hundred opaque or administrative titles remain recorded as non-blocking editorial spot checks for future visual curation. Final mobile/Safari/Lighthouse measurements remain pending.

## Next production milestone

- run the real NASA builder and freeze an approved NASA ID manifest;
- continue visual curation as the catalog evolves;
- profile real atlas quality/weight;
- adjust thumbnail dimensions/compression from measured results;
- add automated Lighthouse/performance-budget checks in CI.
