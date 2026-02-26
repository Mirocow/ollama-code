/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import OpenAI from 'openai';
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_MAX_RETRIES } from '../constants.js';
import { buildRuntimeFetchOptions } from '../../../utils/runtimeFetchOptions.js';
/**
 * Ollama provider for local LLM inference.
 * Ollama provides an OpenAI-compatible API at http://localhost:11434/v1
 * and does not require an API key for local instances.
 */
export class OllamaOpenAICompatibleProvider {
    contentGeneratorConfig;
    cliConfig;
    // Ollama may be slower on local machines, so we use a longer timeout
    static OLLAMA_DEFAULT_TIMEOUT = 300000; // 5 minutes
    constructor(contentGeneratorConfig, cliConfig) {
        this.cliConfig = cliConfig;
        this.contentGeneratorConfig = contentGeneratorConfig;
    }
    /**
     * Check if the configuration is for an Ollama provider.
     */
    static isOllamaProvider(contentGeneratorConfig) {
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
    buildHeaders() {
        const version = this.cliConfig.getCliVersion() || 'unknown';
        const userAgent = `OllamaCode/${version} (${process.platform}; ${process.arch})`;
        const { customHeaders } = this.contentGeneratorConfig;
        const defaultHeaders = {
            'User-Agent': userAgent,
        };
        return customHeaders
            ? { ...defaultHeaders, ...customHeaders }
            : defaultHeaders;
    }
    buildClient() {
        const { apiKey = 'ollama', // Ollama doesn't require a real API key
        baseUrl = DEFAULT_OLLAMA_BASE_URL, timeout = OllamaOpenAICompatibleProvider.OLLAMA_DEFAULT_TIMEOUT, maxRetries = DEFAULT_MAX_RETRIES, } = this.contentGeneratorConfig;
        const defaultHeaders = this.buildHeaders();
        const runtimeOptions = buildRuntimeFetchOptions('openai', this.cliConfig.getProxy());
        return new OpenAI({
            apiKey,
            baseURL: baseUrl,
            timeout,
            maxRetries,
            defaultHeaders,
            ...(runtimeOptions || {}),
        });
    }
    buildRequest(request, _userPromptId) {
        const extraBody = this.contentGeneratorConfig.extra_body;
        return {
            ...request,
            ...(extraBody ? extraBody : {}),
        };
    }
    getDefaultGenerationConfig() {
        return {};
    }
}
//# sourceMappingURL=ollama.js.map