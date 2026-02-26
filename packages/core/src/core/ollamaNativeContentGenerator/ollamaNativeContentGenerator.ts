/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Native Ollama Content Generator.
 * Uses the native Ollama REST API (/api/chat, /api/generate) instead of
 * the OpenAI-compatible API.
 */

import type { ContentGenerator, ContentGeneratorConfig } from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import type {
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';
import {
  OllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
  type OllamaChatResponse,
} from '../ollamaNativeClient.js';
import { OllamaContentConverter } from './converter.js';
import { RequestTokenEstimator } from '../../utils/request-tokenizer/index.js';
import { isAbortError } from '../../utils/errors.js';
import { createDebugLogger } from '../../utils/debugLogger.js';
import { DEFAULT_OLLAMA_EMBEDDING_MODEL } from '../../config/models.js';

const debugLogger = createDebugLogger('OLLAMA_NATIVE');

/**
 * Native Ollama content generator implementation.
 * Communicates directly with Ollama's native REST API endpoints.
 */
export class OllamaNativeContentGenerator implements ContentGenerator {
  private client: OllamaNativeClient;
  private converter: OllamaContentConverter;
  private config: ContentGeneratorConfig;

  constructor(
    contentGeneratorConfig: ContentGeneratorConfig,
    _cliConfig: Config,
  ) {
    this.config = contentGeneratorConfig;

    // Create native Ollama client
    const baseUrl = contentGeneratorConfig.baseUrl || DEFAULT_OLLAMA_NATIVE_URL;
    this.client = new OllamaNativeClient({
      baseUrl,
      timeout: contentGeneratorConfig.timeout,
      config: _cliConfig,
    });

    // Create converter for format transformation
    this.converter = new OllamaContentConverter(contentGeneratorConfig.model);
  }

  /**
   * Generate content using native Ollama API
   */
  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    debugLogger.debug('Generating content with native Ollama API', {
      model: this.config.model,
      userPromptId,
    });

    try {
      // Convert GenAI request to Ollama format
      const ollamaRequest = this.converter.convertGenAIRequestToOllama(request);

      // Handle tools asynchronously if present (tools are in config)
      if (request.config?.tools) {
        ollamaRequest.tools = await this.converter.convertGenAIToolsToOllamaAsync(request.config.tools);
      }

      // Apply config-level options
      this.applyConfigOptions(ollamaRequest);

      debugLogger.debug('Ollama request', { request: JSON.stringify(ollamaRequest, null, 2) });

      // Make the API call
      const ollamaResponse = await this.client.chat(ollamaRequest);

      debugLogger.debug('Ollama response', { response: JSON.stringify(ollamaResponse, null, 2) });

      // Convert response back to GenAI format
      return this.converter.convertOllamaResponseToGenAI(ollamaResponse);
    } catch (error) {
      debugLogger.error('Ollama native API error:', error);
      throw this.handleError(error, request);
    }
  }

  /**
   * Generate content stream using native Ollama API
   */
  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    debugLogger.debug('Generating content stream with native Ollama API', {
      model: this.config.model,
      userPromptId,
    });

    const self = this;

    // Convert request once
    const ollamaRequest = this.converter.convertGenAIRequestToOllama(request);
    if (request.config?.tools) {
      ollamaRequest.tools = await this.converter.convertGenAIToolsToOllamaAsync(request.config.tools);
    }
    this.applyConfigOptions(ollamaRequest);

    // Create async generator
    async function* streamGenerator(): AsyncGenerator<GenerateContentResponse> {
      try {
        // Use streaming API
        let finalResponse: OllamaChatResponse | null = null;

        await self.client.chat(ollamaRequest, (chunk: OllamaChatResponse) => {
          // Collect final response
          if (chunk.done) {
            finalResponse = chunk;
          }
        });

        // Yield final response
        if (finalResponse) {
          yield self.converter.convertOllamaResponseToGenAI(finalResponse);
        }
      } catch (error) {
        debugLogger.error('Ollama native streaming error:', error);
        throw self.handleError(error, request);
      }
    }

    return streamGenerator();
  }

  /**
   * Count tokens using estimation (Ollama doesn't have a native token counting endpoint)
   */
  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    try {
      // Use the request token estimator (character-based)
      const estimator = new RequestTokenEstimator();
      const result = await estimator.calculateTokens(request);

      return {
        totalTokens: result.totalTokens,
      };
    } catch (error) {
      debugLogger.warn(
        'Failed to calculate tokens, falling back to simple method:',
        error,
      );

      // Fallback to simple estimation
      const content = JSON.stringify(request.contents);
      const totalTokens = Math.ceil(content.length / 4);

      return {
        totalTokens,
      };
    }
  }

  /**
   * Generate embeddings using native Ollama API
   */
  async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    // Extract text from contents
    let text = '';
    if (Array.isArray(request.contents)) {
      text = request.contents
        .map((content) => {
          if (typeof content === 'string') return content;
          if ('parts' in content && content.parts) {
            return content.parts
              .map((part) =>
                typeof part === 'string'
                  ? part
                  : 'text' in part
                    ? (part as { text?: string }).text || ''
                    : '',
              )
              .join(' ');
          }
          return '';
        })
        .join(' ');
    } else if (request.contents) {
      if (typeof request.contents === 'string') {
        text = request.contents;
      } else if ('parts' in request.contents && request.contents.parts) {
        text = request.contents.parts
          .map((part) =>
            typeof part === 'string' ? part : 'text' in part ? part.text : '',
          )
          .join(' ');
      }
    }

    try {
      // Use Ollama embedding model
      const embedding = await this.client.embed({
        model: DEFAULT_OLLAMA_EMBEDDING_MODEL,
        input: text,
      });

      return {
        embeddings: [
          {
            values: embedding.embeddings[0],
          },
        ],
      };
    } catch (error) {
      debugLogger.error('Ollama embedding error:', error);
      throw new Error(
        `Ollama embedding error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Whether to use summarized thinking (not supported in native Ollama)
   */
  useSummarizedThinking(): boolean {
    return false;
  }

  /**
   * Apply config-level options to the Ollama request
   */
  private applyConfigOptions(ollamaRequest: ReturnType<typeof this.converter.convertGenAIRequestToOllama>): void {
    if (!ollamaRequest.options) {
      ollamaRequest.options = {};
    }

    // Apply sampling parameters
    const sampling = this.config.samplingParams;
    if (sampling) {
      if (sampling.temperature !== undefined) {
        ollamaRequest.options.temperature = sampling.temperature;
      }
      if (sampling.top_p !== undefined) {
        ollamaRequest.options.top_p = sampling.top_p;
      }
      if (sampling.top_k !== undefined) {
        ollamaRequest.options.top_k = sampling.top_k;
      }
      if (sampling.max_tokens !== undefined) {
        ollamaRequest.options.num_predict = sampling.max_tokens;
      }
      if (sampling.repetition_penalty !== undefined) {
        ollamaRequest.options.repeat_penalty = sampling.repetition_penalty;
      }
      if (sampling.presence_penalty !== undefined) {
        ollamaRequest.options.presence_penalty = sampling.presence_penalty;
      }
      if (sampling.frequency_penalty !== undefined) {
        ollamaRequest.options.frequency_penalty = sampling.frequency_penalty;
      }
    }

    // Apply context window size
    if (this.config.contextWindowSize !== undefined) {
      ollamaRequest.options.num_ctx = this.config.contextWindowSize;
    }
  }

  /**
   * Handle errors from the Ollama API
   */
  private handleError(error: unknown, request: GenerateContentParameters): Error {
    if (isAbortError(error) && request.config?.abortSignal?.aborted) {
      // User cancelled the request
      return error as Error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new Error(`Ollama API error: ${message}`);
  }
}
