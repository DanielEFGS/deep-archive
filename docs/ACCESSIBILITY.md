# Accessibility

DEEP Archive is visual by design, but core inspection should not be mouse-only.

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

The semantic index exposes all 1,000 records in pages of forty. Visible thumbnails resolve through their containing atlas sector, keeping the alternate route useful without introducing per-record image requests.

The visual field exposes sector changes through a labelled vertical rail and live range status. Wheel users can move between sectors; keyboard users can use Page Up/Page Down; touch and switch users can activate 44px previous/next controls. Global Index, search and object URLs remain independent of the active visual sector.

Phase 4 adds labelled text search focusable with `/`, shareable object URLs, visible image/metadata retry controls and filter-aware Previous/Next navigation. Search changes GPU interactivity rather than creating dozens of image nodes. Touch uses tap selection and does not require hover metadata to open a record.

Touch exploration uses an explicit pointer lifecycle: press and drag moves the same tile-snapped lens used by pointer hover, and releasing opens the tile focused at that moment. Pointer capture keeps the gesture stable outside the original contact target, cancellation closes without selection, and the synthesized post-touch click is suppressed to prevent duplicate opens.

On coarse-pointer devices, an offset preview mirrors the focused atlas tile while the finger is down. It follows without React frame updates, flips horizontally or vertically near viewport edges, and stays clear of the mobile header and footer so the selected thumbnail remains visible before release.
