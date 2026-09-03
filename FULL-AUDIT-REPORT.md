# DEEP full SEO audit

Audit date: 2026-09-03  
Production URL: <https://deep.daniel-gs.dev/>  
Scope: technical SEO, content, schema, sitemap, performance risk, mobile/visual behavior, image discovery, GEO and AI crawler access.

## Executive summary

The pre-change site was a single React/Vite document whose raw body contained only an empty React mount point. Metadata and security headers existed, but the 1,000-record WebGL collection, editorial context and Trails had no crawlable document graph. Every unknown path returned the same page with HTTP 200, and production cache rules did not match hashed bundles or atlas assets.

The implementation now combines the existing CSR/WebGL experience with build-time static HTML. Production exposes 47 canonical URLs: the application home, four bilingual collection indexes, 36 approved object guides and six approved Trail guides. Draft editorial content remains private to the source tree and is not emitted as an indexable page. Unknown routes return 404.

## Scorecard

| Area | Before | After | Evidence |
|---|---:|---:|---|
| Crawlability | 85 | 98 | robots and sitemap return 200; 47 URLs return 200; unknown paths return 404 |
| Indexability | 40 | 94 | self-canonical static pages, one H1 and substantive HTML |
| Structured data | 68 | 90 | valid JSON-LD graphs with verifiable properties only |
| JavaScript resilience | 30 | 92 | core descriptions and editorial guides exist without JavaScript |
| URL quality | 50 | 92 | clean trailing-slash routes and query states excluded from sitemap |
| Content / E-E-A-T | 60 | 78 | explicit author, source, credit, review status and limitation language |
| AI citation readiness | 24 | 76 | answer-first home copy, standalone guides, sources and llms.txt |
| GEO | 33 | 79 | OAI search access, structured passages and bilingual static pages |
| Performance readiness | 65 | 75 | immutable asset caching fixed; WebGL load chain remains measurable risk |

The after-scores are implementation assessments, not ranking guarantees. No Search Console, Bing Webmaster, CrUX or analytics account data was available.

## High-priority findings resolved

1. **Empty initial HTML:** replaced with a meaningful semantic home document while React continues to mount normally.
2. **No crawlable editorial URLs:** added SSG output for approved bilingual objects and Trails, plus collection indexes and internal links.
3. **Soft 404s:** changed Cloudflare static asset handling from SPA fallback to `404-page` and added a noindex 404 document.
4. **One-entry sitemap:** build now emits all 47 canonical public pages and omits query parameters, drafts, APIs and 404s.
5. **Generic metadata/entity ambiguity:** title, descriptions, social metadata and author entity now identify DEEP Archive and Daniel García Silva.
6. **Cache mismatch:** replaced unsupported multi-wildcard patterns and added immutable caching for Vite assets and hashed media data.
7. **AI discovery:** explicitly allows OAI-SearchBot and ChatGPT-User and publishes a substantive llms.txt.

## Remaining evidence-based risks

- The initial interactive view still has a roughly 926 KB critical transfer path in a cold visit, dominated by the first atlas and Three.js renderer. The canvas is deliberately lazy and atlas-based; further work should measure `gallery-ready` rather than optimize against an unmeasured Lighthouse score.
- HTTP currently responds without a redirect at the Cloudflare edge. HSTS upgrades returning browsers, but the zone still needs an external **Always Use HTTPS** or Redirect Rule for first visits and bots.
- Search demand, impressions and selected canonicals cannot be verified until Search Console/Bing properties are connected.
- PageSpeed Insights returned `429 RESOURCE_EXHAUSTED`; no CrUX percentile data was available, so no LCP/INP/CLS pass claim is made.
- Static object pages use source-hosted full images. They preserve supplied credits, but search-image eligibility and third-party rights still depend on the upstream record.

## Validation evidence

- `npm run lint`: passed with zero warnings.
- `npm run test`: 2 files and 8 tests passed.
- `npm run build`: passed; generated 36 object pages, six Trail pages and a 47-URL sitemap.
- Catalog validation: 1,000 records, 20 detail shards and two atlas sectors passed.
- Media audit: 1,000 records, zero publication blockers.
- Production: home 200, representative object 200, unknown route 404, OAI-SearchBot representative page 200.
- Production cache: Vite JS and atlas assets return `Cache-Control: public, max-age=31536000, immutable`.
- JSON-LD parses successfully in deterministic audit tooling.

