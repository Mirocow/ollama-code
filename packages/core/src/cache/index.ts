/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cache Module
 * Provides caching utilities for responses, embeddings, and tool results
 */

export {
  ResponseCache,
  SemanticCache,
  CacheManager,
  cacheManager,
  type CacheEntry,
  type CacheConfig,
  type CacheStats,
  type CacheKeyComponents,
} from './responseCache.js';

export {
  EmbeddingCache,
  embeddingCache,
  VectorOps,
  type EmbeddingCacheEntry,
  type EmbeddingCacheConfig,
  type EmbeddingCacheStats,
} from './embeddingCache.js';

export {
  ToolResultCache,
  toolResultCache,
  type ToolResultCacheEntry,
  type ToolResultCacheConfig,
  type ToolResultCacheStats,
  type CacheLookupResult,
} from './toolResultCache.js';
