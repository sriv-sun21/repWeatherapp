import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  networkRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    networkRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', this.trackPageLoad.bind(this));
    }
  }

  private trackPageLoad(): void {
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.loadTime = navigation.loadEventEnd - navigation.startTime;
    }
  }

  public trackRenderTime(componentName: string, startTime: number): void {
    const renderTime = performance.now() - startTime;
    this.metrics.renderTime = renderTime;
  }

  public incrementNetworkRequests(): void {
    this.metrics.networkRequests++;
  }

  public incrementCacheHits(): void {
    this.metrics.cacheHits++;
  }

  public incrementCacheMisses(): void {
    this.metrics.cacheMisses++;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      networkRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance optimization utilities
/* eslint-disable  @typescript-eslint/no-explicit-any */
export function debounce<T extends (...args: any []) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(this: unknown, ...args: Parameters<T>): void {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: unknown, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Image optimization
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src;
  });
}

// Component lazy loading
type LazyComponentProps = Record<string, unknown>;

export function lazyLoad(
  importFunc: () => Promise<{ default: React.ComponentType<LazyComponentProps> }>,
  fallback: React.ReactNode
): React.ComponentType<LazyComponentProps> {
  return function LazyComponent(props: LazyComponentProps) {
    const [Component, setComponent] = useState<React.ComponentType<LazyComponentProps> | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      importFunc()
        .then((module) => {
          setComponent(() => module.default);
        })
        .catch((err) => {
          setError(err);
        });
    }, []);

    if (error) {
      return <>{fallback}</>;
    }

    if (!Component) {
      return <>{fallback}</>;
    }

    return <Component {...props} />;
  };
}

// Resource hints
export const addResourceHint = (url: string, type: 'preconnect' | 'prefetch' | 'preload'): void => {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = type;
    link.href = url;
    document.head.appendChild(link);
  }
}; 