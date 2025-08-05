/**
 * Metrics Collector for tracking system performance and analytics
 */

import { EventEmitter } from 'events';
import { ResourceMetrics } from '@types/additional';

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface JobMetrics {
  jobId: string;
  startTime: Date;
  endTime?: Date;
  processingTime?: number;
  similarity?: number;
  error?: Error;
  resourceUsage?: ResourceMetrics;
}

export class MetricsCollector extends EventEmitter {
  private metrics: Metric[] = [];
  private jobMetrics: Map<string, JobMetrics> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  constructor() {
    super();
    this.startPeriodicFlush();
  }
  
  /**
   * Record a metric value
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };
    
    this.metrics.push(metric);
    this.emit('metric', metric);
  }
  
  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    this.record(`counter.${name}`, current + value);
  }
  
  /**
   * Set a gauge value
   */
  gauge(name: string, value: number): void {
    this.gauges.set(name, value);
    this.record(`gauge.${name}`, value);
  }
  
  /**
   * Add a value to a histogram
   */
  histogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
    this.record(`histogram.${name}`, value);
  }
  
  /**
   * Record processing time
   */
  recordProcessingTime(time: number): void {
    this.histogram('processing_time', time);
  }
  
  /**
   * Record success with similarity score
   */
  recordSuccess(similarity: number): void {
    this.increment('cloning.success');
    this.histogram('similarity_score', similarity);
  }
  
  /**
   * Record error
   */
  recordError(jobId: string, error: Error): void {
    this.increment('cloning.error');
    const job = this.jobMetrics.get(jobId);
    if (job) {
      job.error = error;
    }
  }
  
  /**
   * Record quality score
   */
  recordQuality(jobId: string, quality: number): void {
    this.histogram('quality_score', quality);
    const job = this.jobMetrics.get(jobId);
    if (job) {
      job.similarity = quality;
    }
  }
  
  /**
   * Start tracking a job
   */
  startJob(jobId: string): void {
    this.jobMetrics.set(jobId, {
      jobId,
      startTime: new Date()
    });
  }
  
  /**
   * End tracking a job
   */
  endJob(jobId: string): void {
    const job = this.jobMetrics.get(jobId);
    if (job) {
      job.endTime = new Date();
      job.processingTime = job.endTime.getTime() - job.startTime.getTime();
      this.recordProcessingTime(job.processingTime);
    }
  }
  
  /**
   * Get resource usage for a job
   */
  getResourceUsage(jobId: string): ResourceMetrics {
    // In production, would get actual resource usage
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 1000,
      gpuUsage: Math.random() * 100,
      processingTime: this.jobMetrics.get(jobId)?.processingTime || 0
    };
  }
  
  /**
   * Get all metrics
   */
  getAll(): any {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: this.getHistogramStats(),
      recentMetrics: this.metrics.slice(-100),
      jobMetrics: Array.from(this.jobMetrics.values())
    };
  }
  
  /**
   * Get histogram statistics
   */
  private getHistogramStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, values] of this.histograms) {
      if (values.length === 0) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      stats[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: sum / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }
    
    return stats;
  }
  
  /**
   * Start periodic flush of metrics
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, 60000); // Flush every minute
  }
  
  /**
   * Flush metrics to external service
   */
  private flush(): void {
    if (this.metrics.length === 0) return;
    
    // In production, would send to metrics service
    this.emit('flush', this.metrics);
    
    // Keep only recent metrics
    this.metrics = this.metrics.slice(-1000);
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.jobMetrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}