/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import OpenAI from 'openai';
import type { GenerateContentConfig } from '@google/genai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import type { OpenAICompatibleProvider } from './types.js';
/**
 * Ollama provider for local LLM inference.
 * Ollama provides an OpenAI-compatible API at http://localhost:11434/v1
 * and does not require an API key for local instances.
 */
export declare class OllamaOpenAICompatibleProvider implements OpenAICompatibleProvider {
    protected contentGeneratorConfig: ContentGeneratorConfig;
    protected cliConfig: Config;
    private static readonly OLLAMA_DEFAULT_TIMEOUT;
    constructor(contentGeneratorConfig: ContentGeneratorConfig, cliConfig: Config);
    /**
     * Check if the configuration is for an Ollama provider.
     */
    static isOllamaProvider(contentGeneratorConfig: ContentGeneratorConfig): boolean;
    buildHeaders(): Record<string, string | undefined>;
    buildClient(): OpenAI;
    buildRequest(request: OpenAI.Chat.ChatCompletionCreateParams, _userPromptId: string): OpenAI.Chat.ChatCompletionCreateParams;
    getDefaultGenerationConfig(): GenerateContentConfig;
}
