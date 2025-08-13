'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('@playwright/test');

const START_URL = process.env.LIDER_START_URL || 'https://www.lider.cl/supermercado';
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'public', 'images', 'products', 'lider');
const MAX_PAGES = Number(process.env.MAX_PAGES || 120);
const MAX_SCROLLS_PER_PAGE = Number(process.env.MAX_SCROLLS || 18);
const VERBOSE = process.env.VERBOSE === '1' || process.env.VERBOSE === 'true';

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function log(...args) {
  if (VERBOSE) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

function info(...args) {
  // eslint-disable-next-line no-console
  console.log(...args);
}

function sha1(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function pickBestFromSrcset(srcset) {
  if (!srcset) return null;
  try {
    const candidates = srcset
      .split(',')
      .map((s) => s.trim())
      .map((s) => {
        const [u, size] = s.split(' ');
        const width = size && size.endsWith('w') ? parseInt(size.replace('w', ''), 10) : 0;
        return { url: u, width: Number.isFinite(width) ? width : 0 };
      })
      .sort((a, b) => b.width - a.width);
    return candidates[0] ? candidates[0].url : null;
  } catch {
    return null;
  }
}

async function autoScroll(page, maxSteps) {
  let previousHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 0; i < maxSteps; i += 1) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(600);
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight <= previousHeight) break;
    previousHeight = newHeight;
  }
}

async function dismissBanners(page) {
  const sels = [
    'button:has-text("Aceptar")',
    'button:has-text("Entendido")',
    '[aria-label="Cerrar"]',
    'button[aria-label="close" i]'
  ];
  for (const s of sels) {
    try {
      const el = await page.$(s);
      if (el) { await el.click({ timeout: 500 }); await page.waitForTimeout(250); }
    } catch {}
  }
}

async function discoverLinks(page) {
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href));
  const out = [];
  for (const h of hrefs) {
    try {
      const u = new URL(h, location.href);
      const isInternal = u.origin === location.origin;
      const allowed = u.pathname.startsWith('/supermercado') || u.pathname.startsWith('/catalogo');
      const blocked = /(cuenta|login|ayuda|carro|carrito|checkout|pago)/i.test(u.pathname);
      if (isInternal && allowed && !blocked) out.push(u.toString().split('#')[0]);
    } catch {}
  }
  return Array.from(new Set(out));
}

async function extractProductImageUrls(page) {
  // Heuristic: images inside cards that contain price-like text or quantity controls
  const imgs = await page.evaluate(() => {
    const results = [];
    const priceLike = (el) => /\$|\bPrecio\b|\bOferta\b|\bunid\.|\bunidad\b/i.test(el.innerText || '');
    const cardNodes = Array.from(document.querySelectorAll('article, li, div'))
      .filter((el) => {
        try {
          if (!el.querySelector('img')) return false;
          const txt = (el.innerText || '').slice(0, 2000);
          return /\$/.test(txt) || priceLike(el);
        } catch { return false; }
      })
      .slice(0, 200); // limit per page

    for (const card of cardNodes) {
      for (const img of Array.from(card.querySelectorAll('img'))) {
        const src = img.currentSrc || img.src || img.getAttribute('data-src') || '';
        const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
        const alt = img.alt || '';
        const nw = img.naturalWidth || 0;
        const nh = img.naturalHeight || 0;
        results.push({ src, srcset, alt, nw, nh });
      }
    }
    return results;
  });

  const urls = new Set();
  for (const { src, srcset, alt, nw, nh } of imgs) {
    let u = src || pickBestFromSrcset(srcset);
    if (!u) continue;
    if (!/^https?:\/\//i.test(u)) continue;
    if (/\.svg(\?|$)/i.test(u)) continue;
    if (/\b(icon|logo|placeholder|banner|badge|rating|spinner|loader)\b/i.test(u)) continue;
    if ((nw && nh) && Math.max(nw, nh) < 250) continue;
    if (/google|doubleclick|adservice|creativecdn|collector|px-client/i.test(u)) continue;
    urls.add(u);
  }
  return Array.from(urls);
}

async function downloadWithContext(page, url, filePath) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
    'Referer': page.url(),
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
  };
  const res = await page.request.get(url, { headers });
  if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
  const buf = await res.body();
  if (!buf || buf.length < 1024) throw new Error(`tiny(${buf ? buf.length : 0})`);
  fs.writeFileSync(filePath, buf);
}

function extFromUrl(u) {
  try {
    const { pathname } = new URL(u);
    const m = pathname.match(/\.([a-z0-9]+)$/i);
    return (m ? m[1].toLowerCase() : 'jpg');
  } catch { return 'jpg'; }
}

async function run() {
  ensureDirSync(OUTPUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
  });
  const page = await context.newPage();

  const visited = new Set();
  const frontier = [START_URL];
  const saved = new Set();

  while (frontier.length && visited.size < MAX_PAGES) {
    const url = frontier.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    info(`[Page ${visited.size}] ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await dismissBanners(page);
      await autoScroll(page, MAX_SCROLLS_PER_PAGE);
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

      // Debug snapshot
      try {
        const dbgDir = path.join(__dirname, '..', 'public', 'images', 'products', 'lider', '_debug');
        if (!fs.existsSync(dbgDir)) fs.mkdirSync(dbgDir, { recursive: true });
        await page.screenshot({ path: path.join(dbgDir, `page_${visited.size}.png`), fullPage: true });
        const html = await page.content();
        fs.writeFileSync(path.join(dbgDir, `page_${visited.size}.html`), html);
      } catch {}

      const productUrls = await extractProductImageUrls(page);
      info(`\tproduct images found: ${productUrls.length}`);
      for (const imgUrl of productUrls) {
        const hash = sha1(imgUrl);
        const ext = extFromUrl(imgUrl);
        const filePath = path.join(OUTPUT_DIR, `${hash}.${ext}`);
        if (saved.has(filePath) || fs.existsSync(filePath)) continue;
        try {
          await downloadWithContext(page, imgUrl, filePath);
          saved.add(filePath);
          info(`\t+ saved ${path.basename(filePath)}`);
        } catch (err) {
          log(`\t- skip ${imgUrl} (${err && err.message ? err.message : err})`);
        }
      }

      const links = await discoverLinks(page);
      info(`\tlinks queued: ${links.length}`);
      for (const l of links) if (!visited.has(l)) frontier.push(l);
    } catch (err) {
      log('page error:', err && err.message ? err.message : err);
    }
  }

  const publicRoot = path.join(__dirname, '..', 'public');
  const kept = Array.from(saved)
    .map((p) => `/${path.relative(publicRoot, p).split(path.sep).join('/')}`)
    .sort();
  const manifestPath = path.join(OUTPUT_DIR, 'lider-files.json');
  fs.writeFileSync(manifestPath, JSON.stringify(kept, null, 2));
  info(`Done. Pages: ${visited.size}. Images saved: ${kept.length}. Manifest: ${manifestPath}`);

  await browser.close();
}

if (require.main === module) {
  run().catch((err) => { console.error(err); process.exit(1); });
}

