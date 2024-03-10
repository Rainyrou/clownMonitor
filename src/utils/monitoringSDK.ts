class MonitoringSDK {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public init() {
    this.captureAdvancedPerformanceMetrics();
    this.setupGlobalErrorListener();
    this.trackUserInteractions();
    this.trackPageNavigation();
  }

  private setupGlobalErrorListener() {
    window.onerror = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      const errorMessage =
        typeof message === 'string' ? message : 'Unknown error';
      this.reportError(errorMessage, source, lineno ?? 0, colno ?? 0, error);
      return true; // 阻止默认错误处理
    };

    window.addEventListener(
      'unhandledrejection',
      (event: PromiseRejectionEvent) => {
        const message =
          event.reason instanceof Error
            ? event.reason.message
            : 'Unhandled promise rejection';
        this.reportError(
          message,
          document.location.href,
          0,
          0,
          event.reason instanceof Error ? event.reason : undefined
        );
      }
    );
  }

  private trackUserInteractions() {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      // 添加更多的元素标识信息
      const elementText = target.innerText ? target.innerText.slice(0, 50) : ''; // 限制长度避免过长
      const trackingId = target.getAttribute('data-tracking-id');
      const elementDetail = `${target.tagName}${target.id ? `#${target.id}` : ''}${target.className ? `.${target.className}` : ''}`;
      if (target) {
        this.reportData({
          eventType: 'click',
          target: elementDetail,
          text: elementText,
          trackingId,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        });
      }
    });
  }

  private captureAdvancedPerformanceMetrics() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.performance && 'getEntriesByType' in window.performance) {
          const paintMetrics = performance.getEntriesByType(
            'paint'
          ) as PerformancePaintTiming[];
          const navigationTiming = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;

          const metrics: { [key: string]: number | undefined } = {};
          const fcpMetric = paintMetrics.find(
            (metric) => metric.name === 'first-contentful-paint'
          );
          const fpMetric = paintMetrics.find(
            (metric) => metric.name === 'first-paint'
          );
          const loadTime = navigationTiming
            ? navigationTiming.loadEventEnd - navigationTiming.startTime
            : undefined;

          if (fcpMetric) metrics['fcp'] = fcpMetric.startTime;
          if (fpMetric) metrics['fp'] = fpMetric.startTime;
          metrics['loadTime'] = loadTime;

          const ttiPolyfillMetric = performance.getEntriesByName('TTI')?.[0] as
            | PerformanceEntry
            | undefined;
          if (ttiPolyfillMetric) metrics['tti'] = ttiPolyfillMetric.startTime;

          this.reportData({
            eventType: 'performanceMetrics',
            metrics
          });
        }
      }, 0);
    });
  }

  public reportCustomEvent(eventName: string, eventData: object) {
    const data = {
      eventName,
      eventData,
      timestamp: new Date().toISOString(),
      page: window.location.pathname
    };
    this.reportData(data);
  }

  public monitorApiCall(apiCall: Promise<any>, apiName: string) {
    const startTime = performance.now();
    apiCall
      .then(() => {
        const endTime = performance.now();
        this.reportData({
          eventType: 'apiCall',
          apiName,
          duration: endTime - startTime,
          success: true,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        });
      })
      .catch((error) => {
        const endTime = performance.now();
        this.reportData({
          eventType: 'apiCall',
          apiName,
          duration: endTime - startTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        });
      });
  }

  private trackPageNavigation() {
    window.addEventListener(
      'hashchange',
      () => {
        this.reportData({
          eventType: 'navigation',
          page: window.location.pathname + window.location.hash,
          timestamp: new Date().toISOString()
        });
      },
      false
    );

    window.addEventListener(
      'popstate',
      () => {
        this.reportData({
          eventType: 'navigation',
          page: window.location.pathname + window.location.search,
          timestamp: new Date().toISOString()
        });
      },
      false
    );
  }

  public trackSearchOperation(searchTerm: string, resultsCount: number) {
    this.reportData({
      eventType: 'searchOperation',
      details: {
        searchTerm,
        resultsCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  private reportData(data: object) {
    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch((error) => console.error('Error reporting data:', error));
  }

  private reportError(
    message: string,
    source: string | undefined,
    lineno: number,
    colno: number,
    error: Error | undefined
  ) {
    this.reportData({
      error: {
        message,
        source,
        lineno,
        colno,
        stack: error?.stack
      }
    });
  }
}

export default MonitoringSDK;
