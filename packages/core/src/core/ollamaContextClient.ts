/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Ollama Context Client
 * 
 * Specialized client for Ollama's /api/generate endpoint with context token caching.
 * This client is optimized for multi-turn conversations where KV-cache reuse
 * significantly improves performance.
 * 
 * Key features:
 * - Automatic context token management
 * - Session-based context tracking
 * - Streaming support with context preservation
 * - Hybrid mode: switches to /api/chat when tools are needed
 * 
 * Performance comparison:
 * - Without context caching: Each request processes ALL history tokens
 * - With context caching: Each request only processes NEW tokens
 * 
 * @example
 * const client = new OllamaContextClient();
 * 
 * // First message (processes full prompt)
 * const response1 = await client.generate({
 *   model: 'llama3.2',
 *   sessionId: 'chat-1',
 *   prompt: 'Hello!',
 *   system: 'You are a helpful assistant.',
 * });
 * 
 * // Second message (reuses context tokens - much faster!)
 * const response2 = await client.generate({
 *   model: 'llama3.2',
 *   sessionId: 'chat-1',
 *   prompt: 'What is the capital of France?',
 * });
 */

import { OllamaNativeClient } from './ollamaNativeClient.js';
import { ContextCacheManager } from '../cache/contextCacheManager.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('OLLAMA_CONTEXT_CLIENT');

/**
 * Generate request with context support
 */
export interface OllamaContextGenerateRequest {
  /** Model name */
  model: string;
  /** Session ID for context tracking */
  sessionId: string;
  /** User prompt */
  prompt: string;
  /** System prompt (only used for first message) */
  system?: string;
  /** Images (base64 encoded) */
  images?: string[];
  /** Template override */
  template?: string;
  /** Whether to stream the response */
  stream?: boolean;
  /** Model options */
  options?: Record<string, unknown>;
  /** Keep-alive duration */
  keep_alive?: string | number;
  /** Raw mode (no template processing) */
  raw?: boolean;
  /** Format for structured output */
  format?: 'json' | string | Record<string, unknown>;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Generate response with context
 */
export interface OllamaContextGenerateResponse {
  /** Model name */
  model: string;
  /** Response timestamp */
  created_at: string;
  /** Generated response text */
  response: string;
  /** Whether generation is complete */
  done: boolean;
  /** Context tokens for KV-cache reuse */
  context?: number[];
  /** Total tokens in context */
  total_duration?: number;
  /** Model load duration */
  load_duration?: number;
  /** Prompt evaluation token count */
  prompt_eval_count?: number;
  /** Prompt evaluation duration */
  prompt_eval_duration?: number;
  /** Generated token count */
  eval_count?: number;
  /** Generation duration */
  eval_duration?: number;
  /** Session ID */
  sessionId: string;
  /** Whether context was reused */
  contextReused: boolean;
}

/**
 * Streaming callback for generate responses
 */
export type ContextStreamCallback = (
  chunk: Omit<OllamaContextGenerateResponse, 'context'>,
) => void;

/**
 * Session info
 */
interface SessionInfo {
  /** Message count */
  messageCount: number;
  /** System prompt used */
  systemPrompt?: string;
  /** Model name */
  model: string;
  /** Last activity */
  lastActivity: number;
}

/**
 * Ollama Context Client
 * 
 * Manages conversation context for efficient KV-cache reuse.
 */
export class OllamaContextClient {
  private client: OllamaNativeClient;
  private contextCache: ContextCacheManager;
  private sessions: Map<string, SessionInfo> = new Map();

  constructor(baseUrl?: string, timeout?: number) {
    this.client = new OllamaNativeClient({
      baseUrl,
      timeout,
    });
    this.contextCache = new ContextCacheManager();
    debugLogger.info('OllamaContextClient initialized');
  }

  /**
   * Generate a response with automatic context management
   */
  async generate(
    request: OllamaContextGenerateRequest,
  ): Promise<OllamaContextGenerateResponse> {
    const { sessionId, model, prompt, system, images, signal, ...rest } = request;

    debugLogger.debug(`Generating response for session ${sessionId}`, {
      model,
      promptLength: prompt.length,
      hasSystem: !!system,
    });

    // Get or create session info
    const session = this.getOrCreateSession(sessionId, model, system);

    // Get cached context
    const cachedContext = this.contextCache.getContext(sessionId);
    const contextReused = cachedContext !== null && cachedContext.length > 0;

    // Build generate request
    const generateRequest: Record<string, unknown> = {
      model,
      prompt,
      ...rest,
    };

    if (cachedContext && cachedContext.length > 0) {
      // Reuse cached context tokens
      generateRequest.context = cachedContext;
      debugLogger.info(`Reusing context (${cachedContext.length} tokens)`);
    } else if (system) {
      // First message - include system prompt
      generateRequest.system = system;
      debugLogger.info('First message - using system prompt');
    }

    if (images && images.length > 0) {
      generateRequest.images = images;
    }

    // Make the request
    const response = await this.client.generate(
      generateRequest as any,
      undefined,
      { signal },
    );

    // Extract and cache context
    if (response.context && response.context.length > 0) {
      session.messageCount++;
      this.contextCache.setContext(
        sessionId,
        response.context,
        model,
        session.messageCount,
      );
      debugLogger.info(`Cached context (${response.context.length} tokens)`, {
        messageCount: session.messageCount,
      });
    }

    return {
      model: response.model,
      created_at: response.created_at,
      response: response.response,
      done: response.done,
      context: response.context,
      total_duration: response.total_duration,
      load_duration: response.load_duration,
      prompt_eval_count: response.prompt_eval_count,
      prompt_eval_duration: response.prompt_eval_duration,
      eval_count: response.eval_count,
      eval_duration: response.eval_duration,
      sessionId,
      contextReused,
    };
  }

  /**
   * Generate a streaming response with automatic context management
   */
  async generateStream(
    request: OllamaContextGenerateRequest,
    callback: ContextStreamCallback,
  ): Promise<OllamaContextGenerateResponse> {
    const { sessionId, model, prompt, system, images, signal, ...rest } = request;

    debugLogger.debug(`Starting stream for session ${sessionId}`, {
      model,
      promptLength: prompt.length,
    });

    // Get or create session info
    const session = this.getOrCreateSession(sessionId, model, system);

    // Get cached context
    const cachedContext = this.contextCache.getContext(sessionId);
    const contextReused = cachedContext !== null && cachedContext.length > 0;

    // Build generate request
    const generateRequest: Record<string, unknown> = {
      model,
      prompt,
      stream: true,
      ...rest,
    };

    if (cachedContext && cachedContext.length > 0) {
      generateRequest.context = cachedContext;
    } else if (system) {
      generateRequest.system = system;
    }

    if (images && images.length > 0) {
      generateRequest.images = images;
    }

    // Stream the response
    let finalResponse: OllamaContextGenerateResponse | null = null;

    await this.client.generate(
      generateRequest as any,
      (chunk) => {
        callback({
          model: chunk.model,
          created_at: chunk.created_at,
          response: chunk.response,
          done: chunk.done,
          total_duration: chunk.total_duration,
          load_duration: chunk.load_duration,
          prompt_eval_count: chunk.prompt_eval_count,
          prompt_eval_duration: chunk.prompt_eval_duration,
          eval_count: chunk.eval_count,
          eval_duration: chunk.eval_duration,
          sessionId,
          contextReused,
        });

        if (chunk.done) {
          finalResponse = {
            model: chunk.model,
            created_at: chunk.created_at,
            response: '', // Accumulated in callback
            done: true,
            context: chunk.context,
            total_duration: chunk.total_duration,
            load_duration: chunk.load_duration,
            prompt_eval_count: chunk.prompt_eval_count,
            prompt_eval_duration: chunk.prompt_eval_duration,
            eval_count: chunk.eval_count,
            eval_duration: chunk.eval_duration,
            sessionId,
            contextReused,
          };
        }
      },
      { signal },
    );

    if (!finalResponse) {
      throw new Error('Stream ended without final response');
    }

    // Cache the context
    if (finalResponse.context && finalResponse.context.length > 0) {
      session.messageCount++;
      this.contextCache.setContext(
        sessionId,
        finalResponse.context,
        model,
        session.messageCount,
      );
      debugLogger.info(`Cached context from stream (${finalResponse.context.length} tokens)`);
    }

    return finalResponse;
  }

  /**
   * Get or create session info
   */
  private getOrCreateSession(
    sessionId: string,
    model: string,
    system?: string,
  ): SessionInfo {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        messageCount: 0,
        systemPrompt: system,
        model,
        lastActivity: Date.now(),
      };
      this.sessions.set(sessionId, session);
      debugLogger.debug(`Created new session ${sessionId}`);
    } else {
      session.lastActivity = Date.now();
    }

    return session;
  }

  /**
   * Clear context for a session
   */
  clearSession(sessionId: string): void {
    this.contextCache.remove(sessionId);
    this.sessions.delete(sessionId);
    debugLogger.info(`Cleared session ${sessionId}`);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.contextCache.clear();
    this.sessions.clear();
    debugLogger.info('Cleared all sessions');
  }

  /**
   * Get context cache statistics
   */
  getCacheStats() {
    return this.contextCache.getStats();
  }

  /**
   * Check if session has cached context
   */
  hasContext(sessionId: string): boolean {
    return this.contextCache.hasContext(sessionId);
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get underlying client for advanced operations
   */
  getClient(): OllamaNativeClient {
    return this.client;
  }
}

/**
 * Singleton instance
 */
export const ollamaContextClient = new OllamaContextClient();
