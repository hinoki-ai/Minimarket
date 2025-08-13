'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'public', 'images', 'products', 'lider');
const DELETE_TINY = process.env.DELETE_TINY === '1' || process.env.DELETE_TINY === 'true';
const MIN_BYTES = Number(process.env.MIN_BYTES || 10 * 1024); // 10KB

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    // eslint-disable-next-line no-console
    console.error(`Not found: ${OUTPUT_DIR}`);
    process.exit(1);
  }
  const exts = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);
  const names = fs.readdirSync(OUTPUT_DIR);
  const kept = [];
  let deleted = 0;
  for (const name of names) {
    const full = path.join(OUTPUT_DIR, name);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    const dot = name.lastIndexOf('.');
    if (dot === -1) { if (DELETE_TINY) fs.unlinkSync(full); continue; }
    const ext = name.slice(dot + 1).toLowerCase();
    if (!exts.has(ext)) { if (DELETE_TINY) fs.unlinkSync(full); continue; }
    if (stat.size < MIN_BYTES) {
      if (DELETE_TINY) { fs.unlinkSync(full); deleted += 1; }
      continue;
    }
    kept.push(name);
  }
  kept.sort();
  const publicRoot = path.join(__dirname, '..', 'public');
  const publicPaths = kept.map((name) => `/${path.relative(publicRoot, path.join(OUTPUT_DIR, name)).split(path.sep).join('/')}`);
  const manifestPath = path.join(OUTPUT_DIR, 'lider-files.json');
  fs.writeFileSync(manifestPath, JSON.stringify(publicPaths, null, 2));
  // eslint-disable-next-line no-console
  console.log(`Wrote ${manifestPath} with ${publicPaths.length} entries${DELETE_TINY ? `; deleted ${deleted} tiny files` : ''}.`);
}

if (require.main === module) {
  main();
}

