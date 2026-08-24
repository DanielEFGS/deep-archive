import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { writeDetailShards, writeHashedAsset } from './lib/runtime-assets.mjs';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public', 'datasets', 'demo');
const ATLAS_DIR = path.join(PUBLIC, 'atlas');
const DETAILS_DIR = path.join(PUBLIC, 'details');
const COUNT = 500;
const COLUMNS = 25;
const ROWS = 20;
const TILE_W = 96;
const TILE_H = 72;
const URL_PREFIX = '/datasets/demo';

const categories = ['DEEP SPACE', 'NEBULAE', 'GALAXIES', 'SOLAR SYSTEM', 'STELLAR OBJECTS', 'OBSERVATORIES'];

function tileSvg(id, category) {
  const hue = (id * 47) % 360;
  const hue2 = (hue + 72 + (id % 41)) % 360;
  const starX = 8 + ((id * 31) % 80);
  const starY = 6 + ((id * 17) % 55);
  const star2X = 5 + ((id * 13) % 85);
  const star2Y = 8 + ((id * 29) % 54);

  return Buffer.from(`
    <svg width="${TILE_W}" height="${TILE_H}" viewBox="0 0 ${TILE_W} ${TILE_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="${20 + (id % 60)}%" cy="${20 + ((id * 3) % 60)}%" r="80%">
          <stop offset="0" stop-color="hsl(${hue}, 58%, 48%)" stop-opacity=".92"/>
          <stop offset=".42" stop-color="hsl(${hue2}, 45%, 22%)" stop-opacity=".72"/>
          <stop offset="1" stop-color="#02040a"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="7"/></filter>
      </defs>
      <rect width="96" height="72" fill="#03050a"/>
      <rect width="96" height="72" fill="url(#g)" opacity=".76"/>
      <circle cx="${48 + ((id % 7) - 3) * 4}" cy="${36 + ((id % 5) - 2) * 3}" r="${12 + (id % 15)}" fill="hsl(${hue2}, 70%, 62%)" opacity=".18" filter="url(#blur)"/>
      <circle cx="${starX}" cy="${starY}" r=".8" fill="#fff" opacity=".92"/>
      <circle cx="${star2X}" cy="${star2Y}" r=".45" fill="#fff" opacity=".76"/>
      <circle cx="${(starX + 24) % 92}" cy="${(starY + 18) % 68}" r=".35" fill="#fff" opacity=".54"/>
      <text x="5" y="63" fill="rgba(255,255,255,.72)" font-size="7" font-family="monospace">${String(id).padStart(3, '0')}</text>
    </svg>
  `);
}

await fs.mkdir(ATLAS_DIR, { recursive: true });
await fs.mkdir(DETAILS_DIR, { recursive: true });

const composites = Array.from({ length: COUNT }, (_, index) => {
  const id = index + 1;
  const category = categories[index % categories.length];
  return {
    input: tileSvg(id, category),
    left: (index % COLUMNS) * TILE_W,
    top: Math.floor(index / COLUMNS) * TILE_H,
  };
});

const atlasBuffer = await sharp({
  create: { width: COLUMNS * TILE_W, height: ROWS * TILE_H, channels: 3, background: '#03050a' },
})
  .composite(composites)
  .webp({ quality: 64, effort: 5, smartSubsample: true })
  .toBuffer();

const atlas = await writeHashedAsset({
  directory: ATLAS_DIR,
  prefix: 'demo-atlas',
  extension: 'webp',
  buffer: atlasBuffer,
});

const fullItems = Array.from({ length: COUNT }, (_, index) => {
  const id = index + 1;
  const category = categories[index % categories.length];
  return {
    id,
    title: `DEMO OBJECT ${String(id).padStart(3, '0')}`,
    slug: `demo-object-${String(id).padStart(3, '0')}`,
    subtitle: `${category} / SYNTHETIC PLACEHOLDER`,
    description: 'Synthetic placeholder used to validate layout, GPU interaction, loading behavior and responsive rendering before ingesting credited astronomical media.',
    category,
    date: `20${String(id % 26).padStart(2, '0')}`,
    center: 'LOCAL DEMO DATASET',
    credit: 'Synthetic asset generated for DEEP Archive development.',
    keywords: ['demo', 'placeholder', category.toLowerCase()],
  };
});

const { shardById, assets: detailShards } = await writeDetailShards({ directory: DETAILS_DIR, records: fullItems, publicUrlPrefix: URL_PREFIX });
const items = fullItems.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    subtitle: item.subtitle,
    category: item.category,
    date: item.date,
    year: item.date,
    keywords: item.keywords,
    detailShard: shardById.get(item.id),
  }));

const catalog = {
  generatedAt: new Date().toISOString(),
  source: 'demo',
  atlas: {
    url: `${URL_PREFIX}/atlas/${atlas.fileName}`,
    columns: COLUMNS,
    rows: ROWS,
    tileWidth: TILE_W,
    tileHeight: TILE_H,
    bytes: atlas.bytes,
  },
  atlases: [{
    url: `${URL_PREFIX}/atlas/${atlas.fileName}`,
    columns: COLUMNS,
    rows: ROWS,
    tileWidth: TILE_W,
    tileHeight: TILE_H,
    bytes: atlas.bytes,
    startIndex: 0,
    itemCount: COUNT,
  }],
  items,
};

await fs.writeFile(path.join(PUBLIC, 'catalog.json'), JSON.stringify(catalog));
console.log(`Generated ${COUNT} demo records, ${detailShards.length} detail shards and ${atlas.fileName} (${Math.round(atlas.bytes / 1024)} KB).`);
