/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cache Module
 * Provides caching utilities for responses and embeddings
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
