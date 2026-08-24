# Changelog

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

## 0.1.0

- initial React + Three.js proof of concept;
- 500-tile synthetic atlas;
- combined WebGL geometry and pointer lens;
- basic hover HUD and detail panel;
- initial NASA ingestion script.
# Phase 3 — working build

- Scaled the curated NASA dataset from 50 to 500 records while retaining one atlas and ten on-demand metadata shards.
- Detail panels now resolve NASA medium/large/original assets instead of displaying low-resolution API previews.
- Phase 4 NASA pilot: 49 curated real records, isolated demo/NASA datasets, focal-point cropping and media-review reporting.
- Added index search, URL deep links, velocity-sensitive lens dispersion and HD image retry.
- Replaced 500 per-record detail JSON files with 10 content-hashed metadata shards, reducing filesystem and deployment overhead while preserving on-demand loading.
- Added promise-based in-memory shard caching, concurrent fetch deduplication, graceful fallback and explicit retry.
- Expanded catalog validation to detect missing, duplicate and orphaned details and empty or invalid shards.
- Balanced NASA discovery with per-topic quotas, visual-noise rejection and richer scientific metadata inference.
- Added keyboard and button navigation between detail records while preserving on-demand full media loading.
- Added a development-only renderer diagnostic overlay toggled with `D`.
- Refined typography, metadata legibility and detail navigation styling.
- Regenerated and validated the 500-record demo catalog and 110 KB atlas.
