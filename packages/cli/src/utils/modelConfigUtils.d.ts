/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, type ContentGeneratorConfig, type ContentGeneratorConfigSources } from '@ollama-code/ollama-code-core';
import type { Settings } from '../config/settings.js';
export interface CliGenerationConfigInputs {
    argv: {
        model?: string | undefined;
        ollamaApiKey?: string | undefined;
        ollamaBaseUrl?: string | undefined;
    };
    settings: Settings;
    selectedAuthType: AuthType | undefined;
    /**
     * Injectable env for testability. Defaults to process.env at callsites.
     */
    env?: Record<string, string | undefined>;
}
export interface ResolvedCliGenerationConfig {
    /** The resolved model id (may be empty string if not resolvable at CLI layer) */
    model: string;
    /** API key for Ollama auth (optional for local instances) */
    apiKey: string;
    /** Base URL for Ollama API */
    baseUrl: string;
    /** The full generation config to pass to core Config */
    generationConfig: Partial<ContentGeneratorConfig>;
    /** Source attribution for each resolved field */
    sources: ContentGeneratorConfigSources;
}
export declare function getAuthTypeFromEnv(): AuthType | undefined;
/**
 * Unified resolver for CLI generation config.
 *
 * Precedence (for Ollama auth):
 * - model: argv.model > OLLAMA_MODEL > settings.model.name
 * - apiKey: argv.ollamaApiKey > OLLAMA_API_KEY > settings.security.auth.apiKey
 * - baseUrl: argv.ollamaBaseUrl > OLLAMA_BASE_URL > settings.security.auth.baseUrl
 */
export declare function resolveCliGenerationConfig(inputs: CliGenerationConfigInputs): ResolvedCliGenerationConfig;
