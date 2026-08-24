# Architecture

## Principle

The visitor should experience 500 visual records without paying the cost of 500 DOM images or 500 initial image requests.

```text
Build time
NASA API / curated input
        ↓
cache + normalize + review
        ↓
┌───────────────────────────┐
│ atlas.<hash>.webp         │  500 thumbnails / one texture
│ catalog.json              │  lightweight index
│ details/details-*.json    │  ~10 shards, loaded on demand
│ media/*                   │  optional local detail images
└───────────────────────────┘
        ↓
Netlify CDN
        ↓
Runtime
React UI + one Three.js canvas
```

## React responsibilities

React owns application state and accessible UI:

- dataset/bootstrap state;
- hovered/selected item identity;
- category filter selection;
- detail and information panels;
- loading/error states;
- render-quality label.

React does **not** receive cursor coordinates every frame.

## WebGL responsibilities

`ArchiveRenderer` owns:

- one `WebGLRenderer`;
- one scene/camera;
- one combined, lightly subdivided `BufferGeometry` containing 500 atlas cells;
- one shader material;
- one atlas texture;
- pointer interpolation;
- filter visibility attribute;
- keyboard focus highlight;
- click ripple;
- DPR/quality policy;
- resource disposal.

The shader receives pointer position, viewport resolution, atlas size and motion state as uniforms. Each cell carries its atlas bounds so RGB sampling remains clamped inside the source image. A shared radial vertex transform deforms matching cell boundaries identically, making the mosaic behave like one continuous sheet without overlap. Three subdivisions per axis keep the lens curved while retaining one mesh and one draw call.

The display geometry reserves responsive top and bottom safe zones for the HUD. Tiles are never placed beneath interactive toolbar or footer controls, and pointer hit testing uses the same safe field bounds.

## Data layers

### `catalog.json`

Contains only fields required before an item is opened:

- id;
- NASA id when applicable;
- title/subtitle;
- category;
- date;
- `detailShard`.

### `/details/*.json`

Each content-hashed shard contains approximately 50 records keyed by ID, with heavier metadata:

- description;
- center/creator;
- credit;
- source URL;
- on-demand image URL;
- keywords;
- rights-review notes.

The runtime caches `Promise<DetailShard>` by URL. Concurrent requests for the same shard share one fetch; successful shards stay in memory, while failed promises are removed so retry remains possible. This replaces 500 tiny JSON files with roughly 10 better-compressing assets without adding them to initial loading. Each shard is content-hashed, so immutable browser/CDN caching is safe.

## Dataset boundary and deep links

Demo and NASA outputs live independently under `/datasets/demo` and `/datasets/nasa`. `VITE_DATASET` selects either without regenerating the other; development defaults to demo and production to NASA. Search uses compact index fields only. The `object` query parameter is synchronized through the History API without a routing dependency.

## Failure boundaries

- catalog failure → blocking data error state;
- WebGL initialization/texture failure → static atlas fallback;
- detail metadata failure → base item remains inspectable;
- full image failure → atlas tile remains visible as low-resolution fallback.
