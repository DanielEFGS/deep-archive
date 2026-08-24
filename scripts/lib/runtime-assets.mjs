import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeHashedAsset({ directory, prefix, extension, buffer }) {
  await fs.mkdir(directory, { recursive: true });
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const fileName = `${prefix}.${hash}.${extension}`;
  const target = path.join(directory, fileName);
  await fs.writeFile(target, buffer);

  const entries = await fs.readdir(directory);
  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(`${prefix}.`) && entry.endsWith(`.${extension}`) && entry !== fileName)
      .map((entry) => fs.rm(path.join(directory, entry), { force: true })),
  );

  return { fileName, bytes: buffer.byteLength, hash };
}

export async function writeDetailShards({ directory, records, shardSize = 50, publicUrlPrefix = '' }) {
  await fs.mkdir(directory, { recursive: true });
  const entries = await fs.readdir(directory);
  await Promise.all(entries.filter((entry) => entry.endsWith('.json')).map((entry) => fs.rm(path.join(directory, entry), { force: true })));

  const shardById = new Map();
  const assets = [];
  for (let offset = 0; offset < records.length; offset += shardSize) {
    const shardNumber = Math.floor(offset / shardSize) + 1;
    const recordsInShard = records.slice(offset, offset + shardSize);
    const payload = Object.fromEntries(recordsInShard.map((record) => [String(record.id), record]));
    const buffer = Buffer.from(JSON.stringify(payload));
    const asset = await writeHashedAsset({
      directory,
      prefix: `details-${String(shardNumber).padStart(2, '0')}`,
      extension: 'json',
      buffer,
    });
    const url = `${publicUrlPrefix}/details/${asset.fileName}`;
    recordsInShard.forEach((record) => shardById.set(record.id, url));
    assets.push({ ...asset, count: recordsInShard.length, url });
  }
  return { shardById, assets };
}
