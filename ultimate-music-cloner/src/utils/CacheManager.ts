/**
 * Cache Manager for storing and retrieving analysis results
 */

import Redis from 'redis';
import { promisify } from 'util';
import { Logger } from './Logger';

interface CacheOptions {
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  defaultTTL?: number;
  maxMemorySize?: number;
}

export class CacheManager {
  private logger: Logger;
  private memoryCache: Map<string, { value: any; expiry: number }>;
  private redisClient?: Redis.RedisClient;
  private redisGet?: (key: string) => Promise<string | null>;
  private redisSet?: (key: string, value: string, mode: string, duration: number) => Promise<string>;
  private redisDel?: (key: string) => Promise<number>;
  private defaultTTL: number;
  private maxMemorySize: number;
  private currentMemorySize: number = 0;
  
  constructor(options: CacheOptions = {}) {
    this.logger = new Logger('CacheManager');
    this.memoryCache = new Map();
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
    this.maxMemorySize = options.maxMemorySize || 100 * 1024 * 1024; // 100MB default
    
    if (options.redis) {
      this.initializeRedis(options.redis);
    }
    
    // Start cache cleanup interval
    this.startCleanupInterval();
  }
  
  /**
   * Initialize Redis connection
   */
  private initializeRedis(config: any): void {
    try {
      this.redisClient = Redis.createClient({
        host: config.host,
        port: config.port,
        password: config.password
      });
      
      this.redisClient.on('error', (err) => {
        this.logger.error('Redis error:', err);
      });
      
      this.redisClient.on('connect', () => {
        this.logger.info('Redis connected');
      });
      
      // Promisify Redis methods
      this.redisGet = promisify(this.redisClient.get).bind(this.redisClient);
      this.redisSet = promisify(this.redisClient.setex).bind(this.redisClient);
      this.redisDel = promisify(this.redisClient.del).bind(this.redisClient);
      
    } catch (error) {
      this.logger.warn('Failed to initialize Redis, using memory cache only', error);
    }
  }
  
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryResult = this.getFromMemory(key);
    if (memoryResult !== null) {
      return memoryResult;
    }
    
    // Try Redis if available
    if (this.redisGet) {
      try {
        const redisResult = await this.redisGet(key);
        if (redisResult) {
          const parsed = JSON.parse(redisResult);
          // Store in memory cache for faster access
          this.setInMemory(key, parsed, this.defaultTTL);
          return parsed;
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const ttlSeconds = ttl || this.defaultTTL;
    
    // Store in memory cache
    this.setInMemory(key, value, ttlSeconds);
    
    // Store in Redis if available
    if (this.redisSet) {
      try {
        await this.redisSet(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }
  }
  
  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    // Delete from memory cache
    this.deleteFromMemory(key);
    
    // Delete from Redis if available
    if (this.redisDel) {
      try {
        await this.redisDel(key);
      } catch (error) {
        this.logger.error('Redis delete error:', error);
      }
    }
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    
    // Clear Redis if available
    if (this.redisClient) {
      try {
        await promisify(this.redisClient.flushdb).bind(this.redisClient)();
      } catch (error) {
        this.logger.error('Redis clear error:', error);
      }
    }
  }
  
  /**
   * Get value from memory cache
   */
  private getFromMemory(key: string): any | null {
    const cached = this.memoryCache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (cached.expiry < Date.now()) {
      this.deleteFromMemory(key);
      return null;
    }
    
    return cached.value;
  }
  
  /**
   * Set value in memory cache
   */
  private setInMemory(key: string, value: any, ttlSeconds: number): void {
    const size = this.estimateSize(value);
    
    // Check if we need to evict items to make space
    while (this.currentMemorySize + size > this.maxMemorySize && this.memoryCache.size > 0) {
      this.evictOldest();
    }
    
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.memoryCache.set(key, { value, expiry });
    this.currentMemorySize += size;
  }
  
  /**
   * Delete from memory cache
   */
  private deleteFromMemory(key: string): void {
    const cached = this.memoryCache.get(key);
    if (cached) {
      const size = this.estimateSize(cached.value);
      this.memoryCache.delete(key);
      this.currentMemorySize -= size;
    }
  }
  
  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    // Simple estimation - in production would use more accurate method
    return JSON.stringify(value).length * 2; // 2 bytes per character
  }
  
  /**
   * Evict oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestExpiry = Infinity;
    
    for (const [key, cached] of this.memoryCache) {
      if (cached.expiry < oldestExpiry) {
        oldestExpiry = cached.expiry;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.deleteFromMemory(oldestKey);
    }
  }
  
  /**
   * Start cleanup interval to remove expired items
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Run every minute
  }
  
  /**
   * Clean up expired items from memory cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, cached] of this.memoryCache) {
      if (cached.expiry < now) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.deleteFromMemory(key);
    }
    
    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): any {
    return {
      memoryCache: {
        size: this.memoryCache.size,
        memoryUsage: this.currentMemorySize,
        maxMemory: this.maxMemorySize
      },
      redis: {
        connected: this.redisClient?.connected || false
      }
    };
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await promisify(this.redisClient.quit).bind(this.redisClient)();
    }
    
    this.memoryCache.clear();
    this.logger.info('CacheManager cleaned up');
  }
}