/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Ollama Content Generator - generates content using native Ollama API.
 * This replaces the OpenAI-based content generator with direct Ollama API calls.
 */

import type { Config } from '../../config/config.js';
import type { ContentGeneratorConfig } from '../contentGenerator.js';
import type {
  GenerateContentParameters,
  GenerateContentResponse,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
} from '../../types/content.js';

import {
  OllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
  DEFAULT_OLLAMA_TIMEOUT,
} from '../ollamaNativeClient.js';

import {
  generateParamsToOllamaRequest,
  ollamaResponseToGenerateContentResponse,
  StreamingResponseAggregator,
  extractTextFromContents,
} from '../../utils/ollamaConverter.js';

/**
 * Ollama Content Generator using native Ollama API.
 * Implements the ContentGenerator interface using /api/chat and /api/generate endpoints.
 */
export class OllamaContentGenerator {
  private client: OllamaNativeClient;
  private config: ContentGeneratorConfig;

  constructor(config: ContentGeneratorConfig, cliConfig: Config) {
    this.config = config;

    // Initialize Ollama client with native API URL
    const baseUrl = config.baseUrl
      ? config.baseUrl.replace(/\/v1$/, '') // Remove /v1 suffix if present
      : DEFAULT_OLLAMA_NATIVE_URL;

    this.client = new OllamaNativeClient({
      baseUrl,
      timeout: config.timeout ?? DEFAULT_OLLAMA_TIMEOUT,
      config: cliConfig,
    });
  }

  /**
   * Generate content (non-streaming).
   */
  async generateContent(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const ollamaRequest = generateParamsToOllamaRequest(
      request,
      this.config.model,
    );

    // Apply extra body parameters if present
    if (this.config.extra_body) {
      ollamaRequest.options = {
        ...ollamaRequest.options,
        ...this.config.extra_body,
      };
    }

    // Apply sampling params if present
    if (this.config.samplingParams) {
      ollamaRequest.options = {
        ...ollamaRequest.options,
        temperature: this.config.samplingParams.temperature,
        top_p: this.config.samplingParams.top_p,
        top_k: this.config.samplingParams.top_k,
        num_predict: this.config.samplingParams.max_tokens,
        repeat_penalty: this.config.samplingParams.repetition_penalty,
        presence_penalty: this.config.samplingParams.presence_penalty,
        frequency_penalty: this.config.samplingParams.frequency_penalty,
      };
    }

    const response = await this.client.chat(ollamaRequest);
    return ollamaResponseToGenerateContentResponse(response);
  }

  /**
   * Generate content with streaming.
   */
  async *generateContentStream(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): AsyncGenerator<GenerateContentResponse> {
    const ollamaRequest = generateParamsToOllamaRequest(
      request,
      this.config.model,
    );

    // Set streaming to true
    ollamaRequest.stream = true;

    // Apply extra body parameters if present
    if (this.config.extra_body) {
      ollamaRequest.options = {
        ...ollamaRequest.options,
        ...this.config.extra_body,
      };
    }

    // Apply sampling params if present
    if (this.config.samplingParams) {
      ollamaRequest.options = {
        ...ollamaRequest.options,
        temperature: this.config.samplingParams.temperature,
        top_p: this.config.samplingParams.top_p,
        top_k: this.config.samplingParams.top_k,
        num_predict: this.config.samplingParams.max_tokens,
        repeat_penalty: this.config.samplingParams.repetition_penalty,
        presence_penalty: this.config.samplingParams.presence_penalty,
        frequency_penalty: this.config.samplingParams.frequency_penalty,
      };
    }

    const aggregator = new StreamingResponseAggregator();

    // Use streaming chat
    await this.client.chat(ollamaRequest, (chunk) => {
      aggregator.addChunk(chunk);
    });

    // Yield the final response
    yield aggregator.buildGenerateContentResponse();
  }

  /**
   * Count tokens in content.
   * Ollama doesn't have a dedicated token counting endpoint,
   * so we estimate based on text length.
   */
  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // Ollama doesn't provide a token counting endpoint
    // We estimate tokens: roughly 1 token per 4 characters for English text
    const text = extractTextFromContents(request.contents);
    const estimatedTokens = Math.ceil(text.length / 4);

    return {
      totalTokens: estimatedTokens,
    };
  }

  /**
   * Generate embeddings for content.
   */
  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    const model = request.model ?? this.config.model;

    // Extract text from content - handle both single and batch formats
    const contents = request.contents ?? (request.content ? [request.content] : []);
    const text = extractTextFromContents(contents);

    // Use the embeddings endpoint
    const response = await this.client.embeddings({
      model,
      prompt: text,
    });

    return {
      embedding: {
        values: response.embedding,
      },
    };
  }

  /**
   * Whether to use summarized thinking.
   * This is for compatibility with the interface.
   */
  useSummarizedThinking(): boolean {
    return false;
  }

  /**
   * Get the underlying Ollama client for direct access.
   */
  getClient(): OllamaNativeClient {
    return this.client;
  }

  /**
   * Check if the Ollama server is available.
   */
  async isAvailable(): Promise<boolean> {
    return this.client.isServerRunning();
  }

  /**
   * List available models.
   */
  async listModels() {
    return this.client.listModels();
  }

  /**
   * Get information about a specific model.
   */
  async showModel(model: string) {
    return this.client.showModel(model);
  }

  /**
   * Ensure a model is available (pull if necessary).
   */
  async ensureModelAvailable(model: string) {
    return this.client.ensureModelAvailable(model);
  }
}

/**
 * Create an Ollama content generator.
 */
export function createOllamaContentGenerator(
  config: ContentGeneratorConfig,
  cliConfig: Config,
): OllamaContentGenerator {
  return new OllamaContentGenerator(config, cliConfig);
}
