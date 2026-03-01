/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hybrid Content Generator
 * 
 * Intelligently switches between Ollama API endpoints based on the request:
 * - /api/generate with context caching: For simple conversations (faster)
 * - /api/chat: For requests with tools (more features)
 * 
 * Benefits:
 * 1. Context token caching for faster multi-turn conversations
 * 2. Full tool support when needed
 * 3. Automatic endpoint selection based on request requirements
 * 
 * @example
 * const generator = new HybridContentGenerator(config);
 * 
 * // Simple conversation - uses /api/generate with context caching
 * const response1 = await generator.generate({
 *   contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
 *   model: 'llama3.2',
 * });
 * 
 * // With tools - uses /api/chat
 * const response2 = await generator.generate({
 *   contents: [{ role: 'user', parts: [{ text: 'What is 2+2?' }] }],
 *   model: 'llama3.2',
 *   config: { tools: [calculatorTool] },
 * });
 */

import type {
  Content,
  GenerateContentParameters,
  GenerateContentResponse,
  Tool,
} from '../types/content.js';
import { OllamaNativeClient } from './ollamaNativeClient.js';
import { OllamaContextClient, type OllamaContextGenerateResponse } from './ollamaContextClient.js';
import { ContextCacheManager } from '../cache/contextCacheManager.js';
import { OllamaContentConverter } from './ollamaNativeContentGenerator/converter.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('HYBRID_GENERATOR');

/**
 * Hybrid generator config
 */
export interface HybridContentGeneratorConfig {
  /** Base URL for Ollama API */
  baseUrl?: string;
  /** Request timeout */
  timeout?: number;
  /** Default model */
  model: string;
  /** Context window size */
  contextWindowSize?: number;
  /** Whether to prefer generate endpoint when possible */
  preferGenerateEndpoint?: boolean;
  /** Session ID for context caching */
  sessionId?: string;
  /** System instruction */
  systemInstruction?: string;
}

/**
 * Endpoint selection result
 */
interface EndpointSelection {
  endpoint: 'generate' | 'chat';
  reason: string;
}

/**
 * Hybrid Content Generator
 * 
 * Intelligently selects the optimal Ollama API endpoint based on request requirements.
 */
export class HybridContentGenerator {
  private contextClient: OllamaContextClient;
  private chatClient: OllamaNativeClient;
  private converter: OllamaContentConverter;
  private contextCache: ContextCacheManager;
  private config: HybridContentGeneratorConfig;
  private sessionId: string;

  constructor(config: HybridContentGeneratorConfig) {
    this.config = config;
    this.sessionId = config.sessionId ?? `session-${Date.now()}`;
    this.contextClient = new OllamaContextClient(config.baseUrl, config.timeout);
    this.chatClient = new OllamaNativeClient({
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
    this.converter = new OllamaContentConverter(config.model);
    this.contextCache = new ContextCacheManager();

    debugLogger.info('HybridContentGenerator initialized', {
      model: config.model,
      sessionId: this.sessionId,
    });
  }

  /**
   * Set the model
   */
  setModel(model: string): void {
    this.config.model = model;
    this.converter.setModel(model);
    debugLogger.debug(`Model set to ${model}`);
  }

  /**
   * Set session ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    debugLogger.debug(`Session ID set to ${sessionId}`);
  }

  /**
   * Set system instruction
   */
  setSystemInstruction(instruction: string): void {
    this.config.systemInstruction = instruction;
    debugLogger.debug('System instruction updated');
  }

  /**
   * Generate content - automatically selects optimal endpoint
   */
  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const selection = this.selectEndpoint(request);

    debugLogger.info(`Selected endpoint: ${selection.endpoint}`, {
      reason: selection.reason,
      model: this.config.model,
    });

    if (selection.endpoint === 'generate') {
      return this.generateWithCache(request, userPromptId);
    } else {
      return this.generateWithChat(request, userPromptId);
    }
  }

  /**
   * Generate content stream - automatically selects optimal endpoint
   */
  async *generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): AsyncGenerator<GenerateContentResponse> {
    const selection = this.selectEndpoint(request);

    debugLogger.info(`Selected endpoint for stream: ${selection.endpoint}`, {
      reason: selection.reason,
    });

    if (selection.endpoint === 'generate') {
      yield* this.generateStreamWithCache(request, userPromptId);
    } else {
      yield* this.generateStreamWithChat(request, userPromptId);
    }
  }

  /**
   * Select the optimal endpoint based on request
   */
  private selectEndpoint(request: GenerateContentParameters): EndpointSelection {
    const tools = request.config?.tools;
    const hasTools = tools && Array.isArray(tools) && tools.length > 0;

    // Must use chat endpoint if tools are present
    if (hasTools) {
      return {
        endpoint: 'chat',
        reason: 'Tools present - requires /api/chat endpoint',
      };
    }

    // Check for function calls in contents (previous tool results)
    const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
    const hasFunctionCalls = contents.some(content =>
      content.parts?.some(part =>
        'functionCall' in part || 'functionResponse' in part
      )
    );

    if (hasFunctionCalls) {
      return {
        endpoint: 'chat',
        reason: 'Function calls in history - requires /api/chat endpoint',
      };
    }

    // Check if context caching is preferred and available
    if (this.config.preferGenerateEndpoint !== false) {
      const hasCachedContext = this.contextCache.hasContext(this.sessionId);

      if (hasCachedContext) {
        return {
          endpoint: 'generate',
          reason: 'Cached context available - using /api/generate for KV-cache reuse',
        };
      }

      // First message - can use generate
      return {
        endpoint: 'generate',
        reason: 'Simple conversation - using /api/generate for context caching',
      };
    }

    // Default to chat for compatibility
    return {
      endpoint: 'chat',
      reason: 'Default endpoint preference',
    };
  }

  /**
   * Generate using /api/generate with context caching
   */
  private async generateWithCache(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
    const lastContent = contents[contents.length - 1];

    // Extract text from the last user message
    let prompt = '';
    const images: string[] = [];

    for (const part of lastContent.parts ?? []) {
      if (typeof part === 'string') {
        prompt = part;
      } else if ('text' in part && part.text) {
        prompt = part.text;
      } else if ('inlineData' in part && part.inlineData?.mimeType?.startsWith('image/')) {
        images.push(part.inlineData.data);
      }
    }

    // Get system instruction
    const system = this.extractSystemInstruction(request);

    // Generate with context
    const response = await this.contextClient.generate({
      model: this.config.model,
      sessionId: this.sessionId,
      prompt,
      system: system ?? this.config.systemInstruction,
      images: images.length > 0 ? images : undefined,
      stream: false,
      options: this.buildModelOptions(request),
      signal: request.config?.abortSignal,
    });

    return this.convertGenerateResponse(response);
  }

  /**
   * Generate stream using /api/generate with context caching
   */
  private async *generateStreamWithCache(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): AsyncGenerator<GenerateContentResponse> {
    const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
    const lastContent = contents[contents.length - 1];

    // Extract text from the last user message
    let prompt = '';
    const images: string[] = [];

    for (const part of lastContent.parts ?? []) {
      if (typeof part === 'string') {
        prompt = part;
      } else if ('text' in part && part.text) {
        prompt = part.text;
      } else if ('inlineData' in part && part.inlineData?.mimeType?.startsWith('image/')) {
        images.push(part.inlineData.data);
      }
    }

    const system = this.extractSystemInstruction(request);
    let accumulatedResponse = '';

    await this.contextClient.generateStream(
      {
        model: this.config.model,
        sessionId: this.sessionId,
        prompt,
        system: system ?? this.config.systemInstruction,
        images: images.length > 0 ? images : undefined,
        stream: true,
        options: this.buildModelOptions(request),
        signal: request.config?.abortSignal,
      },
      (chunk) => {
        accumulatedResponse += chunk.response;
      },
    );

    // Yield final response
    yield {
      candidates: [
        {
          content: {
            parts: [{ text: accumulatedResponse }],
            role: 'model',
          },
          finishReason: 'STOP',
          index: 0,
          safetyRatings: [],
        },
      ],
    };
  }

  /**
   * Generate using /api/chat (with tool support)
   */
  private async generateWithChat(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const ollamaRequest = this.converter.convertGenAIRequestToOllama(request);

    // Add tools if present
    if (request.config?.tools) {
      ollamaRequest.tools = await this.converter.convertGenAIToolsToOllamaAsync(
        request.config.tools,
      );
    }

    // Apply model options
    if (!ollamaRequest.options) {
      ollamaRequest.options = {};
    }
    Object.assign(ollamaRequest.options, this.buildModelOptions(request));

    const response = await this.chatClient.chat(ollamaRequest);
    return this.converter.convertOllamaResponseToGenAI(response);
  }

  /**
   * Generate stream using /api/chat
   */
  private async *generateStreamWithChat(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): AsyncGenerator<GenerateContentResponse> {
    const ollamaRequest = this.converter.convertGenAIRequestToOllama(request);

    if (request.config?.tools) {
      ollamaRequest.tools = await this.converter.convertGenAIToolsToOllamaAsync(
        request.config.tools,
      );
    }

    if (!ollamaRequest.options) {
      ollamaRequest.options = {};
    }
    Object.assign(ollamaRequest.options, this.buildModelOptions(request));

    // For streaming, use the existing converter
    const accumulatedToolCalls = new Map<number, { name: string; args: string }>();
    const accumulatedContent = { text: '' };

    await this.chatClient.chat(ollamaRequest, (chunk) => {
      const response = this.converter.convertOllamaChunkToGenAI(
        chunk,
        accumulatedToolCalls,
        accumulatedContent,
      );
      // We'll yield responses after accumulation
    });

    // Yield final response
    yield {
      candidates: [
        {
          content: {
            parts: [{ text: accumulatedContent.text }],
            role: 'model',
          },
          finishReason: 'STOP',
          index: 0,
          safetyRatings: [],
        },
      ],
    };
  }

  /**
   * Extract system instruction from request
   */
  private extractSystemInstruction(request: GenerateContentParameters): string | undefined {
    const sysInstr = request.config?.systemInstruction;
    if (!sysInstr) return undefined;

    if (typeof sysInstr === 'string') {
      return sysInstr;
    }

    if ('parts' in sysInstr && Array.isArray(sysInstr.parts)) {
      return sysInstr.parts
        .map((p: any) => ('text' in p ? p.text : ''))
        .filter(Boolean)
        .join('\n');
    }

    if ('text' in sysInstr) {
      return sysInstr.text;
    }

    return undefined;
  }

  /**
   * Build model options from request
   */
  private buildModelOptions(request: GenerateContentParameters): Record<string, unknown> {
    const options: Record<string, unknown> = {};

    const config = request.config;
    if (!config) return options;

    if (config.temperature !== undefined) {
      options.temperature = config.temperature;
    }
    if (config.topP !== undefined) {
      options.top_p = config.topP;
    }
    if (config.topK !== undefined) {
      options.top_k = config.topK;
    }
    if (config.maxOutputTokens !== undefined) {
      options.num_predict = config.maxOutputTokens;
    }
    if (config.stopSequences && config.stopSequences.length > 0) {
      options.stop = config.stopSequences;
    }

    // Add context window size
    if (this.config.contextWindowSize !== undefined) {
      options.num_ctx = this.config.contextWindowSize;
    }

    return options;
  }

  /**
   * Convert generate response to GenAI format
   */
  private convertGenerateResponse(
    response: OllamaContextGenerateResponse,
  ): GenerateContentResponse {
    return {
      candidates: [
        {
          content: {
            parts: [{ text: response.response }],
            role: 'model',
          },
          finishReason: response.done ? 'STOP' : 'FINISH_REASON_UNSPECIFIED',
          index: 0,
          safetyRatings: [],
        },
      ],
      usageMetadata: {
        promptTokenCount: response.prompt_eval_count ?? 0,
        candidatesTokenCount: response.eval_count ?? 0,
        totalTokenCount: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
      },
    };
  }

  /**
   * Clear context cache for current session
   */
  clearContext(): void {
    this.contextCache.remove(this.sessionId);
    this.contextClient.clearSession(this.sessionId);
    debugLogger.info(`Cleared context for session ${this.sessionId}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      contextCache: this.contextCache.getStats(),
      sessionId: this.sessionId,
      hasCachedContext: this.contextCache.hasContext(this.sessionId),
    };
  }
}

/**
 * Factory function to create hybrid generator
 */
export function createHybridContentGenerator(
  config: HybridContentGeneratorConfig,
): HybridContentGenerator {
  return new HybridContentGenerator(config);
}
