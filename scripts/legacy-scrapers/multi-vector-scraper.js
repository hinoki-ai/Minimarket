#!/usr/bin/env node
'use strict';

/**
 * Multi-Vector Scraper - Multiple attack vectors against Chilean supermarkets
 * Uses different approaches: API endpoints, mobile sites, RSS feeds, sitemaps
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const STORES = [
    {
        name: 'lider',
        urls: [
            'https://www.lider.cl',
            'https://m.lider.cl',
            'https://api.lider.cl',
            'https://www.lider.cl/sitemap.xml'
        ],
        apiEndpoints: [
            '/api/products',
            '/api/search',
            '/api/catalog',
            '/rest/products'
        ]
    },
    {
        name: 'jumbo',
        urls: [
            'https://www.jumbo.cl',
            'https://m.jumbo.cl',
            'https://api.jumbo.cl',
            'https://www.tiendasjumbo.co'
        ],
        apiEndpoints: [
            '/api/products',
            '/api/v1/products',
            '/api/search',
            '/services/products'
        ]
    },
    {
        name: 'tottus',
        urls: [
            'https://www.tottus.com.pe',
            'https://tottus.falabella.com',
            'https://m.tottus.cl',
            'https://api.tottus.com'
        ],
        apiEndpoints: [
            '/api/products',
            '/api/v2/products',
            '/search-api/products',
            '/rest/V1/products'
        ]
    },
    {
        name: 'easy',
        urls: [
            'https://www.easy.cl',
            'https://m.easy.cl',
            'https://easy.falabella.com',
            'https://api.easy.cl'
        ],
        apiEndpoints: [
            '/api/products',
            '/api/search',
            '/rest/products',
            '/services/catalog'
        ]
    },
    {
        name: 'falabella',
        urls: [
            'https://www.falabella.com',
            'https://m.falabella.cl',
            'https://api.falabella.com',
            'https://services.falabella.com'
        ],
        apiEndpoints: [
            '/api/catalog',
            '/api/v1/products',
            '/search/products',
            '/rest/model/falabella/rest/browse/WEB'
        ]
    }
];

class MultiVectorScraper {
    constructor() {
        this.results = new Map();
        this.totalFound = 0;
        this.outputDir = path.join(__dirname, '..', 'data', 'multi-vector');
        this.logFile = path.join(this.outputDir, 'multi-vector.log');
        this.attempts = 0;
        this.successCount = 0;
    }

    async ensureDirectories() {
        await fs.mkdir(this.outputDir, { recursive: true });
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        console.log(`[MULTI-VECTOR] ${message}`);
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (e) {
            // Continue if logging fails
        }
    }

    async randomDelay(min = 500, max = 3000) {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async tryDirectAPIAccess(store) {
        await this.log(`🔌 Attempting direct API access for ${store.name}`);
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const foundProducts = [];

        try {
            for (const baseUrl of store.urls) {
                for (const endpoint of store.apiEndpoints) {
                    this.attempts++;
                    const apiUrl = baseUrl + endpoint;
                    
                    try {
                        await this.log(`  Testing API: ${apiUrl}`);
                        
                        const response = await page.goto(apiUrl + '?limit=100', {
                            waitUntil: 'domcontentloaded',
                            timeout: 15000
                        });

                        if (response && response.status() === 200) {
                            const content = await page.content();
                            
                            // Try to parse as JSON
                            try {
                                const text = await response.text();
                                const json = JSON.parse(text);
                                
                                if (json.products || json.items || json.data) {
                                    const products = json.products || json.items || json.data;
                                    if (Array.isArray(products)) {
                                        await this.log(`  🎉 API SUCCESS: Found ${products.length} products from ${apiUrl}`);
                                        
                                        products.forEach(product => {
                                            if (product.name || product.title) {
                                                foundProducts.push({
                                                    id: crypto.randomUUID(),
                                                    name: product.name || product.title,
                                                    price: product.price || product.cost,
                                                    category: product.category || 'general',
                                                    image: product.image || product.thumbnail,
                                                    store: {
                                                        name: store.name,
                                                        url: apiUrl,
                                                        scraped: new Date().toISOString(),
                                                        method: 'API'
                                                    }
                                                });
                                            }
                                        });
                                        
                                        this.successCount++;
                                        break;
                                    }
                                }
                            } catch (jsonError) {
                                // Not JSON, try to extract data from HTML
                                if (content.includes('product') && content.includes('price')) {
                                    await this.log(`  📄 HTML data detected, attempting extraction...`);
                                    // Could implement HTML parsing here
                                }
                            }
                        }
                    } catch (error) {
                        // Continue to next endpoint
                        continue;
                    }
                    
                    await this.randomDelay(1000, 3000);
                }
            }
        } finally {
            await browser.close();
        }

        return foundProducts;
    }

    async tryMobileSiteAccess(store) {
        await this.log(`📱 Attempting mobile site access for ${store.name}`);
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            viewport: { width: 375, height: 812 }
        });
        const page = await context.newPage();
        
        const foundProducts = [];

        try {
            for (const url of store.urls.filter(u => u.includes('m.') || u.includes('mobile'))) {
                this.attempts++;
                
                try {
                    await this.log(`  Testing mobile: ${url}`);
                    const response = await page.goto(url, { timeout: 20000 });
                    
                    if (response && response.status() === 200) {
                        await this.log(`  📱 Mobile access successful for ${url}`);
                        
                        // Try to find product listings
                        const mobileSelectors = [
                            '[class*="product"]',
                            '[class*="item"]', 
                            '[data-testid*="product"]',
                            '.grid-item',
                            '.card'
                        ];
                        
                        for (const selector of mobileSelectors) {
                            try {
                                const products = await page.$$eval(selector, (elements) => {
                                    return elements.slice(0, 20).map(el => {
                                        const name = el.textContent?.trim();
                                        if (name && name.length > 5 && name.length < 200) {
                                            return {
                                                name: name,
                                                html: el.innerHTML.substring(0, 500)
                                            };
                                        }
                                    }).filter(Boolean);
                                });
                                
                                if (products.length > 0) {
                                    await this.log(`  🎯 Found ${products.length} products via mobile selector: ${selector}`);
                                    
                                    products.forEach(product => {
                                        foundProducts.push({
                                            id: crypto.randomUUID(),
                                            name: product.name,
                                            category: 'general',
                                            store: {
                                                name: store.name,
                                                url: url,
                                                scraped: new Date().toISOString(),
                                                method: 'MOBILE'
                                            }
                                        });
                                    });
                                    
                                    this.successCount++;
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                } catch (error) {
                    continue;
                }
                
                await this.randomDelay(2000, 5000);
            }
        } finally {
            await browser.close();
        }

        return foundProducts;
    }

    async trySitemapAccess(store) {
        await this.log(`🗺️ Attempting sitemap access for ${store.name}`);
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const foundProducts = [];

        try {
            for (const baseUrl of store.urls) {
                const sitemapUrls = [
                    `${baseUrl}/sitemap.xml`,
                    `${baseUrl}/sitemap_products.xml`,
                    `${baseUrl}/product-sitemap.xml`,
                    `${baseUrl}/robots.txt`
                ];
                
                for (const sitemapUrl of sitemapUrls) {
                    this.attempts++;
                    
                    try {
                        await this.log(`  Testing sitemap: ${sitemapUrl}`);
                        const response = await page.goto(sitemapUrl, { timeout: 15000 });
                        
                        if (response && response.status() === 200) {
                            const content = await page.content();
                            
                            if (content.includes('<url>') || content.includes('Sitemap:')) {
                                await this.log(`  🗺️ Sitemap found: ${sitemapUrl}`);
                                
                                // Extract product URLs from sitemap
                                const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g);
                                if (urlMatches) {
                                    const productUrls = urlMatches
                                        .map(match => match.replace(/<\/?loc>/g, ''))
                                        .filter(url => url.includes('product') || url.includes('item'))
                                        .slice(0, 50); // Limit to first 50 product URLs
                                    
                                    await this.log(`  📋 Found ${productUrls.length} product URLs in sitemap`);
                                    
                                    // Extract product names from URLs
                                    productUrls.forEach(url => {
                                        const segments = url.split('/');
                                        const productSegment = segments[segments.length - 1] || segments[segments.length - 2];
                                        
                                        if (productSegment && productSegment.length > 3) {
                                            const productName = productSegment
                                                .replace(/[-_]/g, ' ')
                                                .replace(/\.(html?|php|aspx?)$/i, '')
                                                .trim();
                                            
                                            if (productName.length > 5) {
                                                foundProducts.push({
                                                    id: crypto.randomUUID(),
                                                    name: productName,
                                                    category: 'general',
                                                    store: {
                                                        name: store.name,
                                                        url: url,
                                                        scraped: new Date().toISOString(),
                                                        method: 'SITEMAP'
                                                    }
                                                });
                                            }
                                        }
                                    });
                                    
                                    if (foundProducts.length > 0) {
                                        this.successCount++;
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                    
                    await this.randomDelay(1000, 3000);
                }
            }
        } finally {
            await browser.close();
        }

        return foundProducts;
    }

    async processStore(store) {
        await this.log(`🎯 Multi-vector attack on ${store.name}`);
        
        const allProducts = [];
        
        // Try all attack vectors simultaneously
        const vectors = [
            this.tryDirectAPIAccess(store),
            this.tryMobileSiteAccess(store), 
            this.trySitemapAccess(store)
        ];
        
        const results = await Promise.allSettled(vectors);
        
        results.forEach((result, index) => {
            const vectorName = ['API', 'MOBILE', 'SITEMAP'][index];
            
            if (result.status === 'fulfilled' && result.value.length > 0) {
                await this.log(`  ✅ ${vectorName} vector successful: ${result.value.length} products`);
                allProducts.push(...result.value);
            } else {
                await this.log(`  ❌ ${vectorName} vector failed`);
            }
        });
        
        if (allProducts.length > 0) {
            await this.saveProducts(store.name, allProducts);
            this.totalFound += allProducts.length;
            this.results.set(store.name, allProducts);
        }
        
        return allProducts;
    }

    async saveProducts(storeName, products) {
        const filePath = path.join(this.outputDir, `${storeName}-multi-vector.json`);
        await fs.writeFile(filePath, JSON.stringify(products, null, 2));
        await this.log(`💾 Saved ${products.length} products to ${filePath}`);
    }

    async run() {
        await this.ensureDirectories();
        await this.log('🚀 STARTING MULTI-VECTOR SCRAPING ATTACK');
        await this.log(`Deploying 3 attack vectors against ${STORES.length} stores`);
        
        try {
            for (const store of STORES) {
                const products = await this.processStore(store);
                await this.log(`Store ${store.name}: ${products.length} products collected`);
                
                // Brief delay between stores
                await this.randomDelay(5000, 10000);
            }
            
            await this.generateReport();
            
        } catch (error) {
            await this.log(`💥 Fatal error: ${error.message}`);
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalAttempts: this.attempts,
            successfulAttempts: this.successCount,
            successRate: ((this.successCount / this.attempts) * 100).toFixed(2) + '%',
            totalProductsFound: this.totalFound,
            storeResults: Object.fromEntries(this.results),
            breakdown: {
                byStore: Object.fromEntries(
                    Array.from(this.results.entries()).map(([store, products]) => [
                        store, 
                        products.length
                    ])
                ),
                byMethod: {}
            }
        };

        // Calculate by method breakdown
        Array.from(this.results.values()).flat().forEach(product => {
            const method = product.store.method;
            report.breakdown.byMethod[method] = (report.breakdown.byMethod[method] || 0) + 1;
        });

        const reportPath = path.join(this.outputDir, 'multi-vector-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        await this.log('🎉 MULTI-VECTOR ATTACK COMPLETE');
        await this.log(`Total products found: ${this.totalFound}`);
        await this.log(`Success rate: ${report.successRate}`);
        await this.log(`Successful stores: ${Object.keys(report.breakdown.byStore).length}/${STORES.length}`);
        await this.log(`Report saved: ${reportPath}`);
    }
}

// Run the multi-vector scraper
if (require.main === module) {
    const scraper = new MultiVectorScraper();
    scraper.run().catch(error => {
        console.error('💥 Multi-vector attack failed:', error);
        process.exit(1);
    });
}

module.exports = MultiVectorScraper;