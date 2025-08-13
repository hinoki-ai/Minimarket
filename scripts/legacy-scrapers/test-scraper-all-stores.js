#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Universal Product Scraper
 * Tests all 9 supported Chilean supermarket stores
 */

const UniversalProductScraper = require('./universal-product-scraper');
const { StoreConfigs } = require('./product-schema');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  MAX_TEST_PRODUCTS: 5, // Limit for testing
  TEST_TIMEOUT: 120000, // 2 minutes per store
  TEST_CATEGORIES: ['bebidas'], // Single category for quick testing
  STORES_TO_TEST: Object.keys(StoreConfigs)
};

class ScraperTestSuite {
  constructor() {
    this.results = new Map();
    this.startTime = Date.now();
  }

  log(...args) {
    console.log(`[TEST]`, ...args);
  }

  error(...args) {
    console.error(`[ERROR]`, ...args);
  }

  async runAllTests() {
    this.log('Starting comprehensive scraper test suite...');
    this.log(`Testing ${TEST_CONFIG.STORES_TO_TEST.length} stores`);
    this.log(`Timeout per store: ${TEST_CONFIG.TEST_TIMEOUT / 1000}s`);
    
    const results = [];
    
    for (const storeName of TEST_CONFIG.STORES_TO_TEST) {
      this.log(`\n${'='.repeat(60)}`);
      this.log(`Testing store: ${storeName.toUpperCase()}`);
      this.log(`${'='.repeat(60)}`);
      
      const storeResult = await this.testStore(storeName);
      results.push(storeResult);
      
      this.log(`Store ${storeName} test completed: ${storeResult.success ? 'PASSED' : 'FAILED'}`);
      
      // Brief pause between stores to avoid overwhelming servers
      if (TEST_CONFIG.STORES_TO_TEST.indexOf(storeName) < TEST_CONFIG.STORES_TO_TEST.length - 1) {
        this.log('Pausing 10 seconds before next store...');
        await this.sleep(10000);
      }
    }
    
    await this.generateTestReport(results);
    return results;
  }

  async testStore(storeName) {
    const storeResult = {
      store: storeName,
      success: false,
      startTime: new Date().toISOString(),
      duration: 0,
      productsFound: 0,
      errors: [],
      details: {},
      recommendations: []
    };

    let scraper = null;
    
    try {
      // Override environment for testing
      process.env.STORE = storeName;
      process.env.CATEGORIES = TEST_CONFIG.TEST_CATEGORIES.join(',');
      process.env.MAX_PRODUCTS = TEST_CONFIG.MAX_TEST_PRODUCTS.toString();
      process.env.VERBOSE = '1';
      process.env.DRY_RUN = '1'; // Don't download images during testing
      process.env.HEADLESS = '1'; // Run headless for testing
      
      const testStartTime = Date.now();
      scraper = new UniversalProductScraper(storeName);
      
      // Test 1: Browser setup
      this.log(`[${storeName}] Testing browser setup...`);
      await Promise.race([
        scraper.setupBrowser(),
        this.timeoutPromise(30000, 'Browser setup timeout')
      ]);
      storeResult.details.browserSetup = true;
      this.log(`[${storeName}] ✓ Browser setup successful`);
      
      // Test 2: Homepage accessibility
      this.log(`[${storeName}] Testing homepage accessibility...`);
      const storeConfig = StoreConfigs[storeName];
      const homepageResponse = await Promise.race([
        scraper.gotoAndPrepare(storeConfig.baseUrl),
        this.timeoutPromise(30000, 'Homepage navigation timeout')
      ]);
      
      if (!homepageResponse) {
        throw new Error('Homepage not accessible');
      }
      
      storeResult.details.homepageAccessible = true;
      storeResult.details.homepageStatus = homepageResponse.status();
      this.log(`[${storeName}] ✓ Homepage accessible (HTTP ${homepageResponse.status()})`);
      
      // Test 3: Category discovery
      this.log(`[${storeName}] Testing category discovery...`);
      const categoryUrls = await Promise.race([
        scraper.discoverCategoryUrlsFromHomepage(TEST_CONFIG.TEST_CATEGORIES[0]),
        this.timeoutPromise(45000, 'Category discovery timeout')
      ]);
      
      storeResult.details.categoryUrls = categoryUrls || [];
      storeResult.details.categoryDiscoveryWorking = Array.isArray(categoryUrls) && categoryUrls.length > 0;
      this.log(`[${storeName}] ✓ Discovered ${categoryUrls?.length || 0} category URLs`);
      
      // Test 4: Product extraction (if category URLs found)
      if (categoryUrls && categoryUrls.length > 0) {
        this.log(`[${storeName}] Testing product extraction...`);
        const testUrl = categoryUrls[0];
        
        const testResponse = await Promise.race([
          scraper.gotoAndPrepare(testUrl),
          this.timeoutPromise(30000, 'Product page navigation timeout')
        ]);
        
        if (testResponse) {
          // Wait for content to load
          await scraper.page.waitForTimeout(3000);
          
          // Try scrolling to load more products
          await scraper.autoScroll(5); // Limited scrolling for testing
          
          // Extract products
          const products = await Promise.race([
            scraper.extractProductData(),
            this.timeoutPromise(20000, 'Product extraction timeout')
          ]);
          
          storeResult.productsFound = products ? products.length : 0;
          storeResult.details.productExtractionWorking = products && products.length > 0;
          storeResult.details.sampleProducts = products ? products.slice(0, 2) : [];
          
          this.log(`[${storeName}] ✓ Extracted ${storeResult.productsFound} products`);
          
          // Analyze selector effectiveness
          if (products && products.length > 0) {
            storeResult.details.selectorAnalysis = this.analyzeSelectorEffectiveness(products);
          }
        }
      } else {
        storeResult.errors.push('No category URLs discovered');
        storeResult.recommendations.push('Check category discovery selectors and navigation logic');
      }
      
      // Test 5: Bot detection test
      this.log(`[${storeName}] Testing bot detection evasion...`);
      const botDetected = await scraper.detectAndHandleCaptcha();
      storeResult.details.botDetectionTriggered = botDetected;
      
      if (botDetected) {
        storeResult.errors.push('Bot detection triggered');
        storeResult.recommendations.push('Improve stealth techniques and reduce request frequency');
      } else {
        this.log(`[${storeName}] ✓ No bot detection triggered`);
      }
      
      storeResult.duration = Date.now() - testStartTime;
      storeResult.success = storeResult.details.browserSetup && 
                           storeResult.details.homepageAccessible && 
                           storeResult.productsFound > 0;
      
    } catch (error) {
      storeResult.errors.push(error.message);
      storeResult.success = false;
      this.error(`[${storeName}] Test failed:`, error.message);
      
      // Add recommendations based on error type
      if (error.message.includes('timeout')) {
        storeResult.recommendations.push('Increase timeout values or optimize page load detection');
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        storeResult.recommendations.push('Implement longer delays and better rate limiting');
      }
      if (error.message.includes('blocked') || error.message.includes('captcha')) {
        storeResult.recommendations.push('Enhance anti-detection measures and user agent rotation');
      }
      if (error.message.includes('selector')) {
        storeResult.recommendations.push('Update CSS selectors for current website structure');
      }
      
    } finally {
      // Cleanup
      if (scraper && scraper.browser) {
        try {
          await scraper.closeBrowser();
        } catch (e) {
          this.log(`[${storeName}] Browser cleanup warning:`, e.message);
        }
      }
      
      storeResult.endTime = new Date().toISOString();
      if (!storeResult.duration) {
        storeResult.duration = Date.now() - Date.parse(storeResult.startTime);
      }
    }
    
    return storeResult;
  }

  analyzeSelectorEffectiveness(products) {
    const analysis = {
      productsWithNames: 0,
      productsWithPrices: 0,
      productsWithImages: 0,
      productsWithBrands: 0,
      avgFieldsPerProduct: 0
    };

    let totalFields = 0;
    
    for (const product of products) {
      if (product.name && product.name.length > 0) analysis.productsWithNames++;
      if (product.price && product.price > 0) analysis.productsWithPrices++;
      if (product.imageUrl && product.imageUrl.length > 0) analysis.productsWithImages++;
      if (product.brand && product.brand.length > 0) analysis.productsWithBrands++;
      
      const fieldCount = [product.name, product.price, product.imageUrl, product.brand]
        .filter(field => field && (typeof field === 'string' ? field.length > 0 : field > 0)).length;
      totalFields += fieldCount;
    }

    analysis.avgFieldsPerProduct = products.length > 0 ? totalFields / products.length : 0;
    analysis.completenessScore = (analysis.avgFieldsPerProduct / 4) * 100; // Out of 4 main fields
    
    return analysis;
  }

  async generateTestReport(results) {
    const reportData = {
      testSuite: 'Universal Product Scraper Test Suite',
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      storesTested: results.length,
      storesSuccessful: results.filter(r => r.success).length,
      storesFailed: results.filter(r => !r.success).length,
      results: results,
      summary: {
        overallSuccess: results.filter(r => r.success).length / results.length,
        avgProductsPerStore: results.reduce((sum, r) => sum + r.productsFound, 0) / results.length,
        commonIssues: this.identifyCommonIssues(results),
        recommendations: this.generateRecommendations(results)
      }
    };

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'data', 'scraper-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Generate console summary
    this.printTestSummary(reportData);
    
    return reportData;
  }

  identifyCommonIssues(results) {
    const issues = new Map();
    
    for (const result of results) {
      for (const error of result.errors) {
        const key = error.toLowerCase();
        issues.set(key, (issues.get(key) || 0) + 1);
      }
    }
    
    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count, percentage: (count / results.length) * 100 }));
  }

  generateRecommendations(results) {
    const recommendations = new Set();
    
    for (const result of results) {
      for (const rec of result.recommendations) {
        recommendations.add(rec);
      }
    }
    
    const prioritized = Array.from(recommendations);
    
    // Add general recommendations based on success rate
    const successRate = results.filter(r => r.success).length / results.length;
    if (successRate < 0.5) {
      prioritized.unshift('Consider implementing proxy rotation for better success rates');
      prioritized.unshift('Review and update store configurations and selectors');
    }
    
    return prioritized.slice(0, 10); // Top 10 recommendations
  }

  printTestSummary(reportData) {
    console.log('\n' + '='.repeat(80));
    console.log('SCRAPER TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Duration: ${Math.round(reportData.totalDuration / 1000)}s`);
    console.log(`Stores Tested: ${reportData.storesTested}`);
    console.log(`Success Rate: ${Math.round(reportData.summary.overallSuccess * 100)}%`);
    console.log(`Average Products per Store: ${Math.round(reportData.summary.avgProductsPerStore)}`);
    
    console.log('\nSTORE RESULTS:');
    for (const result of reportData.results) {
      const status = result.success ? '✓ PASS' : '✗ FAIL';
      const duration = Math.round(result.duration / 1000);
      console.log(`  ${result.store.padEnd(15)} ${status} (${duration}s, ${result.productsFound} products)`);
    }
    
    if (reportData.summary.commonIssues.length > 0) {
      console.log('\nCOMMON ISSUES:');
      for (const issue of reportData.summary.commonIssues) {
        console.log(`  • ${issue.issue} (${issue.count} stores, ${Math.round(issue.percentage)}%)`);
      }
    }
    
    if (reportData.summary.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      for (let i = 0; i < Math.min(5, reportData.summary.recommendations.length); i++) {
        console.log(`  ${i + 1}. ${reportData.summary.recommendations[i]}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`Detailed report saved to: data/scraper-test-report.json`);
    console.log('='.repeat(80));
  }

  async timeoutPromise(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const testSuite = new ScraperTestSuite();
  
  try {
    const results = await testSuite.runAllTests();
    const successRate = results.filter(r => r.success).length / results.length;
    
    process.exit(successRate >= 0.5 ? 0 : 1); // Exit with error if less than 50% success
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ScraperTestSuite;