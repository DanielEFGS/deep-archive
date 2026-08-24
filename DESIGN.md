---
name: "DEEP / 1000"
description: "A contemporary observatory for image-led, source-backed astronomical exploration."
colors:
  field-black: "#06080d"
  signal-black: "#05070b"
  observatory-surface: "rgba(8,11,17,.97)"
  ink: "#f5f6f7"
  ink-secondary: "rgba(245,246,247,.72)"
  ink-muted: "rgba(245,246,247,.52)"
  instrument-line: "rgba(245,246,247,.17)"
  control-wash: "rgba(255,255,255,.04)"
typography:
  display:
    fontFamily: '"Helvetica Neue", "Nimbus Sans L", Arial, sans-serif'
    fontSize: "clamp(54px, 7vw, 94px)"
    fontWeight: 560
    lineHeight: 0.86
    letterSpacing: "-.04em"
  headline:
    fontFamily: '"Helvetica Neue", "Nimbus Sans L", Arial, sans-serif'
    fontSize: "clamp(34px, 3.2vw, 56px)"
    fontWeight: 560
    lineHeight: 0.95
    letterSpacing: "-.04em"
  body:
    fontFamily: '"Helvetica Neue", "Nimbus Sans L", Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  observation:
    fontFamily: '"Helvetica Neue", "Nimbus Sans L", Arial, sans-serif'
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: "normal"
  label:
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
    fontSize: "9px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: ".1em"
rounded:
  square: "0"
  instrument: "2px"
  orbital: "50%"
spacing:
  hairline: "1px"
  xs: "5px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  panel: "44px"
components:
  control-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "8px 12px"
    height: "42px"
  control-ghost-hover:
    backgroundColor: "{colors.control-wash}"
    textColor: "{colors.ink}"
  reveal-control:
    backgroundColor: "{colors.control-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "12px"
    height: "48px"
  panel:
    backgroundColor: "{colors.observatory-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "44px"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "2px 22px 3px 0"
    height: "28px"
---

# Design System: DEEP / 1000

## Overview

**Creative North Star: "The Contemporary Observatory"**

DEEP is an image-led exhibit with the composure of a working observation room. The astronomical field is the primary artifact from the first viewport; interface chrome remains thin, monochrome, and peripheral so visitors encounter a view before they encounter an explanation. The mood is precise, restrained, curious, and quietly technical—not cinematic spectacle and not institutional NASA mimicry.

The incumbent archive and the editorial Trail belong to the same world but have different jobs. The archive is a continuous instrument for scanning; the Trail is a bounded reading sequence that enlarges one image, asks the visitor what they notice, and only then reveals source-backed interpretation. Persistent floating navigation keeps place and agency visible without displacing the image.

**Key Characteristics:**

- Astronomical imagery supplies nearly all color; controls remain near-monochrome.
- Oversized neo-grotesque headings meet compact uppercase monospace instrumentation.
- Hairline rules, hard corners, dark translucent planes, and sparse glow establish observatory depth.
- Image and observation prompt precede explanation, metadata, and source links.
- Pointer, touch, keyboard, mobile, fallback, and reduced-motion paths preserve equivalent meaning.

## Colors

The palette is a low-chroma optical housing: black-blue fields, cool white ink, and translucent neutral states that allow source imagery to remain the only expressive color.

### Primary

- **Observation Ink:** The brightest neutral marks primary text, current position, active controls, focus, and the most important instrument readings.

### Neutral

- **Field Black:** The permanent page and canvas surround; it should visually disappear beside the astronomical atlas.
- **Signal Black:** A slightly denser black reserved for graphic observation diagrams and image-stage voids.
- **Observatory Surface:** The nearly opaque panel plane used for detail, index, information, and Trail reading surfaces.
- **Secondary Ink:** Readable supporting copy, button labels, metadata values, and persistent navigation.
- **Muted Ink:** Status, eyebrow, credit, and secondary instrument text that should remain available without competing with the image.
- **Instrument Line:** The shared hairline for panel boundaries, separators, progress tracks, and control outlines.
- **Control Wash:** A faint white wash used only to confirm hover, selection, or a reveal affordance.

### Named Rules

**The Borrowed Color Rule.** Product chrome does not introduce a brand accent; astronomical media owns chroma and the interface borrows only neutral light from it.

**The Legibility Ladder Rule.** Primary, secondary, and muted ink must retain their hierarchy; do not solve emphasis by adding arbitrary hues.

## Typography

**Display Font:** Helvetica Neue, with Nimbus Sans L and Arial fallbacks  
**Body Font:** Helvetica Neue, with Nimbus Sans L and Arial fallbacks  
**Label/Mono Font:** SFMono-Regular, with Consolas and Liberation Mono fallbacks

**Character:** A restrained neo-grotesque carries object names, editorial headlines, and explanatory prose. A compact monospaced voice carries controls, coordinates, counts, source status, and provenance; its uppercase tracking makes the UI read like an instrument rather than a marketing site.

### Hierarchy

- **Display:** Tightly set, oversized, and balanced; reserved for Trail introductions and major exhibit statements.
- **Headline:** Dense object and chapter titles with a short measure, near-solid line height, and negative tracking.
- **Body:** Calm explanatory prose with generous leading; keep most editorial measures near 48–65 characters.
- **Observation:** Larger than ordinary body copy so the prompt becomes the first readable thought beside the image.
- **Label:** Small uppercase monospace with wide tracking for controls, metadata, progress, credit, loading, and source state.

### Named Rules

**The Two Voices Rule.** Sans serif explains the object; monospace operates and verifies the instrument. Do not use the label voice for long prose.

**The Image-Title-Prompt Rule.** On editorial steps, visual prominence flows from image to title to observation prompt before contextual body copy.

## Layout

The archive is a full-viewport field with a pointer-transparent HUD layered over it. Top and bottom safe bands reserve space for controls and authorship so the WebGL tiles never sit under interactive chrome. The HUD uses a three-part desktop grid, while category filters remain horizontally scrollable and persistent.

Panels are bounded exhibits rather than routes. Desktop detail and Trail panels split into an image-dominant stage and a narrower reading column; the active Trail uses a 1.42fr / .72fr ratio and reserves a 44px progress rail. A fixed three-part navigation bar floats below the panel, keeping previous, link, and next/finish actions stable through the sequence.

At 820px and below, image and copy stack vertically without changing content order or removing navigation. At 700px the HUD becomes a real 132px top safe band and 58px bottom safe band. At 560px, copy and controls compress, credits may leave the image overlay, the Trail marker reduces to its orbital glyph, and touch targets become at least 44px; observation, source access, and sequence progress remain available.

**The Stable Instrument Rule.** Navigation and progress stay in predictable positions while the viewed record changes.

**The Same Artifact Rule.** Responsive changes reorganize the same image, copy, controls, and provenance; mobile is not a reduced editorial edition.

## Elevation & Depth

Depth is structural and sparse. The canvas is the deepest plane; modal backdrops dim and blur it, panels sit on near-opaque black-blue surfaces, and only major floating containers receive broad black shadows. Fine borders and tonal separation do more work than highlights. Image stages use blurred versions of their own media beneath the resolved image, so depth comes from the observed artifact rather than decorative glow.

### Shadow Vocabulary

- **Panel Lift** (`0 35px 120px rgba(0,0,0,.62)`): Major detail, index, information, and Trail surfaces above a blurred backdrop.
- **Floating Control Lift** (`0 16px 48px rgba(0,0,0,.48)`): Persistent detail and Trail navigation bars.
- **Guide Lift** (`0 16px 42px rgba(0,0,0,.38)`): The compact first-use field guide.

### Named Rules

**The Structural Shadow Rule.** Shadows distinguish planes and persistence; they never decorate ordinary text or controls.

## Shapes

The form language is rectilinear and instrument-like. Panels, buttons, fields, progress rails, and navigation bars use hard corners and one-pixel boundaries. A 2px radius appears only on the contextual field cursor; full circles are reserved for orbital or targeting signals such as the brand orb and Trail marker. Imagery is clipped into rectangular observation frames.

**The Orbital Exception Rule.** Curves identify celestial or targeting signals; they are not a general container style.

## Components

### Buttons

- **Shape:** Flat, hard-edged controls with either a hairline outline or underline; no filled brand button exists.
- **Primary:** The Trail start action is an underlined monospace command, while context reveal uses a full-width 48px outlined/wash control.
- **Hover / Focus:** Hover brightens ink and may add the faint Control Wash. Keyboard focus always receives a 2px near-white outline with a 3px offset.
- **Disabled:** Dimmed but still structurally present; loading uses wait semantics and end-of-range navigation remains visible at reduced opacity.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** Observatory Surface above a dark blurred backdrop; image stages use Field or Signal Black.
- **Shadow Strategy:** Major panels use Panel Lift; embedded reading regions remain flat.
- **Border:** One-pixel Instrument Line, reused for section divisions.
- **Internal Padding:** Responsive and editorial—approximately 20–44px in reading columns, with larger breathing room for introductions.

### Inputs / Fields

- **Style:** Transparent, uppercase monospace search fields with a single bottom rule and no rounded enclosure.
- **Focus:** The underline brightens; the global visible focus outline remains available.
- **Clear Action:** A compact textual control occupies the field edge without introducing an icon dependency.

### Navigation

The HUD and footer remain peripheral, transparent layers over the archive, using compact uppercase labels and restrained underlines. Active categories gain brighter ink, a hairline box, and a subtle wash. Trail and detail navigation float at the viewport bottom in a blurred dark bar with a stable previous / position-or-copy / next structure. On small screens labels may contract, but hit area, order, and function do not.

### Editorial Trail

The Trail is a modal exhibit sequence, not a metadata drawer. Its introduction pairs a spectral signal graphic with an editorial title and compact factual ledger. Each step leads with a full observation image, chapter number, title, and a bordered observation prompt. Explanation, color method, significance, editorial status, and source links remain behind an explicit “Reveal context” action so noticing precedes interpretation. A 12-segment progress rail and persistent floating controls make sequence state visible at all times.

Motion supports state change: a brief backdrop/panel entrance, image resolution, and explanation reveal. With reduced motion, durations collapse and the custom field cursor disappears; hierarchy, loading state, and navigation remain intact.

## Do's and Don'ts

### Do:

- **Do** let the astronomical image lead every archive and Trail composition.
- **Do** ask visitors what to notice before presenting explanatory conclusions.
- **Do** keep controls monochrome, compact, and instrument-like with visible keyboard focus.
- **Do** preserve credit, source, rights state, and editorial status at the point of interpretation.
- **Do** keep persistent navigation, 44px touch targets, and content parity on mobile and reduced-motion paths.
- **Do** use the sans/mono role split consistently: editorial meaning versus operational status.

### Don't:

- **Don't** introduce a colorful product accent that competes with source imagery.
- **Don't** turn Trails into encyclopedic metadata dumps or reveal explanation before observation.
- **Don't** use rounded cards, pill-heavy controls, glossy gradients, or ornamental glow as the general UI language.
- **Don't** imply NASA identity, affiliation, or scientific review through styling or copy.
- **Don't** hide progress, navigation, sources, or equivalent controls on smaller screens.
- **Don't** add motion that runs while idle or survives a reduced-motion preference.
