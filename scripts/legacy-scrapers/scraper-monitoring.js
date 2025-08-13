'use strict';

/**
 * Advanced Scraper Monitoring and Analytics System
 * Real-time performance tracking, error analysis, and intelligent alerting
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class ScraperMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      logDir: options.logDir || path.join(__dirname, '..', 'logs'),
      metricsInterval: options.metricsInterval || 30000, // 30 seconds
      alertThresholds: {
        errorRate: options.errorRateThreshold || 0.15, // 15%
        responseTime: options.responseTimeThreshold || 10000, // 10 seconds
        memoryUsage: options.memoryThreshold || 1024, // 1GB
        successRate: options.successRateThreshold || 0.8, // 80%
        qualityScore: options.qualityThreshold || 6
      },
      retentionDays: options.retentionDays || 7,
      enableRealTimeAlerts: options.enableAlerts !== false
    };
    
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0 },
      products: { total: 0, valid: 0, rejected: 0 },
      performance: { responseTimes: [], memorySnapshots: [] },
      errors: new Map(), // errorType -> count
      quality: { scores: [], avgScore: 0 },
      timeline: []
    };
    
    this.alerts = [];
    this.isMonitoring = false;
    this.startTime = Date.now();
    
    this.ensureLogDirectory();
    this.setupMetricsCollection();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  setupMetricsCollection() {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.checkAlerts();
    }, this.config.metricsInterval);
  }

  start() {
    this.isMonitoring = true;
    this.startTime = Date.now();
    this.log('📊 Scraper monitoring started');
    this.emit('monitoring:started');
  }

  stop() {
    this.isMonitoring = false;
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    this.generateFinalReport();
    this.log('📊 Scraper monitoring stopped');
    this.emit('monitoring:stopped');
  }

  // Event Recording Methods
  recordRequest(url, responseTime, success, error = null) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.success++;
      this.metrics.performance.responseTimes.push({
        url,
        time: responseTime,
        timestamp: Date.now()
      });
    } else {
      this.metrics.requests.failed++;
      if (error) {
        this.recordError(error, { url, responseTime });
      }
    }
    
    this.addToTimeline('request', { url, success, responseTime, error });
    this.emit('request:recorded', { url, success, responseTime, error });
  }

  recordProduct(product, qualityScore, valid = true) {
    this.metrics.products.total++;
    
    if (valid) {
      this.metrics.products.valid++;
      this.metrics.quality.scores.push(qualityScore);
      this.updateAverageQuality();
    } else {
      this.metrics.products.rejected++;
    }
    
    this.addToTimeline('product', { 
      name: product.name, 
      valid, 
      qualityScore, 
      category: product.category 
    });
    
    this.emit('product:recorded', { product, valid, qualityScore });
  }

  recordError(error, context = {}) {
    const errorType = this.categorizeError(error);
    const currentCount = this.metrics.errors.get(errorType) || 0;
    this.metrics.errors.set(errorType, currentCount + 1);
    
    const errorRecord = {
      type: errorType,
      message: error.message || error,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };
    
    this.writeErrorLog(errorRecord);
    this.addToTimeline('error', errorRecord);
    this.emit('error:recorded', errorRecord);
  }

  recordMemoryUsage(usage) {
    this.metrics.performance.memorySnapshots.push({
      usage,
      timestamp: Date.now()
    });
    
    // Keep only last 100 snapshots
    if (this.metrics.performance.memorySnapshots.length > 100) {
      this.metrics.performance.memorySnapshots.splice(0, 50);
    }
    
    this.emit('memory:recorded', usage);
  }

  // Analysis Methods
  categorizeError(error) {
    const message = (error.message || error).toLowerCase();
    
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('network') || message.includes('connection')) return 'NETWORK';
    if (message.includes('403') || message.includes('blocked')) return 'ACCESS_DENIED';
    if (message.includes('404')) return 'NOT_FOUND';
    if (message.includes('captcha') || message.includes('bot')) return 'BOT_DETECTION';
    if (message.includes('rate limit') || message.includes('429')) return 'RATE_LIMIT';
    if (message.includes('parse') || message.includes('selector')) return 'EXTRACTION';
    if (message.includes('memory') || message.includes('heap')) return 'MEMORY';
    
    return 'UNKNOWN';
  }

  updateAverageQuality() {
    const scores = this.metrics.quality.scores;
    if (scores.length > 0) {
      this.metrics.quality.avgScore = 
        scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  addToTimeline(type, data) {
    this.metrics.timeline.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Keep timeline manageable
    if (this.metrics.timeline.length > 1000) {
      this.metrics.timeline.splice(0, 500);
    }
  }

  collectMetrics() {
    const memory = process.memoryUsage();
    const memoryMB = Math.round(memory.heapUsed / 1024 / 1024);
    
    this.recordMemoryUsage(memoryMB);
    
    const runtime = Date.now() - this.startTime;
    const runtimeMinutes = Math.round(runtime / 60000);
    
    const currentMetrics = {
      runtime: runtimeMinutes,
      memory: memoryMB,
      requests: { ...this.metrics.requests },
      products: { ...this.metrics.products },
      errorRate: this.getErrorRate(),
      successRate: this.getSuccessRate(),
      avgResponseTime: this.getAverageResponseTime(),
      avgQualityScore: this.metrics.quality.avgScore,
      timestamp: Date.now()
    };
    
    this.writeMetricsLog(currentMetrics);
    this.emit('metrics:collected', currentMetrics);
    
    return currentMetrics;
  }

  analyzePerformance() {
    const analysis = {
      trends: this.analyzeTrends(),
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.generateRecommendations()
    };
    
    this.emit('performance:analyzed', analysis);
    return analysis;
  }

  analyzeTrends() {
    const recentRequests = this.metrics.performance.responseTimes.slice(-50);
    const recentMemory = this.metrics.performance.memorySnapshots.slice(-20);
    
    return {
      responseTimetrend: this.calculateTrend(recentRequests.map(r => r.time)),
      memoryTrend: this.calculateTrend(recentMemory.map(m => m.usage)),
      errorTrend: this.analyzeErrorTrend()
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 'STABLE';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'INCREASING';
    if (change < -0.1) return 'DECREASING';
    return 'STABLE';
  }

  analyzeErrorTrend() {
    const recent = this.metrics.timeline
      .filter(e => e.type === 'error' && Date.now() - e.timestamp < 300000) // last 5 minutes
      .length;
    
    const previous = this.metrics.timeline
      .filter(e => e.type === 'error' && 
        Date.now() - e.timestamp >= 300000 && 
        Date.now() - e.timestamp < 600000) // 5-10 minutes ago
      .length;
    
    if (recent > previous * 1.5) return 'INCREASING';
    if (recent < previous * 0.5) return 'DECREASING';
    return 'STABLE';
  }

  identifyBottlenecks() {
    const bottlenecks = [];
    
    // Response time bottlenecks
    const avgResponseTime = this.getAverageResponseTime();
    if (avgResponseTime > this.config.alertThresholds.responseTime) {
      bottlenecks.push({
        type: 'SLOW_RESPONSES',
        severity: 'HIGH',
        value: avgResponseTime,
        threshold: this.config.alertThresholds.responseTime,
        description: `Average response time (${avgResponseTime}ms) exceeds threshold`
      });
    }
    
    // Memory bottlenecks
    const currentMemory = this.getCurrentMemoryUsage();
    if (currentMemory > this.config.alertThresholds.memoryUsage) {
      bottlenecks.push({
        type: 'HIGH_MEMORY',
        severity: 'HIGH',
        value: currentMemory,
        threshold: this.config.alertThresholds.memoryUsage,
        description: `Memory usage (${currentMemory}MB) exceeds threshold`
      });
    }
    
    // Error rate bottlenecks
    const errorRate = this.getErrorRate();
    if (errorRate > this.config.alertThresholds.errorRate) {
      bottlenecks.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'CRITICAL',
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate,
        description: `Error rate (${Math.round(errorRate * 100)}%) exceeds threshold`
      });
    }
    
    return bottlenecks;
  }

  generateRecommendations() {
    const recommendations = [];
    const bottlenecks = this.identifyBottlenecks();
    
    bottlenecks.forEach(bottleneck => {
      switch (bottleneck.type) {
        case 'SLOW_RESPONSES':
          recommendations.push({
            issue: 'Slow response times',
            actions: [
              'Reduce request timeout values',
              'Implement request queuing and concurrency limits',
              'Add caching for repeated requests',
              'Consider using lighter selectors'
            ]
          });
          break;
          
        case 'HIGH_MEMORY':
          recommendations.push({
            issue: 'High memory usage',
            actions: [
              'Implement periodic garbage collection',
              'Reduce batch sizes for processing',
              'Clear unused data structures regularly',
              'Consider processing in smaller chunks'
            ]
          });
          break;
          
        case 'HIGH_ERROR_RATE':
          recommendations.push({
            issue: 'High error rate',
            actions: [
              'Implement more robust retry mechanisms',
              'Add better error handling for common issues',
              'Review and update selectors',
              'Implement circuit breaker patterns'
            ]
          });
          break;
      }
    });
    
    // General recommendations based on metrics
    if (this.metrics.quality.avgScore < this.config.alertThresholds.qualityScore) {
      recommendations.push({
        issue: 'Low data quality scores',
        actions: [
          'Review and improve extraction selectors',
          'Add data validation rules',
          'Implement quality scoring improvements',
          'Review product categorization logic'
        ]
      });
    }
    
    return recommendations;
  }

  checkAlerts() {
    if (!this.config.enableRealTimeAlerts) return;
    
    const currentMetrics = this.collectMetrics();
    const newAlerts = [];
    
    // Error rate alert
    if (currentMetrics.errorRate > this.config.alertThresholds.errorRate) {
      newAlerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'CRITICAL',
        message: `Error rate ${Math.round(currentMetrics.errorRate * 100)}% exceeds threshold`,
        value: currentMetrics.errorRate,
        threshold: this.config.alertThresholds.errorRate,
        timestamp: Date.now()
      });
    }
    
    // Memory usage alert
    if (currentMetrics.memory > this.config.alertThresholds.memoryUsage) {
      newAlerts.push({
        type: 'HIGH_MEMORY',
        severity: 'WARNING',
        message: `Memory usage ${currentMetrics.memory}MB exceeds threshold`,
        value: currentMetrics.memory,
        threshold: this.config.alertThresholds.memoryUsage,
        timestamp: Date.now()
      });
    }
    
    // Response time alert
    if (currentMetrics.avgResponseTime > this.config.alertThresholds.responseTime) {
      newAlerts.push({
        type: 'SLOW_RESPONSES',
        severity: 'WARNING',
        message: `Average response time ${currentMetrics.avgResponseTime}ms exceeds threshold`,
        value: currentMetrics.avgResponseTime,
        threshold: this.config.alertThresholds.responseTime,
        timestamp: Date.now()
      });
    }
    
    // Success rate alert
    if (currentMetrics.successRate < this.config.alertThresholds.successRate) {
      newAlerts.push({
        type: 'LOW_SUCCESS_RATE',
        severity: 'WARNING',
        message: `Success rate ${Math.round(currentMetrics.successRate * 100)}% below threshold`,
        value: currentMetrics.successRate,
        threshold: this.config.alertThresholds.successRate,
        timestamp: Date.now()
      });
    }
    
    newAlerts.forEach(alert => {
      this.alerts.push(alert);
      this.writeAlertLog(alert);
      this.emit('alert:triggered', alert);
      
      if (alert.severity === 'CRITICAL') {
        this.log(`🚨 CRITICAL ALERT: ${alert.message}`);
      } else {
        this.log(`⚠️ WARNING: ${alert.message}`);
      }
    });
  }

  // Utility Methods
  getErrorRate() {
    const total = this.metrics.requests.total;
    return total > 0 ? this.metrics.requests.failed / total : 0;
  }

  getSuccessRate() {
    const total = this.metrics.requests.total;
    return total > 0 ? this.metrics.requests.success / total : 1;
  }

  getAverageResponseTime() {
    const times = this.metrics.performance.responseTimes;
    if (times.length === 0) return 0;
    return times.reduce((sum, rt) => sum + rt.time, 0) / times.length;
  }

  getCurrentMemoryUsage() {
    const snapshots = this.metrics.performance.memorySnapshots;
    return snapshots.length > 0 ? snapshots[snapshots.length - 1].usage : 0;
  }

  // Logging Methods
  writeMetricsLog(metrics) {
    const logFile = path.join(this.config.logDir, `metrics-${this.getDateString()}.json`);
    const logEntry = JSON.stringify(metrics) + '\n';
    
    fs.appendFileSync(logFile, logEntry);
  }

  writeErrorLog(error) {
    const logFile = path.join(this.config.logDir, `errors-${this.getDateString()}.json`);
    const logEntry = JSON.stringify(error) + '\n';
    
    fs.appendFileSync(logFile, logEntry);
  }

  writeAlertLog(alert) {
    const logFile = path.join(this.config.logDir, `alerts-${this.getDateString()}.json`);
    const logEntry = JSON.stringify(alert) + '\n';
    
    fs.appendFileSync(logFile, logEntry);
  }

  generateFinalReport() {
    const runtime = Date.now() - this.startTime;
    const report = {
      summary: {
        runtime: Math.round(runtime / 60000), // minutes
        totalRequests: this.metrics.requests.total,
        successfulRequests: this.metrics.requests.success,
        failedRequests: this.metrics.requests.failed,
        totalProducts: this.metrics.products.total,
        validProducts: this.metrics.products.valid,
        rejectedProducts: this.metrics.products.rejected,
        errorRate: Math.round(this.getErrorRate() * 100),
        successRate: Math.round(this.getSuccessRate() * 100),
        avgResponseTime: Math.round(this.getAverageResponseTime()),
        avgQualityScore: Math.round(this.metrics.quality.avgScore * 10) / 10,
        totalAlerts: this.alerts.length,
        criticalAlerts: this.alerts.filter(a => a.severity === 'CRITICAL').length
      },
      
      errorBreakdown: Array.from(this.metrics.errors.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / this.metrics.requests.failed) * 100)
      })),
      
      performanceMetrics: {
        responseTimeP50: this.calculatePercentile(
          this.metrics.performance.responseTimes.map(rt => rt.time), 50
        ),
        responseTimeP95: this.calculatePercentile(
          this.metrics.performance.responseTimes.map(rt => rt.time), 95
        ),
        peakMemoryUsage: Math.max(...this.metrics.performance.memorySnapshots.map(s => s.usage)),
        avgMemoryUsage: Math.round(
          this.metrics.performance.memorySnapshots.reduce((sum, s) => sum + s.usage, 0) / 
          this.metrics.performance.memorySnapshots.length
        )
      },
      
      recommendations: this.generateRecommendations(),
      
      timestamp: new Date().toISOString()
    };
    
    const reportFile = path.join(this.config.logDir, `scraper-report-${this.getDateString()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log('📊 Final scraping report generated:', reportFile);
    this.emit('report:generated', report);
    
    return report;
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  log(...args) {
    console.log('[MONITOR]', ...args);
  }

  // Public API Methods
  getMetrics() {
    return {
      requests: { ...this.metrics.requests },
      products: { ...this.metrics.products },
      performance: {
        avgResponseTime: this.getAverageResponseTime(),
        currentMemory: this.getCurrentMemoryUsage(),
        errorRate: this.getErrorRate(),
        successRate: this.getSuccessRate()
      },
      quality: { ...this.metrics.quality },
      errors: Object.fromEntries(this.metrics.errors),
      alerts: this.alerts.length,
      runtime: Math.round((Date.now() - this.startTime) / 60000)
    };
  }

  getRecentAlerts(count = 10) {
    return this.alerts.slice(-count);
  }

  clearAlerts() {
    this.alerts = [];
    this.log('🧹 Alerts cleared');
  }

  exportMetrics(format = 'json') {
    const metrics = this.getMetrics();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'csv') {
      // Export as CSV for analysis
      const csv = this.convertToCSV(this.metrics.timeline);
      const filename = `metrics-export-${timestamp}.csv`;
      const filepath = path.join(this.config.logDir, filename);
      fs.writeFileSync(filepath, csv);
      return filepath;
    } else {
      // Export as JSON
      const filename = `metrics-export-${timestamp}.json`;
      const filepath = path.join(this.config.logDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
      return filepath;
    }
  }

  convertToCSV(timeline) {
    const headers = 'timestamp,type,url,success,responseTime,error,productName,qualityScore,category\n';
    
    const rows = timeline.map(entry => {
      const data = entry.data || {};
      return [
        new Date(entry.timestamp).toISOString(),
        entry.type,
        data.url || '',
        data.success || false,
        data.responseTime || '',
        data.error?.message || '',
        data.name || '',
        data.qualityScore || '',
        data.category || ''
      ].join(',');
    }).join('\n');
    
    return headers + rows;
  }
}

module.exports = ScraperMonitor;