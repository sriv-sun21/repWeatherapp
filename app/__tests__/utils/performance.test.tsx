import { performanceMonitor, debounce, throttle, preloadImage, lazyLoad } from '../../../utils/performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.resetMetrics();
  });

  it('should track page load time', () => {
    const mockNavigation = {
      loadEventEnd: 1000,
      startTime: 0,
    };

    (window.performance.getEntriesByType as jest.Mock).mockReturnValueOnce([mockNavigation]);

    // Simulate page load
    window.dispatchEvent(new Event('load'));

    expect(performanceMonitor.getMetrics().loadTime).toBe(1000);
  });

  it('should track render time', () => {
    const startTime = performance.now();
    const componentName = 'TestComponent';

    performanceMonitor.trackRenderTime(componentName, startTime);

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
  });

  it('should track network requests', () => {
    performanceMonitor.incrementNetworkRequests();
    expect(performanceMonitor.getMetrics().networkRequests).toBe(1);
  });

  it('should track cache hits and misses', () => {
    performanceMonitor.incrementCacheHits();
    performanceMonitor.incrementCacheMisses();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.cacheMisses).toBe(1);
  });
});

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toBeCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toBeCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test', 123);

      jest.advanceTimersByTime(100);

      expect(mockFn).toBeCalledWith('test', 123);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toBeCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn();
      expect(mockFn).toBeCalledTimes(2);
    });

    it('should pass arguments to throttled function', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('test', 123);

      expect(mockFn).toBeCalledWith('test', 123);
    });
  });

  describe('preloadImage', () => {
    it('should resolve when image loads successfully', async () => {
      const mockImage = {
        src: '',
        onload: null,
        onerror: null,
      };

      (window.Image as jest.Mock).mockImplementation(() => mockImage);

      const preloadPromise = preloadImage('test.jpg');

      // Simulate successful image load
      mockImage.onload();

      await expect(preloadPromise).resolves.toBeUndefined();
    });

    it('should reject when image fails to load', async () => {
      const mockImage = {
        src: '',
        onload: null,
        onerror: null,
      };

      (window.Image as jest.Mock).mockImplementation(() => mockImage);

      const preloadPromise = preloadImage('test.jpg');

      // Simulate image load error
      mockImage.onerror();

      await expect(preloadPromise).rejects.toBeUndefined();
    });
  });

  describe('lazyLoad', () => {
    it('should lazy load component', async () => {
      const mockComponent = jest.fn(() => <div>Test</div>);
      const importFunc = jest.fn().mockResolvedValue({ default: mockComponent });
      const fallback = <div>Loading...</div>;

      const LazyComponent = lazyLoad(importFunc, fallback);

      expect(importFunc).not.toBeCalled();

      // Render the component
      const { container } = render(<LazyComponent />);

      expect(container.textContent).toBe('Loading...');
      expect(importFunc).toBeCalled();

      // Wait for the component to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(container.textContent).toBe('Test');
    });

    it('should show fallback when component fails to load', async () => {
      const importFunc = jest.fn().mockRejectedValue(new Error('Load failed'));
      const fallback = <div>Error</div>;

      const LazyComponent = lazyLoad(importFunc, fallback);

      const { container } = render(<LazyComponent />);

      expect(container.textContent).toBe('Error');
    });
  });
}); 