// Performance monitoring and optimization utilities

// Core Web Vitals tracking
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Web Vitals thresholds (based on Google recommendations)
export const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// Rate metric based on thresholds
export function rateMetric(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const threshold = VITALS_THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Report Web Vitals to analytics
export function reportWebVitals(metric: WebVitalsMetric) {
  // Send to analytics service (Google Analytics, Vercel Analytics, etc.)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      custom_parameter: metric.id,
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
}

// Performance observer for monitoring
export class PerformanceMonitor {
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initObservers();
    }
  }
  
  private initObservers() {
    // Monitor Long Tasks (> 50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('Long Task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Long Task observer not supported');
        }
      }
      
      // Monitor Layout Shifts
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              console.warn('Layout Shift detected:', {
                value: (entry as any).value,
                sources: (entry as any).sources,
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Layout Shift observer not supported');
        }
      }
    }
  }
  
  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Image preloading utility
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.loading = priority === 'high' ? 'eager' : 'lazy';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Preload critical images
export function preloadCriticalImages(urls: string[]) {
  if (typeof window !== 'undefined') {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

// Resource hints utilities
export function addResourceHint(url: string, type: 'preload' | 'prefetch' | 'dns-prefetch', as?: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = type;
    if (as) link.setAttribute('as', as);
    link.href = url;
    document.head.appendChild(link);
  }
}

// Lazy load component utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => 
    React.createElement(React.Suspense, {
      fallback: fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Loading...')
    }, React.createElement(LazyComponent, props));
}

// Critical path optimization
export class CriticalPathOptimizer {
  private criticalResources: Set<string> = new Set();
  
  // Mark resources as critical
  markCritical(resources: string[]) {
    resources.forEach(resource => this.criticalResources.add(resource));
  }
  
  // Check if resource is critical
  isCritical(resource: string): boolean {
    return this.criticalResources.has(resource);
  }
  
  // Preload critical resources
  preloadCritical() {
    this.criticalResources.forEach(resource => {
      if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
        addResourceHint(resource, 'preload', 'image');
      } else if (resource.match(/\.(css)$/i)) {
        addResourceHint(resource, 'preload', 'style');
      } else if (resource.match(/\.(js)$/i)) {
        addResourceHint(resource, 'preload', 'script');
      }
    });
  }
}

// Intersection Observer utility for lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Bundle size tracking
export function trackBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const totalSize = navigation.transferSize || 0;
      
      console.log('Bundle Performance:', {
        totalTransferSize: totalSize,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      });
    });
  }
}

// Performance budget checker
export interface PerformanceBudget {
  maxBundleSize: number; // in bytes
  maxImages: number;
  maxFonts: number;
  maxThirdParty: number;
}

export function checkPerformanceBudget(budget: PerformanceBudget) {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let totalSize = 0;
    let imageCount = 0;
    let fontCount = 0;
    let thirdPartyCount = 0;
    
    resources.forEach(resource => {
      totalSize += resource.transferSize || 0;
      
      if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
        imageCount++;
      } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
        fontCount++;
      } else if (!resource.name.includes(window.location.hostname)) {
        thirdPartyCount++;
      }
    });
    
    const report = {
      bundleSize: { current: totalSize, budget: budget.maxBundleSize, ok: totalSize <= budget.maxBundleSize },
      images: { current: imageCount, budget: budget.maxImages, ok: imageCount <= budget.maxImages },
      fonts: { current: fontCount, budget: budget.maxFonts, ok: fontCount <= budget.maxFonts },
      thirdParty: { current: thirdPartyCount, budget: budget.maxThirdParty, ok: thirdPartyCount <= budget.maxThirdParty },
    };
    
    console.log('Performance Budget Report:', report);
    
    // Alert on budget violations
    Object.entries(report).forEach(([key, value]) => {
      if (!value.ok) {
        console.warn(`Performance budget exceeded for ${key}:`, value);
      }
    });
  });
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
export const criticalPathOptimizer = new CriticalPathOptimizer();

// React imports (to be included where React is available)
import React from 'react';