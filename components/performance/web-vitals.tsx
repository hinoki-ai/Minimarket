'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

// Web Vitals monitoring component
export function WebVitals() {
  useEffect(() => {
    // Only load web-vitals in the browser
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        function reportMetric(metric: Metric) {
          // Determine rating based on Google's thresholds
          let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
          
          switch (metric.name) {
            case 'CLS':
              if (metric.value > 0.25) rating = 'poor';
              else if (metric.value > 0.1) rating = 'needs-improvement';
              break;
            case 'FID':
              if (metric.value > 300) rating = 'poor';
              else if (metric.value > 100) rating = 'needs-improvement';
              break;
            case 'FCP':
              if (metric.value > 3000) rating = 'poor';
              else if (metric.value > 1800) rating = 'needs-improvement';
              break;
            case 'LCP':
              if (metric.value > 4000) rating = 'poor';
              else if (metric.value > 2500) rating = 'needs-improvement';
              break;
            case 'TTFB':
              if (metric.value > 1800) rating = 'poor';
              else if (metric.value > 800) rating = 'needs-improvement';
              break;
          }

          // Log to console in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Web Vitals] ${metric.name}:`, {
              value: metric.value,
              rating,
              id: metric.id,
              delta: metric.delta,
            });
          }

          // Send to analytics in production
          if (process.env.NODE_ENV === 'production') {
            // Send to Google Analytics if available
            if (typeof window !== 'undefined' && 'gtag' in window) {
              (window as any).gtag('event', metric.name, {
                event_category: 'Web Vitals',
                value: Math.round(metric.value),
                non_interaction: true,
                custom_parameter_rating: rating,
              });
            }

            // Send to Vercel Analytics if available
            if (typeof window !== 'undefined' && (window as any).va) {
              (window as any).va('track', 'Web Vitals', {
                metric: metric.name,
                value: metric.value,
                rating,
              });
            }

            // You can also send to other analytics services here
            // Example: PostHog, Mixpanel, Custom API, etc.
          }
        }

        // Observe all Core Web Vitals
        onCLS(reportMetric, { reportAllChanges: false });
        onFID(reportMetric, { reportAllChanges: false });
        onFCP(reportMetric, { reportAllChanges: false });
        onLCP(reportMetric, { reportAllChanges: false });
        onTTFB(reportMetric, { reportAllChanges: false });
      }).catch((error) => {
        console.warn('Failed to load web-vitals:', error);
      });
    }
  }, []);

  // Component doesn't render anything
  return null;
}

// Performance warning component for development
export function PerformanceWarnings() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`🐌 Long Task detected: ${entry.duration.toFixed(2)}ms`, {
                name: entry.name,
                startTime: entry.startTime,
                duration: entry.duration,
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });

        return () => observer.disconnect();
      } catch (error) {
        // Long tasks not supported
      }
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Monitor layout shifts
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as any;
            if (!layoutShift.hadRecentInput && layoutShift.value > 0.1) {
              console.warn(`📏 Layout Shift detected: ${layoutShift.value.toFixed(4)}`, {
                sources: layoutShift.sources?.map((source: any) => ({
                  node: source.node,
                  previousRect: source.previousRect,
                  currentRect: source.currentRect,
                })),
              });
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        return () => observer.disconnect();
      } catch (error) {
        // Layout shift not supported
      }
    }
  }, []);

  return null;
}

// Bundle size reporter
export function BundleSizeReporter() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

    const reportBundleSize = () => {
      if ('performance' in window) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        let jsSize = 0;
        let cssSize = 0;
        let imageSize = 0;
        let totalSize = 0;
        
        resources.forEach((resource) => {
          const size = resource.transferSize || 0;
          totalSize += size;
          
          if (resource.name.includes('/_next/static/chunks/') || resource.name.endsWith('.js')) {
            jsSize += size;
          } else if (resource.name.endsWith('.css')) {
            cssSize += size;
          } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
            imageSize += size;
          }
        });
        
        const formatSize = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;
        
        console.log('📦 Bundle Size Report:', {
          'JavaScript': formatSize(jsSize),
          'CSS': formatSize(cssSize),
          'Images': formatSize(imageSize),
          'Total': formatSize(totalSize),
        });
        
        // Warn about large bundles
        if (jsSize > 500 * 1024) { // 500KB
          console.warn('⚠️ JavaScript bundle is large:', formatSize(jsSize));
        }
        if (cssSize > 100 * 1024) { // 100KB
          console.warn('⚠️ CSS bundle is large:', formatSize(cssSize));
        }
        if (imageSize > 2 * 1024 * 1024) { // 2MB
          console.warn('⚠️ Image total is large:', formatSize(imageSize));
        }
      }
    };

    // Report after page load
    if (document.readyState === 'complete') {
      setTimeout(reportBundleSize, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(reportBundleSize, 1000);
      });
    }
  }, []);

  return null;
}

// Main performance monitoring component
export function PerformanceMonitor() {
  return (
    <>
      <WebVitals />
      <PerformanceWarnings />
      <BundleSizeReporter />
    </>
  );
}