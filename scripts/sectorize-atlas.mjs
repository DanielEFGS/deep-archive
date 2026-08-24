import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { writeHashedAsset } from "./lib/runtime-assets.mjs";

const dataset = process.argv.find((value) => value.startsWith("--dataset="))?.split("=")[1] ?? "nasa";
const sectorSize = Math.max(1, Number(process.env.ATLAS_SECTOR_SIZE ?? 500));
const root = process.cwd();
const datasetDir = path.join(root, "public", "datasets", dataset);
const catalogPath = path.join(datasetDir, "catalog.json");
const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));

if (!catalog.atlas?.url || !Array.isArray(catalog.items))
  throw new Error("Catalog must contain an atlas and items.");

if (catalog.atlases?.length > 1) {
  console.log(`${dataset} already contains ${catalog.atlases.length} atlas sectors.`);
  process.exit(0);
}

const sourcePath = path.join(
  datasetDir,
  catalog.atlas.url.replace(`/datasets/${dataset}/`, ""),
);
const sourceBuffer = await fs.readFile(sourcePath);
const decoded = await sharp(sourceBuffer).raw().toBuffer({ resolveWithObject: true });
const columns = 25;
const tileWidth = catalog.atlas.tileWidth;
const tileHeight = catalog.atlas.tileHeight;
const atlases = [];

for (let startIndex = 0; startIndex < catalog.items.length; startIndex += sectorSize) {
  const itemCount = Math.min(sectorSize, catalog.items.length - startIndex);
  const rows = Math.ceil(itemCount / columns);
  const composites = await Promise.all(Array.from({ length: itemCount }, async (_, localIndex) => {
    const sourceIndex = startIndex + localIndex;
    const tile = await sharp(decoded.data, { raw: decoded.info })
      .extract({
        left: (sourceIndex % catalog.atlas.columns) * tileWidth,
        top: Math.floor(sourceIndex / catalog.atlas.columns) * tileHeight,
        width: tileWidth,
        height: tileHeight,
      })
      .toBuffer();
    return {
      input: tile,
      raw: {
        width: tileWidth,
        height: tileHeight,
        channels: decoded.info.channels,
      },
      left: (localIndex % columns) * tileWidth,
      top: Math.floor(localIndex / columns) * tileHeight,
    };
  }));
  const buffer = await sharp({
    create: {
      width: columns * tileWidth,
      height: rows * tileHeight,
      channels: 3,
      background: "#03050a",
    },
  })
    .composite(composites)
    .webp({ quality: 68, effort: 6, smartSubsample: true })
    .toBuffer();
  const asset = await writeHashedAsset({
    directory: path.join(datasetDir, "atlas"),
    prefix: `${dataset}-atlas-${String(atlases.length + 1).padStart(2, "0")}`,
    extension: "webp",
    buffer,
  });
  atlases.push({
    url: `/datasets/${dataset}/atlas/${asset.fileName}`,
    columns,
    rows,
    tileWidth,
    tileHeight,
    bytes: asset.bytes,
    startIndex,
    itemCount,
  });
}

catalog.atlas = atlases[0];
catalog.atlases = atlases;
await fs.writeFile(catalogPath, JSON.stringify(catalog));

console.log(
  `Sectorized ${catalog.items.length} ${dataset} records into ${atlases.length} atlases of at most ${sectorSize}.`,
);
