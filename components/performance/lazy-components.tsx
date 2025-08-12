'use client';

import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallback components
export function ProductCardSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2 p-4 border rounded-lg">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SearchBarSkeleton() {
  return (
    <div className="w-full max-w-lg">
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function CheckoutFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-20" />
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

// Lazy-loaded components with proper fallbacks
export const LazyProductCard = lazy(() => 
  import('@/components/ui/product-card').then(module => ({ 
    default: module.ProductCard 
  }))
);

export const LazySearchModal = lazy(() => 
  import('@/components/ui/search-bar').then(module => ({ 
    default: module.SearchModal 
  }))
);

export const LazyCheckoutForm = lazy(() => 
  import('@/app/checkout/page').then(module => ({ 
    default: module.default 
  }))
);

// Higher-order component for lazy loading with performance tracking
export function withLazyLoading<T extends React.ComponentType<any>>(
  Component: React.LazyExoticComponent<T>,
  FallbackComponent: React.ComponentType = () => <div>Loading...</div>,
  componentName?: string
) {
  const WrappedComponent = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const [loadStart, setLoadStart] = React.useState<number>(0);

    React.useEffect(() => {
      if (loadStart === 0) {
        setLoadStart(performance.now());
      }
    }, [loadStart]);

    const handleLoaded = React.useCallback(() => {
      if (loadStart > 0 && componentName) {
        const loadTime = performance.now() - loadStart;
        console.log(`🚀 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
    }, [loadStart, componentName]);

    return (
      <Suspense fallback={<FallbackComponent />}>
        <Component {...props} ref={ref} onLoad={handleLoaded} />
      </Suspense>
    );
  });

  WrappedComponent.displayName = `LazyLoaded(${Component.displayName || 'Component'})`;
  return WrappedComponent;
}

// Intersection Observer based lazy loading
export function LazySection({
  children,
  fallback = <div>Loading...</div>,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded, threshold, rootMargin]);

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Dynamic import utilities
export const dynamicImports = {
  // Admin components (only load when needed)
  AdminPanel: () => import('@/components/admin/admin-panel'),
  AdminProductForm: () => import('@/components/admin/product-form'),
  AdminAnalytics: () => import('@/components/admin/analytics'),
  
  // Heavy UI components
  DataTable: () => import('@/components/ui/data-table'),
  RichTextEditor: () => import('@/components/ui/rich-text-editor'),
  FileUploader: () => import('@/components/ui/file-uploader'),
  
  // Charts and visualizations
  Charts: () => import('@/components/charts/charts'),
  Analytics: () => import('@/components/analytics/analytics'),
  
  // Payment components
  PaymentForm: () => import('@/components/payment/payment-form'),
  StripeElements: () => import('@/components/payment/stripe-elements'),
};

// Route-based code splitting
export function createRouteComponent(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return function RouteComponent(props: any) {
    return (
      <Suspense fallback={fallback ? <fallback /> : <div>Loading page...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Performance-optimized component wrapper
export function PerformanceOptimized<T extends Record<string, any>>({
  children,
  deps = [],
  fallback,
}: {
  children: React.ComponentType<T>;
  deps?: any[];
  fallback?: React.ReactNode;
}) {
  const MemoizedComponent = React.useMemo(() => children, deps);
  
  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <MemoizedComponent />
    </Suspense>
  );
}

// Bundle size tracking wrapper
export function BundleTracker({ 
  children, 
  bundleName 
}: { 
  children: React.ReactNode;
  bundleName: string;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Bundle loaded: ${bundleName}`);
    }
  }, [bundleName]);

  return <>{children}</>;
}