# Changelog

## Unreleased

### Product and identity

- simplified the public product title and social metadata to **DEEP**, leaving record counts as collection information rather than part of the name;
- renamed the repository/package from `deep-500` to `deep-archive`, keeping **DEEP / 1000** as the current collection edition rather than the permanent product name;
- expanded the production NASA catalog from 500 to 1,000 records, two virtualized 500-record WebP atlas sectors and twenty on-demand metadata shards;
- added wheel, Page Up/Page Down and accessible rail navigation between on-demand atlas sectors, shareable `?sector=` state and GPU resource disposal on sector changes;
- added DG authorship plus GitHub and LinkedIn links, production SEO metadata, sitemap, social preview and Netlify configuration;
- documented the product definition, roadmap, release checklist, security posture and current implementation state.

### Learning and localization

- added the first 12-step editorial Trail, “How Space Gets Its Colors,” with shareable step URLs;
- added fixed editorial observation areas, sequenced visual-guide signals and collapsible observation/context modes;
- added complete English and Spanish UI coverage plus localized Trail and editorial records; NASA source metadata remains unchanged;
- added an invitation in About for scientific collaborators to help improve the educational interpretation.

### Interaction and responsive behavior

- made the detail-image resolving overlay begin on the modal's first frame and remain continuous while metadata and HD media load, removing the brief unmasked thumbnail flash;
- applied the same uninterrupted resolving state to Trail images so their atlas previews cannot flash before detail metadata arrives;
- added a shader-driven exposure while switching atlas sectors: the real 500 WebGL tiles now resolve in a restrained pseudo-random sequence that stays registered to the final mosaic at every viewport size;
- aligned the complete footer row—DG signature, GitHub/LinkedIn links and independence notice—on one vertical center and normalized line box;
- refined the gallery into a tile-snapped Archive Aperture interaction with aspect-preserving focus, eased transitions and touch preview placement;
- added touch drag-to-focus and release-to-open behavior with pointer capture and duplicate-click suppression;
- rebuilt detail and Trail layouts for mobile portrait/landscape, persistent navigation, compact titles/numbers and accessible close controls;
- added animated HD-loading placeholder grids and consistent click ripple timing across lazy and already-loaded panels;
- improved Index coverage so all production records remain discoverable outside the canvas.

### Quality, safety and data

- added catalog, editorial and media audits to the production build, including HTTPS/source/credit/rights checks;
- sanitized NASA descriptions by decoding entities and removing embedded HTML, policy links and social boilerplate;
- added restrictive Netlify security headers, safe dataset-path validation and HTTPS-only external media/source handling;
- recorded optimized Lighthouse baselines and documented remaining real-device/browser QA;
- added English/Spanish editorial identity validation and stable NASA-ID references across catalog regeneration.

## 0.2.0

- split initial catalog index from on-demand detail metadata;
- added content-hashed atlas and detail asset strategy;
- added local NASA API/preview cache and retry/timeout handling;
- added catalog integrity validator;
- added category filtering without mesh rebuilds;
- added keyboard browsing and dialog focus behavior;
- added WebGL/static fallback behavior;
- added progressive detail media loading over atlas preview;
- added tile-safe chromatic dispersion and click ripple shader effects;
- added automatic quality profile/DPR downgrade logic;
- added About / Media & Credits panel;
- pinned runtime/build dependency versions;
- expanded architecture, performance, accessibility and deployment documentation.

### Phase 3 — NASA-backed archive

- scaled the curated NASA dataset from 50 to 500 records while retaining one atlas and ten on-demand metadata shards;
- resolved medium, large or original NASA assets for detail panels instead of low-resolution API previews;
- added a 49-record NASA pilot, isolated demo/NASA datasets, focal-point cropping and media-review reporting;
- added Index search, URL deep links, velocity-sensitive lens dispersion and HD image retry;
- replaced per-record detail JSON files with content-hashed metadata shards, in-memory caching and concurrent fetch deduplication;
- expanded validation to detect missing, duplicate, orphaned or invalid details;
- added category-balanced discovery, richer metadata inference and keyboard/button detail navigation;
- added a development-only renderer diagnostic overlay and refined detail typography/navigation;
- regenerated and validated the retained 500-record demo catalog and its 110 KB atlas.

## 0.1.0

- initial React + Three.js proof of concept;
- 500-tile synthetic atlas;
- combined WebGL geometry and pointer lens;
- basic hover HUD and detail panel;
- initial NASA ingestion script.
