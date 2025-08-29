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

// Import only client components, avoid importing server pages from client bundles
export const LazyCheckoutForm = lazy(() => 
  import('@/app/checkout/checkout-client').then(module => ({ 
    default: module.default 
  }))
);

// Higher-order component for lazy loading with performance tracking
export function withLazyLoading<T extends React.ComponentType<unknown>>(
  Component: React.LazyExoticComponent<T>,
  FallbackComponent: React.ComponentType = () => <div>Loading...</div>,
  componentName?: string
) {
  const WrappedComponent = React.forwardRef<unknown, React.ComponentProps<T>>(function LazyWrappedComponent(props) {
    const [loadStart, setLoadStart] = React.useState<number>(0);

    React.useEffect(() => {
      if (loadStart === 0) {
        setLoadStart(performance.now());
      }
    }, [loadStart]);

    const handleLoaded = React.useCallback(() => {
      if (loadStart > 0 && componentName) {
        const loadTime = performance.now() - loadStart;
        console.warn(`🚀 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
    }, [loadStart]);

    React.useEffect(() => {
      // Trigger once the component has mounted (i.e., resolved from Suspense)
      handleLoaded();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Suspense fallback={React.createElement(FallbackComponent)}>
        {/* eslint-disable-next-line */}
        <Component {...(props as any)} />
      </Suspense>
    );
  });

  // Ensure display name exists for linting clarity
  const componentDisplayName = (Component as { displayName?: string; name?: string }).displayName
    || (Component as { name?: string }).name
    || 'Component';
  (WrappedComponent as React.NamedExoticComponent).displayName = `LazyLoaded(${componentDisplayName})`;
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
// Removed dynamic imports pointing to non-existent modules to prevent build-time resolution errors.

// Route-based code splitting
export function createRouteComponent<P = Record<string, unknown>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn as () => Promise<{ default: React.ComponentType<P> }>);
  return function RouteComponent(props: P) {
    const fallbackNode = fallback
      ? React.createElement(fallback)
      : React.createElement('div', null, 'Loading page...');
    return (
      <Suspense fallback={fallbackNode}>
        {/* eslint-disable-next-line */}
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

// Performance-optimized component wrapper
export function PerformanceOptimized<T extends Record<string, unknown>>({
  children,
  fallback,
  props,
}: {
  children: React.ComponentType<T>;
  fallback?: React.ReactNode;
  props?: T;
}) {
  const fallbackNode = fallback ?? React.createElement('div', null, 'Loading...');
  return (
    <Suspense fallback={fallbackNode}>
      {React.createElement(children as React.ComponentType<T>, props as T)}
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
      console.warn(`📦 Bundle loaded: ${bundleName}`);
    }
  }, [bundleName]);

  return <>{children}</>;
}