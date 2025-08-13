#!/usr/bin/env node
'use strict';

/**
 * Enhanced Scraper Runner with Monitoring Integration
 * Orchestrates the enhanced scraper with real-time monitoring and analytics
 */

const EnhancedUniversalScraper = require('./enhanced-universal-scraper');
const ScraperMonitor = require('./scraper-monitoring');
const DataValidator = require('./data-validator');
const fs = require('fs');
const path = require('path');

class ScraperOrchestrator {
  constructor(config = {}) {
    this.config = {
      store: config.store || process.env.STORE || 'lider',
      categories: config.categories || (process.env.CATEGORIES ? process.env.CATEGORIES.split(',') : ['bebidas']),
      maxProducts: config.maxProducts || parseInt(process.env.MAX_PRODUCTS) || 1000,
      enableMonitoring: config.enableMonitoring !== false,
      enableValidation: config.enableValidation !== false,
      reportInterval: config.reportInterval || 60000, // 1 minute
      saveInterval: config.saveInterval || 300000, // 5 minutes
      logDir: config.logDir || path.join(__dirname, '..', 'logs'),
      dataDir: config.dataDir || path.join(__dirname, '..', 'data', 'products')
    };

    this.scraper = null;
    this.monitor = null;
    this.validator = null;
    this.isRunning = false;
    this.startTime = null;
    this.reportTimer = null;
    this.saveTimer = null;
  }

  async initialize() {
    console.log('🚀 Initializing Enhanced Scraper System...');

    // Initialize monitoring system
    if (this.config.enableMonitoring) {
      this.monitor = new ScraperMonitor({
        logDir: this.config.logDir,
        enableAlerts: true,
        errorRateThreshold: 0.2,
        responseTimeThreshold: 15000,
        memoryThreshold: 1536, // 1.5GB
        qualityThreshold: 5
      });

      this.monitor.on('alert:triggered', (alert) => {
        this.handleAlert(alert);
      });

      this.monitor.on('metrics:collected', (metrics) => {
        if (metrics.runtime % 5 === 0) { // Every 5 minutes
          this.logProgress(metrics);
        }
      });

      this.monitor.start();
    }

    // Initialize scraper with monitoring integration
    this.scraper = new EnhancedUniversalScraper(this.config.store);

    // Initialize validator
    if (this.config.enableValidation) {
      this.validator = new DataValidator(this.config.dataDir);
    }

    this.setupScraperIntegration();
    this.setupReporting();

    console.log(`✅ System initialized for store: ${this.config.store}`);
    console.log(`📊 Categories: ${this.config.categories.join(', ')}`);
    console.log(`🎯 Target: ${this.config.maxProducts} products`);
    console.log(`📈 Monitoring: ${this.config.enableMonitoring ? 'Enabled' : 'Disabled'}`);
    console.log(`🔍 Validation: ${this.config.enableValidation ? 'Enabled' : 'Disabled'}`);
  }

  setupScraperIntegration() {
    if (!this.monitor) return;

    // Integrate scraper events with monitoring
    const originalGoto = this.scraper.page?.goto?.bind(this.scraper.page);
    
    // Override navigation to track requests
    if (this.scraper.humanLikeNavigation) {
      const originalNavigation = this.scraper.humanLikeNavigation.bind(this.scraper);
      this.scraper.humanLikeNavigation = async (url) => {
        const startTime = Date.now();
        try {
          const result = await originalNavigation(url);
          const responseTime = Date.now() - startTime;
          this.monitor.recordRequest(url, responseTime, true);
          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          this.monitor.recordRequest(url, responseTime, false, error);
          throw error;
        }
      };
    }

    // Track product processing
    const originalProcessProduct = this.scraper.processProduct?.bind(this.scraper);
    if (originalProcessProduct) {
      this.scraper.processProduct = async (rawProduct) => {
        try {
          const result = await originalProcessProduct(rawProduct);
          if (result) {
            const qualityScore = rawProduct.qualityScore || 5;
            this.monitor.recordProduct(result, qualityScore, true);
          }
          return result;
        } catch (error) {
          this.monitor.recordProduct(rawProduct, 0, false);
          this.monitor.recordError(error, { product: rawProduct.name });
          throw error;
        }
      };
    }

    // Track memory usage
    const originalOptimizeMemory = this.scraper.optimizeMemoryUsage?.bind(this.scraper);
    if (originalOptimizeMemory) {
      this.scraper.optimizeMemoryUsage = async () => {
        const memoryBefore = this.getMemoryUsage();
        await originalOptimizeMemory();
        const memoryAfter = this.getMemoryUsage();
        this.monitor.recordMemoryUsage(memoryAfter);
        
        if (memoryBefore - memoryAfter > 50) { // 50MB reduction
          console.log(`🧹 Memory optimized: ${memoryBefore}MB → ${memoryAfter}MB`);
        }
      };
    }
  }

  setupReporting() {
    // Periodic progress reporting
    this.reportTimer = setInterval(() => {
      this.generateProgressReport();
    }, this.config.reportInterval);

    // Periodic data saving
    this.saveTimer = setInterval(() => {
      this.saveIntermediateResults();
    }, this.config.saveInterval);

    // Cleanup on exit
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      this.gracefulShutdown('EXCEPTION');
    });
  }

  async handleAlert(alert) {
    console.log(`\n🚨 ALERT [${alert.severity}]: ${alert.message}`);

    // Implement automatic responses to alerts
    switch (alert.type) {
      case 'HIGH_ERROR_RATE':
        console.log('🔧 Auto-response: Increasing delays and retry attempts');
        if (this.scraper.rateLimiter) {
          this.scraper.rateLimiter.currentDelay *= 1.5;
        }
        break;

      case 'HIGH_MEMORY':
        console.log('🧹 Auto-response: Triggering memory optimization');
        if (this.scraper.optimizeMemoryUsage) {
          await this.scraper.optimizeMemoryUsage();
        }
        break;

      case 'SLOW_RESPONSES':
        console.log('⏱️ Auto-response: Optimizing request timeouts');
        if (this.scraper.rateLimiter) {
          this.scraper.rateLimiter.currentDelay = Math.max(
            this.scraper.rateLimiter.currentDelay * 1.2,
            3000
          );
        }
        break;

      case 'LOW_SUCCESS_RATE':
        console.log('🔄 Auto-response: Implementing circuit breaker pattern');
        // Implement temporary pause
        console.log('⏸️ Pausing scraping for 2 minutes to let server recover...');
        if (this.scraper && this.scraper.page) {
          await this.scraper.page.waitForTimeout(120000); // 2 minutes
        }
        break;
    }
  }

  generateProgressReport() {
    if (!this.monitor) return;

    const metrics = this.monitor.getMetrics();
    const runtime = Math.round((Date.now() - this.startTime) / 60000);

    console.log('\n📊 === PROGRESS REPORT ===');
    console.log(`⏱️  Runtime: ${runtime} minutes`);
    console.log(`📈 Requests: ${metrics.requests.total} (Success: ${Math.round(metrics.performance.successRate * 100)}%)`);
    console.log(`🛍️  Products: ${metrics.products.valid}/${metrics.products.total} valid`);
    console.log(`⚡ Avg Response: ${Math.round(metrics.performance.avgResponseTime)}ms`);
    console.log(`💾 Memory: ${metrics.performance.currentMemory}MB`);
    console.log(`🔥 Error Rate: ${Math.round(metrics.performance.errorRate * 100)}%`);
    
    if (metrics.errors && Object.keys(metrics.errors).length > 0) {
      console.log('📋 Top Errors:');
      Object.entries(metrics.errors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([type, count]) => {
          console.log(`   • ${type}: ${count}`);
        });
    }

    const recentAlerts = this.monitor.getRecentAlerts(3);
    if (recentAlerts.length > 0) {
      console.log('🚨 Recent Alerts:', recentAlerts.length);
    }

    // Performance predictions
    if (metrics.products.valid > 0 && runtime > 0) {
      const productsPerMinute = metrics.products.valid / runtime;
      const estimatedCompletion = Math.round((this.config.maxProducts - metrics.products.valid) / productsPerMinute);
      console.log(`🔮 ETA: ${estimatedCompletion} minutes remaining`);
    }

    console.log('========================\n');
  }

  async saveIntermediateResults() {
    try {
      if (this.scraper && this.scraper.products && this.scraper.products.size > 0) {
        await this.scraper.saveData();
        console.log(`💾 Intermediate save: ${this.scraper.products.size} products`);
      }
    } catch (error) {
      console.error('❌ Failed to save intermediate results:', error.message);
      if (this.monitor) {
        this.monitor.recordError(error, { context: 'intermediate_save' });
      }
    }
  }

  async run() {
    try {
      this.isRunning = true;
      this.startTime = Date.now();

      console.log('\n🎬 Starting Enhanced Scraping Session...\n');

      // Run the scraper
      await this.scraper.run();

      console.log('\n✅ Scraping completed successfully!');

      // Generate final analytics
      await this.generateFinalReport();

      // Run validation if enabled
      if (this.config.enableValidation) {
        console.log('\n🔍 Running data validation...');
        const validationStats = await this.validator.run();
        console.log(`✅ Validation complete: ${validationStats.finalProductCount} products validated`);
      }

    } catch (error) {
      console.error('\n❌ Scraping session failed:', error.message);
      if (this.monitor) {
        this.monitor.recordError(error, { context: 'main_session' });
      }
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async generateFinalReport() {
    console.log('\n📊 Generating final analytics report...');

    if (this.monitor) {
      const report = this.monitor.generateFinalReport();
      
      console.log('\n🎯 === FINAL SESSION REPORT ===');
      console.log(`⏱️  Total Runtime: ${report.summary.runtime} minutes`);
      console.log(`📊 Total Requests: ${report.summary.totalRequests}`);
      console.log(`✅ Success Rate: ${report.summary.successRate}%`);
      console.log(`🛍️  Products Found: ${report.summary.totalProducts}`);
      console.log(`📈 Valid Products: ${report.summary.validProducts}`);
      console.log(`⚡ Avg Response Time: ${report.summary.avgResponseTime}ms`);
      console.log(`🏆 Avg Quality Score: ${report.summary.avgQualityScore}/10`);
      console.log(`🚨 Total Alerts: ${report.summary.totalAlerts} (Critical: ${report.summary.criticalAlerts})`);

      if (report.performanceMetrics) {
        console.log('\n📈 Performance Metrics:');
        console.log(`   • P50 Response Time: ${report.performanceMetrics.responseTimeP50}ms`);
        console.log(`   • P95 Response Time: ${report.performanceMetrics.responseTimeP95}ms`);
        console.log(`   • Peak Memory: ${report.performanceMetrics.peakMemoryUsage}MB`);
        console.log(`   • Avg Memory: ${report.performanceMetrics.avgMemoryUsage}MB`);
      }

      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec.issue}`);
          rec.actions.forEach(action => {
            console.log(`      • ${action}`);
          });
        });
      }

      console.log('===============================\n');
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up resources...');

    this.isRunning = false;

    // Clear timers
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    // Stop monitoring
    if (this.monitor) {
      this.monitor.stop();
    }

    // Close browser
    if (this.scraper && this.scraper.closeBrowser) {
      await this.scraper.closeBrowser();
    }

    console.log('✅ Cleanup completed');
  }

  async gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Performing graceful shutdown...`);

    try {
      // Save current progress
      if (this.scraper && this.scraper.saveProgress) {
        await this.scraper.saveProgress();
        console.log('💾 Progress saved');
      }

      // Save current data
      if (this.scraper && this.scraper.saveData && this.scraper.products.size > 0) {
        await this.scraper.saveData();
        console.log(`💾 Data saved: ${this.scraper.products.size} products`);
      }

      // Generate emergency report
      if (this.monitor) {
        this.monitor.generateFinalReport();
        console.log('📊 Emergency report generated');
      }

      await this.cleanup();
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
      process.exit(1);
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024); // MB
  }

  logProgress(metrics) {
    const runtime = Math.round((Date.now() - this.startTime) / 60000);
    console.log(`[${runtime}min] Products: ${metrics.products.valid} | Success: ${Math.round(metrics.performance.successRate * 100)}% | Memory: ${metrics.performance.currentMemory}MB`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const config = {};

  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '').toLowerCase();
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'store':
          config.store = value;
          break;
        case 'categories':
          config.categories = value.split(',');
          break;
        case 'max-products':
        case 'maxproducts':
          config.maxProducts = parseInt(value);
          break;
        case 'no-monitoring':
          config.enableMonitoring = false;
          break;
        case 'no-validation':
          config.enableValidation = false;
          break;
        case 'log-dir':
          config.logDir = value;
          break;
        case 'data-dir':
          config.dataDir = value;
          break;
      }
    }
  }

  console.log('🎯 Enhanced Universal Scraper v2.0');
  console.log('=====================================\n');

  const orchestrator = new ScraperOrchestrator(config);
  
  try {
    await orchestrator.initialize();
    await orchestrator.run();
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = ScraperOrchestrator;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}