# Performance strategy

## Primary budgets

Targets for the production catalog should be treated as guardrails rather than marketing numbers:

| Resource                         | Preferred target |
| -------------------------------- | ---------------: |
| Initial atlas sector             |        ≤ 750 KB |
| Initial catalog index            |     ≤ 150 KB raw |
| Initial thumbnail requests       |                1 |
| WebGL draw calls for mosaic      |               ~1 |
| Full-resolution media at startup |                0 |
| Continuous idle animation loop   |                0 |

Compression at the CDN should reduce JSON/JS transfer sizes further.

## Network

### Texture atlas

Thumbnails are packed offline into content-hashed WebP sectors of at most 500 records. Only the active sector is requested and uploaded to the GPU. Other sectors load on navigation; previously visited files may remain in the browser's ordinary HTTP cache but are not retained by Three.js.

### Two-level metadata

The initial index intentionally excludes long descriptions and credits. Metadata is grouped into twenty shards of 50 records. Only the selected record's shard is fetched, concurrent requests are deduplicated, and the shard is cached in memory for subsequent opens. No shard is preloaded.

### Detail media

Large media is not prefetched. One image request begins only after explicit selection. This avoids wasting bandwidth on assets that may never be viewed.

## Main thread

Pointer events write coordinates into mutable renderer state. They do not call React `setState` for motion.

The renderer uses `requestAnimationFrame` only while pointer interpolation or a short ripple remains active. When motion settles, frame scheduling stops.

## GPU

- antialiasing disabled for the dense mosaic;
- DPR capped instead of blindly using Retina DPR;
- constrained devices begin at DPR 1;
- slow-frame sampling may lower DPR once per session;
- filters mutate the active sector's visibility attribute instead of creating/removing DOM nodes;
- one texture and one shader material are active in the GPU scene; renderer disposal releases them before another sector takes over.

## Responsive behavior

Atlas sectors never change by breakpoint. Only display geometry changes:

- desktop: 25 columns for each 500-record sector;
- tablet: 20 columns for each sector;
- mobile: 16 columns.

This prevents duplicate responsive media downloads.

## Recommended profiling before release

Test the real NASA dataset rather than the synthetic atlas:

1. Chrome Performance panel while rapidly moving the pointer.
2. Performance monitor for FPS/GPU memory.
3. Lighthouse mobile with cache disabled.
4. Network throttling (Fast/Slow 4G).
5. 4× CPU throttling.
6. Safari/iOS hardware when available.
7. WebGL context-loss simulation.

Any optimization should be justified by measured bottlenecks after these checks.

## Real NASA catalog measurements

| Metric            |                        Pilot result |       Budget |
| ----------------- | ----------------------------------: | -----------: |
| Initial requests  |                                  ~5 |          <10 |
| Active sector 1   |       590,446 bytes; 3200×1920 WebP |       <750 KB |
| Sector 2 on demand|       634,244 bytes; 3200×1920 WebP | navigation only |
| Catalog           | 365,437 raw / 56,090 bytes gzip | <150 KB gzip |
| Detail shards     |       20 × approximately 50 records |    on demand |
| Mosaic draw calls |                          1 expected |           ≤2 |
| Mosaic triangles  | 9,000 for 500 subdivided records |            — |
| Initial HD media  |                                   0 |            0 |

FPS and Lighthouse scores were not fabricated: browser automation was unavailable here. Pointer velocity is smoothed and clamped. Rendering wakes for interaction, velocity decay, ripple, resize, filtering, focus, quality changes and atlas load, then sleeps.

## Development diagnostics

In the Vite development server, press `D` to toggle a dependency-free renderer readout. It reports FPS/frame time while rendering, bounded DPR, drawing-buffer resolution, quality profile, atlas weight/dimensions, draw calls, triangles and active/sleeping state. Sampling is disabled while the panel is closed.

## Lighthouse baseline — 2026-08-24

The deployed Netlify production build was measured once with Lighthouse 13.4.1 in headless Chrome. Reports are stored in `reports/lighthouse-mobile.report.html` and `reports/lighthouse-desktop.report.html`. Scores are a lab baseline and should be compared using repeated runs on equivalent hardware rather than treated as field data.

| Profile | Performance | Accessibility | Best practices | SEO |   FCP |   LCP | Speed Index |    TBT |   CLS |
| ------- | ----------: | ------------: | -------------: | --: | ----: | ----: | ----------: | -----: | ----: |
| Mobile  |          71 |           100 |            100 | 100 | 2.0 s | 2.0 s |       5.6 s | 960 ms |     0 |
| Desktop |          95 |           100 |            100 | 100 | 0.4 s | 0.4 s |       1.2 s | 170 ms | 0.001 |

The main mobile constraint is JavaScript startup: the single application bundle spent approximately 1.31 s in script evaluation under Lighthouse throttling and contained an estimated 84 KiB of unused transferred JavaScript. The initial transfer remained bounded to six requests and approximately 1.6 MiB, of which the 1.37 MiB atlas is dominant. The next performance iteration should code-split optional dialogs/editorial UI and delay nonessential initialization, then compare the median of at least three mobile runs.

### Local optimized build comparison

After splitting the WebGL renderer and the four optional panels from the initial application chunk, a local production build was measured with the same Lighthouse version and profiles. This local run removes Netlify response latency from the comparison, so it demonstrates client-side improvement but does not replace a future production measurement.

| Profile           | Performance |   FCP |   LCP | Speed Index |    TBT |   CLS |
| ----------------- | ----------: | ----: | ----: | ----------: | -----: | ----: |
| Mobile optimized  |          89 | 1.2 s | 1.7 s |       2.0 s | 420 ms |     0 |
| Desktop optimized |          99 | 0.3 s | 0.4 s |       0.7 s |  90 ms | 0.001 |

The initial JavaScript chunk fell from 744 KiB to 209 KiB raw (201 KiB to 66 KiB gzip). Three.js and `ArchiveRenderer` now form a separate 535 KiB raw chunk loaded only when the catalog is ready, while Detail, Index, About and Trail each load on first use. The field-guide button's visible label and accessible name were also aligned.
