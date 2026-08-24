# Performance strategy

## Primary budgets

Targets for the production catalog should be treated as guardrails rather than marketing numbers:

| Resource | Preferred target |
| --- | ---: |
| Initial atlas | ≤ 1.5 MB |
| Initial catalog index | ≤ 150 KB raw |
| Initial thumbnail requests | 1 |
| WebGL draw calls for mosaic | ~1 |
| Full-resolution media at startup | 0 |
| Continuous idle animation loop | 0 |

Compression at the CDN should reduce JSON/JS transfer sizes further.

## Network

### Texture atlas

500 small thumbnails are packed offline into one content-hashed WebP. This reduces request overhead and prevents hundreds of independent image decode/fetch operations during bootstrap.

### Two-level metadata

The initial index intentionally excludes long descriptions and credits. Metadata is grouped into roughly ten shards of 50 records. Only the selected record's shard is fetched, concurrent requests are deduplicated, and the shard is cached in memory for subsequent opens. No shard is preloaded.

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
- filters mutate a 3,000-float visibility attribute (6 vertices × 500 tiles) instead of creating/removing DOM nodes;
- one texture and one shader material are reused by the full mosaic.

## Responsive behavior

The atlas never changes by breakpoint. Only display geometry changes:

- desktop: 25 columns;
- tablet: 20 columns;
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

| Metric | Pilot result | Budget |
| --- | ---: | ---: |
| Initial requests | ~5 | <10 |
| Atlas | 1,429,678 bytes; 4800×2880 WebP | <1.5 MB |
| Catalog | 192,707 raw / 31,530 gzip | <150 KB gzip |
| Detail shards | 10; 74,587-byte average; 143,811-byte largest | on demand |
| Mosaic draw calls | 1 expected | ≤2 |
| Mosaic triangles | 9,000 for 500 subdivided records | — |
| Initial HD media | 0 | 0 |

FPS and Lighthouse scores were not fabricated: browser automation was unavailable here. Pointer velocity is smoothed and clamped. Rendering wakes for interaction, velocity decay, ripple, resize, filtering, focus, quality changes and atlas load, then sleeps.

## Development diagnostics

In the Vite development server, press `D` to toggle a dependency-free renderer readout. It reports FPS/frame time while rendering, bounded DPR, drawing-buffer resolution, quality profile, atlas weight/dimensions, draw calls, triangles and active/sleeping state. Sampling is disabled while the panel is closed.
