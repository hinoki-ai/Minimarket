'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('@playwright/test');
const https = require('https');
const http = require('http');

const START_URL = process.env.LIDER_START_URL || 'https://www.lider.cl/supermercado';
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'public', 'images', 'products', 'lider');
const MAX_PAGES = Number(process.env.MAX_PAGES || 25);
const MAX_SCROLLS_PER_PAGE = Number(process.env.MAX_SCROLLS || 10);
const DOWNLOAD_CONCURRENCY = Number(process.env.DOWNLOAD_CONCURRENCY || 6);
const VERBOSE = process.env.VERBOSE === '1' || process.env.VERBOSE === 'true';
const MIN_IMAGE_BYTES = Number(process.env.MIN_IMAGE_BYTES || 30 * 1024); // 30KB

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function log(...args) {
  if (VERBOSE) console.log(...args); // eslint-disable-line no-console
}
function info(...args) {
  console.log(...args); // eslint-disable-line no-console
}

function sha1(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

async function autoScroll(page, maxSteps) {
  let previousHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 0; i < maxSteps; i += 1) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(800);
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight <= previousHeight) break;
    previousHeight = newHeight;
  }
}

async function dismissBanners(page) {
  const selectors = [
    'button:has-text("Aceptar")',
    'button:has-text("Entendido")',
    'button:has-text("Aceptar todas")',
    'button:has-text("Aceptar todo")',
    '[aria-label="Cerrar"]',
    'button[aria-label="close" i]'
  ];
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) { await el.click({ timeout: 1000 }); await page.waitForTimeout(300); }
    } catch (_) { /* ignore */ }
  }
}

async function collectLinksOnPage(page) {
  const currentLocation = await page.evaluate(() => location.href);
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')).filter(Boolean));
  const normalized = new Set();
  for (const href of hrefs) {
    try {
      const url = new URL(href, currentLocation);
      if (url.hostname.includes('lider.cl') && url.pathname.startsWith('/supermercado')) {
        if (/(cuenta|login|ayuda|carro|carrito|checkout|pago)/i.test(url.pathname)) continue;
        const clean = url.toString().split('#')[0];
        normalized.add(clean);
      }
    } catch (_) { /* ignore */ }
  }
  return Array.from(normalized);
}

async function extractProductImageUrls(page) {
  const images = await page.evaluate(() => {
    const results = [];
    function pushImage(src, srcset, alt, nw, nh) {
      results.push({ src, srcset, alt, nw, nh });
    }
    for (const img of Array.from(document.querySelectorAll('img'))) {
      const src = img.currentSrc || img.src || '';
      const srcset = img.getAttribute('srcset') || '';
      const alt = img.alt || '';
      const nw = img.naturalWidth || 0;
      const nh = img.naturalHeight || 0;
      pushImage(src, srcset, alt, nw, nh);
    }
    for (const img of Array.from(document.querySelectorAll('img[data-src], img[data-srcset]'))) {
      const src = img.getAttribute('data-src') || '';
      const srcset = img.getAttribute('data-srcset') || '';
      const alt = img.alt || '';
      const nw = img.naturalWidth || 0;
      const nh = img.naturalHeight || 0;
      pushImage(src, srcset, alt, nw, nh);
    }
    return results;
  });

  const denyHosts = ['google.', 'doubleclick.net', 'adservice.google.com', 'creativecdn.com', 'px-client.net', 'adnxs.com'];
  const denyPathRegex = /(landing-sod\/images|catalogo\/images\/(wmt_chile|lider|express|acuenta|central_mayorista)\.webp|logo|banner|tracking|pixel|analytics)/i;

  const candidates = new Set();
  function pickBestFromSrcset(srcset) {
    if (!srcset) return null;
    try {
      const candidates = srcset.split(',').map((part) => part.trim()).map((part) => {
        const [urlPart, size] = part.split(' ');
        const width = size && size.endsWith('w') ? parseInt(size.replace('w', ''), 10) : 0;
        return { url: urlPart, width: Number.isFinite(width) ? width : 0 };
      });
      candidates.sort((a, b) => b.width - a.width);
      return candidates[0] ? candidates[0].url : null;
    } catch (_) { return null; }
  }

  for (const { src, srcset, alt, nw, nh } of images) {
    let url = src || pickBestFromSrcset(srcset);
    if (!url) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    if (/\.svg(\?|$)/i.test(url)) continue;
    if (Math.max(nw, nh) < 300 && !/(product|sku|images|image|foto|producto)/i.test(url)) continue;
    try {
      const u = new URL(url);
      if (!u.hostname.includes('lider.cl')) continue;
      if (denyHosts.some((h) => u.hostname.includes(h))) continue;
      if (denyPathRegex.test(u.pathname)) continue;
      candidates.add(u.toString());
    } catch (_) { /* ignore */ }
  }
  return Array.from(candidates);
}

function fileExtensionFromUrl(urlString) {
  try {
    const u = new URL(urlString);
    const match = u.pathname.match(/\.([a-zA-Z0-9]+)$/);
    if (match) return match[1].toLowerCase();
    return 'jpg';
  } catch (_) { return 'jpg'; }
}

function downloadUrlToFile(urlString, filePath) {
  return new Promise((resolve, reject) => {
    const client = urlString.startsWith('https') ? https : http;
    const visited = new Set();
    function doGet(currentUrl) {
      if (visited.has(currentUrl)) return reject(new Error('Redirect loop'));
      visited.add(currentUrl);
      const req = client.get(currentUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8', 'Referer': 'https://www.lider.cl/' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, currentUrl).toString();
          res.resume();
          return doGet(nextUrl);
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} for ${currentUrl}`)); }
        const contentType = String(res.headers['content-type'] || '');
        const contentLength = Number(res.headers['content-length'] || 0);
        if (!contentType.startsWith('image/')) { res.resume(); return reject(new Error(`Non-image content-type: ${contentType}`)); }
        if (contentLength && contentLength < MIN_IMAGE_BYTES) { res.resume(); return reject(new Error(`Tiny image (${contentLength} bytes)`)); }
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => fileStream.close(() => {
          try {
            const stats = fs.statSync(filePath);
            if (stats.size < MIN_IMAGE_BYTES) { fs.unlinkSync(filePath); return reject(new Error(`Downloaded tiny image (${stats.size} bytes)`)); }
          } catch (_) { /* ignore */ }
          resolve();
        }));
      });
      req.on('error', reject);
      req.setTimeout(30000, () => { req.destroy(new Error('Timeout')); });
    }
    doGet(urlString);
  });
}

async function withConcurrency(items, limit, worker) {
  const queue = [...items];
  let active = 0;
  return new Promise((resolve) => {
    function next() {
      if (queue.length === 0 && active === 0) return resolve();
      while (active < limit && queue.length > 0) {
        const item = queue.shift();
        active += 1;
        Promise.resolve()
          .then(() => worker(item))
          .catch((err) => log('Worker error:', err && err.message ? err.message : err))
          .finally(() => { active -= 1; next(); });
      }
    }
    next();
  });
}

async function run() {
  ensureDirSync(OUTPUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' });
  const page = await context.newPage();

  const frontier = [START_URL];
  const visited = new Set();
  const allImageUrls = new Set();

  while (frontier.length > 0 && visited.size < MAX_PAGES) {
    const url = frontier.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    info(`[Page ${visited.size}] ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await dismissBanners(page);
      await autoScroll(page, MAX_SCROLLS_PER_PAGE);
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      const links = await collectLinksOnPage(page);
      for (const l of links) if (!visited.has(l) && !frontier.includes(l)) frontier.push(l);

      const urls = await extractProductImageUrls(page);
      urls.forEach((u) => allImageUrls.add(u));
      log(`Found ${urls.length} images on page (total unique: ${allImageUrls.size})`);
    } catch (err) {
      log('Navigation/extraction error:', err && err.message ? err.message : err);
    }
  }

  info(`Discovered ${allImageUrls.size} unique candidate image URLs across ${visited.size} page(s).`);

  const urlList = Array.from(allImageUrls);
  const manifestPath = path.join(OUTPUT_DIR, 'lider-images.json');
  fs.writeFileSync(manifestPath, JSON.stringify(urlList, null, 2));
  info(`Saved URL manifest: ${manifestPath}`);

  let downloaded = 0;
  let skipped = 0;
  await withConcurrency(urlList, DOWNLOAD_CONCURRENCY, async (url) => {
    try {
      const ext = fileExtensionFromUrl(url);
      const hash = sha1(url);
      const fileName = `${hash}.${ext}`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      if (fs.existsSync(filePath)) { skipped += 1; return; }
      await downloadUrlToFile(url, filePath);
      downloaded += 1;
      if ((downloaded + skipped) % 10 === 0) info(`Progress: ${downloaded} downloaded, ${skipped} skipped / ${urlList.length}`);
    } catch (err) { log('Download error:', url, err && err.message ? err.message : err); }
  });

  info(`Done. Downloaded ${downloaded}, skipped ${skipped}. Files in: ${OUTPUT_DIR}`);

  // Build a local file manifest to be consumable by the frontend
  try {
    const exts = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
    const allNames = fs.readdirSync(OUTPUT_DIR);
    for (const name of allNames) {
      const full = path.join(OUTPUT_DIR, name);
      try {
        const st = fs.statSync(full);
        if (!st.isFile()) continue;
        const dot = name.lastIndexOf('.');
        if (dot === -1) { fs.unlinkSync(full); continue; }
        const ext = name.slice(dot + 1).toLowerCase();
        if (!exts.has(ext)) { fs.unlinkSync(full); continue; }
        if (st.size < MIN_IMAGE_BYTES) { fs.unlinkSync(full); continue; }
      } catch (_) { /* ignore */ }
    }
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter((name) => {
        const dot = name.lastIndexOf('.');
        if (dot === -1) return false;
        const ext = name.slice(dot + 1).toLowerCase();
        return exts.has(ext);
      })
      .sort();
    const publicRoot = path.join(__dirname, '..', 'public');
    const publicPaths = files.map((name) => {
      const abs = path.join(OUTPUT_DIR, name);
      const relToPublic = path.relative(publicRoot, abs).split(path.sep).join('/');
      return `/${relToPublic}`;
    });
    const filesManifestPath = path.join(OUTPUT_DIR, 'lider-files.json');
    fs.writeFileSync(filesManifestPath, JSON.stringify(publicPaths, null, 2));
    info(`Saved files manifest: ${filesManifestPath}`);
  } catch (err) { info(`Failed to generate files manifest: ${err && err.message ? err.message : err}`); }

  await browser.close();
}

if (require.main === module) {
  run().catch((err) => { console.error(err); process.exit(1); }); // eslint-disable-line no-console
}

