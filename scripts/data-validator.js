'use strict';

/**
 * Data Validation and Deduplication System
 * Ensures product data quality and removes duplicates across stores
 * Validates against the ProductSchema and cleans inconsistent data
 */

const fs = require('fs');
const path = require('path');
const { ProductSchema, Categories } = require('./product-schema');

class DataValidator {
  constructor(dataDir = path.join(__dirname, '..', 'data', 'products')) {
    this.dataDir = dataDir;
    this.products = new Map();
    this.duplicates = new Map();
    this.errors = [];
    this.stats = {
      totalProducts: 0,
      validProducts: 0,
      invalidProducts: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      errorsFixed: 0
    };
  }

  log(...args) {
    console.log('[VALIDATOR]', ...args);
  }

  error(...args) {
    console.error('[VALIDATOR]', ...args);
  }

  // Load all product data from different stores
  loadAllProducts() {
    this.log('Loading products from all stores...');
    
    const storeFiles = [
      'lider/products.json',
      'jumbo/products.json',
      'santa_isabel/products.json',
      'unimarc/products.json',
      '../all-products.json'
    ];

    let allProducts = [];

    for (const file of storeFiles) {
      const filePath = path.join(this.dataDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Array.isArray(products)) {
            allProducts.push(...products);
            this.log(`Loaded ${products.length} products from ${file}`);
          }
        } catch (error) {
          this.error(`Failed to load ${file}:`, error.message);
        }
      }
    }

    this.stats.totalProducts = allProducts.length;
    this.log(`Total products loaded: ${allProducts.length}`);
    return allProducts;
  }

  // Validate a single product against the schema
  validateProduct(product) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    const requiredFields = ['id', 'name', 'category', 'price', 'currency', 'description', 'imageUrl', 'stock', 'inStock', 'store', 'createdAt', 'updatedAt'];
    
    for (const field of requiredFields) {
      if (!product.hasOwnProperty(field) || product[field] === null || product[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type validation
    if (typeof product.name !== 'string' || product.name.trim() === '') {
      errors.push('Product name must be a non-empty string');
    }

    if (typeof product.price !== 'number' || product.price < 0) {
      errors.push('Price must be a non-negative number');
    }

    if (product.currency && product.currency !== 'CLP') {
      warnings.push(`Unexpected currency: ${product.currency} (expected CLP)`);
    }

    if (product.category && !Categories.hasOwnProperty(product.category)) {
      errors.push(`Invalid category: ${product.category}`);
    }

    if (typeof product.stock !== 'number' || product.stock < 0) {
      errors.push('Stock must be a non-negative number');
    }

    if (typeof product.inStock !== 'boolean') {
      errors.push('inStock must be a boolean');
    }

    // URL validation
    if (product.imageUrl && !this.isValidImageUrl(product.imageUrl)) {
      errors.push('Invalid imageUrl format');
    }

    if (product.thumbnailUrl && !this.isValidImageUrl(product.thumbnailUrl)) {
      errors.push('Invalid thumbnailUrl format');
    }

    // Store validation
    if (!product.store || typeof product.store !== 'object') {
      errors.push('Store information is required');
    } else {
      if (!product.store.name || typeof product.store.name !== 'string') {
        errors.push('Store name is required');
      }
      if (!product.store.scraped || !this.isValidISODate(product.store.scraped)) {
        errors.push('Store scraped timestamp is invalid');
      }
    }

    // Date validation
    if (!this.isValidISODate(product.createdAt)) {
      errors.push('createdAt must be a valid ISO date string');
    }

    if (!this.isValidISODate(product.updatedAt)) {
      errors.push('updatedAt must be a valid ISO date string');
    }

    // Optional field validation
    if (product.rating && (typeof product.rating !== 'number' || product.rating < 1 || product.rating > 5)) {
      warnings.push('Rating should be between 1 and 5');
    }

    if (product.reviewCount && (typeof product.reviewCount !== 'number' || product.reviewCount < 0)) {
      warnings.push('ReviewCount should be a non-negative number');
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  isValidImageUrl(url) {
    if (typeof url !== 'string') return false;
    
    // Check if it starts with / (relative URL) or http (absolute URL)
    if (url.startsWith('/') || url.startsWith('http')) {
      // Check if it ends with a valid image extension
      return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url);
    }
    
    return false;
  }

  isValidISODate(dateString) {
    if (typeof dateString !== 'string') return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString === date.toISOString();
  }

  // Fix common data issues
  fixProduct(product, validationResult) {
    const fixed = { ...product };
    let fixCount = 0;

    // Fix missing required fields with defaults
    if (!fixed.id) {
      fixed.id = this.generateProductId(fixed.name, fixed.brand);
      fixCount++;
    }

    if (!fixed.currency) {
      fixed.currency = 'CLP';
      fixCount++;
    }

    if (typeof fixed.inStock !== 'boolean') {
      fixed.inStock = fixed.stock > 0;
      fixCount++;
    }

    if (!fixed.tags || !Array.isArray(fixed.tags)) {
      fixed.tags = [];
      fixCount++;
    }

    if (!fixed.description && fixed.name) {
      fixed.description = fixed.name;
      fixCount++;
    }

    if (!fixed.shortDescription && fixed.name) {
      fixed.shortDescription = fixed.name.length > 50 ? 
        fixed.name.substring(0, 47) + '...' : fixed.name;
      fixCount++;
    }

    // Fix price format (remove decimals for CLP)
    if (fixed.currency === 'CLP' && fixed.price % 1 !== 0) {
      fixed.price = Math.round(fixed.price);
      fixCount++;
    }

    // Fix timestamps
    const now = new Date().toISOString();
    if (!this.isValidISODate(fixed.createdAt)) {
      fixed.createdAt = now;
      fixCount++;
    }
    if (!this.isValidISODate(fixed.updatedAt)) {
      fixed.updatedAt = now;
      fixCount++;
    }

    // Fix store information
    if (!fixed.store || typeof fixed.store !== 'object') {
      fixed.store = {
        name: 'unknown',
        url: '',
        scraped: now,
        section: fixed.category || 'general'
      };
      fixCount++;
    } else {
      if (!this.isValidISODate(fixed.store.scraped)) {
        fixed.store.scraped = now;
        fixCount++;
      }
    }

    // Clean and normalize text fields
    if (fixed.name) {
      const cleanName = this.cleanText(fixed.name);
      if (cleanName !== fixed.name) {
        fixed.name = cleanName;
        fixCount++;
      }
    }

    if (fixed.description) {
      const cleanDesc = this.cleanText(fixed.description);
      if (cleanDesc !== fixed.description) {
        fixed.description = cleanDesc;
        fixCount++;
      }
    }

    if (fixed.brand) {
      const cleanBrand = this.cleanText(fixed.brand);
      if (cleanBrand !== fixed.brand) {
        fixed.brand = cleanBrand;
        fixCount++;
      }
    }

    this.stats.errorsFixed += fixCount;
    return fixed;
  }

  cleanText(text) {
    if (typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\w\s\-.,()áéíóúñüÁÉÍÓÚÑÜ]/g, '') // Remove special chars except common Spanish
      .trim();
  }

  generateProductId(name, brand = '') {
    const text = `${brand} ${name}`.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return text || `product-${Date.now()}`;
  }

  // Find and handle duplicates
  findDuplicates(products) {
    this.log('Finding duplicates...');
    
    const groups = new Map();
    
    for (const product of products) {
      // Create deduplication keys
      const keys = [
        // Exact name match
        product.name?.toLowerCase().trim(),
        
        // Brand + name match
        `${product.brand?.toLowerCase().trim()} ${product.name?.toLowerCase().trim()}`,
        
        // Barcode match (if available)
        product.barcode,
        
        // Similar name (without common words)
        this.normalizeForDuplication(product.name)
      ].filter(Boolean);

      for (const key of keys) {
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(product);
      }
    }

    // Find actual duplicates
    const duplicateGroups = [];
    for (const [key, products] of groups.entries()) {
      if (products.length > 1) {
        // Further validate these are actual duplicates
        const realDuplicates = this.validateDuplicateGroup(products);
        if (realDuplicates.length > 1) {
          duplicateGroups.push({
            key,
            products: realDuplicates,
            count: realDuplicates.length
          });
        }
      }
    }

    this.stats.duplicatesFound = duplicateGroups.reduce((sum, group) => sum + group.count - 1, 0);
    this.log(`Found ${duplicateGroups.length} duplicate groups with ${this.stats.duplicatesFound} duplicates`);
    
    return duplicateGroups;
  }

  normalizeForDuplication(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .replace(/\b(de|la|el|los|las|y|con|sin|para)\b/g, '') // Remove Spanish articles
      .replace(/\b(1l|1\.5l|2l|500ml|250ml|kg|gr|unidades?|pack|botella|lata)\b/g, '') // Remove measurements
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  validateDuplicateGroup(products) {
    // Use more sophisticated matching for final validation
    const confirmed = [];
    const processed = new Set();

    for (let i = 0; i < products.length; i++) {
      if (processed.has(i)) continue;
      
      const base = products[i];
      const matches = [base];
      processed.add(i);

      for (let j = i + 1; j < products.length; j++) {
        if (processed.has(j)) continue;
        
        const candidate = products[j];
        
        if (this.areProductsSimilar(base, candidate)) {
          matches.push(candidate);
          processed.add(j);
        }
      }

      if (matches.length > 1) {
        confirmed.push(...matches);
      }
    }

    return confirmed;
  }

  areProductsSimilar(product1, product2) {
    // Calculate similarity score
    let score = 0;
    let maxScore = 0;

    // Name similarity (weight: 40%)
    const nameWeight = 40;
    maxScore += nameWeight;
    const nameSimilarity = this.textSimilarity(product1.name, product2.name);
    score += nameSimilarity * nameWeight;

    // Brand similarity (weight: 20%)
    const brandWeight = 20;
    maxScore += brandWeight;
    if (product1.brand && product2.brand) {
      const brandSimilarity = this.textSimilarity(product1.brand, product2.brand);
      score += brandSimilarity * brandWeight;
    } else if (product1.brand === product2.brand) {
      score += brandWeight; // Both null/undefined
    }

    // Category match (weight: 20%)
    const categoryWeight = 20;
    maxScore += categoryWeight;
    if (product1.category === product2.category) {
      score += categoryWeight;
    }

    // Price similarity (weight: 20%)
    const priceWeight = 20;
    maxScore += priceWeight;
    if (product1.price && product2.price) {
      const priceDiff = Math.abs(product1.price - product2.price);
      const avgPrice = (product1.price + product2.price) / 2;
      const priceVariance = priceDiff / avgPrice;
      
      if (priceVariance < 0.1) { // Within 10%
        score += priceWeight;
      } else if (priceVariance < 0.2) { // Within 20%
        score += priceWeight * 0.5;
      }
    }

    const similarity = score / maxScore;
    return similarity > 0.8; // 80% similarity threshold
  }

  textSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const str1 = text1.toLowerCase().trim();
    const str2 = text2.toLowerCase().trim();
    
    if (str1 === str2) return 1;
    
    // Use Levenshtein distance for similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 0;
  }

  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Deduplicate by keeping the best version of each product
  deduplicateGroups(duplicateGroups) {
    this.log('Removing duplicates...');
    
    const toRemove = new Set();
    
    for (const group of duplicateGroups) {
      // Sort products by quality score (best first)
      const sorted = group.products.sort((a, b) => this.calculateQualityScore(b) - this.calculateQualityScore(a));
      
      // Keep the first (best) product, mark others for removal
      const keeper = sorted[0];
      const duplicates = sorted.slice(1);
      
      this.log(`Keeping ${keeper.name} (${keeper.store?.name}) from group of ${group.products.length}`);
      
      for (const duplicate of duplicates) {
        toRemove.add(duplicate.id + '|' + duplicate.store?.name);
      }
    }

    this.stats.duplicatesRemoved = toRemove.size;
    return toRemove;
  }

  calculateQualityScore(product) {
    let score = 0;
    
    // Has image
    if (product.imageUrl && product.imageUrl !== '') score += 20;
    if (product.thumbnailUrl && product.thumbnailUrl !== '') score += 10;
    
    // Has detailed info
    if (product.description && product.description.length > 20) score += 15;
    if (product.brand && product.brand !== '') score += 15;
    if (product.barcode && product.barcode !== '') score += 10;
    
    // Data completeness
    if (product.nutrition && Object.keys(product.nutrition).length > 0) score += 10;
    if (product.ingredients && product.ingredients.length > 0) score += 5;
    if (product.tags && product.tags.length > 0) score += 5;
    
    // Recent data
    if (product.store?.scraped) {
      const age = Date.now() - new Date(product.store.scraped).getTime();
      const daysSinceScraped = age / (1000 * 60 * 60 * 24);
      if (daysSinceScraped < 1) score += 10;
      else if (daysSinceScraped < 7) score += 5;
    }

    return score;
  }

  // Generate cleaned and validated dataset
  processAllProducts() {
    this.log('Starting data validation and deduplication...');
    
    const rawProducts = this.loadAllProducts();
    const validatedProducts = [];
    
    // Validate and fix each product
    this.log('Validating individual products...');
    for (const product of rawProducts) {
      const validation = this.validateProduct(product);
      
      if (validation.isValid) {
        validatedProducts.push(product);
        this.stats.validProducts++;
      } else {
        // Try to fix the product
        const fixedProduct = this.fixProduct(product, validation);
        const revalidation = this.validateProduct(fixedProduct);
        
        if (revalidation.isValid) {
          validatedProducts.push(fixedProduct);
          this.stats.validProducts++;
        } else {
          this.errors.push({
            product: product.id || 'unknown',
            store: product.store?.name || 'unknown',
            errors: validation.errors
          });
          this.stats.invalidProducts++;
        }
      }
    }

    // Find and remove duplicates
    const duplicateGroups = this.findDuplicates(validatedProducts);
    const toRemove = this.deduplicateGroups(duplicateGroups);
    
    // Filter out duplicates
    const finalProducts = validatedProducts.filter(product => 
      !toRemove.has(product.id + '|' + product.store?.name)
    );

    this.log('Data processing complete');
    this.log(`Original products: ${rawProducts.length}`);
    this.log(`Valid products: ${validatedProducts.length}`);
    this.log(`Final products (after deduplication): ${finalProducts.length}`);
    
    return finalProducts;
  }

  // Save cleaned data
  saveCleanedData(products) {
    const outputPath = path.join(this.dataDir, 'validated-products.json');
    const statsPath = path.join(this.dataDir, 'validation-stats.json');
    const errorsPath = path.join(this.dataDir, 'validation-errors.json');
    
    // Save products
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    this.log(`Saved ${products.length} validated products to ${outputPath}`);
    
    // Save stats
    const finalStats = {
      ...this.stats,
      finalProductCount: products.length,
      validationDate: new Date().toISOString()
    };
    fs.writeFileSync(statsPath, JSON.stringify(finalStats, null, 2));
    
    // Save errors
    if (this.errors.length > 0) {
      fs.writeFileSync(errorsPath, JSON.stringify(this.errors, null, 2));
      this.log(`Saved ${this.errors.length} validation errors to ${errorsPath}`);
    }
    
    return finalStats;
  }

  // Main entry point
  async run() {
    try {
      const products = this.processAllProducts();
      const stats = this.saveCleanedData(products);
      
      this.log('='.repeat(50));
      this.log('DATA VALIDATION COMPLETE');
      this.log(`Total products processed: ${stats.totalProducts}`);
      this.log(`Valid products: ${stats.validProducts}`);
      this.log(`Invalid products: ${stats.invalidProducts}`);
      this.log(`Duplicates found: ${stats.duplicatesFound}`);
      this.log(`Duplicates removed: ${stats.duplicatesRemoved}`);
      this.log(`Errors fixed: ${stats.errorsFixed}`);
      this.log(`Final dataset: ${stats.finalProductCount} products`);
      this.log('='.repeat(50));
      
      return stats;
    } catch (error) {
      this.error('Validation failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const dataDir = process.argv[2] || path.join(__dirname, '..', 'data', 'products');
  const validator = new DataValidator(dataDir);
  await validator.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DataValidator;