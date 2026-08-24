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
- [ ] Git repository initialized and remote created.
- [ ] Production domain selected.
- [ ] Canonical and absolute social URLs configured.
- [ ] Production social preview converted to PNG/JPG and tested.

## Blocking editorial and legal work

- [ ] Review all 15 records listed in `reports/media-review.json`.
- [ ] Exclude any record whose third-party rights cannot be confirmed.
- [ ] Verify that each published record retains its original source and supplied credit.
- [ ] Confirm the independent, educational and non-commercial disclaimer.
- [ ] Verify that no NASA logo or wording implies affiliation or endorsement.

Rights review is a publication gate. Passing `check:catalog:nasa` with warnings does not clear those assets.

## Identity and links

- [ ] Set `VITE_GITHUB_URL`.
- [ ] Set `VITE_LINKEDIN_URL`.
- [ ] Set `VITE_PORTFOLIO_URL`.
- [ ] Confirm the final DG signature text.
- [ ] Confirm contact method, if one should be public.

Use `.env.example` locally and configure production values in Netlify environment variables. Never commit `.env.local`.

## SEO and sharing

- [ ] Register the final custom domain or accept the permanent Netlify domain.
- [ ] Add an absolute canonical URL.
- [ ] Add absolute `og:url`, `og:image` and Twitter image URLs.
- [ ] Produce a 1200×630 PNG/JPG social image.
- [ ] Generate `sitemap.xml` after the final domain is known.
- [ ] Test previews with LinkedIn Post Inspector and other intended networks.
- [ ] Add a useful static 404 page.

The initial SPA can launch with site-level SEO. Object-level search visibility belongs to the static-page milestone in the product roadmap.

## Netlify preparation

1. Push the repository to GitHub.
2. Import the repository in Netlify.
3. Confirm build command: `npm run check:catalog:nasa && npm run build`.
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
npm run build
npm run preview
```

## Go/no-go rule

The first public version is ready only when:

1. the 15-item rights queue has been resolved;
2. production URLs and identity links are real;
3. desktop/mobile, keyboard and reduced-motion checks pass;
4. the Netlify deploy preview has no console or missing-resource errors;
5. sources, credits and disclaimer remain visible.
