# Release v1 checklist

## Current technical state

- [x] React/TypeScript production build passes.
- [x] One WebGL gallery mesh and one initial atlas request.
- [x] NASA catalog contains 500 records and ten detail shards.
- [x] HD media and detail metadata load on demand.
- [x] Keyboard, touch, dialog focus and reduced-motion behavior exist.
- [x] Netlify configuration selects Node 22 and the NASA dataset.
- [x] SPA fallback and immutable asset caching are configured.
- [x] Base SEO, robots, favicon, social metadata and JSON-LD exist.
- [x] Git repository initialized and private remote created: `DanielEFGS/deep-archive`.
- [x] Current Netlify production URL accepted provisionally: `deeparchive-dg.netlify.app`.
- [x] Canonical and absolute social URLs configured.
- [x] Production social preview converted to a 1200×630 PNG.

## Blocking editorial and legal work

- [x] Resolve all 15 records originally listed in `reports/media-review.json`.
- [x] Exclude records whose third-party rights or editorial relevance cannot be confirmed.
- [x] Automate source, credit, HTTPS media and rights-state checks across all 500 records.
- [x] Confirm the independent, educational and non-commercial disclaimer.
- [x] Verify that no NASA logo or wording implies affiliation or endorsement.

Rights review remains a publication gate. `npm run audit:media` now enforces the resolved state on every production build; it is a risk control rather than legal clearance.

## Identity and links

- [x] Configure GitHub and LinkedIn links with production fallbacks.
- [x] Confirm the DG signature text.
- [x] Use GitHub and LinkedIn as the public contact methods; portfolio/email are not required for v1.

Use `.env.example` locally and configure production values in Netlify environment variables. Never commit `.env.local`.

## SEO and sharing

- [x] Accept the current Netlify domain for v1; a custom domain may be added later.
- [x] Add an absolute canonical URL.
- [x] Add absolute `og:url`, `og:image` and Twitter image URLs.
- [x] Produce a 1200×630 PNG social image.
- [x] Generate `sitemap.xml` for the current production URL.
- [ ] Test previews with LinkedIn Post Inspector and other intended networks.
- [ ] Add a useful static 404 page.

The initial SPA can launch with site-level SEO. Object-level search visibility belongs to the static-page milestone in the product roadmap.

## Netlify preparation

1. Push the repository to GitHub.
2. Import the repository in Netlify.
3. Confirm build command: `npm run check:catalog:nasa && npm run audit:media && npm run build`.
4. Confirm publish directory: `dist`.
5. Add personal-link environment variables.
6. Deploy a preview.
7. Inspect network, console, deep links and headers.
8. Attach the final domain only after preview approval.

Required production files must be committed, including `public/datasets/nasa`. Build-time NASA discovery should not be required on every Netlify deploy.

## Release QA matrix

### Functional

- [ ] Category and text filtering return accurate counts.
- [ ] All 500 records are reachable through canvas, keyboard and Index pages.
- [ ] Direct `?object=<slug>` links open and close correctly.
- [ ] Previous/Next follows the current filter.
- [ ] Metadata and HD retry controls work.
- [ ] WebGL failure exposes a meaningful fallback.

### Devices

- [ ] Chrome desktop.
- [ ] Firefox desktop.
- [ ] Safari desktop.
- [ ] iPhone Safari.
- [ ] Android Chrome on a mid-range device.
- [ ] 1366×768 laptop layout.
- [ ] High-DPR/4K display with bounded renderer DPR.

### Accessibility

- [ ] Complete keyboard-only pass.
- [ ] Escape and focus restoration for every overlay.
- [ ] Screen-reader check of Index and dialogs.
- [ ] 200% browser zoom.
- [ ] `prefers-reduced-motion` pass.
- [ ] Touch targets and visible focus states.

### Performance

- [ ] No per-tile image requests on initial load.
- [ ] No HD media request before explicit selection.
- [ ] Renderer sleeps when interaction settles.
- [ ] No WebGL shader/resource errors in console.
- [ ] Lighthouse mobile run recorded without fabricating unavailable results.
- [ ] Slow 4G and 4× CPU pass.

## Release commands

```bash
npm install
npm run check:catalog:nasa
npm run audit:media
npm run build
npm run preview
```

## Go/no-go rule

The first public version is ready only when:

1. the automated 500-record media audit passes with no publication blockers;
2. production URLs and identity links are real;
3. desktop/mobile, keyboard and reduced-motion checks pass;
4. the Netlify deploy preview has no console or missing-resource errors;
5. sources, credits and disclaimer remain visible.
