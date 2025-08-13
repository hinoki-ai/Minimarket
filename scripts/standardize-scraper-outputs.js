#!/usr/bin/env node
/*
 Standardize scraper outputs into a canonical run directory:
   data/scraper/run-YYYYMMDD-HHmmss/{images,products,reports,logs,sessions}

 Sources collected (if present):
   - Scraped/scraped_images -> images/scraped
   - Scraped/scrape.log -> logs/
   - Scraped/scrape-results.json -> reports/
   - data/[collection]/{images,products,logs,sessions} -> respective folders preserving relative structure
   - data/[collection]/report-*.json and data/[collection]/session.json -> reports/ and sessions/
   - repo-root logs/*scrape*.log -> logs/root
*/

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(REPO_ROOT, 'data');
const SCRAPED_ROOT = path.join(REPO_ROOT, 'Scraped');
const LOGS_ROOT = path.join(REPO_ROOT, 'logs');

function formatNowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function removeIfExists(targetPath) {
  try {
    await fsp.rm(targetPath, { recursive: true, force: true });
  } catch (_) {
    // ignore
  }
}

async function copyItem(src, dest) {
  try {
    await ensureDir(path.dirname(dest));
    await fsp.cp(src, dest, { recursive: true, force: true });
    return true;
  } catch (err) {
    return false;
  }
}

async function pathExists(p) {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

async function listDirs(dir) {
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name));
  } catch (_) {
    return [];
  }
}

async function listFiles(dir) {
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => path.join(dir, e.name));
  } catch (_) {
    return [];
  }
}

async function main() {
  const runId = `run-${formatNowStamp()}`;
  const canonicalRoot = path.join(DATA_ROOT, 'scraper', runId);
  const dest = {
    root: canonicalRoot,
    images: path.join(canonicalRoot, 'images'),
    products: path.join(canonicalRoot, 'products'),
    reports: path.join(canonicalRoot, 'reports'),
    logs: path.join(canonicalRoot, 'logs'),
    sessions: path.join(canonicalRoot, 'sessions'),
  };

  await Promise.all([
    ensureDir(dest.images),
    ensureDir(dest.products),
    ensureDir(dest.reports),
    ensureDir(dest.logs),
    ensureDir(dest.sessions),
  ]);

  const tasks = [];

  // 1) Scraped/*
  const scrapedImages = path.join(SCRAPED_ROOT, 'scraped_images');
  if (await pathExists(scrapedImages)) {
    tasks.push(copyItem(scrapedImages, path.join(dest.images, 'scraped')));
  }
  const scrapedLog = path.join(SCRAPED_ROOT, 'scrape.log');
  if (await pathExists(scrapedLog)) {
    tasks.push(copyItem(scrapedLog, path.join(dest.logs, 'scrape.log')));
  }
  const scrapedResults = path.join(SCRAPED_ROOT, 'scrape-results.json');
  if (await pathExists(scrapedResults)) {
    tasks.push(copyItem(scrapedResults, path.join(dest.reports, 'scrape-results.json')));
  }

  // 2) data/* collections
  const dataSubDirs = await listDirs(DATA_ROOT);
  for (const srcDir of dataSubDirs) {
    const baseName = path.basename(srcDir);

    // images
    const imagesDir = path.join(srcDir, 'images');
    if (await pathExists(imagesDir)) {
      tasks.push(copyItem(imagesDir, path.join(dest.images, baseName)));
    }

    // products
    const productsDir = path.join(srcDir, 'products');
    if (await pathExists(productsDir)) {
      tasks.push(copyItem(productsDir, path.join(dest.products, baseName)));
    }

    // logs
    const logsDir = path.join(srcDir, 'logs');
    if (await pathExists(logsDir)) {
      tasks.push(copyItem(logsDir, path.join(dest.logs, baseName)));
    }

    // sessions directory
    const sessionsDir = path.join(srcDir, 'sessions');
    if (await pathExists(sessionsDir)) {
      tasks.push(copyItem(sessionsDir, path.join(dest.sessions, baseName)));
    }

    // session.json
    const sessionJson = path.join(srcDir, 'session.json');
    if (await pathExists(sessionJson)) {
      tasks.push(copyItem(sessionJson, path.join(dest.sessions, `${baseName}-session.json`)));
    }

    // report-*.json at this level
    const files = await listFiles(srcDir);
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      if (fileName.startsWith('report-') && fileName.endsWith('.json')) {
        tasks.push(copyItem(filePath, path.join(dest.reports, `${baseName}-${fileName}`)));
      }
    }
  }

  // 3) root logs/*scrape*.log
  if (await pathExists(LOGS_ROOT)) {
    const rootLogFiles = await listFiles(LOGS_ROOT);
    for (const filePath of rootLogFiles) {
      const name = path.basename(filePath);
      if (name.toLowerCase().includes('scrape')) {
        tasks.push(copyItem(filePath, path.join(dest.logs, 'root', name)));
      }
    }
  }

  await Promise.all(tasks);

  // Update latest symlink
  const latestLink = path.join(DATA_ROOT, 'scraper', 'latest');
  await ensureDir(path.dirname(latestLink));
  await removeIfExists(latestLink);
  try {
    await fsp.symlink(path.relative(path.dirname(latestLink), dest.root), latestLink, 'dir');
  } catch (_) {
    // ignore symlink errors
  }

  // Write summary index.json
  const summary = {
    runId,
    createdAt: new Date().toISOString(),
    paths: dest,
    sources: {
      scrapedRootExists: await pathExists(SCRAPED_ROOT),
      dataCollections: dataSubDirs.map((p) => path.basename(p)),
    },
  };
  await fsp.writeFile(path.join(dest.root, 'index.json'), JSON.stringify(summary, null, 2));

  // Console output
  process.stdout.write(`Standardized scraper outputs to: ${dest.root}\n`);
  process.stdout.write(`Latest symlink: ${latestLink}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

