# AGENTS.md — DEEP Archive

## Project intent

DEEP Archive is a single-screen astronomical visual archive and frontend performance study. The current public edition is **DEEP / 1000**; the repository and scalable product name are **deep-archive**. It should feel like a polished interactive exhibit while remaining intentionally lightweight at runtime.

The core engineering constraint is: **represent 1,000+ visual records without a request or DOM node per thumbnail**.

## Read before changing architecture

Review `README.md`, `PRODUCT.md` and `DESIGN.md`, then inspect the current implementation before changing architecture.

## Non-negotiable architecture rules

- Keep the application statically deployable to Netlify.
- Do not introduce SSR, a backend, a database, or server functions unless a concrete requirement proves they are necessary.
- React owns UI/application state. Pointer animation must not use React state per frame.
- Keep the gallery in WebGL/Three.js rather than converting it to hundreds or thousands of DOM images.
- Preserve atlas-based initial loading.
- Full-resolution media and heavy metadata must remain on-demand.
- Avoid permanent 60 FPS rendering when the scene is idle.
- Keep device pixel ratio bounded; do not blindly render at native Retina/4K DPR.
- Preserve `prefers-reduced-motion` behavior.
- Maintain the WebGL/static fallback boundary.
- Any new runtime dependency needs a clear reason and must not duplicate functionality already present.

## Data/media rules

- Production media must preserve individual credits/source information.
- Do not assume every NASA-hosted asset is public domain; third-party rights may apply.
- Do not use NASA branding as the product identity or imply affiliation/endorsement.
- Keep the independent educational/non-commercial disclaimer accurate.
- Never silently publish assets flagged for rights review by the ingestion pipeline.

## Coding expectations

- TypeScript first; avoid `any` unless unavoidable and documented.
- Prefer small, explicit components and modules over large abstractions.
- Dispose Three.js textures/materials/geometries/renderers correctly.
- Avoid allocations inside per-frame render paths.
- Keep pointer calculations and shader updates imperative and outside React renders.
- Use semantic HTML for UI overlays and dialogs.
- Maintain keyboard operation and visible focus states.
- Handle loading/error/fallback states explicitly.
- Do not add animation merely for decoration if it harms readability or frame time.

## Commands

```bash
npm install
npm run dev
npm run check:catalog
npm run build
npm run preview
```

Dataset helpers:

```bash
npm run catalog:demo
npm run catalog:nasa
NASA_DOWNLOAD_FULL=1 npm run catalog:nasa
```

## Before considering a task complete

At minimum:

1. Run `npm run check:catalog` when data/assets changed.
2. Run `npm run build` when source/config changed.
3. Verify desktop and mobile layout manually.
4. Verify keyboard navigation and Escape behavior.
5. Test with reduced-motion enabled.
6. Confirm there are no new initial requests per gallery tile.
7. Check browser console for WebGL/resource errors.
8. Update documentation when architecture, data shape, scripts, or deployment behavior changes.

## Current phase

The repository contains the DEEP / 1000 production catalog, a retained 500-record synthetic development dataset, English/Spanish UI and editorial content, guided Trails, security controls and Netlify deployment configuration. The current implementation and changelog are the source of truth for delivered work.
