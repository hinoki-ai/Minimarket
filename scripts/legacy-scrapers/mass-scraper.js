#!/usr/bin/env node
'use strict';

/**
 * Mass Scraper - Scrape ALL products from ALL major Chilean supermarkets
 * Usage: node mass-scraper.js
 * Environment variables:
 * - STORES: comma-separated list of stores (default: all)
 * - CATEGORIES: comma-separated list of categories (default: all)
 * - CONCURRENT_STORES: how many stores to scrape simultaneously (default: 2)
 * - MAX_PRODUCTS_PER_STORE: maximum products per store (default: 50000)
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const UniversalProductScraper = require('./universal-product-scraper');

// All available stores and categories
const ALL_STORES = ['lider', 'jumbo', 'santa_isabel', 'unimarc', 'tottus', 'easy', 'falabella', 'paris', 'sodimac'];
const ALL_CATEGORIES = ['bebidas', 'snacks', 'lacteos', 'carnes', 'panaderia', 'aseo', 'hogar', 'herramientas', 'ferreteria', 'construccion', 'electricidad', 'jardineria', 'pinturas', 'plomeria'];

const CONFIG = {
  STORES: process.env.STORES ? process.env.STORES.split(',') : ALL_STORES,
  CATEGORIES: process.env.CATEGORIES ? process.env.CATEGORIES.split(',') : ALL_CATEGORIES,
  CONCURRENT_STORES: Number(process.env.CONCURRENT_STORES || 2),
  MAX_PRODUCTS_PER_STORE: Number(process.env.MAX_PRODUCTS_PER_STORE || 999999), // UNLIMITED
  OUTPUT_DIR: process.env.OUTPUT_DIR || path.join(__dirname, '..', 'data', 'mass-scrape'),
  VERBOSE: process.env.VERBOSE === '1',
  DRY_RUN: process.env.DRY_RUN === '1'
};

class MassScraper {
  constructor() {
    this.results = new Map();
    this.stats = {
      totalStores: CONFIG.STORES.length,
      completedStores: 0,
      failedStores: 0,
      totalProducts: 0,
      startTime: new Date().toISOString(),
      endTime: null
    };
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }
  }

  log(...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MASS-SCRAPER]`, ...args);
    
    // Also log to file
    const logFile = path.join(CONFIG.OUTPUT_DIR, 'mass-scraper.log');
    const logEntry = `[${timestamp}] ${args.join(' ')}\n`;
    fs.appendFileSync(logFile, logEntry);
  }

  async scrapeStore(storeName) {
    const startTime = Date.now();
    this.log(`Starting ${storeName}...`);
    
    try {
      // Set environment variables for this store
      process.env.STORE = storeName;
      process.env.CATEGORIES = CONFIG.CATEGORIES.join(',');
      process.env.MAX_PRODUCTS = CONFIG.MAX_PRODUCTS_PER_STORE.toString();
      process.env.VERBOSE = CONFIG.VERBOSE ? '1' : '0';
      process.env.DRY_RUN = CONFIG.DRY_RUN ? '1' : '0';
      
      // Create scraper instance
      const scraper = new UniversalProductScraper(storeName);
      await scraper.run();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      const productsCount = scraper.products.size;
      
      this.results.set(storeName, {
        success: true,
        products: productsCount,
        duration: duration,
        stats: scraper.stats
      });
      
      this.stats.completedStores++;
      this.stats.totalProducts += productsCount;
      
      this.log(`✅ ${storeName} completed: ${productsCount} products in ${Math.round(duration/60)} minutes`);
      
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      this.results.set(storeName, {
        success: false,
        error: error.message,
        duration: duration
      });
      
      this.stats.failedStores++;
      this.log(`❌ ${storeName} failed after ${Math.round(duration/60)} minutes: ${error.message}`);
    }
  }

  async scrapeStoresConcurrently(stores, concurrency) {
    const results = [];
    
    // Process stores in chunks
    for (let i = 0; i < stores.length; i += concurrency) {
      const chunk = stores.slice(i, i + concurrency);
      this.log(`Scraping batch: ${chunk.join(', ')}`);
      
      const promises = chunk.map(store => this.scrapeStore(store));
      await Promise.allSettled(promises);
      
      // Brief pause between batches
      if (i + concurrency < stores.length) {
        this.log(`Batch completed. Waiting 30 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    return results;
  }

  generateReport() {
    this.stats.endTime = new Date().toISOString();
    const totalDuration = new Date(this.stats.endTime).getTime() - new Date(this.stats.startTime).getTime();
    const durationHours = Math.round(totalDuration / 1000 / 60 / 60 * 10) / 10;
    
    const report = {
      summary: {
        ...this.stats,
        totalDurationHours: durationHours,
        averageProductsPerStore: Math.round(this.stats.totalProducts / (this.stats.completedStores || 1)),
        successRate: Math.round((this.stats.completedStores / this.stats.totalStores) * 100)
      },
      storeResults: Object.fromEntries(this.results),
      topPerformers: Array.from(this.results.entries())
        .filter(([store, result]) => result.success)
        .sort((a, b) => b[1].products - a[1].products)
        .slice(0, 5)
        .map(([store, result]) => ({ 
          store, 
          products: result.products, 
          productsPerMinute: Math.round(result.products / (result.duration / 60))
        }))
    };
    
    return report;
  }

  async saveReport(report) {
    const reportPath = path.join(CONFIG.OUTPUT_DIR, 'mass-scrape-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also create a human-readable summary
    const summaryPath = path.join(CONFIG.OUTPUT_DIR, 'mass-scrape-summary.txt');
    let summary = `MASS SCRAPING COMPLETE\n`;
    summary += `${'='.repeat(50)}\n`;
    summary += `Start Time: ${report.summary.startTime}\n`;
    summary += `End Time: ${report.summary.endTime}\n`;
    summary += `Total Duration: ${report.summary.totalDurationHours} hours\n`;
    summary += `Total Stores: ${report.summary.totalStores}\n`;
    summary += `Completed Stores: ${report.summary.completedStores}\n`;
    summary += `Failed Stores: ${report.summary.failedStores}\n`;
    summary += `Success Rate: ${report.summary.successRate}%\n`;
    summary += `Total Products: ${report.summary.totalProducts.toLocaleString()}\n`;
    summary += `Average Products/Store: ${report.summary.averageProductsPerStore.toLocaleString()}\n`;
    summary += `\nTOP PERFORMERS:\n`;
    
    report.topPerformers.forEach((performer, i) => {
      summary += `${i+1}. ${performer.store.toUpperCase()}: ${performer.products.toLocaleString()} products (${performer.productsPerMinute}/min)\n`;
    });
    
    summary += `\nDETAILED RESULTS:\n`;
    Object.entries(report.storeResults).forEach(([store, result]) => {
      const status = result.success ? '✅' : '❌';
      const products = result.success ? `${result.products.toLocaleString()} products` : `Error: ${result.error}`;
      const duration = Math.round(result.duration / 60);
      summary += `${status} ${store.toUpperCase()}: ${products} (${duration} minutes)\n`;
    });
    
    fs.writeFileSync(summaryPath, summary);
    
    this.log(`Reports saved to:`);
    this.log(`- JSON: ${reportPath}`);
    this.log(`- Summary: ${summaryPath}`);
  }

  async run() {
    this.log('🚀 STARTING MASS SCRAPER');
    this.log(`Stores: ${CONFIG.STORES.join(', ')}`);
    this.log(`Categories: ${CONFIG.CATEGORIES.join(', ')}`);
    this.log(`Max products per store: ${CONFIG.MAX_PRODUCTS_PER_STORE.toLocaleString()}`);
    this.log(`Concurrent stores: ${CONFIG.CONCURRENT_STORES}`);
    this.log(`Dry run: ${CONFIG.DRY_RUN}`);
    
    const startTime = Date.now();
    
    try {
      await this.scrapeStoresConcurrently(CONFIG.STORES, CONFIG.CONCURRENT_STORES);
      
      const report = this.generateReport();
      await this.saveReport(report);
      
      const totalDuration = Math.round((Date.now() - startTime) / 1000 / 60);
      
      this.log('🎉 MASS SCRAPING COMPLETED');
      this.log(`Total duration: ${totalDuration} minutes`);
      this.log(`Completed stores: ${this.stats.completedStores}/${this.stats.totalStores}`);
      this.log(`Total products scraped: ${this.stats.totalProducts.toLocaleString()}`);
      
      if (this.stats.failedStores > 0) {
        this.log(`⚠️  ${this.stats.failedStores} stores failed - check the log for details`);
      }
      
    } catch (error) {
      this.log('💥 MASS SCRAPING FAILED:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const scraper = new MassScraper();
  scraper.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = MassScraper;