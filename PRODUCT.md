# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a visually curious learner aged roughly 16 or above who is attracted to space imagery but does not have specialist astronomy knowledge. Educators, students and visual-culture practitioners are secondary audiences.

## Product Purpose

DEEP is a free interactive visual archive that helps people learn how to observe and interpret astronomical imagery. Success means moving visitors from visual fascination toward source-backed understanding and meaningful connections between objects.

## Positioning

Unlike a conventional media search, DEEP presents a finite continuous field and turns selected images into guided observation: what to notice, how the view was produced, why it matters and what to explore next.

## Operating Context

Visitors explore a 500-record WebGL mosaic, focus one object, load its high-resolution media and metadata on demand, and may follow editorial Trails. The current edition is DEEP / 500; the scalable project and repository name is deep-archive.

## Capabilities and Constraints

- English is the initial editorial language; Spanish and Japanese are planned reviewed localization layers.
- The site remains statically deployable to Netlify, account-free and privacy-conscious.
- The initial gallery remains one atlas on one WebGL canvas; heavy media and editorial content load on demand.
- Source, credit and rights-review state are preserved per media asset.
- Content is labelled source-checked under DG editorial approval, not scientifically reviewed.
- The first validation slice contains 12 objects and one Trail, followed by a 30-object, three-Trail learning MVP.

## Brand Commitments

The permanent product name is DEEP and the current edition is DEEP / 500. Public authorship is DG, linked to GitHub and LinkedIn. The voice is precise, restrained, curious and accessible without becoming childish or falsely authoritative. The product must not imitate NASA branding or imply affiliation.

## Evidence on Hand

- A 500-record NASA-derived catalog with individual credits and sources under `public/datasets/nasa/`.
- Product strategy and review policy in `docs/PRODUCT_DEFINITION.md`.
- Architecture and performance constraints in `docs/ARCHITECTURE.md` and `docs/PERFORMANCE.md`.
- No qualified astronomy reviewer or comprehension research is currently available; neither may be fabricated.

## Product Principles

1. Begin with the image, then guide observation.
2. Prefer concise connected understanding over encyclopedic metadata.
3. Preserve trustworthy provenance and state uncertainty honestly.
4. Keep learning free, static, fast and account-free.
5. Use technical craft to support meaning rather than overshadow it.

## Accessibility & Inclusion

Mouse, touch and keyboard flows must remain equivalent. Visible focus, semantic dialogs, reduced motion, readable contrast and explicit loading/error states are required. Future translations are editorial products, not automatic substitutions for source metadata.
