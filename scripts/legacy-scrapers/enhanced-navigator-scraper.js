#!/usr/bin/env node
'use strict';

/**
 * Enhanced Navigator Scraper - Intelligent page navigation and product extraction
 * Designed to properly navigate through product pages, categories, and pagination
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class EnhancedNavigatorScraper {
    constructor() {
        this.products = new Set();
        this.visitedUrls = new Set();
        this.outputDir = path.join(__dirname, '..', 'data', 'enhanced-navigation');
        this.logFile = path.join(this.outputDir, 'navigation.log');
        
        this.stores = [
            {
                name: 'lider',
                baseUrl: 'https://www.lider.cl',
                categoryPaths: [
                    '/categoria/bebidas',
                    '/categoria/lacteos', 
                    '/categoria/carnes',
                    '/categoria/panaderia',
                    '/categoria/frutas-verduras',
                    '/categoria/despensa',
                    '/categoria/congelados',
                    '/categoria/aseo-hogar'
                ],
                productSelectors: {
                    container: '[data-testid="product-item"], .product-card, .product-item, [class*="product"]',
                    name: '[data-testid="product-name"], .product-name, .name, h3, h4, h5',
                    price: '[data-testid="product-price"], .price, [class*="price"]',
                    image: 'img',
                    link: 'a[href*="/product/"], a[href*="/producto/"]'
                },
                paginationSelectors: [
                    '[data-testid="next-page"]',
                    '.pagination .next',
                    '[aria-label*="Next"]',
                    '[aria-label*="Siguiente"]',
                    'a[href*="page="]'
                ]
            },
            {
                name: 'jumbo',
                baseUrl: 'https://www.jumbo.cl',
                categoryPaths: [
                    '/bebidas',
                    '/lacteos',
                    '/carnes-aves-pescados',
                    '/panaderia-pasteleria',
                    '/frutas-verduras',
                    '/despensa',
                    '/congelados',
                    '/aseo-y-hogar'
                ],
                productSelectors: {
                    container: '.product-card, .product-item, [data-automation-id*="product"]',
                    name: '.product-name, .name, h3, h4',
                    price: '.price, [class*="price"]',
                    image: 'img',
                    link: 'a'
                },
                paginationSelectors: [
                    '.pagination .next',
                    '[aria-label*="Next"]',
                    'a[href*="page="]'
                ]
            }
        ];
        
        this.navigationDepth = 3; // How deep to navigate (pages)
        this.maxProductsPerStore = 200;
        this.maxPagesPerCategory = 5;
    }

    async ensureDirectories() {
        await fs.mkdir(this.outputDir, { recursive: true });
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        console.log(`[NAVIGATOR] ${message}`);
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (e) {
            // Continue if logging fails
        }
    }

    async createNavigationBrowser() {
        return await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-blink-features=AutomationControlled'
            ]
        });
    }

    async createStealthPage(browser) {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'es-CL'
        });

        const page = await context.newPage();
        
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        return page;
    }

    async navigateToCategory(page, store, categoryPath) {
        const categoryUrl = store.baseUrl + categoryPath;
        
        if (this.visitedUrls.has(categoryUrl)) {
            return [];
        }
        
        this.visitedUrls.add(categoryUrl);
        
        try {
            await this.log(`🗂️ Navigating to category: ${categoryUrl}`);
            
            const response = await page.goto(categoryUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            if (!response || response.status() !== 200) {
                await this.log(`  ❌ Category failed: ${response?.status() || 'no response'}`);
                return [];
            }

            await this.log(`  ✅ Category loaded: ${categoryUrl}`);
            
            // Wait for products to load
            await page.waitForTimeout(3000);
            
            const categoryProducts = [];
            
            // Navigate through pages in this category
            for (let pageNum = 1; pageNum <= this.maxPagesPerCategory; pageNum++) {
                await this.log(`    📄 Processing page ${pageNum}`);
                
                const pageProducts = await this.extractProductsFromPage(page, store);
                
                if (pageProducts.length === 0) {
                    await this.log(`    ⚠️ No products found on page ${pageNum}, stopping pagination`);
                    break;
                }
                
                categoryProducts.push(...pageProducts);
                await this.log(`    ✅ Extracted ${pageProducts.length} products from page ${pageNum}`);
                
                // Try to navigate to next page
                const hasNextPage = await this.navigateToNextPage(page, store);
                if (!hasNextPage) {
                    await this.log(`    📋 No more pages in category`);
                    break;
                }
                
                // Brief delay between pages
                await page.waitForTimeout(2000);
            }
            
            await this.log(`  🎯 Category total: ${categoryProducts.length} products`);
            return categoryProducts;
            
        } catch (error) {
            await this.log(`  ❌ Category navigation error: ${error.message}`);
            return [];
        }
    }

    async navigateToNextPage(page, store) {
        for (const selector of store.paginationSelectors) {
            try {
                const nextButton = await page.$(selector);
                if (nextButton) {
                    const isEnabled = await nextButton.evaluate(el => !el.disabled && !el.classList.contains('disabled'));
                    
                    if (isEnabled) {
                        await this.log(`      ▶️ Clicking next page: ${selector}`);
                        await nextButton.click();
                        await page.waitForLoadState('domcontentloaded');
                        return true;
                    }
                }
            } catch (error) {
                continue; // Try next selector
            }
        }
        return false;
    }

    async extractProductsFromPage(page, store) {
        const products = [];
        
        try {
            // Wait for products to be visible
            await page.waitForSelector(store.productSelectors.container, { timeout: 10000 });
            
            const productElements = await page.$$(store.productSelectors.container);
            await this.log(`      🔍 Found ${productElements.length} product containers`);
            
            for (const element of productElements.slice(0, 50)) { // Limit to 50 per page
                try {
                    const product = await this.extractSingleProduct(element, store, page);
                    if (product) {
                        products.push(product);
                    }
                } catch (elementError) {
                    continue; // Skip problematic products
                }
            }
            
        } catch (error) {
            await this.log(`      ⚠️ Product extraction error: ${error.message}`);
        }
        
        return products;
    }

    async extractSingleProduct(element, store, page) {
        try {
            // Extract product name
            let name = null;
            for (const nameSelector of store.productSelectors.name.split(', ')) {
                const nameEl = await element.$(nameSelector);
                if (nameEl) {
                    name = await nameEl.textContent();
                    if (name && name.trim().length > 3) {
                        name = name.trim();
                        break;
                    }
                }
            }
            
            if (!name) return null;
            
            // Extract price
            let price = null;
            for (const priceSelector of store.productSelectors.price.split(', ')) {
                const priceEl = await element.$(priceSelector);
                if (priceEl) {
                    const priceText = await priceEl.textContent();
                    if (priceText) {
                        const priceMatch = priceText.match(/[\d,\.]+/);
                        if (priceMatch) {
                            price = parseInt(priceMatch[0].replace(/[^\d]/g, ''));
                            break;
                        }
                    }
                }
            }
            
            // Extract image
            let imageUrl = null;
            const imgEl = await element.$('img');
            if (imgEl) {
                imageUrl = await imgEl.getAttribute('src');
                if (imageUrl && imageUrl.startsWith('/')) {
                    imageUrl = store.baseUrl + imageUrl;
                }
            }
            
            // Extract product link for more details
            let productUrl = null;
            for (const linkSelector of (store.productSelectors.link || 'a').split(', ')) {
                const linkEl = await element.$(linkSelector);
                if (linkEl) {
                    productUrl = await linkEl.getAttribute('href');
                    if (productUrl) {
                        if (productUrl.startsWith('/')) {
                            productUrl = store.baseUrl + productUrl;
                        }
                        break;
                    }
                }
            }
            
            const product = {
                id: crypto.randomUUID(),
                name: name.substring(0, 200),
                price: price,
                currency: 'CLP',
                imageUrl: imageUrl,
                category: this.inferCategory(name),
                brand: this.extractBrand(name),
                store: {
                    name: store.name,
                    url: productUrl || page.url(),
                    scraped: new Date().toISOString(),
                    method: 'ENHANCED_NAVIGATION'
                },
                createdAt: new Date().toISOString()
            };
            
            return product;
            
        } catch (error) {
            return null;
        }
    }

    extractBrand(name) {
        if (!name) return 'Sin Marca';
        
        const commonBrands = [
            'Coca-Cola', 'Pepsi', 'Sprite', 'Fanta', 'Nestlé', 'Danone',
            'Soprole', 'Colun', 'Cachantún', 'Benedictino', 'Watt\'s',
            'McKay', 'Savory', 'Lucchetti', 'Carozzi'
        ];
        
        for (const brand of commonBrands) {
            if (name.toLowerCase().includes(brand.toLowerCase())) {
                return brand;
            }
        }
        
        return name.split(' ')[0] || 'Sin Marca';
    }

    inferCategory(name) {
        if (!name) return 'general';
        
        const nameLC = name.toLowerCase();
        const categories = {
            'bebidas': ['agua', 'jugo', 'bebida', 'coca', 'pepsi', 'sprite', 'fanta'],
            'lacteos': ['leche', 'yogur', 'queso', 'mantequilla'],
            'snacks': ['chocolate', 'galleta', 'dulce'],
            'carnes': ['pollo', 'carne', 'pescado'],
            'aseo': ['detergente', 'shampoo', 'jabon'],
            'panaderia': ['pan', 'hallulla']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => nameLC.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    async scrapeStore(store) {
        await this.log(`🚀 Starting enhanced navigation for ${store.name.toUpperCase()}`);
        
        const browser = await this.createNavigationBrowser();
        const storeProducts = [];
        
        try {
            const page = await this.createStealthPage(browser);
            
            // First try to access the main page
            try {
                await this.log(`🏠 Accessing home page: ${store.baseUrl}`);
                const response = await page.goto(store.baseUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });
                
                if (response && response.status() === 200) {
                    await this.log(`  ✅ Home page accessible`);
                    
                    // Try to extract products from home page first
                    const homeProducts = await this.extractProductsFromPage(page, store);
                    if (homeProducts.length > 0) {
                        storeProducts.push(...homeProducts);
                        await this.log(`  🏠 Home page: ${homeProducts.length} products`);
                    }
                } else {
                    await this.log(`  ❌ Home page failed: ${response?.status()}`);
                }
            } catch (homeError) {
                await this.log(`  ❌ Home page error: ${homeError.message}`);
            }
            
            // Navigate through categories
            for (const categoryPath of store.categoryPaths) {
                if (storeProducts.length >= this.maxProductsPerStore) {
                    await this.log(`  🎯 Reached product limit for ${store.name}`);
                    break;
                }
                
                const categoryProducts = await this.navigateToCategory(page, store, categoryPath);
                storeProducts.push(...categoryProducts);
                
                // Brief delay between categories
                await page.waitForTimeout(3000);
            }
            
            await page.close();
            
        } finally {
            await browser.close();
        }
        
        // Save store products
        if (storeProducts.length > 0) {
            await this.saveProducts(store.name, storeProducts);
            storeProducts.forEach(product => this.products.add(product));
        }
        
        await this.log(`🎉 ${store.name} complete: ${storeProducts.length} products`);
        return storeProducts;
    }

    async saveProducts(storeName, products) {
        const filePath = path.join(this.outputDir, `${storeName}-navigated.json`);
        await fs.writeFile(filePath, JSON.stringify(products, null, 2));
        await this.log(`💾 Saved ${products.length} products to ${filePath}`);
    }

    async run() {
        await this.ensureDirectories();
        await this.log('🧭 STARTING ENHANCED NAVIGATION SCRAPER');
        await this.log(`🎯 Target: ${this.maxProductsPerStore} products per store`);
        await this.log(`📊 Navigation depth: ${this.navigationDepth} levels`);
        
        const startTime = Date.now();
        
        try {
            for (const store of this.stores) {
                await this.scrapeStore(store);
                
                // Brief pause between stores
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            const duration = Math.round((Date.now() - startTime) / 1000 / 60);
            const totalProducts = this.products.size;
            
            await this.log('🎉 ENHANCED NAVIGATION COMPLETE');
            await this.log(`📊 Results: ${totalProducts} products in ${duration} minutes`);
            await this.log(`📈 Navigation rate: ${Math.round(totalProducts/duration)} products/minute`);
            
        } catch (error) {
            await this.log(`💥 Navigation failed: ${error.message}`);
        }
    }
}

// Run the enhanced navigator
if (require.main === module) {
    const scraper = new EnhancedNavigatorScraper();
    scraper.run().catch(error => {
        console.error('💥 Enhanced navigation failed:', error);
        process.exit(1);
    });
}

module.exports = EnhancedNavigatorScraper;