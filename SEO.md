# SEO and discovery

DEEP uses a hybrid static strategy: the interactive archive remains a React/WebGL client application, while the build emits crawlable HTML for the home page, source-checked editorial objects and source-checked Trails. Draft editorial content is intentionally excluded.

## Implemented

- Descriptive title, meta description, self-canonical URL, Open Graph and Twitter Card metadata.
- Verifiable `WebSite`, `SoftwareApplication`, `Person`, `CollectionPage`, `LearningResource`, `ImageObject` and breadcrumb JSON-LD where appropriate.
- Meaningful initial HTML for `/`, plus generated English and Spanish editorial pages with one H1, semantic landmarks, source links and links back into the application.
- Build-generated `sitemap.xml`; do not edit the copy in `dist` manually.
- Public `robots.txt` allowing general crawlers, `OAI-SearchBot` and `ChatGPT-User`. No separate GPTBot restriction is currently applied; this favors broad discovery. Change that policy explicitly if model-training crawl should be excluded later.
- `llms.txt` as a concise discovery aid. It does not replace the HTML, sitemap or robots directives.
- A real static 404 response on Cloudflare Workers Static Assets.
- Immutable caching for hashed bundles, atlas sectors and detail shards.

## Google Search Console

1. Add and verify the URL-prefix property `https://deep.daniel-gs.dev/` (or verify the parent domain property if already available).
2. Submit `https://deep.daniel-gs.dev/sitemap.xml` under **Sitemaps**.
3. Use **URL inspection** for the home page, `/objects/`, `/trails/` and one representative object page, then request indexing.
4. Inspect both English and Spanish URLs and confirm Google-selected canonical matches the declared self-canonical.

## Bing Webmaster Tools

1. Add `https://deep.daniel-gs.dev/` or import the verified property from Search Console.
2. Submit `https://deep.daniel-gs.dev/sitemap.xml`.
3. Inspect the home page and representative `/objects/`, `/trails/` and `/es/` URLs.

## IndexNow decision

IndexNow was not added. The site has no publication backend, and introducing a public verification key plus an authenticated post-deploy submission only for this purpose would add deployment state. Bing can discover the current 47 canonical pages through the sitemap. If editorial publishing becomes frequent, add an IndexNow key file at the site root and a CI-only post-deploy request generated from the sitemap; do not place a private credential in React code.

## Recommended validation

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- Lighthouse with mobile throttling and `prefers-reduced-motion`
- Google Search Console and Bing URL inspection

## Maintenance

Run `npm run build` after changing approved editorial content. The build regenerates the editorial delivery, static SEO pages and sitemap. Keep titles, credits and primary source URLs in the content/catalog data; do not hand-edit generated HTML in `dist`.

