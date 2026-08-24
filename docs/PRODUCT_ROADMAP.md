# Product roadmap — DEEP / 500

The product strategy, primary audience, validation slice and MVP boundary are defined in [`PRODUCT_DEFINITION.md`](PRODUCT_DEFINITION.md). This roadmap describes the intended release sequence.

## Product promise

DEEP / 500 should evolve from a visual experiment into a free tool for learning how to observe and understand astronomical imagery.

> Five hundred images, curated into paths that help people read the universe.

The project should not attempt to replace NASA's much larger media search products. Its value is a small, coherent and editorially guided field: what to notice, how an image was produced, why it matters and how it relates to other records.

## Initial audiences

1. People interested in astronomy, photography and visual culture.
2. Secondary and higher-education students.
3. Educators seeking attributable visual material.
4. Designers and frontend developers interested in interactive archives.

## Product principles

- Remain free, static and privacy-conscious.
- Preserve the one-atlas, one-canvas initial architecture.
- Load editorial content and HD media on demand.
- Preserve individual sources, credits and rights-review status.
- Make useful artifacts shareable without requiring accounts.
- Start with 30–50 editorially enriched records rather than weakly enriching all 500.
- Treat Spanish and English as reviewed editorial layers, not automatic replacements for source metadata.

## Success signals

- records opened per visit;
- trail completion rate;
- comparisons created;
- collections created or shared;
- visits landing on object/trail pages;
- return visits to the daily object;
- educational sheets downloaded.

Analytics must be aggregate and privacy-conscious. No metric justifies introducing user accounts in the first releases.

## Release 1 — Learn

### Editorial model

Add static, on-demand content separate from `catalog.json`:

```text
content/
├── objects/
├── trails/
├── glossaries/
└── related.json
```

Suggested record shape:

```ts
type EducationalContent = {
  slug: string;
  locale: 'en' | 'es';
  introduction?: string;
  observe?: string[];
  explanation?: string;
  colorMethod?: string;
  scaleContext?: string;
  relatedIds?: number[];
  difficulty?: 'introductory' | 'intermediate';
  reviewedBy?: string;
  reviewedAt?: string;
};
```

This content must not increase the initial gallery payload.

### DEEP Trails

Build guided paths of five to ten records. Initial candidates:

- Birth of a Star;
- Death of a Star;
- The Infrared Universe;
- Cosmic Collisions;
- How Space Gets Its Colors.

Start with three reviewed trails. Each step should provide one observation prompt, a concise explanation, preserved attribution, visible progress and a shareable URL such as `/trails/infrared-universe?step=3`.

Acceptance criteria:

- mouse, touch and keyboard operation;
- one HD image requested at a time;
- URL restores the current trail and step;
- closing returns focus to the corresponding gallery record;
- reduced motion and error states are handled.

### Static discovery pages

Generate HTML shells during the build for featured objects and trails. A post-build script should reuse the same React bundle while injecting unique titles, descriptions, canonical URLs, social metadata, credit/source information and JSON-LD.

Release 1 begins with pages for the editorially reviewed subset, not all 500.

## Release 2 — Compare

Allow two records to be compared using side-by-side, slider and controlled blink modes. Show telescope, mission, date, wavelength and image-type context when evidence exists.

Example URL:

```text
/compare?left=carina-nebula&right=cosmic-cliffs
```

Only explicitly selected media may load. Artistic illustrations and processed composites must be labelled accurately.

## Release 3 — Create

### My Constellation

Visitors may collect and reorder up to twelve records, name the collection and share it through a compact URL. Use numeric IDs and `localStorage`; do not add accounts or a database.

```text
/collection?ids=12,44,91,191&title=Cosmic+Eyes
```

Generate a downloadable social card only after explicit action, using canvas and preserved project/source attribution.

### Object of the Day

Choose one reviewed record deterministically from the UTC date. This requires no API or scheduled job and gives the project a recurring, shareable entry point.

## Release 4 — Teach

### Progressive ES/EN support

Translate the interface, trails, glossary and reviewed subset first. Locale must be encoded in the URL and static pages should expose `hreflang` alternates.

### Education mode

- observe before revealing the title;
- introductory/intermediate prompts;
- contextual glossary;
- printable A4/Letter sheet;
- source, credit and QR link included in every sheet;
- shareable lesson sequence without authentication.

## Explicit non-goals for early releases

- comments, likes or public rankings;
- user accounts or profiles;
- an internal social feed;
- unreviewed AI-generated scientific explanations;
- claims that DEEP / 500 is a citizen-science project;
- runtime dependence on external NASA APIs.

## Recommended implementation order

1. Freeze the product promise and editorial tone.
2. Select 30 featured records and clear their rights review.
3. Add the editorial schema and validator.
4. Write and review the first trail.
5. Build `TrailPanel` and shareable state.
6. Generate static pages for that trail and its records.
7. Measure completion, performance and comprehension.
8. Expand to three trails before starting Compare.

This sequence validates the educational proposition before investing in broader translation, collections or user-facing creation tools.
