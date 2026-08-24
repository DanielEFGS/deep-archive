# Archived Codex prompt — Phase 3: real NASA catalog + visual polish

> Historical document: this phase has been completed and the repository has since evolved into **deep-archive / DEEP / 1000**. Use `docs/IMPLEMENTATION_STATUS.md` and `docs/PRODUCT_ROADMAP.md` for current planning.

Continue development of **DEEP / 500**, the historical 500-record phase of the React + TypeScript + Vite + Three.js astronomical archive.

Before changing code, read `AGENTS.md`, `README.md`, and every document under `docs/`. Inspect the current implementation instead of rebuilding it from scratch.

## Primary goal

Turn the v0.2 technical prototype into the first credible portfolio-ready NASA-backed version while preserving the existing performance architecture.

## Phase objectives

### 1. Make the real NASA ingestion workflow production-ready

- Review `scripts/build-nasa-catalog.mjs` and improve it where necessary.
- Build a curated, balanced dataset target of 500 image records from NASA's Image and Video Library.
- Favor visually strong astronomical imagery: nebulae, galaxies, deep-space fields, planets, moons, Sun, Earth from space, Hubble/JWST imagery and selected missions.
- Avoid obvious duplicates and low-value technical/administrative imagery.
- Preserve original `nasa_id`, title, description, date, center/creator, credit, source link, keywords and rights-review flags when available.
- Do not make 500 API/media requests at runtime. All bulk ingestion/normalization remains an offline build/development step.
- Keep a deterministic cache so rerunning the script does not redownload unchanged source assets.
- Do not publish records with unresolved rights/credit concerns; surface them in a review report instead.

### 2. Improve atlas quality without increasing initial cost excessively

- Keep the gallery driven by one or a very small number of texture atlases.
- Evaluate WebP vs AVIF support in the build pipeline and choose based on actual size/quality/runtime compatibility.
- Preserve content-hashed filenames.
- Generate thumbnails at a size appropriate for the actual screen tile footprint and modest zoom effect; do not oversize them.
- Produce a build summary with atlas dimensions, encoded size, record count and approximate initial media payload.

### 3. Polish the WebGL interaction

Keep the interaction restrained and premium rather than game-like.

- Refine the gravitational-lens-inspired pointer effect.
- Add subtle depth/displacement around the pointer.
- Keep chromatic aberration very low and velocity-dependent.
- Avoid obvious stretching, seams between atlas cells, texture bleeding or nauseating movement.
- Preserve the idle render sleep behavior.
- Do not allocate objects inside the frame loop.
- Ensure filtered tiles do not behave as interactive targets.
- Maintain good performance on integrated GPUs and high-DPI displays.

### 4. Polish the visual system

Target a dark, scientific/archive aesthetic rather than a generic neon space website.

- Keep the 500-image field as the dominant visual element.
- Refine typography, hierarchy, spacing and borders.
- Keep labels compact and editorial.
- The selected item's title/category/date should be legible without overwhelming the gallery.
- Avoid excessive gradients, glowing UI, glassmorphism or sci-fi clichés.
- Keep the interface usable at 1366×768, 1920×1080 and common mobile widths.

### 5. Improve the detail experience

When a record is opened:

- Show the large image progressively/on demand.
- Use the atlas crop as an immediate low-resolution placeholder where feasible.
- Present a concise educational description and structured metadata.
- Include individual credit and source link prominently enough to be responsible but not visually dominant.
- Include fields only when data exists; do not render empty metadata rows.
- Keep Escape, click-outside and keyboard focus management working.
- Consider previous/next navigation inside the detail view without loading adjacent full images preemptively unless there is a clear, bounded strategy.

### 6. Performance instrumentation

Add a small development-only diagnostic mode, not shown in production by default, that can report:

- renderer resolution/DPR;
- current quality mode;
- frame timing sample;
- atlas dimensions;
- approximate atlas payload;
- number of WebGL draw calls/triangles if available;
- whether the renderer is actively animating or sleeping.

Do not add a heavy monitoring library for this.

### 7. Validation and documentation

- Run the existing catalog validator.
- Build the app successfully.
- Fix TypeScript errors rather than suppressing them.
- Test reduced-motion behavior.
- Test WebGL failure fallback.
- Test keyboard navigation and filtering.
- Update `README.md`, `CHANGELOG.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/PERFORMANCE.md`, and `docs/DATA_PIPELINE.md` to match the final implementation.
- If a design/architecture decision changes, document why.

## Important constraints

- No SSR for this phase.
- No backend/database for this phase.
- No per-tile runtime image request.
- No 500 DOM `<img>` elements.
- No React state updates on every pointer move/frame.
- Do not sacrifice accessibility for WebGL effects.
- Do not claim all NASA-hosted material is public domain.
- Do not imply NASA endorsement or affiliation.
- Do not replace the existing architecture with a large framework or unnecessary state library.

## Definition of done

The phase is complete when:

1. `npm run build` succeeds.
2. `npm run check:catalog` succeeds.
3. The application can run with a reviewed real NASA dataset or, if network/API access prevents ingestion during the task, the ingestion tooling is production-ready and the synthetic fallback remains functional.
4. Initial gallery media still uses an atlas strategy rather than hundreds of image requests.
5. Interaction is smooth on desktop and degrades responsibly on lower-power devices.
6. Selected records show useful metadata, individual credits and original source links.
7. Documentation accurately describes the delivered implementation.

Work incrementally. Preserve working behavior, make small reviewable changes, and summarize the files changed, commands run, measured payload/performance observations, and any remaining risks at the end.
