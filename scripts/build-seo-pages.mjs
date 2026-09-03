import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const baseUrl = "https://deep.daniel-gs.dev";
const portfolioUrl = "https://daniel-gs.dev/";

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const jsonForHtml = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function jsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? jsonFiles(target) : entry.name.endsWith(".json") ? [target] : [];
  }));
  return nested.flat();
}

const catalog = await readJson(path.join(root, "public", "datasets", "nasa", "catalog.json"));
const catalogByNasaId = new Map(catalog.items.map((item) => [item.nasaId, item]));
const detailsById = new Map();
for (const file of await jsonFiles(path.join(root, "public", "datasets", "nasa", "details"))) {
  const shard = await readJson(file);
  for (const detail of Object.values(shard)) detailsById.set(detail.id, detail);
}

const objects = (await Promise.all((await jsonFiles(path.join(root, "content", "objects"))).map(readJson)))
  .filter((entry) => entry.status === "source-checked" || entry.status === "reviewed");
const trails = (await Promise.all((await jsonFiles(path.join(root, "content", "trails"))).map(readJson)))
  .filter((entry) => entry.status === "source-checked" || entry.status === "reviewed");

const routeForObject = (entry) => entry.locale === "es" ? `/es/objetos/${entry.slug}/` : `/objects/${entry.slug}/`;
const routeForTrail = (entry) => entry.locale === "es" ? `/es/recorridos/${entry.slug}/` : `/trails/${entry.slug}/`;
const objectIndexRoute = (locale) => locale === "es" ? "/es/objetos/" : "/objects/";
const trailIndexRoute = (locale) => locale === "es" ? "/es/recorridos/" : "/trails/";

function layout({ locale, title, description, canonicalPath, alternatePath, schema, body }) {
  const es = locale === "es";
  const canonical = `${baseUrl}${canonicalPath}`;
  const alternate = `${baseUrl}${alternatePath}`;
  const fullTitle = `${title} — DEEP Archive`;
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Daniel García Silva">
  <meta name="theme-color" content="#06080d">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="${locale}" href="${canonical}">
  <link rel="alternate" hreflang="${es ? "en" : "es"}" href="${alternate}">
  <link rel="alternate" hreflang="x-default" href="${es ? alternate : canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="DEEP Archive">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${baseUrl}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${baseUrl}/og-image.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/seo-pages.css">
  <script type="application/ld+json">${jsonForHtml(schema)}</script>
  <title>${escapeHtml(fullTitle)}</title>
</head>
<body>
  <header class="site-header"><a class="wordmark" href="/">○ DEEP</a><nav aria-label="${es ? "Navegación principal" : "Main navigation"}"><a href="${objectIndexRoute(locale)}">${es ? "Objetos" : "Objects"}</a><a href="${trailIndexRoute(locale)}">${es ? "Recorridos" : "Trails"}</a><a href="${alternatePath}" hreflang="${es ? "en" : "es"}">${es ? "EN" : "ES"}</a></nav></header>
  ${body}
  <footer><span>DEEP / 1000</span><a href="${portfolioUrl}" rel="author">${es ? "Portafolio de Daniel García Silva" : "Daniel García Silva’s portfolio"}</a></footer>
</body>
</html>`;
}

async function writeRoute(route, html) {
  const directory = path.join(dist, ...route.split("/").filter(Boolean));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), html);
}

for (const object of objects) {
  const item = catalogByNasaId.get(object.nasaId);
  if (!item) continue;
  const detail = detailsById.get(item.id) ?? item;
  const es = object.locale === "es";
  const canonicalPath = routeForObject(object);
  const counterpart = objects.find((entry) => entry.slug === object.slug && entry.locale !== object.locale);
  const alternatePath = counterpart ? routeForObject(counterpart) : "/";
  const source = object.sources?.[0];
  const description = object.introduction;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "@id": `${baseUrl}${canonicalPath}#resource`,
        name: item.title,
        description,
        url: `${baseUrl}${canonicalPath}`,
        inLanguage: object.locale,
        isAccessibleForFree: true,
        educationalUse: "Observation and interpretation of astronomical imagery",
        author: { "@type": "Person", name: "Daniel García Silva", url: portfolioUrl },
        image: detail.fullImageUrl,
        citation: object.sources.map((entry) => entry.url),
      },
      {
        "@type": "ImageObject",
        contentUrl: detail.fullImageUrl,
        name: item.title,
        creditText: detail.credit,
        acquireLicensePage: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "DEEP", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: es ? "Objetos" : "Objects", item: `${baseUrl}${objectIndexRoute(object.locale)}` },
          { "@type": "ListItem", position: 3, name: item.title, item: `${baseUrl}${canonicalPath}` },
        ],
      },
    ],
  };
  const observations = object.observe.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
  const sources = object.sources.map((entry) => `<li><a href="${escapeHtml(entry.url)}" rel="noreferrer">${escapeHtml(entry.label)}</a></li>`).join("");
  const body = `<main class="page"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">DEEP</a> / <a href="${objectIndexRoute(object.locale)}">${es ? "Objetos" : "Objects"}</a></nav><article><p class="eyebrow">${escapeHtml(item.category)} · ${escapeHtml(item.date || item.year || "")}</p><h1>${escapeHtml(item.title)}</h1><p class="lede">${escapeHtml(object.introduction)}</p>${detail.fullImageUrl ? `<figure><img src="${escapeHtml(detail.fullImageUrl)}" alt="${escapeHtml(item.title)}" loading="eager" fetchpriority="high"><figcaption>${escapeHtml(detail.credit || "Credit supplied by source record")}</figcaption></figure>` : ""}<div class="content-grid"><section><h2>${es ? "Qué observar" : "What to observe"}</h2><ul>${observations}</ul></section><section><h2>${es ? "Explicación" : "Explanation"}</h2><p>${escapeHtml(object.explanation)}</p><h2>${es ? "Método de color" : "Color method"}</h2><p>${escapeHtml(object.colorMethod)}</p></section></div><section class="context"><h2>${es ? "Por qué importa" : "Why it matters"}</h2><p>${escapeHtml(object.whyItMatters)}</p></section><section><h2>${es ? "Fuentes y créditos" : "Sources and credits"}</h2><ul>${sources}</ul><p>${es ? "Crédito del recurso" : "Asset credit"}: ${escapeHtml(detail.credit || "—")}</p></section><a class="cta" href="/?object=${item.id}&lang=${object.locale}">${es ? "Abrir este objeto en el archivo interactivo" : "Open this object in the interactive archive"} →</a></article></main>`;
  await writeRoute(canonicalPath, layout({ locale: object.locale, title: item.title, description, canonicalPath, alternatePath, schema, body }));
}

for (const trail of trails) {
  const es = trail.locale === "es";
  const canonicalPath = routeForTrail(trail);
  const counterpart = trails.find((entry) => entry.slug === trail.slug && entry.locale !== trail.locale);
  const alternatePath = counterpart ? routeForTrail(counterpart) : "/";
  const schema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: trail.title,
    description: trail.dek,
    url: `${baseUrl}${canonicalPath}`,
    inLanguage: trail.locale,
    isAccessibleForFree: true,
    timeRequired: `PT${trail.estimatedMinutes}M`,
    learningResourceType: "Guided visual trail",
    educationalUse: trail.learningObjective,
    author: { "@type": "Person", name: "Daniel García Silva", url: portfolioUrl },
  };
  const steps = trail.steps.map((step, index) => {
    const item = catalogByNasaId.get(step.nasaId);
    const editorial = objects.find((entry) => entry.nasaId === step.nasaId && entry.locale === trail.locale);
    const href = editorial ? routeForObject(editorial) : `/?object=${item?.id ?? ""}&lang=${trail.locale}`;
    return `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h2><a href="${href}">${escapeHtml(step.chapter)}</a></h2><p>${escapeHtml(step.prompt)}</p><small>${escapeHtml(item?.title ?? step.nasaId)}</small></div></li>`;
  }).join("");
  const body = `<main class="page"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">DEEP</a> / <a href="${trailIndexRoute(trail.locale)}">${es ? "Recorridos" : "Trails"}</a></nav><article><p class="eyebrow">${trail.steps.length} ${es ? "pasos" : "steps"} · ${trail.estimatedMinutes} min</p><h1>${escapeHtml(trail.title)}</h1><p class="lede">${escapeHtml(trail.dek)}</p><section class="context"><h2>${es ? "Objetivo" : "Learning objective"}</h2><p>${escapeHtml(trail.learningObjective)}</p></section><ol class="trail-steps">${steps}</ol><a class="cta" href="/?trail=${trail.slug}&step=0&lang=${trail.locale}">${es ? "Comenzar en el archivo interactivo" : "Start in the interactive archive"} →</a></article></main>`;
  await writeRoute(canonicalPath, layout({ locale: trail.locale, title: trail.title, description: trail.dek, canonicalPath, alternatePath, schema, body }));
}

for (const locale of ["en", "es"]) {
  const es = locale === "es";
  const entries = objects.filter((entry) => entry.locale === locale).map((entry) => {
    const item = catalogByNasaId.get(entry.nasaId);
    return `<li><a href="${routeForObject(entry)}"><span>${escapeHtml(item?.category ?? "")}</span><strong>${escapeHtml(item?.title ?? entry.slug)}</strong><p>${escapeHtml(entry.introduction)}</p></a></li>`;
  }).join("");
  const objectPath = objectIndexRoute(locale);
  const objectBody = `<main class="page"><article><p class="eyebrow">DEEP / 1000</p><h1>${es ? "Objetos editoriales" : "Editorial objects"}</h1><p class="lede">${es ? "Una selección revisada del archivo, con guías de observación, contexto, método de color, crédito y fuente primaria." : "A source-checked selection from the archive, with observation guides, context, color method, credit and primary source."}</p><ul class="card-list">${entries}</ul></article></main>`;
  await writeRoute(objectPath, layout({ locale, title: es ? "Objetos editoriales" : "Editorial objects", description: es ? "Explora objetos astronómicos seleccionados y verificados en DEEP." : "Explore selected, source-checked astronomical objects in DEEP.", canonicalPath: objectPath, alternatePath: objectIndexRoute(es ? "en" : "es"), schema: { "@context": "https://schema.org", "@type": "CollectionPage", name: es ? "Objetos editoriales de DEEP" : "DEEP editorial objects", url: `${baseUrl}${objectPath}`, inLanguage: locale }, body: objectBody }));

  const trailEntries = trails.filter((entry) => entry.locale === locale).map((entry) => `<li><a href="${routeForTrail(entry)}"><span>${entry.steps.length} ${es ? "pasos" : "steps"} · ${entry.estimatedMinutes} min</span><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.dek)}</p></a></li>`).join("");
  const trailPath = trailIndexRoute(locale);
  const trailBody = `<main class="page"><article><p class="eyebrow">DEEP / 1000</p><h1>${es ? "Recorridos guiados" : "Guided Trails"}</h1><p class="lede">${es ? "Recorridos editoriales para observar evidencia visual antes de interpretar las imágenes." : "Editorial paths designed to help you observe visual evidence before interpreting the images."}</p><ul class="card-list">${trailEntries}</ul></article></main>`;
  await writeRoute(trailPath, layout({ locale, title: es ? "Recorridos guiados" : "Guided Trails", description: es ? "Recorre las guías educativas verificadas de DEEP." : "Explore DEEP’s source-checked educational Trails.", canonicalPath: trailPath, alternatePath: trailIndexRoute(es ? "en" : "es"), schema: { "@context": "https://schema.org", "@type": "CollectionPage", name: es ? "Recorridos guiados de DEEP" : "DEEP guided Trails", url: `${baseUrl}${trailPath}`, inLanguage: locale }, body: trailBody }));
}

const routeRecords = [
  { path: "/" },
  ...["en", "es"].flatMap((locale) => [
    { path: objectIndexRoute(locale) },
    { path: trailIndexRoute(locale) },
  ]),
  ...objects.map((entry) => ({ path: routeForObject(entry) })),
  ...trails.map((entry) => ({ path: routeForTrail(entry) })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routeRecords.map((entry) => `  <url><loc>${baseUrl}${entry.path}</loc></url>`).join("\n")}\n</urlset>\n`;
await fs.writeFile(path.join(dist, "sitemap.xml"), sitemap);
console.log(`SEO pages built: ${objects.length} objects, ${trails.length} Trails, ${routeRecords.length} sitemap URLs.`);
