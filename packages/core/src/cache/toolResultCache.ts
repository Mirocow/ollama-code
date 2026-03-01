/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tool Result Cache
 * Provides caching for tool execution results to avoid redundant operations
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ============================================================================
// Types
// ============================================================================

/**
 * Tool result cache entry
 */
export interface ToolResultCacheEntry<T = unknown> {
  /** Cache key */
  key: string;
  /** Tool name */
  toolName: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
  /** Cached result */
  result: T;
  /** Creation timestamp */
  createdAt: number;
  /** Last accessed timestamp */
  lastAccessedAt: number;
  /** Access count */
  accessCount: number;
  /** Expiration timestamp */
  expiresAt: number;
  /** Whether result is successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Execution duration in ms */
  executionDuration: number;
  /** Size estimate in bytes */
  sizeEstimate: number;
  /** Tags for grouping */
  tags: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Tool result cache configuration
 */
export interface ToolResultCacheConfig {
  /** Maximum entries */
  maxSize: number;
  /** Maximum size in bytes */
  maxBytes: number;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Tool-specific TTLs */
  toolTTLs: Record<string, number>;
  /** Enable persistent storage */
  persistent: boolean;
  /** Storage directory */
  storageDir?: string;
  /** Hash algorithm for keys */
  hashAlgorithm: 'md5' | 'sha256';
  /** Whether to cache errors */
  cacheErrors: boolean;
  /** Error TTL multiplier (relative to default TTL) */
  errorTTLMultiplier: number;
  /** Tools to never cache */
  excludeTools: string[];
  /** Tools to always cache */
  includeTools: string[] | null; // null = cache all
  /** Enable compression for large results */
  compression: boolean;
  /** Compression threshold in bytes */
  compressionThreshold: number;
  /** Callback on cache hit */
  onHit?: (entry: ToolResultCacheEntry) => void;
  /** Callback on cache miss */
  onMiss?: (toolName: string, input: Record<string, unknown>) => void;
  /** Callback on eviction */
  onEvict?: (entry: ToolResultCacheEntry, reason: string) => void;
}

/**
 * Tool result cache statistics
 */
export interface ToolResultCacheStats {
  /** Total entries */
  entries: number;
  /** Total size in bytes */
  totalBytes: number;
  /** Cache hits */
  hits: number;
  /** Cache misses */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
  /** Total time saved in ms */
  timeSavedMs: number;
  /** Average result size */
  averageResultSize: number;
  /** Entries by tool */
  entriesByTool: Record<string, number>;
  /** Hits by tool */
  hitsByTool: Record<string, number>;
  /** Misses by tool */
  missesByTool: Record<string, number>;
  /** Eviction count */
  evictions: number;
}

/**
 * Cache lookup result
 */
export interface CacheLookupResult<T = unknown> {
  /** Whether found in cache */
  found: boolean;
  /** Cached entry if found */
  entry?: ToolResultCacheEntry<T>;
  /** Cache key used */
  key: string;
}

// ============================================================================
// Tool Result Cache Implementation
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ToolResultCacheConfig = {
  maxSize: 1000,
  maxBytes: 100 * 1024 * 1024, // 100MB
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  toolTTLs: {
    // File operations - shorter TTL
    read_file: 5 * 60 * 1000, // 5 minutes
    list_directory: 5 * 60 * 1000,
    glob: 5 * 60 * 1000,
    // Search operations - medium TTL
    grep: 15 * 60 * 1000, // 15 minutes
    ripgrep_search: 15 * 60 * 1000,
    // Web operations - longer TTL
    web_fetch: 60 * 60 * 1000, // 1 hour
    web_search: 60 * 60 * 1000,
  },
  persistent: true,
  hashAlgorithm: 'sha256',
  cacheErrors: true,
  errorTTLMultiplier: 0.25, // Error results cached for 1/4 of normal TTL
  excludeTools: [
    // Never cache these tools
    'write_file',
    'edit_file',
    'run_shell_command',
    'execute_code',
  ],
  includeTools: null, // Cache all non-excluded tools
  compression: false,
  compressionThreshold: 10 * 1024, // 10KB
};

/**
 * Tool Result Cache
 *
 * Caches tool execution results to avoid redundant operations.
 * Supports per-tool TTL, LRU eviction, and persistent storage.
 *
 * @example
 * const cache = new ToolResultCache();
 *
 * // Check cache before executing tool
 * const cached = cache.lookup('read_file', { path: '/src/index.ts' });
 * if (cached.found) {
 *   return cached.entry.result;
 * }
 *
 * // Execute tool and cache result
 * const result = await executeTool('read_file', { path: '/src/index.ts' });
 * cache.store('read_file', { path: '/src/index.ts' }, result, { executionDuration: 150 });
 */
export class ToolResultCache<T = unknown> {
  private cache: Map<string, ToolResultCacheEntry<T>> = new Map();
  private config: ToolResultCacheConfig;
  private stats = { hits: 0, misses: 0, evictions: 0 };
  private statsByTool = {
    entries: new Map<string, number>(),
    hits: new Map<string, number>(),
    misses: new Map<string, number>(),
  };
  private storagePath?: string;
  private currentBytes = 0;

  constructor(config: Partial<ToolResultCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.persistent) {
      this.storagePath =
        this.config.storageDir ||
        path.join(os.homedir(), '.ollama-code', 'cache', 'tool-results');
      this.loadFromDisk();
    }
  }

  /**
   * Generate cache key for tool and input
   */
  generateKey(toolName: string, input: Record<string, unknown>): string {
    // Normalize input for consistent keys
    const normalizedInput = this.normalizeInput(input);
    const data = `${toolName}:${JSON.stringify(normalizedInput)}`;

    return crypto
      .createHash(this.config.hashAlgorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Look up cached result
   */
  lookup(
    toolName: string,
    input: Record<string, unknown>,
  ): CacheLookupResult<T> {
    const key = this.generateKey(toolName, input);

    // Check if tool should be cached
    if (!this.shouldCache(toolName)) {
      this.recordMiss(toolName);
      return { found: false, key };
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.recordMiss(toolName);
      return { found: false, key };
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.recordMiss(toolName);
      return { found: false, key };
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    this.stats.hits++;
    this.statsByTool.hits.set(
      toolName,
      (this.statsByTool.hits.get(toolName) ?? 0) + 1,
    );

    this.config.onHit?.(entry);

    return { found: true, entry, key };
  }

  /**
   * Store result in cache
   */
  store(
    toolName: string,
    input: Record<string, unknown>,
    result: T,
    options: {
      success?: boolean;
      error?: string;
      executionDuration?: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
      ttl?: number;
    } = {},
  ): string {
    const key = this.generateKey(toolName, input);

    // Check if tool should be cached
    if (!this.shouldCache(toolName)) {
      return key;
    }

    // Don't cache errors if disabled
    if (!options.success && !this.config.cacheErrors) {
      return key;
    }

    const now = Date.now();
    const ttl = options.ttl ?? this.getTTL(toolName, !options.success);
    const sizeEstimate = this.estimateSize(result);

    // Check if we need to evict
    this.ensureCapacity(sizeEstimate);

    const entry: ToolResultCacheEntry<T> = {
      key,
      toolName,
      input,
      result,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      expiresAt: now + ttl,
      success: options.success ?? true,
      error: options.error,
      executionDuration: options.executionDuration ?? 0,
      sizeEstimate,
      tags: options.tags ?? [],
      metadata: options.metadata,
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const old = this.cache.get(key)!;
      this.currentBytes -= old.sizeEstimate;
    }

    this.cache.set(key, entry);
    this.currentBytes += sizeEstimate;

    // Update tool stats
    this.statsByTool.entries.set(
      toolName,
      (this.statsByTool.entries.get(toolName) ?? 0) + 1,
    );

    // Persist if enabled
    if (this.config.persistent && this.storagePath) {
      this.persistEntry(entry);
    }

    return key;
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.currentBytes -= entry.sizeEstimate;

    // Update tool stats
    const count = this.statsByTool.entries.get(entry.toolName) ?? 0;
    if (count > 0) {
      this.statsByTool.entries.set(entry.toolName, count - 1);
    }

    if (this.config.persistent && this.storagePath) {
      try {
        fs.unlinkSync(path.join(this.storagePath, `${key}.json`));
      } catch {
        // Ignore errors
      }
    }

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      this.config.onEvict?.(entry, 'clear');
    }

    this.cache.clear();
    this.currentBytes = 0;
    this.statsByTool.entries.clear();
    this.statsByTool.hits.clear();
    this.statsByTool.misses.clear();

    if (this.config.persistent && this.storagePath) {
      try {
        const files = fs.readdirSync(this.storagePath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.storagePath, file));
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Clear entries for a specific tool
   */
  clearTool(toolName: string): number {
    let cleared = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.toolName === toolName) {
        keysToDelete.push(key);
        cleared++;
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }

    return cleared;
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get statistics
   */
  getStats(): ToolResultCacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;

    const entriesByTool: Record<string, number> = {};
    const hitsByTool: Record<string, number> = {};
    const missesByTool: Record<string, number> = {};

    for (const [tool, count] of this.statsByTool.entries) {
      entriesByTool[tool] = count;
    }
    for (const [tool, count] of this.statsByTool.hits) {
      hitsByTool[tool] = count;
    }
    for (const [tool, count] of this.statsByTool.misses) {
      missesByTool[tool] = count;
    }

    // Calculate time saved
    let timeSavedMs = 0;
    for (const entry of this.cache.values()) {
      if (entry.success) {
        timeSavedMs += entry.executionDuration * entry.accessCount;
      }
    }

    // Calculate average result size
    const averageResultSize =
      this.cache.size > 0 ? this.currentBytes / this.cache.size : 0;

    return {
      entries: this.cache.size,
      totalBytes: this.currentBytes,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      timeSavedMs,
      averageResultSize,
      entriesByTool,
      hitsByTool,
      missesByTool,
      evictions: this.stats.evictions,
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get entry by key
   */
  get(key: string): ToolResultCacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  /**
   * Check if tool should be cached
   */
  shouldCache(toolName: string): boolean {
    if (this.config.excludeTools.includes(toolName)) {
      return false;
    }
    if (this.config.includeTools !== null) {
      return this.config.includeTools.includes(toolName);
    }
    return true;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ToolResultCacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private normalizeInput(input: Record<string, unknown>): Record<string, unknown> {
    // Sort keys for consistent serialization
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      sorted[key] = input[key];
    }
    return sorted;
  }

  private getTTL(toolName: string, isError: boolean): number {
    let ttl = this.config.toolTTLs[toolName] ?? this.config.defaultTTL;

    if (isError) {
      ttl *= this.config.errorTTLMultiplier;
    }

    return ttl;
  }

  private estimateSize(result: T): number {
    try {
      return JSON.stringify(result).length * 2;
    } catch {
      return 1024; // Default estimate
    }
  }

  private ensureCapacity(newSize: number): void {
    // Check max entries
    while (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Check max bytes
    while (this.currentBytes + newSize > this.config.maxBytes) {
      this.evictLRU();
    }
  }

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
      this.delete(oldestKey);
      this.stats.evictions++;
      if (entry) {
        this.config.onEvict?.(entry, 'lru');
      }
    }
  }

  private recordMiss(toolName: string): void {
    this.stats.misses++;
    this.statsByTool.misses.set(
      toolName,
      (this.statsByTool.misses.get(toolName) ?? 0) + 1,
    );
    this.config.onMiss?.(toolName, {});
  }

  private persistEntry(entry: ToolResultCacheEntry<T>): void {
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
          const entry = JSON.parse(content) as ToolResultCacheEntry<T>;

          // Skip expired entries
          if (now > entry.expiresAt) {
            fs.unlinkSync(filePath);
            continue;
          }

          this.cache.set(entry.key, entry);
          this.currentBytes += entry.sizeEstimate;
        } catch {
          // Skip invalid entries
        }
      }
    } catch {
      // Ignore load errors
    }
  }
}

// Export singleton instance
export const toolResultCache = new ToolResultCache();
export default ToolResultCache;
