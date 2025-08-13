#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { setTimeout: sleep } = require('timers/promises');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');
const { chromium } = require('@playwright/test');

function ensureDirSync(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function sanitizeFilename(name) {
	const withoutQuery = name.split('?')[0];
	const decoded = (() => { try { return decodeURIComponent(withoutQuery); } catch { return withoutQuery; } })();
	const replaced = decoded.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
	return replaced.length ? replaced.slice(0, 180) : 'file';
}

function extensionFromUrl(u) {
	try {
		const url = new URL(u);
		const m = url.pathname.match(/\.([a-zA-Z0-9]+)$/);
		return m ? m[1].toLowerCase() : 'jpg';
	} catch {
		return 'jpg';
	}
}

function filenameFromUrl(u) {
	try {
		const url = new URL(u);
		const baseFromPath = path.basename(url.pathname) || '';
		const candidate = sanitizeFilename(baseFromPath.replace(/\.[^.]+$/, ''));
		const ext = extensionFromUrl(u);
		if (candidate && candidate !== 'file') return `${candidate}.${ext}`;
		const idParam = url.searchParams.get('id') || url.searchParams.get('sku') || url.searchParams.get('product') || '';
		if (idParam) return `${sanitizeFilename(idParam)}.${ext}`;
		const hostPath = sanitizeFilename((url.hostname + url.pathname).replace(/\/+/, '-'));
		return `${hostPath}.${ext}`;
	} catch {
		return `image.${extensionFromUrl(u)}`;
	}
}

async function validateUrlReachable(inputUrl) {
	let url;
	try {
		url = new URL(inputUrl);
	} catch {
		throw new Error('Invalid URL format');
	}
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);
	try {
		let res;
		try {
			res = await fetch(url.toString(), { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } });
		} catch {
			res = await fetch(url.toString(), { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } });
		}
		if (!res.ok) throw new Error(`Site responded with HTTP ${res.status}`);
		return url.toString();
	} finally {
		clearTimeout(timeout);
	}
}

function createLogger(logFilePath) {
	const stream = fs.createWriteStream(logFilePath, { flags: 'a' });
	const timestamp = () => new Date().toISOString();
	function write(prefix, message) {
		const line = `[${timestamp()}] ${prefix} ${message}\n`;
		stream.write(line);
		stdout.write(line);
	}
	return {
		info: (msg) => write('[INFO] ', msg),
		warn: (msg) => write('[WARN] ', msg),
		error: (msg) => write('[ERROR]', msg),
		close: () => stream.end()
	};
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
	const selectors = [
		'button:has-text("Aceptar")',
		'button:has-text("Entendido")',
		'[aria-label="Cerrar"]',
		'button[aria-label="close" i]',
		'button:has-text("OK")',
		'button:has-text("Accept")'
	];
	for (const s of selectors) {
		try {
			const el = await page.$(s);
			if (el) {
				await el.click({ timeout: 500 });
				await page.waitForTimeout(250);
			}
		} catch {}
	}
}

async function extractImageUrls(page) {
	const imgs = await page.evaluate(() => {
		const results = [];
		for (const img of Array.from(document.querySelectorAll('img'))) {
			const src = img.currentSrc || img.src || img.getAttribute('data-src') || '';
			const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
			const alt = img.alt || '';
			const nw = img.naturalWidth || 0;
			const nh = img.naturalHeight || 0;
			results.push({ src, srcset, alt, nw, nh });
		}
		return results;
	});
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
	const urls = new Set();
	for (const { src, srcset, nw, nh } of imgs) {
		let u = src || pickBestFromSrcset(srcset);
		if (!u) continue;
		if (!/^https?:\/\//i.test(u)) continue;
		if (/\.svg(\?|$)/i.test(u)) continue;
		if ((nw && nh) && Math.max(nw, nh) < 200) continue;
		if (/google|doubleclick|adservice|creativecdn|collector|px-client/i.test(u)) continue;
		urls.add(u);
	}
	return Array.from(urls);
}

async function discoverInternalLinks(page) {
	const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href));
	const base = new URL(page.url());
	const out = [];
	for (const h of hrefs) {
		try {
			const u = new URL(h, base);
			if (u.origin !== base.origin) continue;
			const blocked = /(cuenta|login|ayuda|carro|carrito|checkout|pago|cart|signin|account)/i.test(u.pathname);
			if (!blocked) out.push(u.toString().split('#')[0]);
		} catch {}
	}
	return Array.from(new Set(out));
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

async function main() {
	const rl = readline.createInterface({ input: stdin, output: stdout });
	try {
		const inputUrl = (await rl.question('URL to scrape?: ')).trim();
		const url = await validateUrlReachable(inputUrl);
		const projectsPath = (await rl.question('Projects Path?: ')).trim();
		if (!projectsPath) throw new Error('Projects Path is required');
		const projectsAbs = path.isAbsolute(projectsPath) ? projectsPath : path.resolve(process.cwd(), projectsPath);
		if (!fs.existsSync(projectsAbs)) throw new Error(`Projects Path does not exist: ${projectsAbs}`);
		const scrapedRoot = path.join(projectsAbs, 'Scraped');
		const imagesDir = path.join(scrapedRoot, 'scraped_images');
		ensureDirSync(imagesDir);
		const logFile = path.join(scrapedRoot, 'scrape.log');
		const logger = createLogger(logFile);
		logger.info(`Starting scrape for ${url}`);
		const browser = await chromium.launch({ headless: true });
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
		});
		const page = await context.newPage();
		const visited = new Set();
		const frontier = [url];
		const maxPages = 100;
		const maxScrolls = 15;
		const downloaded = [];
		while (frontier.length && visited.size < maxPages) {
			const current = frontier.shift();
			if (visited.has(current)) continue;
			visited.add(current);
			logger.info(`[Page ${visited.size}] ${current}`);
			try {
				await page.goto(current, { waitUntil: 'domcontentloaded', timeout: 60000 });
				await dismissBanners(page);
				await autoScroll(page, maxScrolls);
				await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
				const productUrls = await extractImageUrls(page);
				logger.info(`\tfound images: ${productUrls.length}`);
				for (const imgUrl of productUrls) {
					let name = filenameFromUrl(imgUrl);
					let filePath = path.join(imagesDir, name);
					const ext = path.extname(filePath) || `.${extensionFromUrl(imgUrl)}`;
					const base = filePath.slice(0, -ext.length);
					let suffix = 1;
					while (fs.existsSync(filePath)) {
						filePath = `${base}-${suffix}${ext}`;
						suffix += 1;
					}
					try {
						await downloadWithContext(page, imgUrl, filePath);
						downloaded.push({ url: imgUrl, file: filePath });
						logger.info(`\t+ saved ${path.basename(filePath)}`);
					} catch (err) {
						logger.warn(`\t- skip ${imgUrl} (${err && err.message ? err.message : err})`);
					}
				}
				const links = await discoverInternalLinks(page);
				logger.info(`\tlinks queued: ${links.length}`);
				for (const l of links) if (!visited.has(l)) frontier.push(l);
			} catch (err) {
				logger.warn(`page error: ${err && err.message ? err.message : err}`);
			}
			await sleep(200);
		}
		const manifest = {
			startUrl: url,
			visitedPages: Array.from(visited),
			imagesSaved: downloaded.map((d) => ({ url: d.url, file: path.relative(scrapedRoot, d.file).split(path.sep).join('/') })),
			stats: { pages: visited.size, images: downloaded.length }
		};
		fs.writeFileSync(path.join(scrapedRoot, 'scrape-results.json'), JSON.stringify(manifest, null, 2));
		logger.info(`Done. Pages: ${visited.size}. Images saved: ${downloaded.length}.`);
		await browser.close();
		logger.close();
	} catch (err) {
		stdout.write(`Error: ${err && err.message ? err.message : err}\n`);
		process.exitCode = 1;
	} finally {
		try { await rl.close(); } catch {}
	}
}

if (require.main === module) {
	main();
}

