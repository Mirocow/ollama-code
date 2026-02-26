/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, resolveModelConfig, } from '@ollama-code/ollama-code-core';
import { writeStderrLine } from './stdioHelpers.js';
export function getAuthTypeFromEnv() {
    // Ollama is the only supported auth type
    // Check for Ollama environment variables
    if (process.env['OLLAMA_BASE_URL'] || process.env['OLLAMA_HOST']) {
        return AuthType.USE_OLLAMA;
    }
    // Default to Ollama
    return AuthType.USE_OLLAMA;
}
/**
 * Unified resolver for CLI generation config.
 *
 * Precedence (for Ollama auth):
 * - model: argv.model > OLLAMA_MODEL > settings.model.name
 * - apiKey: argv.ollamaApiKey > OLLAMA_API_KEY > settings.security.auth.apiKey
 * - baseUrl: argv.ollamaBaseUrl > OLLAMA_BASE_URL > settings.security.auth.baseUrl
 */
export function resolveCliGenerationConfig(inputs) {
    const { argv, settings, selectedAuthType } = inputs;
    const env = inputs.env ?? process.env;
    const authType = selectedAuthType || AuthType.USE_OLLAMA;
    // Find modelProvider from settings.modelProviders based on authType and model
    let modelProvider;
    if (authType && settings.modelProviders) {
        const providers = settings.modelProviders[authType];
        if (providers && Array.isArray(providers)) {
            // Try to find by requested model (from CLI or settings)
            const requestedModel = argv.model || settings.model?.name;
            if (requestedModel) {
                modelProvider = providers.find((p) => p.id === requestedModel);
            }
        }
    }
    const configSources = {
        authType,
        cli: {
            model: argv.model,
            apiKey: argv.ollamaApiKey,
            baseUrl: argv.ollamaBaseUrl,
        },
        settings: {
            model: settings.model?.name,
            apiKey: settings.security?.auth?.apiKey,
            baseUrl: settings.security?.auth?.baseUrl,
            generationConfig: settings.model?.generationConfig,
        },
        modelProvider,
        env,
    };
    const resolved = resolveModelConfig(configSources);
    // Log warnings if any
    for (const warning of resolved.warnings) {
        writeStderrLine(warning);
    }
    // Build the full generation config
    const generationConfig = {
        ...resolved.config,
    };
    return {
        model: resolved.config.model || '',
        apiKey: resolved.config.apiKey || '',
        baseUrl: resolved.config.baseUrl || '',
        generationConfig,
        sources: resolved.sources,
    };
}
//# sourceMappingURL=modelConfigUtils.js.map