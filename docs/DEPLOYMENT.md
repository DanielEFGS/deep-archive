# Deployment

## Netlify

The repository includes `netlify.toml`:

- build command: `npm run check:catalog:nasa && npm run build`;
- publish directory: `dist`;
- immutable one-year cache for content-hashed atlas/detail/media assets;
- short cache + stale-while-revalidate for `catalog.json`;
- basic security/privacy headers.
- Node 22 and the NASA production dataset selected in the Netlify build environment;
- an SPA fallback so query-string detail links continue to resolve.

## Production identity and SEO

Copy `.env.example` to `.env.local` for local development, and configure the same values in **Netlify → Site configuration → Environment variables**:

```bash
VITE_GITHUB_URL=https://github.com/DanielEFGS
VITE_LINKEDIN_URL=https://www.linkedin.com/in/daniel-garcia-silva-695086213/
VITE_PORTFOLIO_URL=https://your-domain.com
```

The DG signature is always visible. Personal links appear only when their corresponding URL exists, preventing placeholder links from being published. Once the final Netlify custom domain is known, add an absolute canonical URL and replace relative Open Graph image paths with that production origin.

## Release sequence

```bash
npm install
npm run catalog:demo        # or catalog:nasa
npm run check:catalog
npm run build
npm run preview
```

Then deploy the generated repository through Netlify.

Before the first public deployment, complete [`RELEASE_V1_CHECKLIST.md`](RELEASE_V1_CHECKLIST.md). Product milestones after the technical prototype are defined in [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

For a NASA production dataset, run the catalog build locally/CI, review rights/credits, commit or publish the generated static assets, and deploy. The browser should not generate the NASA catalog itself.

## Cache correctness

Immutable caching is safe only because atlas/detail-shard filenames include a content hash. Rebuilt content receives a new URL. `catalog.json` is the small mutable pointer to the current asset versions.
