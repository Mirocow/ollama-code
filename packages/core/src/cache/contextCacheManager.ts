/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Context Cache Manager
 * 
 * Manages Ollama context tokens for KV-cache reuse, significantly improving
 * performance by avoiding re-processing of conversation history.
 * 
 * How it works:
 * 1. Ollama returns `context: number[]` in /api/generate responses
 * 2. This array contains token IDs representing the processed conversation state
 * 3. Sending this context back allows Ollama to reuse the KV-cache
 * 4. This avoids re-processing the entire conversation history each time
 * 
 * Performance improvement:
 * - First message: processes all history (slow)
 * - Subsequent messages with context: only processes new tokens (fast)
 * 
 * @example
 * const cacheManager = new ContextCacheManager();
 * 
 * // After receiving response from Ollama
 * cacheManager.setContext('session-1', response.context);
 * 
 * // Before next request
 * const context = cacheManager.getContext('session-1');
 * if (context) {
 *   request.context = context; // Reuse KV-cache
 * }
 */

import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('CONTEXT_CACHE');

/**
 * Context cache entry
 */
interface ContextCacheEntry {
  /** Context tokens from Ollama */
  context: number[];
  /** Model used for this context */
  model: string;
  /** Timestamp when context was created/updated */
  timestamp: number;
  /** Number of messages in conversation when context was created */
  messageCount: number;
  /** Token count for the context */
  tokenCount: number;
  /** Whether this context is still valid */
  isValid: boolean;
}

/**
 * Session context state
 */
interface SessionContextState {
  /** Current context tokens */
  context: number[] | null;
  /** Model name */
  model: string;
  /** System prompt used */
  systemPrompt: string | null;
  /** Message count when context was created */
  messageCount: number;
  /** Last activity timestamp */
  lastActivity: number;
}

/**
 * Configuration for Context Cache Manager
 */
export interface ContextCacheConfig {
  /** Maximum number of sessions to cache */
  maxSessions?: number;
  /** Time-to-live for cached contexts in milliseconds (default: 30 minutes) */
  ttl?: number;
  /** Whether to validate context before reuse */
  validateOnReuse?: boolean;
  /** Maximum context token count (for memory management) */
  maxContextTokens?: number;
}

/**
 * Statistics for context cache
 */
export interface ContextCacheStats {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Total contexts invalidated */
  invalidations: number;
  /** Current number of cached sessions */
  cachedSessions: number;
  /** Total memory used by contexts (estimated) */
  memoryUsage: number;
  /** Average context size */
  averageContextSize: number;
}

/**
 * Context Cache Manager
 * 
 * Manages Ollama context tokens for efficient KV-cache reuse.
 */
export class ContextCacheManager {
  private cache: Map<string, ContextCacheEntry> = new Map();
  private sessionStates: Map<string, SessionContextState> = new Map();
  private config: Required<ContextCacheConfig>;
  private stats: ContextCacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    cachedSessions: 0,
    memoryUsage: 0,
    averageContextSize: 0,
  };

  constructor(config: ContextCacheConfig = {}) {
    this.config = {
      maxSessions: config.maxSessions ?? 10,
      ttl: config.ttl ?? 30 * 60 * 1000, // 30 minutes
      validateOnReuse: config.validateOnReuse ?? true,
      maxContextTokens: config.maxContextTokens ?? 128000,
    };
  }

  /**
   * Set context for a session
   */
  setContext(
    sessionId: string,
    context: number[],
    model: string,
    messageCount: number,
  ): void {
    debugLogger.debug(`Setting context for session ${sessionId}`, {
      contextLength: context.length,
      model,
      messageCount,
    });

    // Check if we need to evict old sessions
    if (this.cache.size >= this.config.maxSessions && !this.cache.has(sessionId)) {
      this.evictOldest();
    }

    const entry: ContextCacheEntry = {
      context,
      model,
      timestamp: Date.now(),
      messageCount,
      tokenCount: context.length,
      isValid: true,
    };

    this.cache.set(sessionId, entry);
    this.updateStats();
  }

  /**
   * Get context for a session
   */
  getContext(sessionId: string): number[] | null {
    const entry = this.cache.get(sessionId);

    if (!entry) {
      this.stats.misses++;
      debugLogger.debug(`Context cache miss for session ${sessionId}`);
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      debugLogger.debug(`Context expired for session ${sessionId}`);
      this.invalidate(sessionId);
      this.stats.misses++;
      return null;
    }

    // Check validity
    if (!entry.isValid) {
      debugLogger.debug(`Context invalid for session ${sessionId}`);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    debugLogger.debug(`Context cache hit for session ${sessionId}`, {
      contextLength: entry.context.length,
    });

    return entry.context;
  }

  /**
   * Check if a session has a valid context
   */
  hasContext(sessionId: string): boolean {
    const entry = this.cache.get(sessionId);
    if (!entry) return false;

    // Check TTL and validity
    return entry.isValid && Date.now() - entry.timestamp <= this.config.ttl;
  }

  /**
   * Invalidate context for a session
   */
  invalidate(sessionId: string): void {
    const entry = this.cache.get(sessionId);
    if (entry) {
      entry.isValid = false;
      this.stats.invalidations++;
      debugLogger.debug(`Invalidated context for session ${sessionId}`);
    }
  }

  /**
   * Remove context for a session
   */
  remove(sessionId: string): void {
    this.cache.delete(sessionId);
    this.sessionStates.delete(sessionId);
    this.updateStats();
    debugLogger.debug(`Removed context for session ${sessionId}`);
  }

  /**
   * Clear all cached contexts
   */
  clear(): void {
    this.cache.clear();
    this.sessionStates.clear();
    this.updateStats();
    debugLogger.info('Cleared all cached contexts');
  }

  /**
   * Get session state for tracking
   */
  getSessionState(sessionId: string): SessionContextState | undefined {
    return this.sessionStates.get(sessionId);
  }

  /**
   * Initialize session state
   */
  initSession(sessionId: string, model: string, systemPrompt?: string): void {
    this.sessionStates.set(sessionId, {
      context: null,
      model,
      systemPrompt: systemPrompt ?? null,
      messageCount: 0,
      lastActivity: Date.now(),
    });
    debugLogger.debug(`Initialized session state for ${sessionId}`);
  }

  /**
   * Update session state after a message
   */
  updateSessionState(
    sessionId: string,
    context: number[],
    messageCount: number,
  ): void {
    const state = this.sessionStates.get(sessionId);
    if (state) {
      state.context = context;
      state.messageCount = messageCount;
      state.lastActivity = Date.now();
    }
    this.setContext(sessionId, context, state?.model ?? 'unknown', messageCount);
  }

  /**
   * Check if context is compatible with model
   */
  isContextCompatible(sessionId: string, model: string): boolean {
    const entry = this.cache.get(sessionId);
    if (!entry) return false;
    return entry.model === model;
  }

  /**
   * Get cache statistics
   */
  getStats(): ContextCacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cached session IDs
   */
  getCachedSessionIds(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      // Each number in context array is 8 bytes (double precision)
      total += entry.context.length * 8;
    }
    return total;
  }

  /**
   * Evict oldest session
   */
  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [sessionId, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = sessionId;
      }
    }

    if (oldest) {
      this.remove(oldest);
      debugLogger.debug(`Evicted oldest session ${oldest}`);
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.cachedSessions = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();

    if (this.cache.size > 0) {
      const totalSize = Array.from(this.cache.values()).reduce(
        (sum, entry) => sum + entry.context.length,
        0,
      );
      this.stats.averageContextSize = Math.round(totalSize / this.cache.size);
    } else {
      this.stats.averageContextSize = 0;
    }
  }

  /**
   * Create a generate request with context
   */
  createGenerateRequest(
    sessionId: string,
    prompt: string,
    model: string,
    systemPrompt?: string,
  ): { prompt: string; context?: number[]; system?: string } {
    const request: { prompt: string; context?: number[]; system?: string } = {
      prompt,
    };

    // Get cached context
    const cachedContext = this.getContext(sessionId);
    if (cachedContext && this.isContextCompatible(sessionId, model)) {
      request.context = cachedContext;
      debugLogger.debug(`Using cached context (${cachedContext.length} tokens)`);
    } else if (systemPrompt) {
      // First message - include system prompt
      request.system = systemPrompt;
      debugLogger.debug('First message - including system prompt');
    }

    return request;
  }

  /**
   * Handle generate response - extract and cache context
   */
  handleGenerateResponse(
    sessionId: string,
    response: { context?: number[] },
    model: string,
    messageCount: number,
  ): void {
    if (response.context && response.context.length > 0) {
      this.updateSessionState(sessionId, response.context, messageCount);
      debugLogger.info(`Cached context for session ${sessionId}`, {
        contextLength: response.context.length,
        messageCount,
      });
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const contextCacheManager = new ContextCacheManager();
