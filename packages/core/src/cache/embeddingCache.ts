/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Embedding Cache
 * Provides caching for text embeddings to avoid recomputation
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ============================================================================
// Types
// ============================================================================

/**
 * Embedding cache entry
 */
export interface EmbeddingCacheEntry {
  /** Cache key */
  key: string;
  /** Original text (optional, for debugging) */
  text?: string;
  /** Embedding vector */
  embedding: number[];
  /** Model used */
  model: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last accessed timestamp */
  lastAccessedAt: number;
  /** Access count */
  accessCount: number;
  /** Dimension count */
  dimensions: number;
}

/**
 * Embedding cache configuration
 */
export interface EmbeddingCacheConfig {
  /** Maximum entries */
  maxSize: number;
  /** Enable persistent storage */
  persistent: boolean;
  /** Storage directory */
  storageDir?: string;
  /** Hash algorithm */
  hashAlgorithm: 'md5' | 'sha256';
  /** Store original text (for debugging) */
  storeText: boolean;
}

/**
 * Cache statistics
 */
export interface EmbeddingCacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalVectors: number;
  averageDimensions: number;
  memoryUsage: number;
}

// ============================================================================
// Embedding Cache Implementation
// ============================================================================

const DEFAULT_CONFIG: EmbeddingCacheConfig = {
  maxSize: 5000,
  persistent: true,
  hashAlgorithm: 'md5',
  storeText: false,
};

/**
 * Embedding Cache
 *
 * Caches text embeddings to avoid recomputation.
 * Supports:
 * - Multiple embedding models
 * - LRU eviction
 * - Persistent storage
 * - Batch operations
 */
export class EmbeddingCache {
  private cache: Map<string, EmbeddingCacheEntry> = new Map();
  private config: EmbeddingCacheConfig;
  private stats = { hits: 0, misses: 0 };
  private storagePath?: string;

  constructor(config: Partial<EmbeddingCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.persistent) {
      this.storagePath =
        this.config.storageDir ||
        path.join(os.homedir(), '.ollama-code', 'cache', 'embeddings');
      this.loadFromDisk();
    }
  }

  /**
   * Generate cache key for text and model
   */
  generateKey(text: string, model: string): string {
    const data = `${model}:${text}`;
    return crypto
      .createHash(this.config.hashAlgorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Get cached embedding
   */
  get(text: string, model: string): number[] | null {
    const key = this.generateKey(text, model);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    this.stats.hits++;

    return entry.embedding;
  }

  /**
   * Get cached embedding by key
   */
  getByKey(key: string): number[] | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    this.stats.hits++;

    return entry.embedding;
  }

  /**
   * Set embedding in cache
   */
  set(text: string, embedding: number[], model: string): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(text, model);
    const now = Date.now();

    const entry: EmbeddingCacheEntry = {
      key,
      text: this.config.storeText ? text : undefined,
      embedding,
      model,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      dimensions: embedding.length,
    };

    this.cache.set(key, entry);

    // Persist if enabled
    if (this.config.persistent && this.storagePath) {
      this.persistEntry(entry);
    }
  }

  /**
   * Batch get embeddings
   */
  getBatch(
    items: Array<{ text: string; model: string }>,
  ): Map<string, number[] | null> {
    const results = new Map<string, number[] | null>();

    for (const { text, model } of items) {
      const embedding = this.get(text, model);
      results.set(`${model}:${text}`, embedding);
    }

    return results;
  }

  /**
   * Batch set embeddings
   */
  setBatch(
    items: Array<{ text: string; embedding: number[]; model: string }>,
  ): void {
    for (const { text, embedding, model } of items) {
      this.set(text, embedding, model);
    }
  }

  /**
   * Check if embedding exists
   */
  has(text: string, model: string): boolean {
    const key = this.generateKey(text, model);
    return this.cache.has(key);
  }

  /**
   * Delete embedding
   */
  delete(text: string, model: string): boolean {
    const key = this.generateKey(text, model);
    const deleted = this.cache.delete(key);

    if (deleted && this.config.persistent && this.storagePath) {
      try {
        fs.unlinkSync(path.join(this.storagePath, `${key}.json`));
      } catch {
        // Ignore errors
      }
    }

    return deleted;
  }

  /**
   * Clear cache
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
  getStats(): EmbeddingCacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.stats.hits + this.stats.misses;
    const totalVectors = entries.length;
    const averageDimensions =
      totalVectors > 0
        ? entries.reduce((sum, e) => sum + e.dimensions, 0) / totalVectors
        : 0;

    // Estimate memory usage (each number is 8 bytes)
    const memoryUsage = entries.reduce(
      (sum, e) => sum + e.embedding.length * 8,
      0,
    );

    return {
      entries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      totalVectors,
      averageDimensions,
      memoryUsage,
    };
  }

  /**
   * Get entries by model
   */
  getByModel(model: string): EmbeddingCacheEntry[] {
    return Array.from(this.cache.values()).filter((e) => e.model === model);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
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
      const entry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);

      if (this.config.persistent && this.storagePath && entry) {
        try {
          fs.unlinkSync(path.join(this.storagePath, `${entry.key}.json`));
        } catch {
          // Ignore errors
        }
      }
    }
  }

  /**
   * Persist entry to disk
   */
  private persistEntry(entry: EmbeddingCacheEntry): void {
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

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.storagePath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const entry = JSON.parse(content) as EmbeddingCacheEntry;

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
// Vector Operations
// ============================================================================

/**
 * Vector operations for embeddings
 */
export const VectorOps = {
  /**
   * Calculate cosine similarity
   */
  cosineSimilarity(a: number[], b: number[]): number {
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
  },

  /**
   * Calculate Euclidean distance
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Infinity;

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }

    return Math.sqrt(sum);
  },

  /**
   * Normalize vector
   */
  normalize(v: number[]): number[] {
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    if (norm === 0) return v;
    return v.map((x) => x / norm);
  },

  /**
   * Add vectors
   */
  add(a: number[], b: number[]): number[] {
    if (a.length !== b.length) return a;
    return a.map((x, i) => x + b[i]);
  },

  /**
   * Subtract vectors
   */
  subtract(a: number[], b: number[]): number[] {
    if (a.length !== b.length) return a;
    return a.map((x, i) => x - b[i]);
  },

  /**
   * Scale vector
   */
  scale(v: number[], s: number): number[] {
    return v.map((x) => x * s);
  },

  /**
   * Dot product
   */
  dot(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    return a.reduce((sum, x, i) => sum + x * b[i], 0);
  },

  /**
   * Find nearest neighbors
   */
  findNearest(
    query: number[],
    candidates: Array<{ id: string; embedding: number[] }>,
    k: number,
  ): Array<{ id: string; similarity: number }> {
    const similarities = candidates.map(({ id, embedding }) => ({
      id,
      similarity: this.cosineSimilarity(query, embedding),
    }));

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, k);
  },
};

// Export singleton instance
export const embeddingCache = new EmbeddingCache();
export default EmbeddingCache;
