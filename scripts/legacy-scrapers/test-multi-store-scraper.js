'use strict';

/**
 * Multi-Store Scraper Test Script
 * Tests the complete workflow across multiple Chilean supermarkets
 * Demonstrates scraping → validation → library building
 */

const fs = require('fs');
const path = require('path');
const UniversalProductScraper = require('./universal-product-scraper');
const DataValidator = require('./data-validator');
const ProductLibrary = require('./product-library');

class MultiStoreScrapeTest {
  constructor(options = {}) {
    this.stores = options.stores || ['lider', 'jumbo', 'santa_isabel'];
    this.categories = options.categories || ['bebidas', 'snacks', 'lacteos'];
    this.maxProductsPerStore = options.maxProductsPerStore || 20;
    this.dryRun = options.dryRun || true; // Safe default
    this.verbose = options.verbose || true;
    
    this.dataDir = path.join(__dirname, '..', 'data', 'products');
    this.imageDir = path.join(__dirname, '..', 'public', 'images', 'products');
    
    this.results = {
      stores: {},
      totalProducts: 0,
      totalImages: 0,
      errors: []
    };
  }

  log(...args) {
    if (this.verbose) {
      console.log('[TEST]', ...args);
    }
  }

  error(...args) {
    console.error('[TEST]', ...args);
    this.results.errors.push(args.join(' '));
  }

  async scrapeStore(storeName) {
    this.log(`Testing scraper for ${storeName}...`);
    
    try {
      // Configure environment for this store
      process.env.STORE = storeName;
      process.env.CATEGORIES = this.categories.join(',');
      process.env.MAX_PRODUCTS = this.maxProductsPerStore.toString();
      process.env.DRY_RUN = this.dryRun ? '1' : '0';
      process.env.VERBOSE = this.verbose ? '1' : '0';
      process.env.MAX_PAGES = '3'; // Limit pages for testing
      
      const scraper = new UniversalProductScraper(storeName);
      
      if (this.dryRun) {
        // In dry run mode, simulate scraping with sample data
        await this.simulateStoreScraping(storeName);
      } else {
        // Real scraping
        await scraper.run();
      }
      
      // Analyze results
      const storeDataPath = path.join(this.dataDir, storeName, 'products.json');
      let productCount = 0;
      
      if (fs.existsSync(storeDataPath) || this.dryRun) {
        if (this.dryRun) {
          productCount = Math.floor(Math.random() * this.maxProductsPerStore) + 5;
        } else {
          const products = JSON.parse(fs.readFileSync(storeDataPath, 'utf8'));
          productCount = products.length;
        }
      }
      
      this.results.stores[storeName] = {
        success: true,
        productCount,
        categories: this.categories.length,
        timestamp: new Date().toISOString()
      };
      
      this.results.totalProducts += productCount;
      this.log(`✓ ${storeName}: ${productCount} products`);
      
    } catch (error) {
      this.error(`Failed to scrape ${storeName}:`, error.message);
      this.results.stores[storeName] = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async simulateStoreScraping(storeName) {
    this.log(`[DRY RUN] Simulating scraping for ${storeName}...`);
    
    // Create sample data structure
    const sampleProducts = this.generateSampleProducts(storeName);
    
    // Ensure directory exists
    const storeDir = path.join(this.dataDir, storeName);
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    }
    
    // Save sample data
    const dataPath = path.join(storeDir, 'products.json');
    fs.writeFileSync(dataPath, JSON.stringify(sampleProducts, null, 2));
    
    // Create sample manifest
    const manifestPath = path.join(this.imageDir, storeName, 'manifest.json');
    const manifestDir = path.dirname(manifestPath);
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }
    
    const manifest = {
      store: storeName,
      totalProducts: sampleProducts.length,
      categories: this.categories,
      lastUpdated: new Date().toISOString(),
      stats: {
        pagesVisited: 3,
        productsFound: sampleProducts.length,
        imagesDownloaded: this.dryRun ? 0 : sampleProducts.length,
        errors: 0
      }
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    this.log(`[DRY RUN] Created ${sampleProducts.length} sample products for ${storeName}`);
  }

  generateSampleProducts(storeName) {
    const products = [];
    const productCount = Math.floor(Math.random() * this.maxProductsPerStore) + 5;
    
    const sampleNames = {
      bebidas: [
        'Coca-Cola 1.5L', 'Fanta Naranja 500ml', 'Sprite 1L', 'Cachantún Agua 1.5L',
        'Jugo Natural 1L', 'Cerveza Cristal 355ml', 'Néctar Watts 1L'
      ],
      snacks: [
        'Papas Lays Original', 'Chocolate Sahne-Nuss', 'Galletas McKay',
        'Maní Salado', 'Ramitas Queso', 'Cheetos Queso'
      ],
      lacteos: [
        'Leche Soprole Entera 1L', 'Queso Gouda', 'Yogurt Natural',
        'Mantequilla Colun', 'Queso Cremoso', 'Leche Descremada 1L'
      ]
    };
    
    const brands = {
      bebidas: ['Coca-Cola', 'Fanta', 'Sprite', 'Cachantún', 'Watts', 'CCU'],
      snacks: ['Lays', 'Nestlé', 'McKay', 'Evercrisp', 'Frito-Lay'],
      lacteos: ['Soprole', 'Colun', 'Nestlé', 'Quillayes', 'Surlat']
    };

    for (let i = 0; i < productCount; i++) {
      const category = this.categories[i % this.categories.length];
      const names = sampleNames[category];
      const brandOptions = brands[category];
      
      const name = names[Math.floor(Math.random() * names.length)];
      const brand = brandOptions[Math.floor(Math.random() * brandOptions.length)];
      const price = Math.floor(Math.random() * 5000) + 500; // 500-5500 CLP
      
      const productId = this.generateProductId(name, brand);
      const now = new Date().toISOString();
      
      const product = {
        id: productId,
        name: name,
        brand: brand,
        category: category,
        price: price,
        currency: 'CLP',
        description: `${name} - Producto de calidad de ${brand}`,
        shortDescription: name,
        imageUrl: `/images/products/${category}/${productId}.webp`,
        thumbnailUrl: `/images/products/${category}/thumbs/${productId}.webp`,
        stock: Math.floor(Math.random() * 100) + 10,
        inStock: true,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
        reviewCount: Math.floor(Math.random() * 200),
        popularity: Math.floor(Math.random() * 100) + 1,
        tags: this.generateTags(name, category),
        origin: 'Chile',
        store: {
          name: storeName,
          url: `https://www.${storeName}.cl/product/${productId}`,
          scraped: now,
          section: category
        },
        createdAt: now,
        updatedAt: now
      };
      
      products.push(product);
    }
    
    return products;
  }

  generateProductId(name, brand = '') {
    const text = `${brand} ${name}`.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return text || `product-${Date.now()}`;
  }

  generateTags(name, category) {
    const tags = [category];
    
    if (name.includes('1L') || name.includes('1.5L')) tags.push('familiar');
    if (name.includes('500ml') || name.includes('250ml')) tags.push('individual');
    if (name.includes('Original')) tags.push('original');
    if (name.includes('Natural')) tags.push('natural');
    
    return tags;
  }

  async validateAllData() {
    this.log('Validating scraped data...');
    
    try {
      const validator = new DataValidator(this.dataDir);
      const stats = await validator.run();
      
      this.results.validation = {
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      };
      
      this.log(`✓ Validation complete: ${stats.finalProductCount} valid products`);
      
    } catch (error) {
      this.error('Validation failed:', error.message);
      this.results.validation = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async buildLibrary() {
    this.log('Building product library...');
    
    try {
      const library = new ProductLibrary({ dataDir: this.dataDir });
      await library.loadLibrary();
      
      const stats = library.getStats();
      const validation = await library.validateLibrary();
      
      this.results.library = {
        success: true,
        stats: stats,
        validation: validation,
        timestamp: new Date().toISOString()
      };
      
      this.log(`✓ Library built: ${stats.totalProducts} products, ${stats.totalImages} images`);
      
      // Test search functionality
      const searchResults = library.search({ query: 'coca cola', limit: 5 });
      this.log(`✓ Search test: found ${searchResults.total} results for "coca cola"`);
      
      // Test category browsing
      const categoryProducts = library.getProductsByCategory('bebidas', { includeImages: true });
      this.log(`✓ Category test: found ${categoryProducts.length} bebidas`);
      
    } catch (error) {
      this.error('Library building failed:', error.message);
      this.results.library = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runFullTest() {
    this.log('='.repeat(60));
    this.log('MULTI-STORE SCRAPER TEST STARTED');
    this.log(`Stores: ${this.stores.join(', ')}`);
    this.log(`Categories: ${this.categories.join(', ')}`);
    this.log(`Max products per store: ${this.maxProductsPerStore}`);
    this.log(`Dry run: ${this.dryRun}`);
    this.log('='.repeat(60));

    try {
      // Step 1: Scrape all stores
      this.log('\nStep 1: Scraping stores...');
      for (const store of this.stores) {
        await this.scrapeStore(store);
        // Small delay between stores
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Validate data
      this.log('\nStep 2: Validating data...');
      await this.validateAllData();

      // Step 3: Build library
      this.log('\nStep 3: Building library...');
      await this.buildLibrary();

      // Step 4: Generate report
      await this.generateReport();

      this.log('\n' + '='.repeat(60));
      this.log('MULTI-STORE SCRAPER TEST COMPLETED SUCCESSFULLY');
      this.log('='.repeat(60));

    } catch (error) {
      this.error('Test failed:', error.message);
      throw error;
    }
  }

  async generateReport() {
    const reportPath = path.join(this.dataDir, 'test-report.json');
    const report = {
      testInfo: {
        timestamp: new Date().toISOString(),
        stores: this.stores,
        categories: this.categories,
        dryRun: this.dryRun,
        maxProductsPerStore: this.maxProductsPerStore
      },
      results: this.results,
      summary: {
        totalStoresTested: Object.keys(this.results.stores).length,
        successfulStores: Object.values(this.results.stores).filter(s => s.success).length,
        totalProducts: this.results.totalProducts,
        validationSuccess: this.results.validation?.success || false,
        librarySuccess: this.results.library?.success || false,
        finalProductCount: this.results.library?.stats?.totalProducts || 0,
        totalImages: this.results.library?.stats?.totalImages || 0,
        errorCount: this.results.errors.length
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n📊 Test report saved: ${reportPath}`);

    // Print summary to console
    console.log('\n📋 TEST SUMMARY:');
    console.log(`   Stores tested: ${report.summary.totalStoresTested}/${this.stores.length}`);
    console.log(`   Successful scrapes: ${report.summary.successfulStores}/${report.summary.totalStoresTested}`);
    console.log(`   Products scraped: ${report.summary.totalProducts}`);
    console.log(`   Validation: ${report.summary.validationSuccess ? '✅' : '❌'}`);
    console.log(`   Library: ${report.summary.librarySuccess ? '✅' : '❌'}`);
    console.log(`   Final product count: ${report.summary.finalProductCount}`);
    console.log(`   Images: ${report.summary.totalImages}`);
    console.log(`   Errors: ${report.summary.errorCount}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
  }
}

// CLI interface
async function main() {
  const options = {
    stores: ['lider'], // Start with just lider for initial testing
    categories: ['bebidas', 'snacks'],
    maxProductsPerStore: 10,
    dryRun: true, // Safe default
    verbose: true
  };

  // Parse command line arguments
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    
    switch (key) {
      case 'stores':
        options.stores = value?.split(',') || options.stores;
        break;
      case 'categories':
        options.categories = value?.split(',') || options.categories;
        break;
      case 'max-products':
        options.maxProductsPerStore = parseInt(value) || options.maxProductsPerStore;
        break;
      case 'real':
        options.dryRun = false;
        break;
      case 'quiet':
        options.verbose = false;
        break;
    }
  }

  console.log('🚀 Starting Multi-Store Scraper Test');
  console.log('⚠️  This is a test script. Use --real for actual scraping.');
  
  const tester = new MultiStoreScrapeTest(options);
  await tester.runFullTest();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = MultiStoreScrapeTest;