# Local development

## Prerequisites

- Node.js 22.12 or newer
- npm
- Git (recommended)
- A modern browser with WebGL 2 support

The repository includes `.nvmrc` so Node version managers can select the expected major version.

## First install

```bash
npm install
npm run dev
```

Vite will print the local URL in the terminal.

After the first successful install, keep the generated `package-lock.json` in version control so local machines, CI and Netlify use a reproducible dependency graph.

## Useful commands

```bash
# Development server
npm run dev

# Validate current catalog/assets
npm run check:catalog

# Regenerate the synthetic 500-item dataset
npm run catalog:demo

# Build a NASA-backed dataset (requires network access)
npm run catalog:nasa

# NASA dataset + optimized local detail media
NASA_DOWNLOAD_FULL=1 npm run catalog:nasa

# TypeScript + production Vite build
npm run build

# Preview the built site
npm run preview
```

## Recommended Codex workflow

1. Open the repository root in the workspace.
2. Tell Codex to read `AGENTS.md` before making changes.
3. Use `NEXT_PHASE_PROMPT.md` as the starting prompt for the next milestone.
4. Let Codex inspect existing source/docs before proposing structural changes.
5. Ask it to run `npm run check:catalog` and `npm run build` after relevant changes.
6. Review visual changes manually in the browser; performance and aesthetics cannot be fully validated from static code inspection alone.

## Important generated/local directories

Do not commit:

- `node_modules/`
- `dist/`
- `.cache/`
- local logs/editor caches

Do commit:

- source code;
- documentation;
- `package.json`;
- generated `package-lock.json` after installation;
- curated production assets/catalogs that are intentionally part of the deployed static site.

## Dataset strategy

The checked-in demo data exists so UI/WebGL work is possible without network access. The production NASA ingest is an offline development/build task. It should never turn the visitor's browser into the catalog crawler.
