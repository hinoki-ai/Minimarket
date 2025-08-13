#!/usr/bin/env node
'use strict';

/**
 * Universal Product Scraper CLI
 * Master command-line interface for all scraper functionality
 */

const fs = require('fs');
const path = require('path');

class ScraperCLI {
  constructor() {
    this.commands = {
      setup: 'Initialize scraper and create directory structure',
      scrape: 'Extract products from Chilean supermarkets',
      validate: 'Clean and validate scraped product data',
      library: 'Build and query product library',
      test: 'Run multi-store integration tests',
      search: 'Search products in library',
      export: 'Export product data in various formats',
      stats: 'Show library statistics and health',
      help: 'Show this help message'
    };
  }

  showHelp() {
    console.log('🛒 Universal Product Scraper for Chilean Markets');
    console.log('   Extract product data from supermarkets & hardware stores\n');
    
    console.log('Usage: node scraper-cli.js <command> [options]\n');
    
    console.log('Commands:');
    Object.entries(this.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(12)} ${desc}`);
    });
    
    console.log('\nExamples:');
    console.log('  node scraper-cli.js setup                           # Initial setup');
    console.log('  node scraper-cli.js scrape --store lider --dry-run  # Test scraping');
    console.log('  node scraper-cli.js scrape --store jumbo --real     # Real scraping');
    console.log('  node scraper-cli.js test --stores lider,jumbo       # Multi-store test');
    console.log('  node scraper-cli.js search "coca cola"              # Search products');
    console.log('  node scraper-cli.js export --format csv            # Export as CSV');
    
    console.log('\nStore Options:');
    console.log('  --store <name>     Target store: lider, jumbo, santa_isabel, unimarc');
    console.log('  --categories <list> Categories: bebidas,snacks,lacteos,herramientas');
    console.log('  --max-products <n> Maximum products to extract');
    console.log('  --dry-run         Test mode (no actual downloads)');
    console.log('  --real            Real scraping mode');
    console.log('  --verbose         Detailed logging');
    
    console.log('\nDocumentation: scripts/README.md');
  }

  parseArgs(args) {
    const options = {
      command: args[0] || 'help',
      store: 'lider',
      categories: 'bebidas,snacks',
      maxProducts: '50',
      dryRun: true,
      verbose: false,
      format: 'json',
      query: '',
      headless: true,
      seedUrls: []
    };

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      const value = args[i + 1];

      switch (arg) {
        case '--store':
          options.store = value;
          i++;
          break;
        case '--categories':
          options.categories = value;
          i++;
          break;
        case '--max-products':
          options.maxProducts = value;
          i++;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--real':
          options.dryRun = false;
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--format':
          options.format = value;
          i++;
          break;
        case '--headful':
          options.headless = false;
          break;
        case '--seed-urls':
          options.seedUrls = (value || '').split(',').map(u => u.trim()).filter(Boolean);
          i++;
          break;
        case '--query':
          options.query = value;
          i++;
          break;
        case '--stores':
          options.stores = value?.split(',') || ['lider'];
          i++;
          break;
        default:
          if (!arg.startsWith('--') && options.command === 'search' && !options.query) {
            options.query = arg;
          }
      }
    }

    return options;
  }

  async executeCommand(command, options) {
    try {
      switch (command) {
        case 'setup':
          await this.runSetup(options);
          break;
        case 'scrape':
          await this.runScraper(options);
          break;
        case 'validate':
          await this.runValidator(options);
          break;
        case 'library':
          await this.runLibrary(options);
          break;
        case 'test':
          await this.runTest(options);
          break;
        case 'search':
          await this.runSearch(options);
          break;
        case 'export':
          await this.runExport(options);
          break;
        case 'stats':
          await this.runStats(options);
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async runSetup(options) {
    console.log('🔧 Initializing Universal Product Scraper...\n');
    const SetupScript = require('./setup');
    const setup = new SetupScript();
    await setup.run();
  }

  async runScraper(options) {
    console.log(`🛒 Scraping ${options.store} for ${options.categories}...`);
    console.log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'REAL SCRAPING'}`);
    console.log(`   Max products: ${options.maxProducts}\n`);

    // Set environment variables
    process.env.STORE = options.store;
    process.env.CATEGORIES = options.categories;
    process.env.MAX_PRODUCTS = options.maxProducts;
    process.env.DRY_RUN = options.dryRun ? '1' : '0';
    process.env.VERBOSE = options.verbose ? '1' : '0';
    process.env.HEADLESS = options.headless ? '1' : '0';
    if (options.seedUrls && options.seedUrls.length) {
      process.env.SEED_URLS = options.seedUrls.join(',');
    }

    const UniversalProductScraper = require('./universal-product-scraper');
    const scraper = new UniversalProductScraper(options.store);
    await scraper.run();
  }

  async runValidator(options) {
    console.log('🔍 Validating and cleaning product data...\n');
    
    const DataValidator = require('./data-validator');
    const validator = new DataValidator();
    const stats = await validator.run();
    
    console.log('\n📊 Validation Summary:');
    console.log(`   Original products: ${stats.totalProducts}`);
    console.log(`   Valid products: ${stats.validProducts}`);
    console.log(`   Duplicates removed: ${stats.duplicatesRemoved}`);
    console.log(`   Final dataset: ${stats.finalProductCount} products`);
  }

  async runLibrary(options) {
    console.log('📚 Building product library...\n');
    
    const ProductLibrary = require('./product-library');
    const library = new ProductLibrary();
    await library.loadLibrary();
    
    const stats = library.getStats();
    console.log('📊 Library Statistics:');
    console.log(`   Total products: ${stats.totalProducts}`);
    console.log(`   Total images: ${stats.totalImages}`);
    console.log(`   Categories: ${Object.keys(stats.categories).length}`);
    console.log(`   Search tokens: ${stats.searchTokens}`);
    console.log(`   Last updated: ${stats.lastUpdated}`);
    
    if (options.verbose) {
      console.log('\n📂 Products by category:');
      Object.entries(stats.categories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
    }
  }

  async runTest(options) {
    console.log('🧪 Running multi-store integration test...\n');
    
    const MultiStoreScrapeTest = require('./test-multi-store-scraper');
    const testOptions = {
      stores: options.stores || [options.store],
      categories: options.categories.split(','),
      maxProductsPerStore: parseInt(options.maxProducts) || 20,
      dryRun: options.dryRun,
      verbose: options.verbose
    };
    
    const tester = new MultiStoreScrapeTest(testOptions);
    await tester.runFullTest();
  }

  async runSearch(options) {
    if (!options.query) {
      console.error('❌ Search query required. Usage: scraper-cli.js search "query"');
      return;
    }
    
    console.log(`🔍 Searching for "${options.query}"...\n`);
    
    const ProductLibrary = require('./product-library');
    const library = new ProductLibrary();
    await library.loadLibrary();
    
    const results = library.search({
      query: options.query,
      limit: 20
    });
    
    console.log(`Found ${results.total} products:\n`);
    
    results.products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Brand: ${product.brand || 'N/A'}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Price: $${product.price} ${product.currency}`);
      console.log(`   Store: ${product.store?.name || 'Unknown'}`);
      if (product.imageUrl) {
        console.log(`   Image: ${product.imageUrl}`);
      }
      console.log('');
    });
    
    if (results.hasMore) {
      console.log(`... and ${results.total - results.products.length} more results`);
    }
  }

  async runExport(options) {
    console.log(`📄 Exporting products as ${options.format}...\n`);
    
    const ProductLibrary = require('./product-library');
    const library = new ProductLibrary();
    await library.loadLibrary();
    
    const exported = library.exportData(options.format, {
      includeImages: true
    });
    
    const filename = `products-${new Date().toISOString().split('T')[0]}.${options.format}`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, exported);
    console.log(`✅ Exported to ${filename}`);
    
    if (options.format === 'json') {
      const data = JSON.parse(exported);
      console.log(`   ${data.length} products exported`);
    }
  }

  async runStats(options) {
    console.log('📊 System Health & Statistics\n');
    
    try {
      const ProductLibrary = require('./product-library');
      const library = new ProductLibrary();
      await library.loadLibrary();
      
      const stats = library.getStats();
      const validation = await library.validateLibrary();
      
      console.log('📈 Library Status:');
      console.log(`   Status: ${validation.isValid ? '✅ Healthy' : '⚠️ Issues found'}`);
      console.log(`   Products: ${stats.totalProducts}`);
      console.log(`   Images: ${stats.totalImages}`);
      console.log(`   Categories: ${Object.keys(stats.categories).length}`);
      console.log(`   Last updated: ${stats.lastUpdated || 'Never'}`);
      
      console.log('\n🏪 Store Coverage:');
      console.log(`   Stores: ${stats.stores}`);
      console.log(`   Brands: ${stats.brands}`);
      
      console.log('\n💾 Storage Usage:');
      const dataDir = path.join(__dirname, '..', 'data', 'products');
      const imageDir = path.join(__dirname, '..', 'public', 'images', 'products');
      
      if (fs.existsSync(dataDir)) {
        const dataSize = this.getDirectorySize(dataDir);
        console.log(`   Data: ${this.formatBytes(dataSize)}`);
      }
      
      if (fs.existsSync(imageDir)) {
        const imageSize = this.getDirectorySize(imageDir);
        console.log(`   Images: ${this.formatBytes(imageSize)}`);
      }
      
      if (!validation.isValid) {
        console.log('\n⚠️ Issues Found:');
        validation.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`);
        });
        console.log('\nRun "scraper-cli.js validate" to fix issues');
      }
      
    } catch (error) {
      console.log('❌ Could not load library statistics');
      console.log('💡 Try running "scraper-cli.js setup" first');
    }
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Directory doesn't exist or permission denied
    }
    
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showHelp();
      return;
    }
    
    const options = this.parseArgs(args);
    await this.executeCommand(options.command, options);
  }
}

// Make script executable
if (require.main === module) {
  const cli = new ScraperCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = ScraperCLI;