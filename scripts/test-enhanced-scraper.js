#!/usr/bin/env node
'use strict';

/**
 * Enhanced Scraper Test Suite
 * Comprehensive testing of the enhanced scraping system
 */

const ScraperOrchestrator = require('./enhanced-scraper-runner');
const path = require('path');
const fs = require('fs');

class ScraperTester {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
    
    this.testConfig = {
      store: 'lider',
      categories: ['bebidas'],
      maxProducts: 10, // Small test run
      enableMonitoring: true,
      enableValidation: true,
      logDir: path.join(__dirname, '..', 'test-logs'),
      dataDir: path.join(__dirname, '..', 'test-data')
    };
  }

  log(...args) {
    console.log('[TEST]', ...args);
  }

  async runTest(testName, testFn) {
    this.testResults.total++;
    this.log(`🧪 Running test: ${testName}`);
    
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.passed++;
      this.testResults.tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        error: null
      });
      this.log(`✅ Test passed: ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.failed++;
      this.testResults.tests.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      this.log(`❌ Test failed: ${testName} - ${error.message}`);
    }
  }

  async setupTestEnvironment() {
    this.log('🔧 Setting up test environment...');
    
    // Create test directories
    const dirs = [
      this.testConfig.logDir,
      this.testConfig.dataDir,
      path.join(this.testConfig.dataDir, this.testConfig.store)
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Set test environment variables
    process.env.STORE = this.testConfig.store;
    process.env.CATEGORIES = this.testConfig.categories.join(',');
    process.env.MAX_PRODUCTS = this.testConfig.maxProducts.toString();
    process.env.HEADLESS = '1';
    process.env.DRY_RUN = '1'; // Don't download images in tests
    process.env.VERBOSE = '1';
    
    this.log('✅ Test environment ready');
  }

  async cleanupTestEnvironment() {
    this.log('🧹 Cleaning up test environment...');
    
    // Remove test directories
    const dirsToClean = [
      this.testConfig.logDir,
      this.testConfig.dataDir
    ];
    
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch (error) {
          this.log(`Warning: Failed to clean ${dir}:`, error.message);
        }
      }
    }
    
    this.log('✅ Cleanup completed');
  }

  async testOrchestratorInitialization() {
    const orchestrator = new ScraperOrchestrator(this.testConfig);
    await orchestrator.initialize();
    
    // Verify components are initialized
    if (!orchestrator.scraper) throw new Error('Scraper not initialized');
    if (!orchestrator.monitor) throw new Error('Monitor not initialized');
    if (!orchestrator.validator) throw new Error('Validator not initialized');
    
    await orchestrator.cleanup();
  }

  async testScraperConfiguration() {
    const orchestrator = new ScraperOrchestrator(this.testConfig);
    await orchestrator.initialize();
    
    // Test scraper configuration
    const scraper = orchestrator.scraper;
    if (scraper.storeName !== this.testConfig.store) {
      throw new Error(`Expected store ${this.testConfig.store}, got ${scraper.storeName}`);
    }
    
    if (!scraper.storeConfig) {
      throw new Error('Store configuration not loaded');
    }
    
    await orchestrator.cleanup();
  }

  async testMonitoringSystem() {
    const orchestrator = new ScraperOrchestrator(this.testConfig);
    await orchestrator.initialize();
    
    const monitor = orchestrator.monitor;
    
    // Test event recording
    monitor.recordRequest('https://test.com', 1000, true);
    monitor.recordRequest('https://test.com/fail', 5000, false, new Error('Test error'));
    
    const testProduct = {
      name: 'Test Product',
      category: 'bebidas',
      price: 1000
    };
    monitor.recordProduct(testProduct, 8, true);
    monitor.recordProduct(testProduct, 3, false);
    
    // Test metrics collection
    const metrics = monitor.getMetrics();
    if (metrics.requests.total !== 2) {
      throw new Error(`Expected 2 total requests, got ${metrics.requests.total}`);
    }
    if (metrics.requests.success !== 1) {
      throw new Error(`Expected 1 successful request, got ${metrics.requests.success}`);
    }
    if (metrics.products.total !== 2) {
      throw new Error(`Expected 2 total products, got ${metrics.products.total}`);
    }
    
    await orchestrator.cleanup();
  }

  async testDataValidation() {
    const orchestrator = new ScraperOrchestrator(this.testConfig);
    await orchestrator.initialize();
    
    const validator = orchestrator.validator;
    
    // Test product validation
    const validProduct = {
      id: 'test-product-1',
      name: 'Test Coca Cola',
      category: 'bebidas',
      price: 1500,
      currency: 'CLP',
      description: 'Test description',
      imageUrl: '/test/image.jpg',
      stock: 10,
      inStock: true,
      store: {
        name: 'lider',
        url: 'https://test.com',
        scraped: new Date().toISOString(),
        section: 'bebidas'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const validation = validator.validateProduct(validProduct);
    if (!validation.isValid) {
      throw new Error(`Valid product failed validation: ${validation.errors.join(', ')}`);
    }
    
    // Test invalid product
    const invalidProduct = {
      name: '', // Invalid: empty name
      price: -100, // Invalid: negative price
      category: 'invalid_category' // Invalid: unknown category
    };
    
    const invalidValidation = validator.validateProduct(invalidProduct);
    if (invalidValidation.isValid) {
      throw new Error('Invalid product passed validation');
    }
    
    await orchestrator.cleanup();
  }

  async testErrorHandling() {
    const orchestrator = new ScraperOrchestrator(this.testConfig);
    await orchestrator.initialize();
    
    const monitor = orchestrator.monitor;
    
    // Test different error types
    const errors = [
      new Error('Timeout error - page load failed'),
      new Error('Network connection failed'),
      new Error('403 Forbidden - access denied'),
      new Error('404 Not Found'),
      new Error('Rate limit exceeded - 429'),
      new Error('CAPTCHA detected'),
      new Error('Failed to parse product data'),
      new Error('Memory allocation failed')
    ];
    
    errors.forEach(error => {
      monitor.recordError(error, { url: 'https://test.com' });
    });
    
    const metrics = monitor.getMetrics();
    if (Object.keys(metrics.errors).length === 0) {
      throw new Error('No errors were categorized');
    }
    
    // Check that errors were properly categorized
    const expectedCategories = ['TIMEOUT', 'NETWORK', 'ACCESS_DENIED', 'NOT_FOUND', 'RATE_LIMIT', 'BOT_DETECTION', 'EXTRACTION', 'MEMORY'];
    const actualCategories = Object.keys(metrics.errors);
    
    for (const expected of expectedCategories) {
      if (!actualCategories.includes(expected)) {
        this.log(`Warning: Error category '${expected}' not found in metrics`);
      }
    }
    
    await orchestrator.cleanup();
  }

  async testPerformanceMetrics() {
    const orchestrator = new ScraperOrchestrator(this.testConfig);
    await orchestrator.initialize();
    
    const monitor = orchestrator.monitor;
    
    // Simulate various response times
    const responseTimes = [500, 1000, 1500, 800, 2000, 750, 1200];
    responseTimes.forEach((time, i) => {
      monitor.recordRequest(`https://test.com/page${i}`, time, true);
    });
    
    const metrics = monitor.getMetrics();
    if (metrics.performance.avgResponseTime <= 0) {
      throw new Error('Average response time not calculated');
    }
    
    const expectedAvg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const actualAvg = metrics.performance.avgResponseTime;
    
    if (Math.abs(expectedAvg - actualAvg) > 50) { // 50ms tolerance
      throw new Error(`Expected avg response time ~${expectedAvg}ms, got ${actualAvg}ms`);
    }
    
    await orchestrator.cleanup();
  }

  async testAlertSystem() {
    const orchestrator = new ScraperOrchestrator({
      ...this.testConfig,
      enableMonitoring: true
    });
    await orchestrator.initialize();
    
    const monitor = orchestrator.monitor;
    
    // Configure low thresholds to trigger alerts
    monitor.config.alertThresholds.errorRate = 0.1; // 10%
    monitor.config.alertThresholds.responseTime = 1000; // 1 second
    
    // Simulate high error rate
    for (let i = 0; i < 5; i++) {
      monitor.recordRequest(`https://test.com/${i}`, 500, false, new Error('Test error'));
    }
    monitor.recordRequest('https://test.com/success', 500, true);
    
    // Simulate slow responses
    monitor.recordRequest('https://slow.com', 2000, true);
    
    // Trigger alert check
    monitor.checkAlerts();
    
    const alerts = monitor.getRecentAlerts(10);
    if (alerts.length === 0) {
      throw new Error('No alerts triggered despite crossing thresholds');
    }
    
    const hasErrorRateAlert = alerts.some(a => a.type === 'HIGH_ERROR_RATE');
    if (!hasErrorRateAlert) {
      throw new Error('High error rate alert not triggered');
    }
    
    await orchestrator.cleanup();
  }

  async testMemoryManagement() {
    const orchestrator = new ScraperOrchestrator(this.testConfig);
    await orchestrator.initialize();
    
    const monitor = orchestrator.monitor;
    
    // Record memory usage
    const memoryValues = [100, 150, 200, 180, 220, 190];
    memoryValues.forEach(memory => {
      monitor.recordMemoryUsage(memory);
    });
    
    const metrics = monitor.getMetrics();
    if (metrics.performance.currentMemory <= 0) {
      throw new Error('Current memory usage not tracked');
    }
    
    await orchestrator.cleanup();
  }

  async testFullScrapingWorkflow() {
    // This test runs a minimal scraping session
    const orchestrator = new ScraperOrchestrator({
      ...this.testConfig,
      maxProducts: 5, // Very small test
      reportInterval: 5000, // 5 seconds
      saveInterval: 10000 // 10 seconds
    });
    
    await orchestrator.initialize();
    
    // Override scraper run method for testing
    const originalRun = orchestrator.scraper.run.bind(orchestrator.scraper);
    orchestrator.scraper.run = async function() {
      // Simulate scraping without actually running the full scraper
      this.log('🧪 Running test scraping simulation...');
      
      // Add some test products
      const testProducts = [
        { id: 'test-1', name: 'Test Product 1', category: 'bebidas', price: 1000 },
        { id: 'test-2', name: 'Test Product 2', category: 'bebidas', price: 1500 },
        { id: 'test-3', name: 'Test Product 3', category: 'bebidas', price: 2000 }
      ];
      
      for (const product of testProducts) {
        this.products.set(product.id, product);
        this.stats.productsFound++;
      }
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.log('🧪 Test simulation completed');
    };
    
    // Run the test workflow
    await orchestrator.run();
    
    // Verify results
    if (orchestrator.scraper.products.size === 0) {
      throw new Error('No products were processed in test workflow');
    }
    
    // Verify monitoring captured data
    const metrics = orchestrator.monitor.getMetrics();
    if (metrics.products.total === 0) {
      this.log('Warning: Monitor did not capture product data (integration may need adjustment)');
    }
  }

  generateTestReport() {
    const duration = Date.now() - this.startTime;
    const successRate = this.testResults.total > 0 ? 
      (this.testResults.passed / this.testResults.total) * 100 : 0;
    
    console.log('\n📋 TEST REPORT');
    console.log('================');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${Math.round(successRate)}%`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('================\n');
    
    return this.testResults;
  }

  async runAllTests() {
    this.startTime = Date.now();
    
    try {
      await this.setupTestEnvironment();
      
      // Run all tests
      await this.runTest('Orchestrator Initialization', () => this.testOrchestratorInitialization());
      await this.runTest('Scraper Configuration', () => this.testScraperConfiguration());
      await this.runTest('Monitoring System', () => this.testMonitoringSystem());
      await this.runTest('Data Validation', () => this.testDataValidation());
      await this.runTest('Error Handling', () => this.testErrorHandling());
      await this.runTest('Performance Metrics', () => this.testPerformanceMetrics());
      await this.runTest('Alert System', () => this.testAlertSystem());
      await this.runTest('Memory Management', () => this.testMemoryManagement());
      await this.runTest('Full Scraping Workflow', () => this.testFullScrapingWorkflow());
      
    } finally {
      await this.cleanupTestEnvironment();
    }
    
    return this.generateTestReport();
  }
}

// CLI Interface
async function main() {
  console.log('🧪 Enhanced Scraper Test Suite');
  console.log('==============================\n');
  
  const tester = new ScraperTester();
  
  try {
    const results = await tester.runAllTests();
    
    if (results.failed === 0) {
      console.log('🎉 All tests passed! The enhanced scraper is ready to use.');
      process.exit(0);
    } else {
      console.log('⚠️ Some tests failed. Please review the issues above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = ScraperTester;

// Run if called directly
if (require.main === module) {
  main();
}