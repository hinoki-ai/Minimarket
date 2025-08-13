#!/usr/bin/env node
'use strict';

/**
 * Continuous Aggregator - Real-time monitoring and aggregation of all scraper data
 * Watches all scraper output directories and continuously updates the product library
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ContinuousAggregator {
    constructor() {
        this.watchedDirectories = [
            path.join(__dirname, '..', 'data', 'products'),
            path.join(__dirname, '..', 'data', 'advanced-scrape'),
            path.join(__dirname, '..', 'data', 'ultra-aggressive'),
            path.join(__dirname, '..', 'data', 'multi-vector'),
            path.join(__dirname, '..', 'data', 'mass-scrape'),
            // Include outputs from the new ultra scraper and the consolidated massive library
            path.join(__dirname, '..', 'data', 'ultra-scraper'),
            path.join(__dirname, '..', 'data', 'massive-library')
        ];
        
        this.productLibrary = new Map();
        this.outputDir = path.join(__dirname, '..', 'data', 'live-aggregation');
        this.logFile = path.join(this.outputDir, 'continuous.log');
        
        this.lastUpdate = new Date();
        this.updateCount = 0;
        this.checkInterval = 10000; // Check every 10 seconds
    }

    async ensureDirectories() {
        await fs.mkdir(this.outputDir, { recursive: true });
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        console.log(`[CONTINUOUS] ${message}`);
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (e) {
            // Continue if logging fails
        }
    }

    async scanForNewFiles() {
        const allFiles = [];
        
        for (const dir of this.watchedDirectories) {
            try {
                await this.scanDirectory(dir, allFiles);
            } catch (error) {
                // Directory might not exist yet
            }
        }
        
        return allFiles;
    }

    async scanDirectory(dirPath, fileList) {
        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    await this.scanDirectory(itemPath, fileList);
                } else if (item.name.endsWith('.json')) {
                    
                    const stats = await fs.stat(itemPath);
                    fileList.push({
                        path: itemPath,
                        name: item.name,
                        modified: stats.mtime,
                        size: stats.size
                    });
                }
            }
        } catch (error) {
            // Continue if directory scan fails
        }
    }

    async processFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            if (!content.trim() || content.trim() === '[]') {
                return [];
            }

            const data = JSON.parse(content);
            let products = [];
            
            if (Array.isArray(data)) {
                products = data;
            } else if (data.products) {
                products = data.products;
            } else if (data.storeResults) {
                // Handle report format
                for (const result of Object.values(data.storeResults)) {
                    if (result.products && Array.isArray(result.products)) {
                        products.push(...result.products);
                    }
                }
            }
            
            return products.filter(p => p && p.name && typeof p.name === 'string');
            
        } catch (error) {
            return [];
        }
    }

    generateProductId(product) {
        const key = `${product.name}_${product.store?.name || 'unknown'}`.toLowerCase();
        return crypto.createHash('md5').update(key).digest('hex');
    }

    async updateLibrary() {
        const files = await this.scanForNewFiles();
        let newProductCount = 0;
        let updatedFiles = 0;
        
        for (const file of files) {
            // Only process files that have been modified recently or are new
            if (file.modified > this.lastUpdate || !this.productLibrary.has(file.path)) {
                const products = await this.processFile(file.path);
                
                if (products.length > 0) {
                    updatedFiles++;
                    
                    for (const product of products) {
                        const id = product.id || this.generateProductId(product);
                        
                        if (!this.productLibrary.has(id)) {
                            // New product
                            const processedProduct = {
                                id: id,
                                name: product.name?.trim(),
                                brand: product.brand || this.extractBrand(product.name),
                                category: product.category || this.inferCategory(product.name),
                                price: this.normalizePrice(product.price),
                                currency: product.currency || 'CLP',
                                description: product.description || `${product.name} - Producto de calidad`,
                                imageUrl: product.imageUrl || product.image,
                                store: {
                                    name: product.store?.name || 'unknown',
                                    url: product.store?.url || product.url,
                                    scraped: product.store?.scraped || product.createdAt || new Date().toISOString(),
                                    method: product.store?.method || 'SCRAPER'
                                },
                                sourceFile: path.basename(file.path),
                                discoveredAt: new Date().toISOString(),
                                createdAt: product.createdAt || new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };
                            
                            this.productLibrary.set(id, processedProduct);
                            newProductCount++;
                        }
                    }
                }
            }
        }
        
        this.lastUpdate = new Date();
        this.updateCount++;
        
        if (newProductCount > 0 || updatedFiles > 0) {
            await this.log(`📊 Update ${this.updateCount}: +${newProductCount} products from ${updatedFiles} files | Total: ${this.productLibrary.size}`);
            await this.saveCurrentState();
        }
        
        return { newProducts: newProductCount, updatedFiles: updatedFiles };
    }

    extractBrand(name) {
        if (!name) return 'Sin Marca';
        
        const commonBrands = [
            'Coca-Cola', 'Pepsi', 'Sprite', 'Fanta', 'Nestlé', 'Danone', 
            'Soprole', 'Colun', 'Cachantún', 'Benedictino', 'Watt\'s',
            'McKay', 'Savory', 'Lucchetti', 'Carozzi', 'Chef', 'Maggi',
            'Jumbo', 'Líder', 'Tottus', 'Easy', 'Falabella'
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
            'bebidas': ['agua', 'jugo', 'bebida', 'coca', 'pepsi', 'sprite', 'fanta', 'cerveza', 'vino'],
            'lacteos': ['leche', 'yogur', 'queso', 'mantequilla', 'crema'],
            'snacks': ['chocolate', 'galleta', 'dulce', 'papa', 'chip'],
            'carnes': ['pollo', 'carne', 'pescado', 'cerdo', 'vacuno'],
            'aseo': ['detergente', 'shampoo', 'jabon', 'pasta'],
            'hogar': ['herramientas', 'pintura', 'electricidad', 'toalla'],
            'panaderia': ['pan', 'hallulla', 'marraqueta']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => nameLC.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    normalizePrice(price) {
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
            const numStr = price.replace(/[^\d]/g, '');
            return numStr ? parseInt(numStr) : null;
        }
        return null;
    }

    async saveCurrentState() {
        const allProducts = Array.from(this.productLibrary.values());
        
        // Save complete library
        const libraryPath = path.join(this.outputDir, 'live-product-library.json');
        await fs.writeFile(libraryPath, JSON.stringify(allProducts, null, 2));
        
        // Generate live statistics
        const stats = this.generateLiveStats(allProducts);
        const statsPath = path.join(this.outputDir, 'live-stats.json');
        await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
        
        // Save human-readable summary
        const summaryPath = path.join(this.outputDir, 'LIVE-SUMMARY.txt');
        await this.generateLiveSummary(stats, summaryPath);
    }

    generateLiveStats(products) {
        const stats = {
            timestamp: new Date().toISOString(),
            totalProducts: products.length,
            updateCount: this.updateCount,
            lastUpdate: this.lastUpdate.toISOString(),
            byStore: {},
            byCategory: {},
            byMethod: {},
            withPrices: 0,
            withImages: 0,
            averagePrice: 0,
            priceRange: { min: Infinity, max: 0 }
        };
        
        let validPrices = [];
        
        products.forEach(product => {
            // Store breakdown
            const store = product.store.name;
            stats.byStore[store] = (stats.byStore[store] || 0) + 1;
            
            // Category breakdown
            const category = product.category;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            
            // Method breakdown
            const method = product.store.method;
            stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
            
            // Price and image stats
            if (product.price && product.price > 0) {
                stats.withPrices++;
                validPrices.push(product.price);
                stats.priceRange.min = Math.min(stats.priceRange.min, product.price);
                stats.priceRange.max = Math.max(stats.priceRange.max, product.price);
            }
            if (product.imageUrl) {
                stats.withImages++;
            }
        });
        
        if (validPrices.length > 0) {
            stats.averagePrice = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length);
        }
        
        if (stats.priceRange.min === Infinity) {
            stats.priceRange = null;
        }
        
        return stats;
    }

    async generateLiveSummary(stats, summaryPath) {
        let summary = `LIVE CHILEAN SUPERMARKET PRODUCT LIBRARY\n`;
        summary += `${'='.repeat(60)}\n`;
        summary += `🕒 Last Update: ${new Date(stats.lastUpdate).toLocaleString()}\n`;
        summary += `🔄 Updates: ${stats.updateCount}\n\n`;
        
        summary += `📊 CURRENT TOTALS\n`;
        summary += `Total Products: ${stats.totalProducts.toLocaleString()}\n`;
        summary += `Stores: ${Object.keys(stats.byStore).length} (${Object.keys(stats.byStore).join(', ')})\n`;
        summary += `Categories: ${Object.keys(stats.byCategory).length}\n`;
        summary += `With Prices: ${stats.withPrices} (${Math.round((stats.withPrices/stats.totalProducts)*100)}%)\n`;
        summary += `With Images: ${stats.withImages} (${Math.round((stats.withImages/stats.totalProducts)*100)}%)\n`;
        summary += `Average Price: $${stats.averagePrice?.toLocaleString()} CLP\n\n`;
        
        summary += `🏪 BY STORE\n`;
        Object.entries(stats.byStore)
            .sort(([,a], [,b]) => b - a)
            .forEach(([store, count]) => {
                summary += `${store.toUpperCase()}: ${count.toLocaleString()}\n`;
            });
        
        summary += `\n🏷️ BY CATEGORY\n`;
        Object.entries(stats.byCategory)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                summary += `${category.toUpperCase()}: ${count.toLocaleString()}\n`;
            });
        
        summary += `\n⚡ BY SCRAPING METHOD\n`;
        Object.entries(stats.byMethod)
            .sort(([,a], [,b]) => b - a)
            .forEach(([method, count]) => {
                summary += `${method}: ${count.toLocaleString()}\n`;
            });
        
        await fs.writeFile(summaryPath, summary);
    }

    async run() {
        await this.ensureDirectories();
        await this.log('🔄 STARTING CONTINUOUS AGGREGATION');
        await this.log(`👀 Watching ${this.watchedDirectories.length} directories`);
        await this.log(`⏱️  Checking every ${this.checkInterval/1000} seconds`);
        
        // Initial scan
        await this.updateLibrary();
        
        // Continuous monitoring
        const intervalId = setInterval(async () => {
            try {
                const result = await this.updateLibrary();
                
                if (this.productLibrary.size >= 500) {
                    await this.log(`🎉 TARGET ACHIEVED: ${this.productLibrary.size} products >= 500!`);
                }
                
                // Log progress every 10 updates
                if (this.updateCount % 10 === 0) {
                    await this.log(`📈 Progress Report - Update ${this.updateCount}: ${this.productLibrary.size} total products`);
                }
                
            } catch (error) {
                await this.log(`⚠️  Update error: ${error.message}`);
            }
        }, this.checkInterval);
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await this.log('🛑 Shutting down continuous aggregation...');
            clearInterval(intervalId);
            await this.saveCurrentState();
            await this.log(`✅ Final state saved: ${this.productLibrary.size} products`);
            process.exit(0);
        });
        
        await this.log('🚀 Continuous aggregation is running! Press Ctrl+C to stop.');
    }
}

// Start continuous aggregation
if (require.main === module) {
    const aggregator = new ContinuousAggregator();
    aggregator.run().catch(error => {
        console.error('💥 Continuous aggregation failed:', error);
        process.exit(1);
    });
}

module.exports = ContinuousAggregator;