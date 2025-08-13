'use strict';

/**
 * Universal Product Scraper for Chilean Supermarkets
 * Extracts product data (name, image, price, description) with image organization
 * Supports: Líder, Jumbo, Santa Isabel, Unimarc
 * Future-ready for hardware store websites
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('@playwright/test');
const { ProductSchema, Categories, StoreConfigs } = require('./product-schema');

// Configuration
const CONFIG = {
  OUTPUT_DIR: process.env.OUTPUT_DIR || path.join(__dirname, '..', 'public', 'images', 'products'),
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, '..', 'data', 'products'),
  MAX_PAGES: Number(process.env.MAX_PAGES || 99999), // UNLIMITED PAGES
  MAX_PRODUCTS: Number(process.env.MAX_PRODUCTS || 999999), // UNLIMITED PRODUCTS
  CONCURRENT_DOWNLOADS: Number(process.env.CONCURRENT_DOWNLOADS || 5),
  MIN_IMAGE_BYTES: Number(process.env.MIN_IMAGE_BYTES || 10 * 1024), // 10KB
  STORE: process.env.STORE || 'lider', // lider, jumbo, santa_isabel, unimarc, tottus, easy, falabella, paris
  CATEGORIES: process.env.CATEGORIES ? process.env.CATEGORIES.split(',') : ['bebidas', 'snacks', 'lacteos'],
  VERBOSE: process.env.VERBOSE === '1' || process.env.VERBOSE === 'true',
  DRY_RUN: process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true',
  HEADLESS: !(process.env.HEADLESS === '0' || process.env.HEADLESS === 'false'),
  SEED_URLS: process.env.SEED_URLS ? process.env.SEED_URLS.split(',').map(u => u.trim()).filter(Boolean) : null,
  // Enhanced configuration for mass scraping
  MAX_RETRIES: Number(process.env.MAX_RETRIES || 3),
  RETRY_DELAY: Number(process.env.RETRY_DELAY || 5000),
  REQUEST_TIMEOUT: Number(process.env.REQUEST_TIMEOUT || 45000),
  SCROLL_DELAY: Number(process.env.SCROLL_DELAY || 2000),
  PROGRESS_INTERVAL: Number(process.env.PROGRESS_INTERVAL || 100), // Save progress every N products
  RESUME_FROM: process.env.RESUME_FROM || null // Resume from specific category or page
};

class UniversalProductScraper {
  constructor(storeName = CONFIG.STORE) {
    this.storeName = storeName;
    this.storeConfig = StoreConfigs[storeName];
    this.products = new Map();
    this.imageUrls = new Set();
    this.downloadQueue = [];
    this.failedProducts = new Map(); // Track failed scraping attempts
    this.retryQueue = []; // Products to retry
    this.progressFile = path.join(CONFIG.DATA_DIR, this.storeName, 'scraping-progress.json');
    this.categoryUrlMap = {}; // Discovered category -> URL mapping from homepage navigation
    this.capturedApiPayloads = [];
    
    // Performance optimization tracking
    this.performanceMetrics = {
      requestTimes: [],
      averageResponseTime: 0,
      failureRate: 0,
      rateLimitHits: 0,
      optimalDelay: this.storeConfig.rateLimit || 2000
    };
    
    // Intelligent rate limiting
    this.rateLimiter = {
      lastRequestTime: 0,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      currentDelay: this.storeConfig.rateLimit || 2000,
      minDelay: 1000,
      maxDelay: 10000
    };
    
    this.stats = {
      pagesVisited: 0,
      productsFound: 0,
      imagesDownloaded: 0,
      errors: 0,
      retries: 0,
      categoriesCompleted: 0,
      totalCategories: CONFIG.CATEGORIES.length,
      startTime: new Date().toISOString(),
      lastSaved: null,
      estimatedRemaining: null,
      averageProductsPerPage: 0,
      currentRequestsPerMinute: 0,
      peakMemoryUsage: 0
    };
    
    if (!this.storeConfig) {
      throw new Error(`Unknown store: ${storeName}. Available: ${Object.keys(StoreConfigs).join(', ')}`);
    }
  }

  log(...args) {
    if (CONFIG.VERBOSE) console.log(`[${this.storeName.toUpperCase()}]`, ...args);
  }

  info(...args) {
    console.log(`[${this.storeName.toUpperCase()}]`, ...args);
  }

  error(...args) {
    console.error(`[${this.storeName.toUpperCase()}]`, ...args);
    this.stats.errors++;
  }

  ensureDirectories() {
    const dirs = [
      CONFIG.OUTPUT_DIR,
      CONFIG.DATA_DIR,
      path.join(CONFIG.OUTPUT_DIR, this.storeName),
      path.join(CONFIG.OUTPUT_DIR, this.storeName, 'thumbs'),
      path.join(CONFIG.DATA_DIR, this.storeName)
    ];

    // Create category directories
    for (const categoryId of Object.keys(Categories)) {
      dirs.push(path.join(CONFIG.OUTPUT_DIR, categoryId));
      dirs.push(path.join(CONFIG.OUTPUT_DIR, categoryId, 'thumbs'));
    }

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateProductId(name, brand = '') {
    const text = `${brand} ${name}`.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Remove multiple hyphens
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
    
    return text || crypto.randomUUID().slice(0, 8);
  }

  sha1(input) {
    return crypto.createHash('sha1').update(input).digest('hex');
  }

  generateRandomUserAgent() {
    const versions = ['120.0.0.0', '119.0.0.0', '118.0.0.0', '117.0.0.0'];
    const osVersions = [
      'Windows NT 10.0; Win64; x64',
      'Windows NT 10.0; WOW64',
      'X11; Linux x86_64',
      'Macintosh; Intel Mac OS X 10_15_7'
    ];
    
    const version = versions[Math.floor(Math.random() * versions.length)];
    const osVersion = osVersions[Math.floor(Math.random() * osVersions.length)];
    
    return `Mozilla/5.0 (${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
  }

  async simulateHumanBehavior(page) {
    try {
      // Random mouse movements
      await page.mouse.move(
        Math.random() * 100 + 100,
        Math.random() * 100 + 100
      );
      
      // Random scroll behavior
      await page.mouse.wheel(0, Math.random() * 300 + 100);
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
      
      // Simulate reading time
      await this.page.waitForTimeout(Math.random() * 2000 + 1000);
      
    } catch (e) {
      // Ignore errors in human simulation
    }
  }

  async humanLikeNavigation(url) {
    try {
      // Apply intelligent rate limiting
      await this.applyIntelligentRateLimit();
      
      const startTime = Date.now();
      
      // Simulate typing URL or clicking
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
      
      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: CONFIG.REQUEST_TIMEOUT
      });
      
      // Track performance metrics
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(response, responseTime);
      
      // Simulate reading and scanning page
      await this.simulateHumanBehavior(this.page);
      
      return response;
    } catch (error) {
      this.updatePerformanceMetrics(null, 0, error);
      throw error;
    }
  }

  async applyIntelligentRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimiter.lastRequestTime;
    
    // Calculate required delay based on current conditions
    let requiredDelay = this.rateLimiter.currentDelay;
    
    // If we need to wait, implement the delay
    if (timeSinceLastRequest < requiredDelay) {
      const remainingDelay = requiredDelay - timeSinceLastRequest;
      this.log(`Intelligent rate limit: waiting ${Math.round(remainingDelay)}ms`);
      await this.page.waitForTimeout(remainingDelay);
    }
    
    this.rateLimiter.lastRequestTime = Date.now();
    
    // Update requests per minute tracking
    this.updateRequestsPerMinute();
  }

  updatePerformanceMetrics(response, responseTime, error = null) {
    const metrics = this.performanceMetrics;
    
    if (error) {
      // Handle error scenarios
      this.rateLimiter.consecutiveFailures++;
      this.rateLimiter.consecutiveSuccesses = 0;
      
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        metrics.rateLimitHits++;
        // Increase delay significantly for rate limits
        this.rateLimiter.currentDelay = Math.min(
          this.rateLimiter.currentDelay * 2.5, 
          this.rateLimiter.maxDelay
        );
        this.log(`Rate limit hit. Increased delay to ${this.rateLimiter.currentDelay}ms`);
      } else {
        // Moderate increase for other errors
        this.rateLimiter.currentDelay = Math.min(
          this.rateLimiter.currentDelay * 1.3, 
          this.rateLimiter.maxDelay
        );
      }
    } else {
      // Handle successful requests
      this.rateLimiter.consecutiveSuccesses++;
      this.rateLimiter.consecutiveFailures = 0;
      
      if (response) {
        metrics.requestTimes.push(responseTime);
        
        // Keep only last 100 response times for rolling average
        if (metrics.requestTimes.length > 100) {
          metrics.requestTimes.shift();
        }
        
        metrics.averageResponseTime = metrics.requestTimes.reduce((a, b) => a + b, 0) / metrics.requestTimes.length;
        
        // Adaptive delay optimization
        if (this.rateLimiter.consecutiveSuccesses >= 5 && responseTime < 2000) {
          // Decrease delay if we're having consistent success with fast responses
          this.rateLimiter.currentDelay = Math.max(
            this.rateLimiter.currentDelay * 0.9,
            this.rateLimiter.minDelay
          );
        } else if (responseTime > 5000) {
          // Increase delay if responses are slow
          this.rateLimiter.currentDelay = Math.min(
            this.rateLimiter.currentDelay * 1.2,
            this.rateLimiter.maxDelay
          );
        }
      }
    }
    
    // Update failure rate
    const totalRequests = metrics.requestTimes.length + this.stats.errors;
    metrics.failureRate = totalRequests > 0 ? (this.stats.errors / totalRequests) : 0;
    
    // Update memory usage tracking
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage, memUsage.heapUsed);
    }
  }

  updateRequestsPerMinute() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Initialize requests tracking if not exists
    if (!this.requestTimestamps) {
      this.requestTimestamps = [];
    }
    
    // Add current request
    this.requestTimestamps.push(now);
    
    // Remove requests older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    
    // Update current requests per minute
    this.stats.currentRequestsPerMinute = this.requestTimestamps.length;
    
    // Log warning if requests per minute is too high
    if (this.stats.currentRequestsPerMinute > 30) {
      this.log(`Warning: High request rate detected (${this.stats.currentRequestsPerMinute} requests/min)`);
    }
  }

  getOptimalBatchSize() {
    // Calculate optimal batch size based on success rate and response times
    const baseSize = CONFIG.CONCURRENT_DOWNLOADS;
    const successRate = 1 - this.performanceMetrics.failureRate;
    const avgResponseTime = this.performanceMetrics.averageResponseTime;
    
    let optimalSize = baseSize;
    
    // Reduce batch size if high failure rate
    if (successRate < 0.8) {
      optimalSize = Math.max(1, Math.floor(baseSize * 0.5));
    } else if (successRate > 0.95 && avgResponseTime < 1000) {
      // Increase batch size if very successful and fast
      optimalSize = Math.min(10, Math.floor(baseSize * 1.5));
    }
    
    return optimalSize;
  }

  async optimizeMemoryUsage() {
    try {
      // Clear old API payloads if we have too many
      if (this.capturedApiPayloads.length > 50) {
        this.capturedApiPayloads = this.capturedApiPayloads.slice(-25);
        this.log('Cleared old API payloads to optimize memory');
      }
      
      // Clear old performance metrics
      if (this.performanceMetrics.requestTimes.length > 100) {
        this.performanceMetrics.requestTimes = this.performanceMetrics.requestTimes.slice(-50);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.log('Performed garbage collection');
      }
      
    } catch (e) {
      this.log('Memory optimization warning:', e.message);
    }
  }

  async setupBrowser() {
    const retryCount = 3;
    let attempt = 0;
    
    while (attempt < retryCount) {
      try {
        // Randomize viewport and fingerprint
        const viewports = [
          { width: 1920, height: 1080 },
          { width: 1366, height: 768 },
          { width: 1440, height: 900 },
          { width: 1536, height: 864 },
          { width: 1280, height: 720 }
        ];
        const viewport = viewports[Math.floor(Math.random() * viewports.length)];
        
        this.browser = await chromium.launch({ 
          headless: CONFIG.HEADLESS,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-ipc-flooding-protection',
            '--lang=es-CL',
            `--window-size=${viewport.width},${viewport.height}`,
            '--start-maximized'
          ]
        });
        
        // Enhanced fingerprinting evasion
        this.context = await this.browser.newContext({
          userAgent: this.generateRandomUserAgent(),
          viewport: viewport,
          locale: 'es-CL',
          timezoneId: 'America/Santiago',
          ignoreHTTPSErrors: true,
          bypassCSP: true,
          javaScriptEnabled: true,
          extraHTTPHeaders: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'DNT': '1'
          }
        });
        
        this.page = await this.context.newPage();
        
        // Advanced stealth and fingerprint evasion
        await this.page.addInitScript(() => {
          // Remove webdriver property
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
          });
          
          // Add chrome object for better Chrome simulation
          if (!window.chrome) {
            window.chrome = {
              runtime: {},
              loadTimes: function() { return {}; },
              csi: function() { return {}; },
              app: {}
            };
          }
          
          // Override navigator properties for Chilean market
          Object.defineProperties(navigator, {
            languages: {
              get: () => ['es-CL', 'es', 'en-US', 'en'],
              configurable: true
            },
            platform: {
              get: () => Math.random() > 0.5 ? 'Win32' : 'Linux x86_64',
              configurable: true
            },
            hardwareConcurrency: {
              get: () => Math.floor(Math.random() * 8) + 2,
              configurable: true
            },
            deviceMemory: {
              get: () => Math.pow(2, Math.floor(Math.random() * 3) + 2),
              configurable: true
            }
          });
          
          // Mock permissions API
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
              Promise.resolve({ state: Notification.permission }) :
              originalQuery(parameters)
          );
          
          // Mock plugin detection
          Object.defineProperty(navigator, 'plugins', {
            get: () => {
              const plugins = [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                { name: 'Native Client', filename: 'internal-nacl-plugin' }
              ];
              return Object.setPrototypeOf(plugins, PluginArray.prototype);
            },
            configurable: true
          });
          
          // Override screen properties with realistic values
          Object.defineProperties(screen, {
            availWidth: { get: () => window.innerWidth || 1920 },
            availHeight: { get: () => window.innerHeight || 1080 },
            colorDepth: { get: () => 24 },
            pixelDepth: { get: () => 24 }
          });
          
          // Mock connection for Chilean internet speeds
          Object.defineProperty(navigator, 'connection', {
            get: () => ({
              effectiveType: '4g',
              downlink: Math.random() * 10 + 5, // 5-15 Mbps
              rtt: Math.random() * 50 + 20 // 20-70ms latency
            }),
            configurable: true
          });
          
          // Override Date to avoid timezone detection
          const originalDate = Date;
          const timezone = 'America/Santiago';
          Date = class extends originalDate {
            constructor(...args) {
              if (args.length === 0) {
                super();
              } else {
                super(...args);
              }
            }
            getTimezoneOffset() {
              return 180; // Chilean timezone offset
            }
          };
          Date.now = originalDate.now;
          Date.parse = originalDate.parse;
          Date.UTC = originalDate.UTC;
          
          // Add realistic localStorage and sessionStorage fingerprints
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
          } catch (e) {}
          
          // Mock WebGL for fingerprint evasion
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
            if (parameter === 37446) return 'Intel(R) HD Graphics'; // UNMASKED_RENDERER_WEBGL
            return getParameter.apply(this, arguments);
          };
        });
        
        // Enhanced timeouts for mass scraping
        this.page.setDefaultTimeout(CONFIG.REQUEST_TIMEOUT);
        this.page.setDefaultNavigationTimeout(CONFIG.REQUEST_TIMEOUT * 2);

          // Reduce noise and blocking by aborting tracker/analytics/ads requests
          const blockedPatterns = [
            'doubleclick.net',
            'googletagmanager.com',
            'google-analytics.com',
            'analytics.google.com',
            'bat.bing.com',
            'px-cloud.net',
            'px-cdn.net',
            'visualwebsiteoptimizer.com',
            'facebook.com',
            'securepubads.g.doubleclick.net',
            'optimizely.com',
            'hotjar.com',
            'newrelic.com',
            'segment.com'
          ];
          await this.page.route('**/*', (route) => {
            const url = route.request().url();
            // Do not block recaptcha or captcha endpoints
            if (/recaptcha|captcha/i.test(url)) {
              return route.continue();
            }
            if (blockedPatterns.some(p => url.includes(p))) {
              return route.abort();
            }
            return route.continue();
          });
        
        // Handle page errors gracefully
        this.page.on('pageerror', (error) => {
          this.log('Page error:', error.message);
        });
        
        this.page.on('requestfailed', (request) => {
          this.log('Request failed:', request.url(), request.failure()?.errorText);
        });
          // Capture JSON API responses for fallback extraction
          this.page.on('response', async (response) => {
            try {
              const url = response.url();
              const headers = response.headers();
              const ct = headers && (headers['content-type'] || headers['Content-Type'] || '');
              if (typeof ct === 'string' && !/json/i.test(ct)) return;
              if (!/(bff|catalog|plp|products|api|graphql|_next\/data)/i.test(url)) return;
              const json = await response.json();
              this.capturedApiPayloads.push({ url, json });
            } catch {}
          });
        
        return; // Success, exit retry loop
        
      } catch (error) {
        attempt++;
        this.error(`Browser setup attempt ${attempt}/${retryCount} failed:`, error.message);
        
        if (this.browser) {
          try {
            await this.browser.close();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
        if (attempt >= retryCount) {
          throw new Error(`Failed to setup browser after ${retryCount} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      }
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async dismissBanners() {
    const selectors = [
      'button:has-text("Aceptar")',
      'button:has-text("Entendido")',
      'button:has-text("Aceptar todas")',
      'button:has-text("Cerrar")',
      '[aria-label="Cerrar"]',
      'button[aria-label="close" i]',
      '.modal-close',
      '.cookie-accept',
      '.banner-close'
    ];

    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          await element.click({ timeout: 1000 });
          await this.page.waitForTimeout(500);
          this.log('Dismissed banner:', selector);
        }
      } catch (e) {
        // Continue if banner dismissal fails
      }
    }
  }

  // Navigate from homepage and collect real category URLs by interacting with menus
  async discoverCategoryUrlsFromHomepage(targetCategory) {
    const discovered = new Set();
    try {
      const home = this.storeConfig.baseUrl;
      this.log(`Navigating to homepage: ${home}`);
      const resp = await this.page.goto(home, { waitUntil: 'domcontentloaded', timeout: CONFIG.REQUEST_TIMEOUT });
      if (!resp || !resp.ok()) return [];
      await this.dismissBanners();
      await this.page.waitForTimeout(1200);

      // Try to open category menus
      const menuSelectors = [
        'button[aria-label*="categoria" i]',
        'button:has-text("Todas las categorías")',
        'a:has-text("Supermercado")',
        '[data-testid*="menu" i]'
      ];
      for (const sel of menuSelectors) {
        try { const el = await this.page.$(sel); if (el) { await el.click({ timeout: 800 }); await this.page.waitForTimeout(400); } } catch {}
      }

      // Harvest anchors likely related to bebidas
      const anchors = await this.page.evaluate((cat) => {
        const texts = [cat.toLowerCase(), 'bebidas', 'bebidas y licores', 'bebidas-aguas-y-jugos', 'gaseosas', 'aguas', 'jugos'];
        const as = Array.from(document.querySelectorAll('a[href]'));
        const out = [];
        for (const a of as) {
          const href = a.getAttribute('href') || '';
          const t = (a.textContent || '').toLowerCase();
          if (texts.some(x => t.includes(x)) || /bebidas|gaseosas|aguas|jugos/.test(href)) {
            try { out.push(new URL(href, location.href).toString()); } catch {}
          }
        }
        return Array.from(new Set(out));
      }, targetCategory || 'bebidas');
      anchors.forEach(u => discovered.add(u));

      // Follow one candidate and collect subcategory links
      const candidate = [...discovered].find(u => /bebidas|gaseosas|aguas|jugos/i.test(u)) || [...discovered][0];
      if (candidate) {
        const r2 = await this.page.goto(candidate, { waitUntil: 'domcontentloaded', timeout: CONFIG.REQUEST_TIMEOUT });
        if (r2 && r2.ok()) {
          await this.dismissBanners();
          await this.page.waitForTimeout(800);
          const subs = await this.page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href]'))
              .map(a => a.getAttribute('href') || '')
              .map(href => { try { return new URL(href, location.href).toString(); } catch { return ''; } })
              .filter(Boolean)
              .filter(u => /bebidas|gaseosas|aguas|jugos|categoria/i.test(u));
          });
          subs.forEach(u => discovered.add(u));
        }
      }

      const baseHost = new URL(this.storeConfig.baseUrl).host;
      return [...new Set([...discovered].filter(u => {
        try { return new URL(u).host === baseHost; } catch { return false; }
      }))];
    } catch (e) {
      this.log('Homepage discovery failed:', e.message);
      return [];
    }
  }

  async autoScroll(maxScrolls = 50) { // Increased for complete scraping
    let previousHeight = 0;
    let scrollCount = 0;
    let stableCount = 0;
    const maxStable = 3; // Stop after 3 stable scrolls

    while (scrollCount < maxScrolls && stableCount < maxStable) {
      try {
        const currentHeight = await this.page.evaluate(() => {
          // Scroll and wait for any lazy-loaded content
          window.scrollBy(0, window.innerHeight);
          return document.body.scrollHeight;
        });
        
        if (currentHeight === previousHeight) {
          stableCount++;
          this.log(`Height stable (${stableCount}/${maxStable})`);
        } else {
          stableCount = 0; // Reset counter if height changes
        }

        await this.page.waitForTimeout(CONFIG.SCROLL_DELAY);

          // Trigger lazy-load events in-page
          await this.page.evaluate(() => {
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
          });
        
        previousHeight = currentHeight;
        scrollCount++;
        
        this.log(`Scroll ${scrollCount}/${maxScrolls} (height: ${currentHeight})`);
        
      } catch (error) {
        this.error('Scroll error:', error.message);
        break;
      }
    }
    
    this.log(`Scrolling complete: ${scrollCount} scrolls, final height: ${previousHeight}`);
  }

  async extractProductData() {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        return await this.page.evaluate((storeConfig) => {
          const products = [];
          const selectors = storeConfig.selectors;

          // Helper function to try multiple selectors (array or string)
          function trySelectors(element, selectorList, findAll = false) {
            const selectorsToTry = Array.isArray(selectorList) ? selectorList : [selectorList];
            
            for (const selector of selectorsToTry) {
              try {
                if (findAll) {
                  const elements = Array.from(element.querySelectorAll(selector));
                  if (elements.length > 0) return elements;
                } else {
                  const element_ = element.querySelector(selector);
                  if (element_) return element_;
                }
              } catch (e) {
                continue;
              }
            }
            return findAll ? [] : null;
          }

          // Find all product containers with enhanced selector strategies
          let productCards = [];
          const selectorSets = [
            ...((Array.isArray(selectors.productCard) ? selectors.productCard : [selectors.productCard])),
            'article[class*="product"]',
            '.product-card',
            '.product-item',
            '.product',
            '[data-testid*="product"]',
            '[data-test*="product"]',
            '[class*="Product"]',
            '.item'
          ];
          
          for (const selectorSet of selectorSets) {
            try {
              const cards = Array.from(document.querySelectorAll(selectorSet));
              if (cards.length > productCards.length) {
                productCards = cards;
                console.log(`Best selector found: "${selectorSet}" with ${cards.length} products`);
                break;
              }
            } catch (e) {
              continue;
            }
          }
          
          console.log(`Found ${productCards.length} product cards using enhanced selectors`);
          
          // Process all products (no limit for complete scraping)
          for (let i = 0; i < productCards.length; i++) {
            const card = productCards[i];
            try {
              const product = { index: i };

              // Extract name with enhanced fallbacks
              const nameSelectors = [
                ...(Array.isArray(selectors.productName) ? selectors.productName : [selectors.productName]),
                'h1[class*="product"]',
                'h2[class*="product"]',
                'h3[class*="product"]',
                '[data-testid*="name"]',
                '[data-testid*="title"]',
                '.title',
                '.name',
                '.product-name',
                '.product-title',
                '[class*="ProductName"]',
                '[class*="Title"]',
                'a[title]',
                '[title]'
              ];
              
              const nameElement = trySelectors(card, nameSelectors);
              product.name = nameElement?.textContent?.trim() || 
                           nameElement?.getAttribute('title')?.trim() || 
                           card.getAttribute('title')?.trim() || '';

              // Extract price with enhanced pattern matching
              const priceSelectors = [
                ...(Array.isArray(selectors.price) ? selectors.price : [selectors.price]),
                '[data-testid*="price"]',
                '[class*="price"]',
                '[class*="Price"]',
                '.precio',
                '.cost',
                '.value',
                '[data-cy*="price"]',
                '[aria-label*="price" i]',
                '[aria-label*="precio" i]'
              ];
              
              const priceElement = trySelectors(card, priceSelectors);
              let priceText = priceElement?.textContent?.trim() || '';
              
              // Enhanced price extraction with Chilean peso patterns
              const pricePatterns = [
                /\$\s*([\d.,]+)/,           // $1.234
                /([\d.,]+)\s*pesos?/i,      // 1234 pesos
                /CLP\s*([\d.,]+)/i,         // CLP 1234
                /([\d.,]+)\s*\$/,           // 1234$
                /([\d.,]+)/                 // Just numbers
              ];
              
              let price = 0;
              for (const pattern of pricePatterns) {
                const match = priceText.match(pattern);
                if (match) {
                  const cleanPrice = match[1].replace(/[.,]/g, '');
                  const numPrice = parseInt(cleanPrice);
                  if (numPrice > 0 && numPrice < 10000000) { // Reasonable price range
                    price = numPrice;
                    break;
                  }
                }
              }
              product.price = price;

              // Extract image with comprehensive fallbacks
              const imgSelectors = [
                ...(Array.isArray(selectors.image) ? selectors.image : [selectors.image]),
                'img[src*="product"]',
                'img[src*="imagen"]',
                'img[src*="item"]',
                'img[data-src*="product"]',
                'img[data-lazy-src]',
                'img[class*="product"]',
                'img[class*="Product"]',
                'picture img',
                'figure img',
                '.product-image img',
                '[class*="ProductImage"] img',
                'img:not([src*="icon"]):not([src*="logo"]):not([width="1"])',
                'img'
              ];
              
              let bestImg = null;
              let bestSize = 0;
              
              for (const selector of imgSelectors) {
                const imgs = trySelectors(card, [selector], true);
                
                for (const img of imgs) {
                  const width = parseInt(img.getAttribute('width')) || img.offsetWidth || 0;
                  const height = parseInt(img.getAttribute('height')) || img.offsetHeight || 0;
                  const size = width * height;
                  
                  const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                  if (size > bestSize && src && !src.includes('data:image') && src.length > 10) {
                    bestImg = img;
                    bestSize = size;
                  }
                }
                
                if (bestImg) break;
              }
              
              if (bestImg) {
                product.imageUrl = bestImg.src || 
                                  bestImg.getAttribute('data-src') || 
                                  bestImg.getAttribute('data-lazy-src') || 
                                  bestImg.getAttribute('srcset')?.split(',')[0]?.trim().split(' ')[0];
                
                // Convert relative URLs to absolute
                if (product.imageUrl && !product.imageUrl.startsWith('http')) {
                  try {
                    product.imageUrl = new URL(product.imageUrl, location.href).toString();
                  } catch (e) {
                    product.imageUrl = '';
                  }
                }
              }

              // Extract description
              const descSelectors = [
                ...(Array.isArray(selectors.description) ? selectors.description : [selectors.description]),
                '[data-testid*="description"]',
                '[data-testid*="desc"]',
                '.product-description',
                '.description',
                '.desc',
                '[class*="Description"]',
                '.product-details',
                '.summary',
                '.details',
                '.info'
              ];
              
              const descElement = trySelectors(card, descSelectors);
              product.description = descElement?.textContent?.trim() || product.name;

              // Extract brand
              const brandSelectors = [
                ...(Array.isArray(selectors.brand) ? selectors.brand : [selectors.brand]),
                '[data-testid*="brand"]',
                '[data-testid*="marca"]',
                '.brand',
                '.marca',
                '.manufacturer',
                '[class*="brand"]',
                '[class*="Brand"]',
                '[class*="marca"]',
                '.brand-name'
              ];
              
              const brandElement = trySelectors(card, brandSelectors);
              product.brand = brandElement?.textContent?.trim() || '';

              // Extract source URL
              const linkElement = card.querySelector('a[href]') || card.closest('a[href]');
              product.sourceUrl = linkElement ? new URL(linkElement.href, location.href).toString() : location.href;

              // Include products with name and either price or image
              if (product.name && product.name.length > 2 && (product.price > 0 || product.imageUrl)) {
                products.push(product);
              }
              
            } catch (e) {
              console.log(`Error extracting product ${i}:`, e.message);
            }
          }

          console.log(`Extracted ${products.length} valid products from ${productCards.length} cards`);
          return products;
        }, this.storeConfig);
        
      } catch (error) {
        attempt++;
        this.error(`Product extraction attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt >= maxRetries) {
          this.error('Failed to extract products after maximum retries');
          return [];
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  categorizeProduct(name, description, brand = '') {
    const text = `${name} ${description} ${brand}`.toLowerCase();
    
    // Food categories
    if (/gaseosa|cola|fanta|sprite|bebida|jugo|agua/.test(text)) return 'bebidas';
    if (/pan|hallulla|marraqueta|cereal|avena/.test(text)) return 'panaderia';
    if (/carne|pollo|pescado|jamon|salchicha/.test(text)) return 'carnes';
    if (/leche|queso|yogurt|mantequilla/.test(text)) return 'lacteos';
    if (/papas|chocolate|dulce|galleta|snack/.test(text)) return 'snacks';
    if (/detergente|jabon|shampoo|pasta|dientes/.test(text)) return 'aseo';
    
    // Hardware categories
    if (/martillo|destornillador|llave|herramienta|taladro/.test(text)) return 'herramientas';
    if (/tornillo|tuerca|clavo|bisagra/.test(text)) return 'ferreteria';
    if (/cemento|ladrillo|madera|tubo/.test(text)) return 'construccion';
    if (/cable|enchufe|foco|lampara|electr/.test(text)) return 'electricidad';
    if (/semilla|fertilizante|planta|tierra|maceta/.test(text)) return 'jardineria';
    if (/pintura|barniz|brocha|rodillo/.test(text)) return 'pinturas';
    if (/tuber[ií]a|grifo|ducha|bomba|plomer/.test(text)) return 'plomeria';

    return 'hogar'; // Default category
  }

  async processProduct(rawProduct) {
    if (!rawProduct.name || !rawProduct.name.trim()) return null;

    const category = this.categorizeProduct(rawProduct.name, rawProduct.description, rawProduct.brand);
    const productId = this.generateProductId(rawProduct.name, rawProduct.brand);
    const now = new Date().toISOString();

    const product = {
      id: productId,
      name: rawProduct.name.trim(),
      brand: rawProduct.brand?.trim() || '',
      category: category,
      price: rawProduct.price || 0,
      currency: 'CLP',
      description: rawProduct.description?.trim() || rawProduct.name,
      shortDescription: rawProduct.name.length > 50 ? 
        rawProduct.name.substring(0, 47) + '...' : rawProduct.name,
      
      // Images (will be set after download)
      imageUrl: '',
      thumbnailUrl: '',
      
      // Default values
      stock: Math.floor(Math.random() * 100) + 10, // Random stock for demo
      inStock: true,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      reviewCount: Math.floor(Math.random() * 200),
      popularity: Math.floor(Math.random() * 100) + 1,
      
      // Store info
      store: {
        name: this.storeName,
        url: rawProduct.sourceUrl || '',
        scraped: now,
        section: category
      },
      
      // Metadata
      tags: this.generateTags(rawProduct.name, rawProduct.description),
      origin: 'Chile',
      
      createdAt: now,
      updatedAt: now
    };

      // Queue image for download
      if (rawProduct.imageUrl) {
        this.downloadQueue.push({
          url: rawProduct.imageUrl,
          productId: productId,
          category: category
        });
      }

      return product;
    }

    async gotoAndPrepare(url, maxRetries = 3) {
      let attempt = 0;
      let lastError = null;
      
      while (attempt < maxRetries) {
        try {
          this.log(`Navigating to ${url} (attempt ${attempt + 1}/${maxRetries})`);
          
          // Use human-like navigation with randomized timing
          const response = await this.humanLikeNavigation(url);
          
          if (!response) {
            throw new Error('No response received');
          }
          
          const status = response.status();
          this.log(`Response status: ${status}`);
          
          // Handle different HTTP status codes
          if (status === 403 || status === 429) {
            this.log('Rate limited or blocked. Implementing backoff strategy...');
            const backoffTime = Math.min(60000 * Math.pow(2, attempt), 300000); // Max 5 min
            await this.page.waitForTimeout(backoffTime);
            throw new Error(`HTTP ${status}: Rate limited or blocked`);
          }
          
          if (status === 404) {
            this.log('Page not found, skipping...');
            return null;
          }
          
          if (status >= 500) {
            throw new Error(`Server error: HTTP ${status}`);
          }
          
          if (status !== 200 && status !== 304) {
            throw new Error(`Unexpected status code: ${status}`);
          }
          
          // Wait for page to stabilize
          await this.page.waitForTimeout(Math.random() * 2000 + 1000);
          
          // Best-effort banner dismissal with multiple attempts
          try {
            await this.dismissBanners();
            await this.page.waitForTimeout(500);
          } catch (e) {
            this.log('Banner dismissal failed:', e.message);
          }
          
          // Enhanced bot detection with fallback strategies
          const captchaDetected = await this.detectAndHandleCaptcha();
          if (captchaDetected && attempt < maxRetries - 1) {
            throw new Error('CAPTCHA detected, retrying with different strategy');
          }
          
          // Verify page loaded correctly
          const pageLoaded = await this.verifyPageLoad();
          if (!pageLoaded && attempt < maxRetries - 1) {
            throw new Error('Page did not load correctly');
          }
          
          return response;
          
        } catch (error) {
          lastError = error;
          attempt++;
          this.error(`Navigation attempt ${attempt} failed:`, error.message);
          
          if (attempt >= maxRetries) {
            break;
          }
          
          // Implement intelligent backoff strategy
          const backoffTime = this.calculateBackoffTime(attempt, error);
          this.log(`Retrying in ${Math.round(backoffTime / 1000)} seconds...`);
          await this.page.waitForTimeout(backoffTime);
          
          // Try changing user agent and viewport for next attempt
          if (attempt === 1) {
            await this.rotateUserAgent();
          }
        }
      }
      
      throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    }

    calculateBackoffTime(attempt, error) {
      const baseDelay = CONFIG.RETRY_DELAY;
      
      // Adjust delay based on error type
      let multiplier = 1;
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        multiplier = 3; // Longer delay for rate limiting
      } else if (error.message.includes('timeout')) {
        multiplier = 1.5; // Moderate delay for timeouts
      } else if (error.message.includes('CAPTCHA')) {
        multiplier = 4; // Much longer delay for CAPTCHA
      }
      
      // Exponential backoff with jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1) * multiplier;
      const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
      
      return Math.min(exponentialDelay + jitter, 300000); // Max 5 minutes
    }

    async rotateUserAgent() {
      try {
        const newUserAgent = this.generateRandomUserAgent();
        await this.page.setExtraHTTPHeaders({
          'User-Agent': newUserAgent
        });
        this.log('Rotated user agent for retry');
      } catch (e) {
        this.log('Failed to rotate user agent:', e.message);
      }
    }

    async detectAndHandleCaptcha() {
      try {
        const captchaIndicators = [
          'captcha',
          'recaptcha',
          'hcaptcha',
          'blocked',
          'suspicious activity',
          'verify you are human',
          'please complete the security check',
          'access denied'
        ];
        
        const pageText = await this.page.textContent('body').catch(() => '');
        const url = this.page.url();
        
        // Check URL for captcha indicators
        const urlHasCaptcha = captchaIndicators.some(indicator => 
          url.toLowerCase().includes(indicator)
        );
        
        // Check page content for captcha indicators
        const contentHasCaptcha = captchaIndicators.some(indicator => 
          pageText.toLowerCase().includes(indicator)
        );
        
        // Check for captcha iframes
        const captchaFrames = await this.page.$$('iframe[src*="captcha"], iframe[src*="recaptcha"]');
        
        const captchaDetected = urlHasCaptcha || contentHasCaptcha || captchaFrames.length > 0;
        
        if (captchaDetected) {
          this.log('CAPTCHA/Anti-bot detection triggered. Implementing evasion strategy...');
          
          // Implement evasion strategies
          await this.page.waitForTimeout(Math.random() * 30000 + 30000); // 30-60s delay
          
          // Try to clear cookies and restart
          await this.context.clearCookies();
          
          return true;
        }
        
        return false;
      } catch (e) {
        this.log('CAPTCHA detection failed:', e.message);
        return false;
      }
    }

    async verifyPageLoad() {
      try {
        // Check if page has content
        const bodyContent = await this.page.textContent('body');
        if (!bodyContent || bodyContent.trim().length < 100) {
          return false;
        }
        
        // Check for error pages
        const errorIndicators = [
          'error 404',
          'page not found',
          'access denied',
          'temporarily unavailable',
          'maintenance'
        ];
        
        const hasErrors = errorIndicators.some(indicator => 
          bodyContent.toLowerCase().includes(indicator)
        );
        
        return !hasErrors;
      } catch (e) {
        this.log('Page verification failed:', e.message);
        return false;
      }
    }

    // Discover category URLs by actually navigating the homepage and reading the menu links
    async discoverCategoryUrlsFromHomepage(targetCategory = null) {
      try {
        const baseUrl = this.storeConfig.baseUrl;
        await this.gotoAndPrepare(baseUrl);

        // Give menus time to hydrate
        await this.page.waitForTimeout(1500);

        // Expand common menu toggles if present
        const menuSelectors = [
          'button[aria-label*="menu" i]',
          'button[aria-haspopup="menu"]',
          'button:has-text("Categorías")',
          '[data-testid*="menu" i]',
          '[role="navigation"] button'
        ];
        for (const sel of menuSelectors) {
          try {
            const has = await this.page.$(sel);
            if (has) {
              await has.click({ timeout: 1000 }).catch(() => {});
              await this.page.waitForTimeout(500);
            }
          } catch {}
        }

        // Build synonyms to improve matching across sites
        const categorySynonyms = {
          bebidas: ['bebida', 'bebidas', 'aguas', 'jugos', 'cervezas', 'gaseosas'],
          snacks: ['snack', 'snacks', 'galletas', 'dulces', 'chocolates'],
          lacteos: ['lacteos', 'lácteos', 'leche', 'yogurt', 'queso'],
          carnes: ['carnes', 'pollo', 'cerdo', 'vacuno', 'pescados'],
          panaderia: ['pan', 'panadería', 'panaderia', 'bolleria'],
          aseo: ['aseo', 'limpieza', 'hogar limpieza'],
          hogar: ['hogar', 'cocina', 'menaje', 'organización']
        };

        // Extract all links from nav and page body
        const anchors = await this.page.$$eval('a[href]', nodes =>
          nodes.map(a => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim().toLowerCase() }))
        );

        // Normalize to absolute URLs and match per category
        const toAbsolute = (href) => {
          try {
            if (!href) return null;
            if (href.startsWith('http')) return href;
            if (href.startsWith('//')) return new URL(`${location.protocol}${href}`).toString();
            if (href.startsWith('/')) return new URL(href, baseUrl).toString();
            return new URL(`/${href}`, baseUrl).toString();
          } catch { return null; }
        };

        const absAnchors = anchors
          .map(a => ({ href: toAbsolute(a.href), text: a.text }))
          .filter(a => a.href && a.href.startsWith(baseUrl) && !a.href.endsWith('/#') && !a.href.endsWith('#'));

        for (const category of CONFIG.CATEGORIES) {
          const synonyms = categorySynonyms[category] || [category];
          // Prefer URLs that look like PLP/category pages
          const ranked = absAnchors
            .filter(a => synonyms.some(s => a.href.toLowerCase().includes(s) || a.text.includes(s)))
            .sort((a, b) => {
              const score = (u) => {
                let s = 0;
                if (/categoria|category|plp|productos/.test(u.href)) s += 5;
                if (new URL(u.href).pathname.split('/').length <= 5) s += 2; // shorter path
                if (u.text && u.text.length > 0) s += 1;
                return s;
              };
              return score(b) - score(a);
            });

          if (ranked.length > 0) {
            this.categoryUrlMap[category] = ranked[0].href;
          }
        }

        const discovered = Object.entries(this.categoryUrlMap).length;
        if (discovered > 0) {
          this.info(`Discovered ${discovered} category URLs from homepage navigation`);
        } else {
          this.log('No category URLs discovered from homepage');
        }

        if (targetCategory) {
          const url = this.categoryUrlMap[targetCategory];
          return url ? [url] : [];
        }
        return Object.values(this.categoryUrlMap);
      } catch (error) {
        this.log('Category discovery failed:', error.message);
      }
    }

    async isCaptchaPage() {
      try {
        const url = this.page.url();
        if (/captcha|blocked|perimeterx|px-cdn|px-cloud/i.test(url)) return true;
        const hasCaptcha = await this.page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          if (text.includes("no soy un robot") || text.includes("i'm not a robot") || text.includes('captcha')) return true;
          const iframes = Array.from(document.querySelectorAll('iframe[src]')).map(f => f.getAttribute('src') || '');
          return iframes.some(src => /recaptcha|hcaptcha|captcha/i.test(src));
        });
        return !!hasCaptcha;
      } catch {
        return false;
      }
    }

    async clickNextIfAvailable() {
      try {
        const candidates = [
          'a[rel="next"]',
          'button[aria-label*="siguiente" i]',
          'a[aria-label*="siguiente" i]',
          'button:has-text("Siguiente")',
          'a:has-text("Siguiente")',
          '.pagination-next a',
          '.pagination .next a',
          '.next a',
          '.next button',
          'button[aria-label="Next"]',
          'a[aria-label="Next"]'
        ];
        for (const sel of candidates) {
          const el = await this.page.$(sel);
          if (el) {
            try {
              await el.click({ timeout: 1500 });
              await this.page.waitForTimeout(1200);
              await this.dismissBanners();
              return true;
            } catch {}
          }
        }
        return false;
      } catch {
        return false;
      }
    }

  generateTags(name, description) {
    const text = `${name} ${description}`.toLowerCase();
    const tags = [];
    
    // Common food tags
    const foodTags = {
      'familiar': /familiar|grande|1\.5l|2l|family/,
      'individual': /individual|personal|peque[ñn]o|500ml|250ml/,
      'light': /light|diet|zero|sin azucar/,
      'organico': /organico|organic|natural|bio/,
      'vegano': /vegano|vegan|plant/,
      'gluten_free': /sin gluten|gluten free/,
      'importado': /importado|import/,
      'premium': /premium|gourmet|select/
    };

    // Common hardware tags
    const hardwareTags = {
      'profesional': /profesional|professional|heavy duty/,
      'domestico': /domestico|home|hogar/,
      'industrial': /industrial|comercial/,
      'manual': /manual|hand/,
      'electrico': /electrico|electric/,
      'bateria': /bateria|battery|recargable/,
      'acero': /acero|steel|stainless/,
      'plastico': /plastico|plastic/,
      'resistente': /resistente|durable|fuerte/
    };

    const allTags = { ...foodTags, ...hardwareTags };

    for (const [tag, pattern] of Object.entries(allTags)) {
      if (pattern.test(text)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  async downloadImage(imageInfo) {
    if (!imageInfo.url || this.imageUrls.has(imageInfo.url)) {
      return null; // Skip if already processed
    }

    try {
      this.imageUrls.add(imageInfo.url);
      
      // Generate filenames
      const hash = this.sha1(imageInfo.url);
      const ext = this.getImageExtension(imageInfo.url);
      const filename = `${imageInfo.productId}.${ext}`;
      const thumbFilename = `${imageInfo.productId}-thumb.${ext}`;
      
      // File paths
      const categoryPath = path.join(CONFIG.OUTPUT_DIR, imageInfo.category, filename);
      const thumbPath = path.join(CONFIG.OUTPUT_DIR, imageInfo.category, 'thumbs', thumbFilename);
      const storePath = path.join(CONFIG.OUTPUT_DIR, this.storeName, `${hash}.${ext}`);
      
      // Skip if already exists
      if (fs.existsSync(categoryPath)) {
        return {
          imageUrl: `/images/products/${imageInfo.category}/${filename}`,
          thumbnailUrl: `/images/products/${imageInfo.category}/thumbs/${thumbFilename}`
        };
      }

      if (CONFIG.DRY_RUN) {
        this.log(`[DRY RUN] Would download: ${imageInfo.url} -> ${filename}`);
        return {
          imageUrl: `/images/products/${imageInfo.category}/${filename}`,
          thumbnailUrl: `/images/products/${imageInfo.category}/thumbs/${thumbFilename}`
        };
      }

      // Download using Playwright for proper headers and cookies
      const response = await this.page.request.get(imageInfo.url, {
        headers: {
          'Referer': this.storeConfig.baseUrl,
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}`);
      }

      const buffer = await response.body();
      
      if (buffer.length < CONFIG.MIN_IMAGE_BYTES) {
        throw new Error(`Image too small: ${buffer.length} bytes`);
      }

      // Save to multiple locations
      fs.writeFileSync(categoryPath, buffer);
      fs.writeFileSync(storePath, buffer);
      
      // Create thumbnail (copy for now, could add resizing later)
      fs.writeFileSync(thumbPath, buffer);

      // Create info file
      const infoPath = path.join(CONFIG.OUTPUT_DIR, imageInfo.category, `${imageInfo.productId}.info.json`);
      const info = {
        filename: filename,
        originalUrl: imageInfo.url,
        hash: hash,
        size: buffer.length,
        category: imageInfo.category,
        store: this.storeName,
        created: new Date().toISOString()
      };
      fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));

      this.stats.imagesDownloaded++;
      this.log(`Downloaded: ${filename} (${buffer.length} bytes)`);

      return {
        imageUrl: `/images/products/${imageInfo.category}/${filename}`,
        thumbnailUrl: `/images/products/${imageInfo.category}/thumbs/${thumbFilename}`
      };

    } catch (error) {
      this.error(`Failed to download ${imageInfo.url}:`, error.message);
      return null;
    }
  }

  getImageExtension(url) {
    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/\.([a-z0-9]+)$/i);
      if (match) {
        return match[1].toLowerCase();
      }
      return 'webp'; // Default to webp
    } catch {
      return 'webp';
    }
  }

  async processDownloadQueue() {
    this.info(`Processing ${this.downloadQueue.length} images...`);
    
    // Process downloads with concurrency control
    const chunks = [];
    for (let i = 0; i < this.downloadQueue.length; i += CONFIG.CONCURRENT_DOWNLOADS) {
      chunks.push(this.downloadQueue.slice(i, i + CONFIG.CONCURRENT_DOWNLOADS));
    }

    for (const chunk of chunks) {
      const downloads = chunk.map(imageInfo => this.downloadImage(imageInfo));
      const results = await Promise.allSettled(downloads);
      
      // Update products with image URLs
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const imageInfo = chunk[index];
          const product = this.products.get(imageInfo.productId);
          if (product) {
            product.imageUrl = result.value.imageUrl;
            product.thumbnailUrl = result.value.thumbnailUrl;
          }
        }
      });

      // Rate limiting between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

    async scrapeCategory(category) {
    let baseUrls = this.generateCategoryUrls(category);
      this.info(`Scraping category: ${category} with ${baseUrls.length} URL patterns`);

      // If we don't have a specific URL yet, try discovery now
      if (!baseUrls || baseUrls.length === 0 || baseUrls.some(u => u === this.storeConfig.baseUrl)) {
        const found = await this.discoverCategoryUrlsFromHomepage(category);
        if (Array.isArray(found) && found.length > 0) {
          baseUrls = found;
          this.info(`Discovered ${found.length} URLs for ${category}`);
        }
      }

      for (const categoryUrl of baseUrls) {
      await this.scrapeCategoryUrl(category, categoryUrl);
      if (this.stats.productsFound >= CONFIG.MAX_PRODUCTS) {
        this.info(`Reached maximum products limit: ${CONFIG.MAX_PRODUCTS}`);
        break;
      }
    }
    
    this.stats.categoriesCompleted++;
    await this.saveProgress();
  }
  
  generateCategoryUrls(category) {
      // Prefer discovered URL for this category
      if (this.categoryUrlMap && this.categoryUrlMap[category]) {
        return [this.categoryUrlMap[category]];
      }
      // Allow explicit seed URLs from env to override discovery for all categories
      if (CONFIG.SEED_URLS && CONFIG.SEED_URLS.length > 0) {
        return CONFIG.SEED_URLS;
      }

    // Defer to live discovery from homepage; cache results per category
    this._discoveredCache = this._discoveredCache || {};
    if (this._discoveredCache[category]?.length) return this._discoveredCache[category];
    // Fallback: start from homepage and trigger discovery in scrapeCategory
    this._pendingDiscoveries = this._pendingDiscoveries || {};
    this._pendingDiscoveries[category] = true;
    return [this.storeConfig.baseUrl];
  }
  
  // Extract products from captured API payloads as fallback
  extractProductsFromApis(category) {
    const products = [];
    
    for (const payload of this.capturedApiPayloads) {
      try {
        this.log(`Analyzing API payload from: ${payload.url}`);
        const json = payload.json;
        
        // Common API response patterns for Chilean supermarkets
        const possiblePaths = [
          json.data?.products,
          json.products,
          json.items,
          json.results,
          json.content,
          json.data?.items,
          json.data?.results,
          json.response?.products,
          json.payload?.products
        ];
        
        for (const path of possiblePaths) {
          if (Array.isArray(path)) {
            for (const item of path.slice(0, 50)) { // Limit to prevent memory issues
              try {
                const product = this.extractProductFromApiItem(item, category);
                if (product) products.push(product);
              } catch (e) {
                this.log(`Failed to extract API product: ${e.message}`);
              }
            }
            break; // Found products, stop looking
          }
        }
      } catch (e) {
        this.log(`API payload analysis failed: ${e.message}`);
      }
    }
    
    this.log(`Extracted ${products.length} products from API payloads`);
    return products;
  }

  // Extract individual product from API response item
  extractProductFromApiItem(item, category) {
    if (!item || typeof item !== 'object') return null;
    
    // Common API field mappings
    const name = item.name || item.title || item.displayName || item.productName || '';
    const price = this.extractPriceFromApiItem(item);
    const imageUrl = this.extractImageFromApiItem(item);
    const brand = item.brand || item.manufacturer || item.brandName || '';
    const description = item.description || item.desc || item.shortDescription || name;
    
    if (!name || name.length < 2) return null;
    
    return {
      name: name.trim(),
      price: price || 0,
      imageUrl: imageUrl || '',
      brand: brand.trim(),
      description: description.trim(),
      sourceUrl: item.url || item.link || item.productUrl || '',
      index: Math.floor(Math.random() * 1000) // Fake index for consistency
    };
  }

  // Extract price from API item with various field patterns
  extractPriceFromApiItem(item) {
    const priceFields = [
      item.price, item.currentPrice, item.salePrice, item.finalPrice,
      item.pricing?.current, item.pricing?.sale, item.pricing?.final,
      item.priceInfo?.current, item.priceInfo?.price,
      item.value, item.cost, item.amount
    ];
    
    for (const priceField of priceFields) {
      if (typeof priceField === 'number' && priceField > 0) {
        return Math.round(priceField);
      }
      if (typeof priceField === 'string') {
        const match = priceField.match(/[\d.,]+/);
        if (match) {
          const numPrice = parseInt(match[0].replace(/[.,]/g, ''));
          if (numPrice > 0 && numPrice < 10000000) {
            return numPrice;
          }
        }
      }
    }
    return 0;
  }

  // Extract image URL from API item with various field patterns
  extractImageFromApiItem(item) {
    const imageFields = [
      item.image, item.imageUrl, item.thumbnail, item.photo,
      item.images?.[0], item.pictures?.[0], item.media?.[0],
      item.assets?.image, item.assets?.thumbnail,
      item.imageInfo?.url, item.imageInfo?.src
    ];
    
    for (const imageField of imageFields) {
      if (typeof imageField === 'string' && imageField.length > 10) {
        // Convert relative URLs to absolute
        try {
          if (imageField.startsWith('http')) return imageField;
          if (imageField.startsWith('//')) return `https:${imageField}`;
          if (imageField.startsWith('/')) return new URL(imageField, this.storeConfig.baseUrl).toString();
          return new URL(`/${imageField}`, this.storeConfig.baseUrl).toString();
        } catch (e) {
          continue;
        }
      }
    }
    return '';
  }

  async scrapeCategoryUrl(category, categoryUrl) {
    const maxRetries = CONFIG.MAX_RETRIES;
    let attempt = 0;
    let pageNum = 1;
    let consecutiveEmpty = 0;
    const maxConsecutiveEmpty = 3;

    while (attempt < maxRetries && pageNum <= CONFIG.MAX_PAGES && consecutiveEmpty < maxConsecutiveEmpty) {
      try {
          // Try different URL patterns for pagination (also support hash-based SPAs)
        const paginatedUrls = [
          `${categoryUrl}?page=${pageNum}`,
          `${categoryUrl}?p=${pageNum}`,
            `${categoryUrl}?pagina=${pageNum}`,
          `${categoryUrl}/${pageNum}`,
          `${categoryUrl}&page=${pageNum}`,
            `${categoryUrl}#?page=${pageNum}`,
            `${categoryUrl}#?p=${pageNum}`,
          categoryUrl // First page might not need pagination
        ];
        
        let pageLoaded = false;
        let rawProducts = [];
        
        for (const url of paginatedUrls) {
          try {
            this.log(`Attempting to load: ${url}`);
            
            const response = await this.page.goto(url, { 
              waitUntil: 'domcontentloaded',
              timeout: CONFIG.REQUEST_TIMEOUT
            });
            
            if (!response || !response.ok()) {
              this.log(`Page returned ${response?.status()}: ${url}`);
              continue;
            }
            
            // Wait for content to load
            await this.page.waitForTimeout(2000);
            await this.dismissBanners();
            
            // Check if page has products before scrolling
            const hasProducts = await this.page.evaluate((selectors) => {
              const productCards = document.querySelectorAll(selectors.productCard + ', article, .product, .item');
              return productCards.length > 0;
            }, this.storeConfig.selectors);
            
            if (!hasProducts) {
              this.log(`No products found on page, trying next URL pattern`);
              continue;
            }
            
              // Scroll to load all products
              await this.autoScroll();

              // If still no DOM products, attempt API payload fallback
              if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
                const fallback = this.extractProductsFromApis(category);
                if (fallback.length) {
                  this.log(`Recovered ${fallback.length} products from API payloads`);
                  rawProducts = fallback;
                }
              }
            
            rawProducts = await this.extractProductData();
            
            if (rawProducts.length > 0) {
              pageLoaded = true;
              this.log(`Successfully loaded page ${pageNum} with ${rawProducts.length} products`);
              break;
            }
            
          } catch (pageError) {
            this.log(`Failed to load ${url}: ${pageError.message}`);
            continue;
          }
        }
        
        if (!pageLoaded) {
          this.log(`No valid URL pattern worked for page ${pageNum} of ${category}`);
          // Try clicking a "next" button as last resort
          const advanced = await (async () => {
            try {
              const before = this.page.url();
              const nextRel = this.page.locator('a[rel="next"]');
              if (await nextRel.isVisible().catch(() => false)) {
                await Promise.all([
                  nextRel.click({ timeout: 3000 }).catch(() => {}),
                  this.page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {})
                ]);
              } else {
                const nextBtn = this.page.locator('a, button').filter({ hasText: /Siguiente|Next|Ver m[aá]s|Mostrar m[aá]s|Cargar m[aá]s/i });
                if (await nextBtn.first().isVisible().catch(() => false)) {
                  await Promise.all([
                    nextBtn.first().click({ timeout: 3000 }).catch(() => {}),
                    this.page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {})
                  ]);
                } else {
                  return false;
                }
              }
              await this.page.waitForTimeout(1200);
              return this.page.url() !== before;
            } catch { return false; }
          })();

          if (advanced) {
            await this.dismissBanners();
            await this.autoScroll();
            const attemptExtract = await this.extractProductData();
            if (Array.isArray(attemptExtract) && attemptExtract.length > 0) {
              rawProducts = attemptExtract;
              pageLoaded = true;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        if (rawProducts.length === 0) {
          consecutiveEmpty++;
          this.log(`Empty page ${pageNum} (${consecutiveEmpty}/${maxConsecutiveEmpty})`);
        } else {
          consecutiveEmpty = 0; // Reset counter
          
          // Process products
          for (const rawProduct of rawProducts) {
            try {
              const product = await this.processProduct(rawProduct);
              if (product && !this.products.has(product.id)) {
                this.products.set(product.id, product);
                this.stats.productsFound++;
                
                // Save progress periodically
                if (this.stats.productsFound % CONFIG.PROGRESS_INTERVAL === 0) {
                  await this.saveProgress();
                  this.info(`Progress: ${this.stats.productsFound} products scraped from ${category}`);
                }
              }
            } catch (productError) {
              this.error(`Failed to process product: ${productError.message}`);
            }
            
            if (this.stats.productsFound >= CONFIG.MAX_PRODUCTS) {
              return;
            }
          }
        }
        
        this.stats.pagesVisited++;
        pageNum++;
        attempt = 0; // Reset retry counter on success
        
        // Persist after each page to disk
        try { await this.saveData(); } catch {}
        // Rate limiting between pages
        await new Promise(resolve => setTimeout(resolve, this.storeConfig.rateLimit || 2000));
        
      } catch (error) {
        attempt++;
        this.error(`Attempt ${attempt}/${maxRetries} failed for ${category} page ${pageNum}: ${error.message}`);
        this.stats.retries++;
        
        if (attempt >= maxRetries) {
          this.error(`Max retries exceeded for ${category} page ${pageNum}`);
          break;
        }
        
        // Exponential backoff
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        this.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    this.info(`Completed scraping category ${category}: ${this.stats.productsFound} total products`);
  }

  async saveProgress() {
    try {
      const progress = {
        store: this.storeName,
        stats: this.stats,
        completedCategories: CONFIG.CATEGORIES.slice(0, this.stats.categoriesCompleted),
        currentProducts: this.stats.productsFound,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
    } catch (error) {
      this.error('Failed to save progress:', error.message);
    }
  }
  
  async loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        return progress;
      }
    } catch (error) {
      this.log('No previous progress found or failed to load');
    }
    return null;
  }

  async saveData() {
    try {
      // Save products data with backup
      const productsArray = Array.from(this.products.values());
      const dataPath = path.join(CONFIG.DATA_DIR, this.storeName, 'products.json');
      const backupPath = path.join(CONFIG.DATA_DIR, this.storeName, `products-backup-${Date.now()}.json`);
      
      // Create backup of existing data
      if (fs.existsSync(dataPath)) {
        fs.copyFileSync(dataPath, backupPath);
      }
      
      fs.writeFileSync(dataPath, JSON.stringify(productsArray, null, 2));
      this.stats.lastSaved = new Date().toISOString();

      // Create comprehensive manifests
      const manifestPath = path.join(CONFIG.OUTPUT_DIR, this.storeName, 'manifest.json');
      const endTime = new Date().toISOString();
      const startTime = new Date(this.stats.startTime);
      const duration = new Date(endTime).getTime() - startTime.getTime();
      
      const manifest = {
        store: this.storeName,
        totalProducts: productsArray.length,
        categories: [...new Set(productsArray.map(p => p.category))],
        categoryBreakdown: this.getCategoryBreakdown(productsArray),
        priceRange: this.getPriceRange(productsArray),
        brandsCount: [...new Set(productsArray.map(p => p.brand).filter(b => b))].length,
        averageRating: this.getAverageRating(productsArray),
        lastUpdated: endTime,
        scrapingDuration: Math.round(duration / 1000), // seconds
        stats: {
          ...this.stats,
          endTime,
          duration,
          averageProductsPerPage: Math.round(this.stats.productsFound / (this.stats.pagesVisited || 1)),
          errorRate: Math.round((this.stats.errors / (this.stats.productsFound || 1)) * 100)
        }
      };
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      // Update global products file with deduplication
      await this.updateGlobalProducts(productsArray);
      
      // Clean up old backups (keep last 5)
      await this.cleanupBackups();
      
      this.info(`Saved ${productsArray.length} products to ${dataPath}`);
      this.info(`Scraping duration: ${Math.round(duration / 1000 / 60)} minutes`);
      
    } catch (error) {
      this.error('Failed to save data:', error.message);
      throw error;
    }
  }
  
  async updateGlobalProducts(newProducts) {
    const globalPath = path.join(CONFIG.DATA_DIR, 'all-products.json');
    let allProducts = [];
    
    try {
      if (fs.existsSync(globalPath)) {
        allProducts = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
      }
      
      // Remove existing products from this store
      allProducts = allProducts.filter(p => p.store?.name !== this.storeName);
      
      // Add new products
      allProducts.push(...newProducts);
      
      // Sort by category and name for better organization
      allProducts.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });
      
      fs.writeFileSync(globalPath, JSON.stringify(allProducts, null, 2));
      
      // Create summary statistics
      const summaryPath = path.join(CONFIG.DATA_DIR, 'products-summary.json');
      const summary = {
        totalProducts: allProducts.length,
        stores: [...new Set(allProducts.map(p => p.store?.name))],
        categories: [...new Set(allProducts.map(p => p.category))],
        lastUpdated: new Date().toISOString(),
        storeBreakdown: this.getStoreBreakdown(allProducts),
        categoryBreakdown: this.getCategoryBreakdown(allProducts)
      };
      
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      this.info(`Updated global products: ${allProducts.length} total products across ${summary.stores.length} stores`);
      
    } catch (error) {
      this.error('Failed to update global products:', error.message);
    }
  }
  
  getCategoryBreakdown(products) {
    const breakdown = {};
    products.forEach(p => {
      breakdown[p.category] = (breakdown[p.category] || 0) + 1;
    });
    return breakdown;
  }
  
  getStoreBreakdown(products) {
    const breakdown = {};
    products.forEach(p => {
      const store = p.store?.name || 'unknown';
      breakdown[store] = (breakdown[store] || 0) + 1;
    });
    return breakdown;
  }
  
  getPriceRange(products) {
    const prices = products.map(p => p.price).filter(p => p > 0);
    if (prices.length === 0) return { min: 0, max: 0, average: 0 };
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };
  }
  
  getAverageRating(products) {
    const ratings = products.map(p => p.rating).filter(r => r > 0);
    if (ratings.length === 0) return 0;
    return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
  }
  
  async cleanupBackups() {
    try {
      const backupDir = path.join(CONFIG.DATA_DIR, this.storeName);
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('products-backup-') && f.endsWith('.json'))
        .map(f => ({ name: f, path: path.join(backupDir, f), time: fs.statSync(path.join(backupDir, f)).mtime }))
        .sort((a, b) => b.time - a.time);
      
      // Keep only the 5 most recent backups
      for (const file of files.slice(5)) {
        fs.unlinkSync(file.path);
        this.log(`Removed old backup: ${file.name}`);
      }
    } catch (error) {
      this.log('Backup cleanup failed:', error.message);
    }
  }

  async run() {
    try {
      this.info('Starting Enhanced Universal Product Scraper');
      this.info(`Store: ${this.storeName}`);
      this.info(`Categories: ${CONFIG.CATEGORIES.join(', ')}`);
      this.info(`Max products: ${CONFIG.MAX_PRODUCTS}`);
      this.info(`Max pages per category: ${CONFIG.MAX_PAGES}`);
      this.info(`Dry run: ${CONFIG.DRY_RUN}`);
      
      // Load previous progress if resuming
      const previousProgress = await this.loadProgress();
      if (previousProgress && CONFIG.RESUME_FROM) {
        this.info(`Resuming from previous session. Previous products: ${previousProgress.currentProducts}`);
        this.stats = { ...this.stats, ...previousProgress.stats };
      }

      this.ensureDirectories();
      await this.setupBrowser();
      
      // Start timing
      const startTime = Date.now();
      this.stats.startTime = new Date().toISOString();

        // Try to discover category URLs by navigating the homepage
        await this.discoverCategoryUrlsFromHomepage();

        // Scrape each category
      const categoriesToScrape = CONFIG.RESUME_FROM ? 
        CONFIG.CATEGORIES.slice(CONFIG.CATEGORIES.indexOf(CONFIG.RESUME_FROM)) : 
        CONFIG.CATEGORIES;
        
      for (const category of categoriesToScrape) {
        if (this.stats.productsFound >= CONFIG.MAX_PRODUCTS) {
          this.info(`Reached maximum products limit: ${CONFIG.MAX_PRODUCTS}`);
          break;
        }
        
        this.info(`Starting category ${this.stats.categoriesCompleted + 1}/${CONFIG.CATEGORIES.length}: ${category}`);
        await this.scrapeCategory(category);
        
        // Show progress
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const avgPerCategory = elapsed / (this.stats.categoriesCompleted || 1);
        const remaining = (CONFIG.CATEGORIES.length - this.stats.categoriesCompleted) * avgPerCategory;
        
        this.info(`Category ${category} completed. Estimated remaining time: ${Math.round(remaining / 60)} minutes`);
      }

      // Process image downloads
      if (this.downloadQueue.length > 0) {
        this.info(`Processing ${this.downloadQueue.length} image downloads...`);
        await this.processDownloadQueue();
      }

      // Save all data
      await this.saveData();

      // Final comprehensive report
      const endTime = Date.now();
      const totalDuration = Math.round((endTime - startTime) / 1000);
      const durationMinutes = Math.round(totalDuration / 60);
      
      this.info('='.repeat(60));
      this.info('MASS SCRAPING COMPLETE');
      this.info(`Store: ${this.storeName}`);
      this.info(`Total Duration: ${durationMinutes} minutes (${totalDuration} seconds)`);
      this.info(`Categories scraped: ${this.stats.categoriesCompleted}/${CONFIG.CATEGORIES.length}`);
      this.info(`Pages visited: ${this.stats.pagesVisited}`);
      this.info(`Products found: ${this.stats.productsFound}`);
      this.info(`Images downloaded: ${this.stats.imagesDownloaded}`);
      this.info(`Retries: ${this.stats.retries}`);
      this.info(`Errors: ${this.stats.errors}`);
      this.info(`Success rate: ${Math.round(((this.stats.productsFound - this.stats.errors) / (this.stats.productsFound || 1)) * 100)}%`);
      this.info(`Average products per page: ${Math.round(this.stats.productsFound / (this.stats.pagesVisited || 1))}`);
      this.info(`Products per minute: ${Math.round((this.stats.productsFound / totalDuration) * 60)}`);
      
      if (this.stats.errors > 0) {
        this.info(`Warning: ${this.stats.errors} errors occurred during scraping`);
      }
      
      this.info('='.repeat(60));
      
      // Clean up progress file on completion
      if (fs.existsSync(this.progressFile)) {
        fs.unlinkSync(this.progressFile);
      }

    } catch (error) {
      this.error('Mass scraping failed:', error.message);
      this.error('Stack trace:', error.stack);
      
      // Save progress even on failure
      try {
        await this.saveProgress();
        if (this.products.size > 0) {
          await this.saveData();
          this.info(`Emergency save completed: ${this.products.size} products saved`);
        }
      } catch (saveError) {
        this.error('Emergency save failed:', saveError.message);
      }
      
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (key && value) {
      options[key.toUpperCase()] = value;
    }
  }

  // Override config with CLI options
  Object.assign(CONFIG, options);

  const scraper = new UniversalProductScraper(CONFIG.STORE);
  await scraper.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = UniversalProductScraper;

// Export configuration for external use
module.exports.CONFIG = CONFIG;