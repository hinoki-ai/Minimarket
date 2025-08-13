'use strict';

/**
 * Setup Script for Universal Product Scraper
 * Initializes directories, installs dependencies, and runs basic tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupScript {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.requiredDirs = [
      'data/products',
      'data/products/.cache',
      'public/images/products',
      'public/images/products/bebidas',
      'public/images/products/bebidas/thumbs',
      'public/images/products/snacks',
      'public/images/products/snacks/thumbs',
      'public/images/products/lacteos',
      'public/images/products/lacteos/thumbs',
      'public/images/products/herramientas',
      'public/images/products/herramientas/thumbs',
      'public/images/products/ferreteria',
      'public/images/products/ferreteria/thumbs',
      'public/images/products/lider',
      'public/images/products/jumbo',
      'public/images/products/santa_isabel',
      'public/images/products/unimarc'
    ];
  }

  log(...args) {
    console.log('🔧 [SETUP]', ...args);
  }

  success(...args) {
    console.log('✅', ...args);
  }

  error(...args) {
    console.error('❌ [SETUP]', ...args);
  }

  warning(...args) {
    console.warn('⚠️ [SETUP]', ...args);
  }

  // Create required directory structure
  createDirectories() {
    this.log('Creating directory structure...');
    
    for (const dir of this.requiredDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.log(`Created: ${dir}`);
      }
    }
    
    this.success('Directory structure ready');
  }

  // Check and install Node.js dependencies
  checkDependencies() {
    this.log('Checking dependencies...');
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion < 16) {
        this.error(`Node.js ${majorVersion} detected. Requires Node.js 16 or higher.`);
        return false;
      }
      
      this.success(`Node.js ${nodeVersion} ✓`);
      
      // Check if package.json exists in scripts directory
      const scriptsPackageJson = path.join(__dirname, 'package.json');
      if (fs.existsSync(scriptsPackageJson)) {
        this.log('Installing scraper dependencies...');
        process.chdir(__dirname);
        execSync('npm install', { stdio: 'inherit' });
        this.success('Scraper dependencies installed');
      }
      
      // Check main project dependencies
      const mainPackageJson = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(mainPackageJson)) {
        this.log('Checking main project dependencies...');
        process.chdir(this.projectRoot);
        
        // Check if @playwright/test is installed
        try {
          require.resolve('@playwright/test');
          this.success('Playwright already installed');
        } catch (e) {
          this.log('Installing Playwright...');
          execSync('npm install @playwright/test', { stdio: 'inherit' });
          execSync('npx playwright install chromium', { stdio: 'inherit' });
          this.success('Playwright installed');
        }
      }
      
      return true;
    } catch (error) {
      this.error('Dependency installation failed:', error.message);
      return false;
    }
  }

  // Create sample configuration files
  createSampleConfigs() {
    this.log('Creating sample configuration...');
    
    // Create environment configuration
    const envSamplePath = path.join(__dirname, '.env.sample');
    const envContent = `# Universal Product Scraper Configuration
# Store selection: lider, jumbo, santa_isabel, unimarc
STORE=lider

# Categories to scrape (comma-separated)
CATEGORIES=bebidas,snacks,lacteos

# Limits
MAX_PAGES=10
MAX_PRODUCTS=50
CONCURRENT_DOWNLOADS=3
MIN_IMAGE_BYTES=10240

# Behavior
DRY_RUN=1
VERBOSE=1

# Paths (optional - uses defaults if not set)
# OUTPUT_DIR=/path/to/images
# DATA_DIR=/path/to/data
`;
    
    if (!fs.existsSync(envSamplePath)) {
      fs.writeFileSync(envSamplePath, envContent);
      this.log('Created .env.sample configuration file');
    }
    
    // Create store configuration template
    const storeConfigPath = path.join(__dirname, 'store-config-template.js');
    const storeConfigContent = `// Store Configuration Template
// Copy this template to add new stores to product-schema.js

const newStoreConfig = {
  name: 'Your Store Name',
  baseUrl: 'https://www.yourstore.com',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  selectors: {
    // CSS selectors for product data extraction
    productCard: '.product-card, .item-product',
    productName: 'h1, .product-title, [data-testid="product-name"]',
    price: '.price, .precio, [data-testid="price"]',
    image: '.product-image img, img[src*="product"]',
    description: '.description, .product-description',
    brand: '.brand, .marca, [data-testid="brand"]'
  },
  rateLimit: 1000,  // Milliseconds between requests
  concurrent: 2     // Max concurrent operations
};

// Add to StoreConfigs in product-schema.js:
// StoreConfigs.your_store = newStoreConfig;
`;
    
    if (!fs.existsSync(storeConfigPath)) {
      fs.writeFileSync(storeConfigPath, storeConfigContent);
      this.log('Created store configuration template');
    }
    
    this.success('Sample configurations created');
  }

  // Run basic system tests
  async runBasicTests() {
    this.log('Running basic tests...');
    
    try {
      // Test 1: Schema validation
      this.log('Testing product schema...');
      const { ProductSchema, Categories } = require('./product-schema');
      
      if (Object.keys(Categories).length > 0) {
        this.success(`Product schema loaded (${Object.keys(Categories).length} categories)`);
      } else {
        this.error('Product schema validation failed');
        return false;
      }
      
      // Test 2: Scraper initialization
      this.log('Testing scraper initialization...');
      const UniversalProductScraper = require('./universal-product-scraper');
      const scraper = new UniversalProductScraper('lider');
      
      if (scraper.storeName === 'lider') {
        this.success('Scraper initialization ✓');
      } else {
        this.error('Scraper initialization failed');
        return false;
      }
      
      // Test 3: Data validator
      this.log('Testing data validator...');
      const DataValidator = require('./data-validator');
      const validator = new DataValidator();
      
      if (validator.dataDir) {
        this.success('Data validator ✓');
      } else {
        this.error('Data validator initialization failed');
        return false;
      }
      
      // Test 4: Product library
      this.log('Testing product library...');
      const ProductLibrary = require('./product-library');
      const library = new ProductLibrary();
      
      if (library.dataDir) {
        this.success('Product library ✓');
      } else {
        this.error('Product library initialization failed');
        return false;
      }
      
      // Test 5: Run dry-run test
      this.log('Running integration test (dry run)...');
      const MultiStoreScrapeTest = require('./test-multi-store-scraper');
      const tester = new MultiStoreScrapeTest({
        stores: ['lider'],
        categories: ['bebidas'],
        maxProductsPerStore: 5,
        dryRun: true,
        verbose: false
      });
      
      await tester.runFullTest();
      this.success('Integration test passed ✓');
      
      return true;
    } catch (error) {
      this.error('Basic tests failed:', error.message);
      return false;
    }
  }

  // Display usage information
  showUsageInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SETUP COMPLETE - Universal Product Scraper Ready!');
    console.log('='.repeat(60));
    
    console.log('\n📚 Quick Start Commands:');
    console.log('  npm run test                 # Run full system test');
    console.log('  npm run scrape               # Start scraping products');
    console.log('  npm run validate             # Clean and validate data');
    console.log('  npm run library              # View library statistics');
    console.log('  npm run search "coca cola"   # Search products');
    
    console.log('\n🔧 Configuration:');
    console.log('  • Edit .env.sample and rename to .env for custom settings');
    console.log('  • Modify product-schema.js to add new stores or categories');
    console.log('  • Check README.md for comprehensive documentation');
    
    console.log('\n🚀 Example Workflows:');
    console.log('  1. Test scraping: STORE=lider DRY_RUN=1 npm run scrape');
    console.log('  2. Real scraping: STORE=lider MAX_PRODUCTS=50 npm run scrape');
    console.log('  3. Multi-store:   npm run test -- --stores lider,jumbo --real');
    
    console.log('\n🏪 Supported Stores:');
    console.log('  • Líder (lider)');
    console.log('  • Jumbo (jumbo)'); 
    console.log('  • Santa Isabel (santa_isabel)');
    console.log('  • Unimarc (unimarc)');
    
    console.log('\n🛠️ Hardware Store Support:');
    console.log('  • Check README.md section "Hardware Store Adaptation"');
    console.log('  • Use store-config-template.js for new stores');
    console.log('  • Categories: herramientas, ferreteria, construccion, etc.');
    
    console.log('\n⚠️  Important Notes:');
    console.log('  • Always start with DRY_RUN=1 for testing');
    console.log('  • Respect website terms of service');
    console.log('  • Monitor resource usage during scraping');
    
    console.log('\n📖 Documentation: scripts/README.md');
    console.log('='.repeat(60) + '\n');
  }

  // Main setup process
  async run() {
    console.log('🚀 Universal Product Scraper Setup');
    console.log('   Preparing system for Chilean market data extraction...\n');
    
    try {
      // Step 1: Create directories
      this.createDirectories();
      
      // Step 2: Check dependencies
      const depsOk = this.checkDependencies();
      if (!depsOk) {
        this.error('Setup failed: dependency issues');
        process.exit(1);
      }
      
      // Step 3: Create configuration templates
      this.createSampleConfigs();
      
      // Step 4: Run basic tests
      const testsOk = await this.runBasicTests();
      if (!testsOk) {
        this.warning('Setup completed with test warnings');
        this.warning('Some features may not work correctly');
      }
      
      // Step 5: Show usage information
      this.showUsageInfo();
      
    } catch (error) {
      this.error('Setup failed:', error.message);
      console.log('\n🔍 Troubleshooting:');
      console.log('  1. Ensure Node.js 16+ is installed');
      console.log('  2. Check write permissions in project directory');
      console.log('  3. Install dependencies manually: npm install @playwright/test');
      console.log('  4. Try running: npx playwright install chromium');
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const setup = new SetupScript();
  await setup.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  });
}

module.exports = SetupScript;