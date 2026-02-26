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
import type { GenerateContentParameters, GenerateContentResponse, CountTokensParameters, CountTokensResponse, EmbedContentParameters, EmbedContentResponse } from '../../types/content.js';
import { OllamaNativeClient } from '../ollamaNativeClient.js';
/**
 * Ollama Content Generator using native Ollama API.
 * Implements the ContentGenerator interface using /api/chat and /api/generate endpoints.
 */
export declare class OllamaContentGenerator {
    private client;
    private config;
    constructor(config: ContentGeneratorConfig, cliConfig: Config);
    /**
     * Generate content (non-streaming).
     */
    generateContent(request: GenerateContentParameters, userPromptId: string): Promise<GenerateContentResponse>;
    /**
     * Generate content with streaming.
     */
    generateContentStream(request: GenerateContentParameters, userPromptId: string): AsyncGenerator<GenerateContentResponse>;
    /**
     * Count tokens in content.
     * Ollama doesn't have a dedicated token counting endpoint,
     * so we estimate based on text length.
     */
    countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;
    /**
     * Generate embeddings for content.
     */
    embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;
    /**
     * Whether to use summarized thinking.
     * This is for compatibility with the interface.
     */
    useSummarizedThinking(): boolean;
    /**
     * Get the underlying Ollama client for direct access.
     */
    getClient(): OllamaNativeClient;
    /**
     * Check if the Ollama server is available.
     */
    isAvailable(): Promise<boolean>;
    /**
     * List available models.
     */
    listModels(): Promise<import("../ollamaNativeClient.js").OllamaTagsResponse>;
    /**
     * Get information about a specific model.
     */
    showModel(model: string): Promise<import("../ollamaNativeClient.js").OllamaShowResponse>;
    /**
     * Ensure a model is available (pull if necessary).
     */
    ensureModelAvailable(model: string): Promise<void>;
}
/**
 * Create an Ollama content generator.
 */
export declare function createOllamaContentGenerator(config: ContentGeneratorConfig, cliConfig: Config): OllamaContentGenerator;
