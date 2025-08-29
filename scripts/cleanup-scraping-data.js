#!/usr/bin/env node

/**
 * Comprehensive scraping data cleanup and organization script
 * Organizes the extensive Chilean minimarket scraping infrastructure
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

console.log('🧹 Starting comprehensive scraping data cleanup...\n');

/**
 * Archive old scraper runs and consolidate data
 */
function archiveScrapingData() {
  console.log('📂 Archiving scraping data...');
  
  const archiveDir = path.join(DATA_DIR, 'scraping', 'archived');
  const activeDir = path.join(DATA_DIR, 'scraping', 'active');
  
  // Ensure directories exist
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(activeDir, { recursive: true });
  
  // Move ultra-* directories to archived
  const ultraDirs = [
    'ultra-scraper',
    'ultra-scraper-test', 
    'ultra-20250813-132501',
    'ultra-aggressive'
  ];
  
  ultraDirs.forEach(dirName => {
    const sourcePath = path.join(DATA_DIR, dirName);
    const targetPath = path.join(archiveDir, dirName);
    
    if (fs.existsSync(sourcePath)) {
      console.log(`  Moving ${dirName} to archived/`);
      fs.renameSync(sourcePath, targetPath);
    }
  });
}

/**
 * Consolidate product data from all scrapers
 */
function consolidateProductData() {
  console.log('\n📦 Consolidating product data...');
  
  const productsDir = path.join(DATA_DIR, 'products');
  const consolidatedDir = path.join(DATA_DIR, 'scraping', 'active', 'consolidated');
  
  fs.mkdirSync(consolidatedDir, { recursive: true });
  
  // Copy latest products from each store
  const stores = ['jumbo', 'lider', 'santa_isabel', 'tottus', 'unimarc', 'sodimac'];
  
  stores.forEach(store => {
    const storeDir = path.join(productsDir, store);
    const mainProductFile = path.join(storeDir, 'products.json');
    
    if (fs.existsSync(mainProductFile)) {
      const targetFile = path.join(consolidatedDir, `${store}-latest.json`);
      console.log(`  Consolidating ${store} products...`);
      fs.copyFileSync(mainProductFile, targetFile);
    }
  });
  
  // Archive backup files 
  console.log('  Archiving backup files...');
  const backupArchive = path.join(DATA_DIR, 'scraping', 'archived', 'backups');
  fs.mkdirSync(backupArchive, { recursive: true });
  
  stores.forEach(store => {
    const storeDir = path.join(productsDir, store);
    if (!fs.existsSync(storeDir)) return;
    
    const files = fs.readdirSync(storeDir);
    const backupFiles = files.filter(file => file.includes('backup'));
    
    backupFiles.forEach(backupFile => {
      const sourcePath = path.join(storeDir, backupFile);
      const targetPath = path.join(backupArchive, `${store}-${backupFile}`);
      fs.renameSync(sourcePath, targetPath);
    });
  });
}

/**
 * Create scraping summary and inventory
 */
function createScrapingSummary() {
  console.log('\n📊 Creating scraping summary...');
  
  const summaryPath = path.join(DATA_DIR, 'scraping', 'SCRAPING_INVENTORY.md');
  
  const summary = `# Minimarket Scraping Infrastructure Inventory

## Overview
Comprehensive Chilean minimarket product scraping system covering:
- **Jumbo** - Leading supermarket chain
- **Líder** - Walmart Chile subsidiary  
- **Santa Isabel** - Cencosud subsidiary
- **Tottus** - Falabella retail chain
- **Unimarc** - Chilean supermarket chain
- **Sodimac** - Home improvement retailer

## Data Organization

### Active Data (\`data/scraping/active/\`)
- **consolidated/** - Latest products from each store
- **images/** - Current product images
- **reports/** - Recent scraping reports

### Archived Data (\`data/scraping/archived/\`)
- **legacy-scraped/** - Original scraped assets
- **ultra-scraper/** - Historical ultra-scraper runs
- **backups/** - Product data backups by date

### Raw Data (\`data/products/\`)
- Individual store product databases
- Validation and summary files
- Store-specific manifests

## Scraper Commands (package.json)

\`\`\`bash
# Main scraper (ultra-scraper.js)
npm run scrape

# Líder-specific scraping
npm run scrape:lider
npm run scrape:lider:clean

# Data standardization
npm run scrape:standardize
\`\`\`

## Data Schema
Products follow standardized Chilean market schema:
- SKU, name, price, brand, category
- Store-specific metadata
- Image URLs and local paths
- Availability and stock status

## Archive Policy
- Keep last 30 days of active data
- Archive older runs monthly
- Maintain consolidated latest data per store

Last updated: ${new Date().toISOString()}
`;

  fs.writeFileSync(summaryPath, summary);
  console.log('  Created scraping inventory documentation');
}

/**
 * Clean up temporary and log files
 */
function cleanupTempFiles() {
  console.log('\n🗑️ Cleaning up temporary files...');
  
  // Remove old log files from root
  const logFiles = ['jumbo-scrape.log', 'lider-scrape.log', 'santaisabel-scrape.log', 'unimarc-scrape.log'];
  const logsDir = path.join(PROJECT_ROOT, 'logs');
  
  if (fs.existsSync(logsDir)) {
    logFiles.forEach(logFile => {
      const logPath = path.join(logsDir, logFile);
      if (fs.existsSync(logPath)) {
        console.log(`  Removing ${logFile}`);
        fs.unlinkSync(logPath);
      }
    });
    
    // Remove logs directory if empty
    const remainingFiles = fs.readdirSync(logsDir);
    if (remainingFiles.length === 0) {
      fs.rmdirSync(logsDir);
      console.log('  Removed empty logs directory');
    }
  }
  
  // Remove .scraper.pid if exists
  const scraperPid = path.join(PROJECT_ROOT, '.scraper.pid');
  if (fs.existsSync(scraperPid)) {
    fs.unlinkSync(scraperPid);
    console.log('  Removed .scraper.pid file');
  }
}

/**
 * Update package.json scripts for cleaner scraping
 */
function updateScrapingScripts() {
  console.log('\n⚙️ Updating scraping scripts...');
  
  const packagePath = path.join(PROJECT_ROOT, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Clean up scraping scripts
  const cleanScripts = {
    ...packageJson.scripts,
    // Remove absolute path references
    "scrape": "echo 'Scraper needs configuration - see data/scraping/SCRAPING_INVENTORY.md'",
    // Keep existing scripts but add note
    "scrape:lider": packageJson.scripts["scrape:lider"] || "node scripts/scrape_lider_products.js",
    "scrape:lider:clean": packageJson.scripts["scrape:lider:clean"] || "node scripts/clean_lider_images.js",
    "scrape:standardize": packageJson.scripts["scrape:standardize"] || "node scripts/standardize-scraper-outputs.js"
  };
  
  // Remove the absolute path "xx" script
  delete cleanScripts.xx;
  
  packageJson.scripts = cleanScripts;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('  Updated package.json scraping scripts');
}

// Execute cleanup
try {
  archiveScrapingData();
  consolidateProductData();
  createScrapingSummary();
  cleanupTempFiles();
  updateScrapingScripts();
  
  console.log('\n✅ Scraping data cleanup completed successfully!');
  console.log('\n📋 Summary:');
  console.log('  • Archived ultra-scraper runs');
  console.log('  • Consolidated latest product data');
  console.log('  • Created scraping inventory documentation');
  console.log('  • Cleaned up temporary files');
  console.log('  • Updated package.json scripts');
  console.log('\n🔍 See data/scraping/SCRAPING_INVENTORY.md for details');
  
} catch (error) {
  console.error('\n❌ Error during cleanup:', error.message);
  process.exit(1);
}