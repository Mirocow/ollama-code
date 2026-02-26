/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
import type { OpenAICompatibleProvider } from './types.js';
import { DEFAULT_OLLAMA_BASE_URL } from '../constants.js';
import { buildRuntimeFetchOptions } from '../../../utils/runtimeFetchOptions.js';

/**
 * Ollama provider for local LLM inference.
 * Ollama provides an OpenAI-compatible API at http://localhost:11434/v1
 * and does not require an API key for local instances.
 */
export class OllamaOpenAICompatibleProvider
  extends DefaultOpenAICompatibleProvider
  implements OpenAICompatibleProvider
{
  // Ollama may be slower on local machines, so we use a longer timeout
  private static readonly OLLAMA_DEFAULT_TIMEOUT = 300000; // 5 minutes

  constructor(
    contentGeneratorConfig: ContentGeneratorConfig,
    cliConfig: Config,
  ) {
    super(contentGeneratorConfig, cliConfig);
  }

  /**
   * Check if the configuration is for an Ollama provider.
   * Detects Ollama by baseUrl containing localhost:11434 or ollama in the URL.
   */
  static isOllamaProvider(
    contentGeneratorConfig: ContentGeneratorConfig,
  ): boolean {
    const baseUrl = contentGeneratorConfig.baseUrl ?? '';

    // Check for default Ollama URL
    if (baseUrl === DEFAULT_OLLAMA_BASE_URL) {
      return true;
    }

    // Check for localhost:11434 pattern
    if (baseUrl.includes('localhost:11434') || baseUrl.includes('127.0.0.1:11434')) {
      return true;
    }

    // Check for 'ollama' in URL for custom deployments
    const lowerUrl = baseUrl.toLowerCase();
    if (lowerUrl.includes('ollama')) {
      return true;
    }

    return false;
  }

  /**
   * Override buildClient to provide Ollama-specific configuration.
   * Ollama doesn't require a real API key, so we use 'ollama' as a placeholder.
   */
  override buildClient(): OpenAI {
    const {
      apiKey = 'ollama', // Ollama doesn't require a real API key
      baseUrl = DEFAULT_OLLAMA_BASE_URL,
      timeout = OllamaOpenAICompatibleProvider.OLLAMA_DEFAULT_TIMEOUT,
      maxRetries = 1, // Fewer retries for local instance
    } = this.contentGeneratorConfig;

    const defaultHeaders = this.buildHeaders();
    const runtimeOptions = buildRuntimeFetchOptions(
      'openai',
      this.cliConfig.getProxy(),
    );

    return new OpenAI({
      apiKey,
      baseURL: baseUrl,
      timeout,
      maxRetries,
      defaultHeaders,
      ...(runtimeOptions || {}),
    });
  }

  /**
   * Override buildHeaders to add Ollama-specific headers if needed.
   */
  override buildHeaders(): Record<string, string | undefined> {
    const version = this.cliConfig.getCliVersion() || 'unknown';
    const userAgent = `QwenCode-Ollama/${version} (${process.platform}; ${process.arch})`;
    const { customHeaders } = this.contentGeneratorConfig;
    const defaultHeaders = {
      'User-Agent': userAgent,
    };

    return customHeaders
      ? { ...defaultHeaders, ...customHeaders }
      : defaultHeaders;
  }
}
