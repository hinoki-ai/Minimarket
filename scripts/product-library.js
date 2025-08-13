'use strict';

/**
 * Product Library with Image-Data Linking System
 * Manages relationships between product data and images
 * Provides search, indexing, and data access functionality
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProductLibrary {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(__dirname, '..', 'data', 'products');
    this.imageDir = options.imageDir || path.join(__dirname, '..', 'public', 'images', 'products');
    this.cacheDir = options.cacheDir || path.join(this.dataDir, '.cache');
    
    this.products = new Map();
    this.imageIndex = new Map();
    this.searchIndex = new Map();
    this.categoryIndex = new Map();
    this.brandIndex = new Map();
    this.storeIndex = new Map();
    
    this.libraryVersion = '1.0.0';
    this.lastUpdated = null;
    
    this.ensureDirectories();
  }

  log(...args) {
    console.log('[LIBRARY]', ...args);
  }

  error(...args) {
    console.error('[LIBRARY]', ...args);
  }

  ensureDirectories() {
    [this.dataDir, this.cacheDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Load product data and build indexes
  async loadLibrary() {
    this.log('Loading product library...');
    
    try {
      // Load validated products
      const validatedPath = path.join(this.dataDir, 'validated-products.json');
      if (fs.existsSync(validatedPath)) {
        const products = JSON.parse(fs.readFileSync(validatedPath, 'utf8'));
        await this.indexProducts(products);
        this.log(`Loaded ${products.length} validated products`);
      } else {
        // Fallback to all-products.json
        const allProductsPath = path.join(this.dataDir, 'all-products.json');
        if (fs.existsSync(allProductsPath)) {
          const products = JSON.parse(fs.readFileSync(allProductsPath, 'utf8'));
          await this.indexProducts(products);
          this.log(`Loaded ${products.length} products from fallback source`);
        } else {
          this.log('No product data found');
        }
      }
      
      // Build image index
      await this.buildImageIndex();
      
      // Cache the indexes
      await this.cacheIndexes();
      
      this.lastUpdated = new Date().toISOString();
      this.log('Library loaded successfully');
      
    } catch (error) {
      this.error('Failed to load library:', error.message);
      throw error;
    }
  }

  // Index all products for fast searching
  async indexProducts(products) {
    this.products.clear();
    this.searchIndex.clear();
    this.categoryIndex.clear();
    this.brandIndex.clear();
    this.storeIndex.clear();

    for (const product of products) {
      // Main product storage
      this.products.set(product.id, product);
      
      // Search index (full-text search tokens)
      this.indexProductForSearch(product);
      
      // Category index
      if (!this.categoryIndex.has(product.category)) {
        this.categoryIndex.set(product.category, new Set());
      }
      this.categoryIndex.get(product.category).add(product.id);
      
      // Brand index
      if (product.brand) {
        const brandKey = product.brand.toLowerCase();
        if (!this.brandIndex.has(brandKey)) {
          this.brandIndex.set(brandKey, new Set());
        }
        this.brandIndex.get(brandKey).add(product.id);
      }
      
      // Store index
      const storeKey = product.store?.name;
      if (storeKey) {
        if (!this.storeIndex.has(storeKey)) {
          this.storeIndex.set(storeKey, new Set());
        }
        this.storeIndex.get(storeKey).add(product.id);
      }
    }

    this.log(`Indexed ${this.products.size} products`);
  }

  indexProductForSearch(product) {
    const tokens = new Set();
    
    // Tokenize searchable fields
    const searchableText = [
      product.name,
      product.brand,
      product.description,
      product.shortDescription,
      ...(product.tags || []),
      ...(product.ingredients || [])
    ].filter(Boolean).join(' ').toLowerCase();

    // Create search tokens
    const words = searchableText.match(/\w+/g) || [];
    words.forEach(word => {
      if (word.length >= 2) { // Minimum word length
        tokens.add(word);
        // Add partial matches for longer words
        if (word.length >= 4) {
          for (let i = 2; i <= word.length - 1; i++) {
            tokens.add(word.substring(0, i));
          }
        }
      }
    });

    // Index each token
    tokens.forEach(token => {
      if (!this.searchIndex.has(token)) {
        this.searchIndex.set(token, new Set());
      }
      this.searchIndex.get(token).add(product.id);
    });
  }

  // Build image index linking products to their images
  async buildImageIndex() {
    this.log('Building image index...');
    this.imageIndex.clear();

    // Scan category directories for images
    const categories = fs.readdirSync(this.imageDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const category of categories) {
      const categoryPath = path.join(this.imageDir, category);
      
      try {
        const files = fs.readdirSync(categoryPath);
        const imageFiles = files.filter(file => 
          /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file) && !file.includes('-thumb')
        );

        for (const imageFile of imageFiles) {
          const productId = path.parse(imageFile).name;
          const imagePath = path.join(categoryPath, imageFile);
          const thumbPath = path.join(categoryPath, 'thumbs', imageFile);
          
          // Check if files exist
          const imageExists = fs.existsSync(imagePath);
          const thumbExists = fs.existsSync(thumbPath);
          
          if (imageExists) {
            const stats = fs.statSync(imagePath);
            const imageInfo = {
              productId,
              category,
              filename: imageFile,
              path: imagePath,
              relativePath: `/images/products/${category}/${imageFile}`,
              thumbnailPath: thumbExists ? `/images/products/${category}/thumbs/${imageFile}` : null,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              hash: await this.calculateFileHash(imagePath)
            };

            this.imageIndex.set(productId, imageInfo);
          }
        }
      } catch (error) {
        this.error(`Failed to scan category ${category}:`, error.message);
      }
    }

    this.log(`Indexed ${this.imageIndex.size} images`);
  }

  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  // Cache indexes to disk for faster loading
  async cacheIndexes() {
    try {
      const cacheData = {
        version: this.libraryVersion,
        timestamp: new Date().toISOString(),
        products: this.products.size,
        images: this.imageIndex.size,
        categories: Array.from(this.categoryIndex.keys()),
        brands: Array.from(this.brandIndex.keys()),
        stores: Array.from(this.storeIndex.keys())
      };

      const cachePath = path.join(this.cacheDir, 'library-cache.json');
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
      
      // Cache search index (convert Sets to Arrays for JSON)
      const searchCache = {};
      for (const [token, productIds] of this.searchIndex.entries()) {
        searchCache[token] = Array.from(productIds);
      }
      
      const searchCachePath = path.join(this.cacheDir, 'search-index.json');
      fs.writeFileSync(searchCachePath, JSON.stringify(searchCache, null, 2));
      
    } catch (error) {
      this.error('Failed to cache indexes:', error.message);
    }
  }

  // Search products with various filters and options
  search(options = {}) {
    const {
      query = '',
      category = '',
      brand = '',
      store = '',
      priceMin = 0,
      priceMax = Infinity,
      inStock = null,
      hasImage = null,
      sortBy = 'relevance', // relevance, name, price, popularity
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = options;

    let candidates = new Set();

    // Text search
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      const termResults = searchTerms.map(term => {
        const matches = new Set();
        
        // Exact matches
        if (this.searchIndex.has(term)) {
          this.searchIndex.get(term).forEach(id => matches.add(id));
        }
        
        // Partial matches
        for (const [indexTerm, productIds] of this.searchIndex.entries()) {
          if (indexTerm.includes(term) || term.includes(indexTerm)) {
            productIds.forEach(id => matches.add(id));
          }
        }
        
        return matches;
      });

      // Intersection of all search terms (AND logic)
      if (termResults.length > 0) {
        candidates = termResults.reduce((acc, termSet) => {
          return acc.size === 0 ? termSet : new Set([...acc].filter(id => termSet.has(id)));
        }, new Set());
      }
    } else {
      // No search query, start with all products
      candidates = new Set(this.products.keys());
    }

    // Apply filters
    const results = Array.from(candidates)
      .map(id => this.products.get(id))
      .filter(product => {
        if (!product) return false;
        
        // Category filter
        if (category && product.category !== category) return false;
        
        // Brand filter
        if (brand && product.brand?.toLowerCase() !== brand.toLowerCase()) return false;
        
        // Store filter
        if (store && product.store?.name !== store) return false;
        
        // Price filters
        if (product.price < priceMin || product.price > priceMax) return false;
        
        // Stock filter
        if (inStock !== null && product.inStock !== inStock) return false;
        
        // Image filter
        if (hasImage !== null) {
          const hasImg = this.imageIndex.has(product.id);
          if (hasImage && !hasImg) return false;
          if (!hasImage && hasImg) return false;
        }
        
        return true;
      });

    // Calculate relevance scores for ranking
    if (query && query.trim()) {
      results.forEach(product => {
        product._relevanceScore = this.calculateRelevance(product, query);
      });
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = (b._relevanceScore || 0) - (a._relevanceScore || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'popularity':
          comparison = (b.popularity || 0) - (a.popularity || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Remove relevance scores before returning
    results.forEach(product => delete product._relevanceScore);

    // Apply pagination
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      products: paginatedResults,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
      query: options
    };
  }

  calculateRelevance(product, query) {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Exact name match (high score)
    if (product.name.toLowerCase().includes(queryLower)) {
      score += 100;
    }

    // Brand match
    if (product.brand && product.brand.toLowerCase().includes(queryLower)) {
      score += 50;
    }

    // Description match
    if (product.description && product.description.toLowerCase().includes(queryLower)) {
      score += 30;
    }

    // Tags match
    if (product.tags) {
      const matchingTags = product.tags.filter(tag => 
        tag.toLowerCase().includes(queryLower)
      );
      score += matchingTags.length * 20;
    }

    // Popularity boost
    score += (product.popularity || 0) * 0.5;

    // Rating boost
    score += (product.rating || 0) * 10;

    return score;
  }

  // Get product by ID with image information
  getProduct(productId, includeImages = true) {
    const product = this.products.get(productId);
    if (!product) return null;

    const result = { ...product };

    if (includeImages && this.imageIndex.has(productId)) {
      const imageInfo = this.imageIndex.get(productId);
      result.imageInfo = imageInfo;
      result.imageUrl = imageInfo.relativePath;
      if (imageInfo.thumbnailPath) {
        result.thumbnailUrl = imageInfo.thumbnailPath;
      }
    }

    return result;
  }

  // Get products by category
  getProductsByCategory(category, options = {}) {
    const productIds = this.categoryIndex.get(category);
    if (!productIds) return [];

    const products = Array.from(productIds)
      .map(id => this.getProduct(id, options.includeImages !== false))
      .filter(Boolean);

    // Apply sorting if specified
    if (options.sortBy) {
      products.sort((a, b) => {
        const aVal = a[options.sortBy] || 0;
        const bVal = b[options.sortBy] || 0;
        return options.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    return products;
  }

  // Get products by brand
  getProductsByBrand(brand, options = {}) {
    const productIds = this.brandIndex.get(brand.toLowerCase());
    if (!productIds) return [];

    return Array.from(productIds)
      .map(id => this.getProduct(id, options.includeImages !== false))
      .filter(Boolean);
  }

  // Get products by store
  getProductsByStore(store, options = {}) {
    const productIds = this.storeIndex.get(store);
    if (!productIds) return [];

    return Array.from(productIds)
      .map(id => this.getProduct(id, options.includeImages !== false))
      .filter(Boolean);
  }

  // Get library statistics
  getStats() {
    const categories = {};
    for (const [category, productIds] of this.categoryIndex.entries()) {
      categories[category] = productIds.size;
    }

    const brands = {};
    for (const [brand, productIds] of this.brandIndex.entries()) {
      brands[brand] = productIds.size;
    }

    const stores = {};
    for (const [store, productIds] of this.storeIndex.entries()) {
      stores[store] = productIds.size;
    }

    return {
      totalProducts: this.products.size,
      totalImages: this.imageIndex.size,
      categories,
      brands: Object.keys(brands).length,
      stores: Object.keys(stores).length,
      searchTokens: this.searchIndex.size,
      lastUpdated: this.lastUpdated,
      version: this.libraryVersion
    };
  }

  // Export library data for external use
  exportData(format = 'json', options = {}) {
    const products = Array.from(this.products.values());
    
    // Add image information if requested
    if (options.includeImages) {
      products.forEach(product => {
        if (this.imageIndex.has(product.id)) {
          const imageInfo = this.imageIndex.get(product.id);
          product.imageInfo = imageInfo;
        }
      });
    }

    switch (format) {
      case 'json':
        return JSON.stringify(products, null, 2);
      
      case 'csv':
        return this.exportToCSV(products, options);
      
      case 'summary':
        return this.exportSummary(products);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportToCSV(products, options = {}) {
    const headers = [
      'id', 'name', 'brand', 'category', 'price', 'currency',
      'description', 'stock', 'inStock', 'rating', 'popularity',
      'store', 'imageUrl', 'createdAt'
    ];

    const rows = products.map(product => {
      return headers.map(header => {
        let value = product[header];
        
        if (header === 'store') {
          value = product.store?.name || '';
        } else if (header === 'imageUrl' && options.includeImages) {
          const imageInfo = this.imageIndex.get(product.id);
          value = imageInfo?.relativePath || '';
        }
        
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value || '';
      });
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  exportSummary(products) {
    const stats = this.getStats();
    const summary = {
      libraryInfo: {
        version: this.libraryVersion,
        lastUpdated: this.lastUpdated,
        totalProducts: stats.totalProducts,
        totalImages: stats.totalImages
      },
      categories: stats.categories,
      topBrands: Object.entries(this.brandIndex.entries())
        .map(([brand, ids]) => ({ brand, count: ids.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      priceStats: this.calculatePriceStats(products),
      recentProducts: products
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(p => ({ id: p.id, name: p.name, category: p.category }))
    };

    return JSON.stringify(summary, null, 2);
  }

  calculatePriceStats(products) {
    const prices = products.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
    
    if (prices.length === 0) return null;

    return {
      min: prices[0],
      max: prices[prices.length - 1],
      average: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
      median: prices[Math.floor(prices.length / 2)]
    };
  }

  // Validate library integrity
  async validateLibrary() {
    this.log('Validating library integrity...');
    const issues = [];

    // Check products without images
    const productsWithoutImages = [];
    for (const [productId, product] of this.products.entries()) {
      if (!this.imageIndex.has(productId)) {
        productsWithoutImages.push(productId);
      }
    }
    
    if (productsWithoutImages.length > 0) {
      issues.push(`${productsWithoutImages.length} products missing images`);
    }

    // Check orphaned images
    const orphanedImages = [];
    for (const [productId, imageInfo] of this.imageIndex.entries()) {
      if (!this.products.has(productId)) {
        orphanedImages.push(productId);
      }
    }
    
    if (orphanedImages.length > 0) {
      issues.push(`${orphanedImages.length} orphaned images`);
    }

    // Check broken image files
    const brokenImages = [];
    for (const [productId, imageInfo] of this.imageIndex.entries()) {
      if (!fs.existsSync(imageInfo.path)) {
        brokenImages.push(productId);
      }
    }
    
    if (brokenImages.length > 0) {
      issues.push(`${brokenImages.length} broken image files`);
    }

    this.log(`Validation complete. Issues found: ${issues.length}`);
    return {
      isValid: issues.length === 0,
      issues,
      stats: {
        totalProducts: this.products.size,
        totalImages: this.imageIndex.size,
        productsWithoutImages: productsWithoutImages.length,
        orphanedImages: orphanedImages.length,
        brokenImages: brokenImages.length
      }
    };
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const dataDir = process.argv[3] || path.join(__dirname, '..', 'data', 'products');
  
  const library = new ProductLibrary({ dataDir });
  
  try {
    await library.loadLibrary();
    
    switch (command) {
      case 'stats':
        console.log(JSON.stringify(library.getStats(), null, 2));
        break;
        
      case 'search':
        const query = process.argv[4] || '';
        const results = library.search({ query, limit: 10 });
        console.log(`Found ${results.total} products for "${query}"`);
        results.products.forEach(p => {
          console.log(`- ${p.name} (${p.category}) - $${p.price}`);
        });
        break;
        
      case 'validate':
        const validation = await library.validateLibrary();
        console.log(JSON.stringify(validation, null, 2));
        break;
        
      case 'export':
        const format = process.argv[4] || 'json';
        const exported = library.exportData(format, { includeImages: true });
        console.log(exported);
        break;
        
      default:
        console.log('Usage: node product-library.js <command> [dataDir] [options]');
        console.log('Commands:');
        console.log('  stats              - Show library statistics');
        console.log('  search <query>     - Search products');
        console.log('  validate           - Validate library integrity');
        console.log('  export <format>    - Export data (json|csv|summary)');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductLibrary;