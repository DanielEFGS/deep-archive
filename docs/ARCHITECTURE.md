# Architecture

## Principle

The visitor should experience 1,000 visual records without paying the cost of 1,000 DOM images or 1,000 initial image requests.

```text
Build time
NASA API / curated input
        ↓
cache + normalize + review
        ↓
┌───────────────────────────┐
│ atlas-01.<hash>.webp      │  records 1–500
│ atlas-02.<hash>.webp      │  records 501–1,000
│ catalog.json              │  lightweight index
│ details/details-*.json    │  ~20 shards, loaded on demand
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
- one combined, lightly subdivided `BufferGeometry` containing the active sector's ≤500 atlas cells;
- one shader material;
- one active atlas texture; visited sectors may remain in the browser's ordinary HTTP cache;
- pointer interpolation;
- filter visibility attribute;
- keyboard focus highlight;
- click ripple;
- DPR/quality policy;
- resource disposal.

The shader receives pointer position, viewport resolution, active atlas size and motion state as uniforms. Each cell carries its atlas bounds so RGB sampling remains clamped inside the source image. A shared radial vertex transform deforms matching cell boundaries identically, making the mosaic behave like one continuous sheet without overlap. Three subdivisions per axis keep the aperture curved while retaining one mesh and one draw call.

## Atlas sector virtualization

Production catalogs expose an ordered `atlases` array. Each sector declares `startIndex`, `itemCount`, texture dimensions and its content-hashed URL. React keeps the lightweight 1,000-record index available for global search, filters, deep links and detail navigation, but mounts only the active sector in WebGL.

Wheel movement, Page Up/Page Down and the accessible sector rail load sectors on demand. Changing sector remounts `ArchiveRenderer`; its disposal path releases geometry, material, texture and renderer resources, so GPU memory does not grow with archive length. The active sector is reflected in `?sector=` for reload/back-link continuity.

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

The runtime caches `Promise<DetailShard>` by URL. Concurrent requests for the same shard share one fetch; successful shards stay in memory, while failed promises are removed so retry remains possible. This replaces 1,000 tiny JSON files with roughly 20 better-compressing assets without adding them to initial loading. Each shard is content-hashed, so immutable browser/CDN caching is safe.

## Dataset boundary and deep links

Demo and NASA outputs live independently under `/datasets/demo` and `/datasets/nasa`. `VITE_DATASET` selects either without regenerating the other; development defaults to demo and production to NASA. Search uses compact index fields only. The `object` query parameter is synchronized through the History API without a routing dependency.

## Localization boundary

Interface language is selected at runtime from `?lang=`, a local preference, or the browser language, in that order. UI copy is compiled as a small typed dictionary; no runtime translation service or dependency is required. Editorial Trails live in parallel locale trees under `content/`. Source catalog titles, descriptions, credits and identifiers remain faithful to NASA's upstream records. Japanese can be added as another reviewed locale without changing the gallery architecture.

## Failure boundaries

- catalog failure → blocking data error state;
- WebGL initialization/texture failure → static atlas fallback;
- detail metadata failure → base item remains inspectable;
- full image failure → atlas tile remains visible as low-resolution fallback.
