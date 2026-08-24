# Accessibility

DEEP / 500 is visual by design, but core inspection should not be mouse-only.

Implemented:

- canvas is keyboard focusable;
- arrow keys navigate nearby visible records;
- Home/End jump to the first/last visible record;
- Enter/Space opens the selected record;
- Escape closes overlays/clears keyboard focus;
- dialogs expose `role="dialog"`, `aria-modal` and labelled headings;
- focus moves into overlays, remains contained while they are open and returns when they close;
- filter buttons expose `aria-pressed`;
- hover metadata uses an `aria-live` region;
- `prefers-reduced-motion` suppresses shader motion/ripple behavior;
- WebGL failure provides a static visual fallback.
- a text-first archive index exposes searchable records without depending on canvas interaction;
- first-use guidance adapts its instructions for pointer and touch input;

The semantic index exposes all 500 records in pages of forty. Its visible thumbnails reuse the same atlas URL, keeping the alternate route useful without introducing per-record image requests.

Phase 4 adds labelled text search focusable with `/`, shareable object URLs, visible image/metadata retry controls and filter-aware Previous/Next navigation. Search changes GPU interactivity rather than creating dozens of image nodes. Touch uses tap selection and does not require hover metadata to open a record.
