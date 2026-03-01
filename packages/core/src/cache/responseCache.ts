/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Response Cache
 * Provides caching for LLM responses to reduce API calls and improve performance
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ============================================================================
// Types
// ============================================================================

/**
 * Cache entry structure
 */
export interface CacheEntry<T = unknown> {
  /** Unique cache key */
  key: string;
  /** Cached value */
  value: T;
  /** Creation timestamp (ms since epoch) */
  createdAt: number;
  /** Expiration timestamp (ms since epoch) */
  expiresAt: number;
  /** Access count */
  accessCount: number;
  /** Last access timestamp */
  lastAccessedAt: number;
  /** Model used for generation */
  model?: string;
  /** Token count */
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum number of entries */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Enable persistent storage */
  persistent: boolean;
  /** Storage directory for persistent cache */
  storageDir?: string;
  /** Enable compression */
  compression: boolean;
  /** Hash algorithm for keys */
  hashAlgorithm: 'md5' | 'sha256';
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries */
  entries: number;
  /** Cache hits */
  hits: number;
  /** Cache misses */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
  /** Total size in bytes */
  totalSize: number;
  /** Oldest entry timestamp */
  oldestEntry?: number;
  /** Newest entry timestamp */
  newestEntry?: number;
}

/**
 * Cache key components
 */
export interface CacheKeyComponents {
  /** Model name */
  model: string;
  /** Prompt or messages hash */
  prompt: string;
  /** Temperature setting */
  temperature?: number;
  /** Other parameters */
  params?: Record<string, unknown>;
}

// ============================================================================
// Response Cache Implementation
// ============================================================================

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  persistent: true,
  compression: false,
  hashAlgorithm: 'sha256',
};

/**
 * Response Cache
 *
 * Provides intelligent caching for LLM responses with:
 * - Configurable TTL and max size
 * - LRU eviction policy
 * - Persistent storage support
 * - Semantic similarity matching
 */
export class ResponseCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };
  private storagePath?: string;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.persistent) {
      this.storagePath =
        this.config.storageDir ||
        path.join(os.homedir(), '.ollama-code', 'cache', 'responses');
      this.loadFromDisk();
    }
  }

  /**
   * Generate cache key from components
   */
  generateKey(components: CacheKeyComponents): string {
    const data = JSON.stringify({
      model: components.model,
      prompt: components.prompt,
      temperature: components.temperature,
      params: components.params,
    });

    return crypto
      .createHash(this.config.hashAlgorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Get cached response
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Set cache entry
   */
  set(
    key: string,
    value: T,
    ttl: number = this.config.defaultTTL,
    metadata?: Partial<CacheEntry<T>>,
  ): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessedAt: now,
      ...metadata,
    };

    this.cache.set(key, entry);

    // Persist if enabled
    if (this.config.persistent && this.storagePath) {
      this.persistEntry(entry);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.config.persistent && this.storagePath) {
      const filePath = path.join(this.storagePath, `${key}.json`);
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore errors
      }
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    if (this.config.persistent && this.storagePath) {
      try {
        const storageDir = this.storagePath;
        const files = fs.readdirSync(storageDir);
        files.forEach((file) => {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(storageDir, file));
          }
        });
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.stats.hits + this.stats.misses;

    let oldestEntry: number | undefined;
    let newestEntry: number | undefined;
    let totalSize = 0;

    for (const entry of entries) {
      if (!oldestEntry || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (!newestEntry || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
      totalSize += JSON.stringify(entry.value).length;
    }

    return {
      entries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      totalSize,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all entries
   */
  entries(): Array<CacheEntry<T>> {
    return Array.from(this.cache.values());
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Persist entry to disk
   */
  private persistEntry(entry: CacheEntry<T>): void {
    if (!this.storagePath) return;

    try {
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }

      const filePath = path.join(this.storagePath, `${entry.key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
    } catch {
      // Ignore persistence errors
    }
  }

  /**
   * Load cache from disk
   */
  private loadFromDisk(): void {
    if (!this.storagePath) return;

    try {
      if (!fs.existsSync(this.storagePath)) {
        return;
      }

      const files = fs.readdirSync(this.storagePath);
      const now = Date.now();

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.storagePath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const entry = JSON.parse(content) as CacheEntry<T>;

          // Skip expired entries
          if (now > entry.expiresAt) {
            fs.unlinkSync(filePath);
            continue;
          }

          this.cache.set(entry.key, entry);
        } catch {
          // Skip invalid entries
        }
      }
    } catch {
      // Ignore load errors
    }
  }
}

// ============================================================================
// Semantic Cache
// ============================================================================

/**
 * Semantic Cache for similar query matching
 * Uses embeddings to find semantically similar cached responses
 */
export class SemanticCache<T = unknown> {
  private cache: Map<string, { embedding: number[]; entry: CacheEntry<T> }> =
    new Map();
  private similarityThreshold: number;

  constructor(similarityThreshold = 0.95) {
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Add entry with embedding
   */
  set(key: string, embedding: number[], entry: CacheEntry<T>): void {
    this.cache.set(key, { embedding, entry });
  }

  /**
   * Find similar cached entry
   */
  findSimilar(embedding: number[]): CacheEntry<T> | null {
    let bestMatch: CacheEntry<T> | null = null;
    let bestSimilarity = this.similarityThreshold;

    for (const { embedding: cachedEmbedding, entry } of this.cache.values()) {
      const similarity = this.cosineSimilarity(embedding, cachedEmbedding);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

/**
 * Global cache manager
 */
export class CacheManager {
  private static instance: CacheManager;
  private responseCache: ResponseCache;
  private semanticCache: SemanticCache;

  private constructor() {
    this.responseCache = new ResponseCache();
    this.semanticCache = new SemanticCache();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  getResponseCache(): ResponseCache {
    return this.responseCache;
  }

  getSemanticCache(): SemanticCache {
    return this.semanticCache;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.responseCache.clear();
    this.semanticCache.clear();
  }

  /**
   * Get combined statistics
   */
  getStats(): { response: CacheStats; semantic: { size: number } } {
    return {
      response: this.responseCache.getStats(),
      semantic: { size: this.semanticCache.size },
    };
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
export default ResponseCache;
