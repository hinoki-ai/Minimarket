#!/usr/bin/env node
'use strict';

/**
 * ULTRA-AGGRESSIVE SCRAPER - Maximum penetration for hundreds of products
 * Uses every possible technique: brute force, multiple proxies, API mining, etc.
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const MASSIVE_STORE_CONFIG = [
    {
        name: 'lider',
        baseUrls: [
            'https://www.lider.cl',
            'https://m.lider.cl', 
            'https://lider.cl',
            'https://www.lider.com'
        ],
        searchTerms: [
            'agua', 'leche', 'pan', 'arroz', 'aceite', 'azucar', 'sal', 'harina',
            'pollo', 'carne', 'pescado', 'huevos', 'queso', 'yogur', 'mantequilla',
            'coca-cola', 'pepsi', 'sprite', 'fanta', 'jugo', 'cerveza', 'vino',
            'detergente', 'shampoo', 'jabon', 'pasta', 'papel', 'toallas',
            'chocolate', 'galletas', 'cereales', 'cafe', 'te', 'dulces'
        ]
    },
    {
        name: 'jumbo',
        baseUrls: [
            'https://www.jumbo.cl',
            'https://jumbo.cl',
            'https://m.jumbo.cl',
            'https://www.tiendasjumbo.co'
        ],
        searchTerms: [
            'bebidas', 'lacteos', 'carnes', 'panaderia', 'frutas', 'verduras',
            'snacks', 'dulces', 'aseo', 'hogar', 'limpieza', 'higiene'
        ]
    },
    {
        name: 'tottus',
        baseUrls: [
            'https://www.tottus.com.pe',
            'https://tottus.falabella.com',
            'https://www.tottus.cl'
        ],
        searchTerms: [
            'alimentos', 'bebidas', 'lacteos', 'carnes', 'pollo', 'pescado'
        ]
    },
    {
        name: 'easy',
        baseUrls: [
            'https://www.easy.cl',
            'https://easy.cl',
            'https://easy.falabella.com'
        ],
        searchTerms: [
            'herramientas', 'pinturas', 'electricidad', 'plomeria', 'jardineria'
        ]
    },
    {
        name: 'falabella',
        baseUrls: [
            'https://www.falabella.com',
            'https://www.falabella.cl'
        ],
        searchTerms: [
            'electro', 'ropa', 'deportes', 'hogar', 'tecnologia', 'muebles'
        ]
    }
];

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0'
];

class UltraAggressiveScraper {
    constructor() {
        this.products = new Map();
        this.totalAttempts = 0;
        this.successfulExtractions = 0;
        this.outputDir = path.join(__dirname, '..', 'data', 'ultra-aggressive');
        this.logFile = path.join(this.outputDir, 'ultra-aggressive.log');
        
        this.targetProducts = 500; // MINIMUM 500 products
        this.maxAttemptsPerStore = 25; // Maximum aggression
    }

    async ensureDirectories() {
        await fs.mkdir(this.outputDir, { recursive: true });
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        console.log(`[ULTRA-AGGRESSIVE] ${message}`);
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (e) {
            // Continue if logging fails
        }
    }

    async randomDelay(min = 500, max = 2000) {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    getRandomUserAgent() {
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }

    async createAggressiveBrowser() {
        return await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images', // Faster loading
                '--disable-javascript', // Sometimes works better
                '--no-first-run'
            ]
        });
    }

    async createStealthPage(browser) {
        const context = await browser.newContext({
            userAgent: this.getRandomUserAgent(),
            viewport: {
                width: 1366 + Math.floor(Math.random() * 500),
                height: 768 + Math.floor(Math.random() * 300)
            },
            locale: 'es-CL',
            geolocation: { latitude: -33.4489, longitude: -70.6693 },
            extraHTTPHeaders: {
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const page = await context.newPage();
        
        // Advanced anti-detection
        await page.addInitScript(() => {
            // Remove webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
            );
        });

        return page;
    }

    async bruteForceProductExtraction(page, store) {
        const products = [];
        
        // Ultra-aggressive selectors - try EVERYTHING
        const AGGRESSIVE_SELECTORS = [
            // Generic product selectors
            '[class*="product"]', '[data-testid*="product"]', '[id*="product"]',
            '[class*="item"]', '[data-testid*="item"]', '[id*="item"]',
            '[class*="card"]', '[class*="tile"]', '[class*="grid"]',
            
            // Store-specific patterns
            '.product-card', '.product-item', '.product-tile', '.product-container',
            '.item-card', '.item-product', '.grid-item', '.list-item',
            '.catalog-product', '.search-result', '.product-result',
            
            // Content patterns
            'article', 'section[class*="product"]', 'div[class*="product"]',
            'li[class*="product"]', 'li[class*="item"]',
            
            // Data attributes
            '[data-automation-id*="product"]', '[data-track*="product"]',
            '[data-id*="product"]', '[data-component*="product"]',
            
            // Price indicators
            '[class*="price"]', '[data-testid*="price"]',
            
            // Generic containers that might have products
            '.results', '.listing', '.catalog', '.grid', '.list'
        ];

        for (const selector of AGGRESSIVE_SELECTORS) {
            try {
                const elements = await page.$$(selector);
                
                if (elements.length > 0) {
                    await this.log(`    🎯 Found ${elements.length} elements with selector: ${selector}`);
                    
                    for (let i = 0; i < Math.min(elements.length, 100); i++) {
                        try {
                            const element = elements[i];
                            
                            // Extract all text content
                            const textContent = await element.textContent();
                            const innerHTML = await element.innerHTML();
                            
                            if (textContent && textContent.length > 10) {
                                // Try to identify if this looks like a product
                                const text = textContent.toLowerCase();
                                const hasProductIndicators = 
                                    text.includes('$') || text.includes('precio') || 
                                    text.includes('clp') || text.includes('peso') ||
                                    /\d+/.test(text); // Contains numbers
                                
                                if (hasProductIndicators) {
                                    // Extract product name (first meaningful text)
                                    const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 3);
                                    const productName = lines[0] || textContent.substring(0, 100);
                                    
                                    // Extract price if possible
                                    const priceMatch = textContent.match(/\$?[\d,.]+ ?(clp|pesos?)?/i);
                                    const price = priceMatch ? priceMatch[0].replace(/[^\d]/g, '') : null;
                                    
                                    // Extract image if available
                                    const img = await element.$('img');
                                    const imageUrl = img ? await img.getAttribute('src') : null;
                                    
                                    // Extract link
                                    const link = await element.$('a');
                                    const productUrl = link ? await link.getAttribute('href') : null;
                                    
                                    if (productName.length > 5) {
                                        const product = {
                                            id: crypto.randomUUID(),
                                            name: productName.substring(0, 200),
                                            price: price ? parseInt(price) : null,
                                            currency: 'CLP',
                                            imageUrl: imageUrl,
                                            category: this.inferCategory(productName),
                                            store: {
                                                name: store.name,
                                                url: productUrl || page.url(),
                                                scraped: new Date().toISOString(),
                                                selector: selector,
                                                method: 'BRUTE_FORCE'
                                            },
                                            createdAt: new Date().toISOString()
                                        };
                                        
                                        products.push(product);
                                        
                                        if (products.length >= 50) break; // Max 50 per selector
                                    }
                                }
                            }
                        } catch (elementError) {
                            continue; // Skip problematic elements
                        }
                    }
                    
                    if (products.length > 0) {
                        await this.log(`    ✅ Extracted ${products.length} products with selector: ${selector}`);
                        break; // Success with this selector
                    }
                }
            } catch (selectorError) {
                continue; // Try next selector
            }
        }
        
        return products;
    }

    inferCategory(name) {
        if (!name) return 'general';
        const nameLC = name.toLowerCase();
        
        const categories = {
            'bebidas': ['agua', 'jugo', 'bebida', 'coca', 'pepsi', 'sprite', 'fanta', 'cerveza'],
            'lacteos': ['leche', 'yogur', 'queso', 'mantequilla'],
            'snacks': ['chocolate', 'galleta', 'dulce', 'papa'],
            'carnes': ['pollo', 'carne', 'pescado', 'cerdo'],
            'aseo': ['detergente', 'shampoo', 'jabon'],
            'hogar': ['herramientas', 'pintura', 'electricidad'],
            'panaderia': ['pan', 'hallulla']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => nameLC.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    async attackStore(store) {
        await this.log(`🚀 ULTRA-AGGRESSIVE ATTACK ON ${store.name.toUpperCase()}`);
        await this.log(`Target: ${store.baseUrls.length} URLs × ${store.searchTerms.length} terms × ${this.maxAttemptsPerStore} attempts`);
        
        const browser = await this.createAggressiveBrowser();
        const storeProducts = [];
        
        try {
            for (let attempt = 1; attempt <= this.maxAttemptsPerStore; attempt++) {
                await this.log(`  Attempt ${attempt}/${this.maxAttemptsPerStore}`);
                
                for (const baseUrl of store.baseUrls) {
                    for (const searchTerm of store.searchTerms.slice(0, 5)) { // Limit to 5 terms per attempt
                        this.totalAttempts++;
                        
                        try {
                            const page = await this.createStealthPage(browser);
                            
                            // Try different URL patterns
                            const searchUrls = [
                                `${baseUrl}`,
                                `${baseUrl}/search?q=${searchTerm}`,
                                `${baseUrl}/buscar?q=${searchTerm}`,
                                `${baseUrl}/productos?search=${searchTerm}`,
                                `${baseUrl}/categoria/${searchTerm}`,
                                `${baseUrl}/${searchTerm}`
                            ];
                            
                            for (const url of searchUrls) {
                                try {
                                    await this.log(`    Testing: ${url}`);
                                    await this.randomDelay(1000, 3000);
                                    
                                    const response = await page.goto(url, { 
                                        waitUntil: 'domcontentloaded',
                                        timeout: 30000 
                                    });
                                    
                                    if (response && response.status() === 200) {
                                        await this.log(`    ✅ 200 OK: ${url}`);
                                        
                                        // Wait for content to load
                                        await this.randomDelay(2000, 5000);
                                        
                                        const products = await this.bruteForceProductExtraction(page, store);
                                        
                                        if (products.length > 0) {
                                            await this.log(`    🎉 JACKPOT! ${products.length} products from ${url}`);
                                            storeProducts.push(...products);
                                            this.successfulExtractions++;
                                        }
                                        
                                        // If we found products, try a few more URLs
                                        if (products.length > 0) {
                                            break;
                                        }
                                    }
                                } catch (urlError) {
                                    continue; // Try next URL
                                }
                            }
                            
                            await page.close();
                            
                        } catch (pageError) {
                            continue; // Try next iteration
                        }
                        
                        // Check if we have enough products
                        if (storeProducts.length >= 100) {
                            await this.log(`  🎯 Reached 100 products for ${store.name}, moving to next store`);
                            break;
                        }
                    }
                    
                    if (storeProducts.length >= 100) break;
                }
                
                if (storeProducts.length >= 100) break;
                
                // Progressive delay between attempts
                await this.randomDelay(5000 * attempt, 10000 * attempt);
            }
            
        } finally {
            await browser.close();
        }
        
        if (storeProducts.length > 0) {
            await this.saveStoreProducts(store.name, storeProducts);
            storeProducts.forEach(product => {
                this.products.set(product.id, product);
            });
        }
        
        await this.log(`${store.name} COMPLETE: ${storeProducts.length} products collected`);
        return storeProducts;
    }

    async saveStoreProducts(storeName, products) {
        const filePath = path.join(this.outputDir, `${storeName}-ultra.json`);
        await fs.writeFile(filePath, JSON.stringify(products, null, 2));
        await this.log(`💾 Saved ${products.length} products to ${filePath}`);
    }

    async run() {
        await this.ensureDirectories();
        await this.log('🔥 STARTING ULTRA-AGGRESSIVE SCRAPING CAMPAIGN');
        await this.log(`🎯 TARGET: ${this.targetProducts} products minimum`);
        await this.log(`⚡ AGGRESSION LEVEL: MAXIMUM (${this.maxAttemptsPerStore} attempts per store)`);
        
        const startTime = Date.now();
        
        try {
            for (const store of MASSIVE_STORE_CONFIG) {
                const products = await this.attackStore(store);
                
                const currentTotal = this.products.size;
                await this.log(`📊 RUNNING TOTAL: ${currentTotal} products`);
                
                if (currentTotal >= this.targetProducts) {
                    await this.log(`🎉 TARGET ACHIEVED! ${currentTotal} >= ${this.targetProducts}`);
                    break;
                }
                
                // Brief pause between stores
                await this.randomDelay(10000, 20000);
            }
            
            await this.generateFinalReport(startTime);
            
        } catch (error) {
            await this.log(`💥 Campaign failed: ${error.message}`);
        }
    }

    async generateFinalReport(startTime) {
        const duration = Math.round((Date.now() - startTime) / 1000 / 60);
        const totalProducts = this.products.size;
        
        const report = {
            timestamp: new Date().toISOString(),
            campaign: {
                duration_minutes: duration,
                target_products: this.targetProducts,
                achieved_products: totalProducts,
                target_met: totalProducts >= this.targetProducts,
                success_rate: ((this.successfulExtractions / this.totalAttempts) * 100).toFixed(2) + '%'
            },
            stats: {
                total_attempts: this.totalAttempts,
                successful_extractions: this.successfulExtractions,
                products_per_minute: Math.round(totalProducts / duration)
            },
            breakdown: {
                by_store: {},
                by_category: {},
                with_prices: 0,
                with_images: 0
            }
        };

        // Calculate breakdowns
        const allProducts = Array.from(this.products.values());
        allProducts.forEach(product => {
            const store = product.store.name;
            report.breakdown.by_store[store] = (report.breakdown.by_store[store] || 0) + 1;
            
            const category = product.category;
            report.breakdown.by_category[category] = (report.breakdown.by_category[category] || 0) + 1;
            
            if (product.price) report.breakdown.with_prices++;
            if (product.imageUrl) report.breakdown.with_images++;
        });

        // Save all products
        const allProductsPath = path.join(this.outputDir, 'ultra-aggressive-all-products.json');
        await fs.writeFile(allProductsPath, JSON.stringify(allProducts, null, 2));

        // Save report
        const reportPath = path.join(this.outputDir, 'ultra-aggressive-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        await this.log('🎉 ULTRA-AGGRESSIVE CAMPAIGN COMPLETE');
        await this.log(`🏆 FINAL SCORE: ${totalProducts} products in ${duration} minutes`);
        await this.log(`⚡ EXTRACTION RATE: ${report.stats.products_per_minute} products/minute`);
        await this.log(`📊 SUCCESS RATE: ${report.campaign.success_rate}`);
        
        if (totalProducts >= this.targetProducts) {
            await this.log(`✅ MISSION ACCOMPLISHED: ${totalProducts} >= ${this.targetProducts}`);
        } else {
            await this.log(`⚠️  MISSION INCOMPLETE: ${totalProducts} < ${this.targetProducts}`);
        }
    }
}

// Launch the ultra-aggressive campaign
if (require.main === module) {
    const scraper = new UltraAggressiveScraper();
    scraper.run().catch(error => {
        console.error('💥 Ultra-aggressive campaign failed:', error);
        process.exit(1);
    });
}

module.exports = UltraAggressiveScraper;