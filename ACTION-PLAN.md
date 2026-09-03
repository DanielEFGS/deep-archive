# SEO action plan

## Completed in code

- [x] Add meaningful initial HTML and descriptive metadata.
- [x] Generate clean bilingual URLs for approved objects and Trails.
- [x] Generate and publish a 47-URL sitemap during build.
- [x] Add self-canonicals, hreflang pairs, semantic headings and internal links.
- [x] Add verifiable JSON-LD for the application and editorial resources.
- [x] Allow OAI-SearchBot and publish llms.txt.
- [x] Replace soft 404 behavior with a real 404 page.
- [x] Fix immutable cache rules for hashed assets and atlases.
- [x] Deploy and validate on Cloudflare.

## Owner actions (next)

1. Enable Cloudflare **Always Use HTTPS** or create a 301/308 Redirect Rule from HTTP to HTTPS.
2. Verify the property in Google Search Console and submit `/sitemap.xml`.
3. Register/import the property in Bing Webmaster Tools and submit `/sitemap.xml`.
4. Request indexing for `/`, `/objects/`, `/trails/`, one English object and its Spanish counterpart.

## Measure before changing

1. Record CrUX/Lighthouse mobile results and a custom `gallery-ready` mark.
2. If the cold load remains slow, begin the renderer import in parallel with catalog loading and evaluate preloading only the first atlas.
3. Review title/description performance after enough Search Console impressions exist; do not rewrite them from zero-data assumptions.

## Later, only if publishing frequency grows

- Add IndexNow in CI with a root verification key and post-deploy sitemap submission.
- Publish additional object/Trail pages only when their editorial status becomes `source-checked` or `reviewed`.
- Add a corrections/contact route if the project begins accepting regular scientific review.
