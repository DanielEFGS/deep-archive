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

- added two bilingual source-checked Trails, "Reading a Nebula" and "Earth or Another World?", plus a responsive Trail index;
- added compact related-object navigation below detail credits using category, mission, telescope and keyword affinity;

- added the first 12-step editorial Trail, “How Space Gets Its Colors,” with shareable step URLs;
- added fixed editorial observation areas, sequenced visual-guide signals and collapsible observation/context modes;
- added complete English and Spanish UI coverage plus localized Trail and editorial records; NASA source metadata remains unchanged;
- added an invitation in About for scientific collaborators to help improve the educational interpretation.

### Interaction and responsive behavior

- replaced the generic Trail introduction bars with three route-specific instrument diagrams for wavelength mapping, nebula structure and planetary evidence;
- restored Trail signal descriptions to the image-stage corner and returned Observation Mode to a full-bleed, intentionally cropped image without blurred gutters;
- decoupled Visual Guide controls from cover-cropped image coordinates so the guide card and status remain anchored inside the visible stage;
- removed blurred image backdrops from detail and Trail modals; imagery now fills the visual stage edge to edge with a clean cover crop across desktop and mobile;
- made Observation Mode preserve the complete image and its guided sectors, with synchronized touch pinch-to-zoom up to 3x and a short mobile gesture hint;
- softened the Trail intro signal pacing so its line drawings resolve more deliberately;
- replaced Observation Mode's soft side fill with a coarse pixel-grid treatment that keeps letterboxing intentional without competing with the guided image;
- added an Image Only toggle to Observation Mode: it hides all editorial overlays and switches to a full-stage cover crop, with one-action restoration of the complete guided view;
- added a fast dip-to-black transition between guided and Image Only framing so the cover/contain swap no longer flashes;
- extended Image Only mode to standard detail records, expanding media to the full viewport while temporarily removing metadata and archive navigation;
- corrected Image Only's mobile grid so the photograph occupies the full viewport instead of retaining an empty content row, and aligned its restore control directly below Close;
- aligned mixed-width Observation Mode actions to one shared right edge on desktop and mobile;
- condensed the Trail picker into shorter editorial rows with single-line summaries and inline duration metadata, and documented the next three proposed learning paths;
- added an immediate, accessible loading field while lazily loaded panels and menus resolve;
- changed mobile search into an in-place toolbar state that temporarily replaces branding and navigation without increasing the header height;
- corrected mobile overlay stacking so archive-sector pagination retreats behind the navigation drawer, tightened language grouping and removed duplicate Detail accordion dividers;
- made the mobile Trail menu and Trail introduction true top-aligned full-viewport surfaces with shorter preview copy;
- registered Visual Guide grids to the image's actual `object-fit: contain` rectangle across portrait, landscape and Focus Mode, while restoring full-height landscape controls and an explicit guide label;
- redesigned compact/touch navigation around a persistent DEEP mark, on-demand search, active-filter chip and accessible drawer for categories, destinations and language;
- added responsive NASA-description clamping (five desktop lines, four mobile), accessible expand/collapse controls and a subtle continuation fade;
- grouped secondary mobile Detail metadata into an accordion while keeping credit and original source visible, and changed related objects to a native horizontal rail;
- standardized mobile dialog close controls as accessible 44px SVG X buttons while retaining `ESC / CLOSE` on keyboard-oriented desktop layouts;
- hardened Trail Focus Mode with minimal UI, safe-area positioning, best-effort fullscreen/orientation lock and a non-blocking rotate-device fallback;
- made the detail-image resolving overlay begin on the modal's first frame and remain continuous while metadata and HD media load, removing the brief unmasked thumbnail flash;
- applied the same uninterrupted resolving state to Trail images so their atlas previews cannot flash before detail metadata arrives;
- added a shader-driven exposure while switching atlas sectors: the real 500 WebGL tiles now resolve in a restrained pseudo-random sequence that stays registered to the final mosaic at every viewport size;
- aligned the complete footer row—DG signature, GitHub/LinkedIn links and independence notice—on one vertical center and normalized line box;
- made the mobile sector controls retreat while a touch exploration gesture is active, then return smoothly on release; direct taps on the controls remain available;
- aligned the mobile Trail observation control rail with the close control and made guide collapse request fullscreen landscape orientation on supported portrait touch browsers;
- replaced the verbose mobile Trail close label with a compact, accessible SVG close control while retaining the keyboard-oriented label on desktop;
- refined the gallery into a tile-snapped Archive Aperture interaction with aspect-preserving focus, eased transitions and touch preview placement;
- added touch drag-to-focus and release-to-open behavior with pointer capture and duplicate-click suppression;
- rebuilt detail and Trail layouts for mobile portrait/landscape, persistent navigation, compact titles/numbers and accessible close controls;
- added animated HD-loading placeholder grids and consistent click ripple timing across lazy and already-loaded panels;
- improved Index coverage so all production records remain discoverable outside the canvas.

### Quality, safety and data

- reorganized the React composition root around catalog/detail hooks, shared fetch services, endpoint configuration, feature selectors and explicit lazy-panel boundaries;
- added Oxlint, Vitest and a combined `npm run check` quality gate, with initial coverage for archive filtering, sector-local mapping, related-object ranking and atlas selection;
- added a deterministic category-subject audit to production builds and corrected 64 strong catalog conflicts automatically;

- refined automated NASA categorization so terrestrial observation, mission operations and Solar System records discovered by broad astronomy queries no longer leak into Deep Space;
- ensured a newly mounted atlas sector receives the active category/search visibility mask immediately, preserving filters across sector changes;
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
