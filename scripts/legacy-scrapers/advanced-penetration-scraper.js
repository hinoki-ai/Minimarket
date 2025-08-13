#!/usr/bin/env node
'use strict';

/**
 * Advanced Penetration Scraper - Enhanced anti-bot bypassing for Chilean supermarkets
 * Uses sophisticated evasion techniques, IP rotation, and aggressive retry strategies
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const STORES = [
    {
        name: 'jumbo',
        baseUrls: [
            'https://www.jumbo.cl',
            'https://jumbo.cl', 
            'https://www.tiendasjumbo.co',
            'https://m.jumbo.cl'
        ],
        searchPaths: [
            '/search?q=',
            '/buscar?q=',
            '/productos?search=',
            '/catalog/search?term='
        ],
        productSelectors: [
            '.product-card',
            '.item-product',
            '[data-testid*="product"]',
            '.grid-product',
            '.product-tile'
        ]
    },
    {
        name: 'tottus', 
        baseUrls: [
            'https://www.tottus.com.pe',
            'https://tottus.falabella.com',
            'https://www.tottus.cl',
            'https://m.tottus.cl'
        ],
        searchPaths: [
            '/search?q=',
            '/buscar/',
            '/productos/',
            '/catalog/'
        ],
        productSelectors: [
            '.product-card',
            '.product-item',
            '[data-automation-id*="product"]',
            '.product-container'
        ]
    },
    {
        name: 'easy',
        baseUrls: [
            'https://www.easy.cl',
            'https://easy.cl',
            'https://m.easy.cl',
            'https://easy.falabella.com'
        ],
        searchPaths: [
            '/search?q=',
            '/buscar/',
            '/productos/',
            '/tienda/'
        ],
        productSelectors: [
            '.product-card',
            '.product-item',
            '[data-automation-id*="product"]',
            '.grid-item'
        ]
    },
    {
        name: 'falabella',
        baseUrls: [
            'https://www.falabella.com',
            'https://www.falabella.cl', 
            'https://falabella.com',
            'https://m.falabella.cl'
        ],
        searchPaths: [
            '/search?q=',
            '/s/',
            '/buscar/',
            '/productos/'
        ],
        productSelectors: [
            '.product-card',
            '[data-automation-id*="product"]',
            '.grid-item',
            '.search-results-item'
        ]
    },
    {
        name: 'paris',
        baseUrls: [
            'https://www.paris.cl',
            'https://paris.cl',
            'https://m.paris.cl'
        ],
        searchPaths: [
            '/search?q=',
            '/buscar/',
            '/productos/'
        ],
        productSelectors: [
            '.product-card',
            '.product-item',
            '.grid-item'
        ]
    }
];

const SEARCH_TERMS = [
    'bebidas', 'agua', 'jugo', 'cerveza', 'vino',
    'leche', 'yogur', 'queso', 'mantequilla',
    'pan', 'galletas', 'cereales', 'arroz', 'pasta',
    'carne', 'pollo', 'pescado', 'embutidos',
    'frutas', 'verduras', 'papas', 'cebolla',
    'chocolate', 'dulces', 'helados', 'snacks',
    'detergente', 'shampoo', 'papel', 'toallas'
];

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const PROXY_LIST = [
    // Free Chilean proxies (if available)
    null // Will use direct connection for now
];

class AdvancedPenetrationScraper {
    constructor() {
        this.results = new Map();
        this.browser = null;
        this.totalFound = 0;
        this.outputDir = path.join(__dirname, '..', 'data', 'advanced-scrape');
        this.logFile = path.join(this.outputDir, 'penetration.log');
        
        this.ensureDirectories();
    }

    async ensureDirectories() {
        await fs.mkdir(this.outputDir, { recursive: true });
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        console.log(`[PENETRATION] ${message}`);
        await fs.appendFile(this.logFile, logEntry);
    }

    async randomDelay(min = 1000, max = 5000) {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    getRandomUserAgent() {
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }

    async initializeBrowser() {
        if (this.browser) await this.browser.close();
        
        this.browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-popup-blocking',
                '--disable-translate',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--no-zygote',
                '--disable-ipc-flooding-protection'
            ]
        });
    }

    async createStealthPage() {
        const context = await this.browser.newContext({
            userAgent: this.getRandomUserAgent(),
            viewport: {
                width: 1920 + Math.floor(Math.random() * 200),
                height: 1080 + Math.floor(Math.random() * 200)
            },
            locale: 'es-CL',
            geolocation: { 
                latitude: -33.4489, 
                longitude: -70.6693 // Santiago, Chile
            },
            permissions: ['geolocation'],
            extraHTTPHeaders: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        });

        const page = await context.newPage();
        
        // Remove automation indicators
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Remove automation scripts
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
            
            // Fake canvas fingerprint
            const getContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type) {
                if (type === '2d') {
                    const context = getContext.apply(this, arguments);
                    const getImageData = context.getImageData;
                    context.getImageData = function() {
                        const result = getImageData.apply(this, arguments);
                        // Add noise to canvas fingerprint
                        for (let i = 0; i < result.data.length; i += 4) {
                            result.data[i] += Math.floor(Math.random() * 10) - 5;
                        }
                        return result;
                    };
                    return context;
                }
                return getContext.apply(this, arguments);
            };
        });

        return page;
    }

    async attemptStoreAccess(store, maxAttempts = 10) {
        await this.log(`🎯 Targeting ${store.name} with ${maxAttempts} penetration attempts`);
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.log(`  Attempt ${attempt}/${maxAttempts} for ${store.name}`);
                
                const page = await this.createStealthPage();
                
                // Try different base URLs
                for (const baseUrl of store.baseUrls) {
                    try {
                        await this.log(`    Testing URL: ${baseUrl}`);
                        
                        // Random delay before each request
                        await this.randomDelay(2000, 8000);
                        
                        const response = await page.goto(baseUrl, {
                            waitUntil: 'networkidle',
                            timeout: 60000
                        });

                        if (!response) {
                            await this.log(`    ❌ No response from ${baseUrl}`);
                            continue;
                        }

                        const status = response.status();
                        await this.log(`    Status: ${status} for ${baseUrl}`);
                        
                        if (status === 200) {
                            // Success! Try to find products
                            await this.log(`    ✅ SUCCESS! Accessing ${baseUrl}`);
                            const products = await this.extractProducts(page, store, baseUrl);
                            
                            if (products.length > 0) {
                                await this.log(`    🎉 Found ${products.length} products from ${store.name}`);
                                await this.saveProducts(store.name, products);
                                this.totalFound += products.length;
                                await page.close();
                                return products;
                            }
                        } else if (status === 403) {
                            await this.log(`    🛡️ 403 Blocked - trying evasion techniques`);
                            await this.attemptEvasion(page, baseUrl, store);
                        } else if (status === 503 || status === 502) {
                            await this.log(`    ⏳ Server error ${status} - retrying with delay`);
                            await this.randomDelay(10000, 20000);
                        }
                        
                    } catch (urlError) {
                        await this.log(`    ❌ URL Error: ${urlError.message}`);
                    }
                }
                
                await page.close();
                
                // Exponential backoff between attempts
                if (attempt < maxAttempts) {
                    const delay = Math.min(2 ** attempt * 1000, 30000);
                    await this.log(`    Waiting ${Math.round(delay/1000)}s before next attempt...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
            } catch (error) {
                await this.log(`  ❌ Attempt ${attempt} failed: ${error.message}`);
            }
        }
        
        await this.log(`❌ All attempts failed for ${store.name}`);
        return [];
    }

    async attemptEvasion(page, baseUrl, store) {
        await this.log(`    🥷 Attempting evasion techniques for ${baseUrl}`);
        
        try {
            // Wait for any potential redirects or challenges
            await this.randomDelay(5000, 15000);
            
            // Try to detect and bypass common anti-bot systems
            const title = await page.title();
            const content = await page.content();
            
            if (content.includes('cloudflare') || content.includes('Checking your browser')) {
                await this.log(`    🔍 Detected Cloudflare challenge - waiting...`);
                await page.waitForLoadState('networkidle', { timeout: 60000 });
            }
            
            if (content.includes('captcha') || content.includes('CAPTCHA')) {
                await this.log(`    🤖 CAPTCHA detected - attempting bypass...`);
                // In real implementation, could integrate CAPTCHA solving service
            }
            
            // Try alternative entry points
            for (const searchPath of store.searchPaths) {
                const searchUrl = baseUrl + searchPath + 'agua';
                await this.log(`    🔄 Trying search entry: ${searchUrl}`);
                
                try {
                    await page.goto(searchUrl, { timeout: 30000 });
                    const products = await this.extractProducts(page, store, baseUrl);
                    if (products.length > 0) {
                        return products;
                    }
                } catch (e) {
                    await this.log(`    Search entry failed: ${e.message}`);
                }
            }
            
        } catch (error) {
            await this.log(`    Evasion failed: ${error.message}`);
        }
    }

    async extractProducts(page, store, baseUrl) {
        const products = [];
        
        try {
            // Wait for page to load
            await this.randomDelay(3000, 8000);
            
            // Try different product selectors
            for (const selector of store.productSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 10000 });
                    
                    const foundProducts = await page.$$eval(selector, (elements) => {
                        return elements.slice(0, 50).map(el => {
                            try {
                                const name = el.querySelector('[class*="name"], [class*="title"], h3, h4, h5')?.textContent?.trim();
                                const price = el.querySelector('[class*="price"], [class*="cost"]')?.textContent?.trim();
                                const image = el.querySelector('img')?.src;
                                const link = el.querySelector('a')?.href;
                                
                                if (name && (price || image)) {
                                    return {
                                        name: name.substring(0, 200),
                                        price: price ? price.replace(/[^\d]/g, '') : null,
                                        image: image,
                                        url: link,
                                        selector: '.' + Array.from(el.classList).join('.')
                                    };
                                }
                            } catch (e) {
                                return null;
                            }
                        }).filter(p => p !== null);
                    });
                    
                    if (foundProducts.length > 0) {
                        await this.log(`    ✅ Found ${foundProducts.length} products with selector: ${selector}`);
                        
                        foundProducts.forEach(product => {
                            products.push({
                                id: crypto.createHash('md5').update(product.name + store.name).digest('hex'),
                                name: product.name,
                                price: product.price ? parseInt(product.price) : null,
                                currency: 'CLP',
                                imageUrl: product.image,
                                store: {
                                    name: store.name,
                                    url: product.url || baseUrl,
                                    scraped: new Date().toISOString()
                                },
                                selector: product.selector,
                                createdAt: new Date().toISOString()
                            });
                        });
                        
                        break; // Success with this selector
                    }
                } catch (e) {
                    // Try next selector
                    continue;
                }
            }
            
        } catch (error) {
            await this.log(`    Product extraction error: ${error.message}`);
        }
        
        return products;
    }

    async saveProducts(storeName, products) {
        const filePath = path.join(this.outputDir, `${storeName}-products.json`);
        await fs.writeFile(filePath, JSON.stringify(products, null, 2));
        await this.log(`💾 Saved ${products.length} products to ${filePath}`);
    }

    async run() {
        await this.log('🚀 STARTING ADVANCED PENETRATION SCRAPING');
        await this.log(`Targeting ${STORES.length} stores with aggressive techniques`);
        
        await this.initializeBrowser();
        
        try {
            // Attack each store with maximum aggression
            for (const store of STORES) {
                const products = await this.attemptStoreAccess(store, 15); // 15 attempts per store
                this.results.set(store.name, products);
                
                // Brief pause between stores to avoid pattern detection
                await this.randomDelay(10000, 30000);
                
                // Reinitialize browser periodically
                if (Math.random() > 0.7) {
                    await this.log('🔄 Reinitializing browser for fresh fingerprint');
                    await this.initializeBrowser();
                }
            }
            
            // Generate final report
            await this.generateReport();
            
        } catch (error) {
            await this.log(`💥 Fatal error: ${error.message}`);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalProductsFound: this.totalFound,
            storeResults: Object.fromEntries(
                Array.from(this.results.entries()).map(([store, products]) => [
                    store, 
                    {
                        productCount: products.length,
                        success: products.length > 0,
                        samples: products.slice(0, 3).map(p => ({ name: p.name, price: p.price }))
                    }
                ])
            ),
            successfulStores: Array.from(this.results.entries()).filter(([, products]) => products.length > 0).length,
            totalStores: STORES.length
        };

        const reportPath = path.join(this.outputDir, 'penetration-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        await this.log('🎉 PENETRATION SCRAPING COMPLETE');
        await this.log(`Total products found: ${this.totalFound}`);
        await this.log(`Successful stores: ${report.successfulStores}/${report.totalStores}`);
        await this.log(`Report saved: ${reportPath}`);
    }
}

// Run the advanced penetration scraper
if (require.main === module) {
    const scraper = new AdvancedPenetrationScraper();
    scraper.run().catch(error => {
        console.error('💥 Penetration scraping failed:', error);
        process.exit(1);
    });
}

module.exports = AdvancedPenetrationScraper;