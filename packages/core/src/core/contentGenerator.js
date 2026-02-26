/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { LoggingContentGenerator } from './loggingContentGenerator/index.js';
import { getDefaultModelEnvVar, MissingModelError, StrictMissingModelIdError, } from '../models/modelConfigErrors.js';
import { PROVIDER_SOURCED_FIELDS } from '../models/modelsConfig.js';
export var AuthType;
(function (AuthType) {
    AuthType["USE_OLLAMA"] = "ollama";
})(AuthType || (AuthType = {}));
function setSource(sources, path, source) {
    sources[path] = source;
}
function getSeedSource(seed, path) {
    return seed?.[path];
}
/**
 * Resolve ContentGeneratorConfig while tracking the source of each effective field.
 */
export function resolveContentGeneratorConfigWithSources(config, authType, generationConfig, seedSources, options) {
    const sources = { ...(seedSources || {}) };
    const strictModelProvider = options?.strictModelProvider === true;
    // Build config with computed fields
    const newContentGeneratorConfig = {
        ...(generationConfig || {}),
        authType,
        proxy: config?.getProxy(),
    };
    // Set sources for computed fields
    setSource(sources, 'authType', {
        kind: 'computed',
        detail: 'provided by caller',
    });
    if (config?.getProxy()) {
        setSource(sources, 'proxy', {
            kind: 'computed',
            detail: 'Config.getProxy()',
        });
    }
    // Preserve seed sources for fields that were passed in
    const seedOrUnknown = (path) => getSeedSource(seedSources, path) ?? { kind: 'unknown' };
    for (const field of PROVIDER_SOURCED_FIELDS) {
        if (generationConfig && field in generationConfig && !sources[field]) {
            setSource(sources, field, seedOrUnknown(field));
        }
    }
    // Validate required fields
    const validation = validateModelConfig(newContentGeneratorConfig, strictModelProvider);
    if (!validation.valid) {
        throw new Error(validation.errors.map((e) => e.message).join('\n'));
    }
    return {
        config: newContentGeneratorConfig,
        sources,
    };
}
/**
 * Validate a resolved model configuration.
 * Ollama doesn't require an API key for local instances.
 */
export function validateModelConfig(config, isStrictModelProvider = false) {
    const errors = [];
    // Ollama doesn't require an API key for local instances
    // Set a placeholder API key if not provided
    if (!config.apiKey) {
        config.apiKey = 'ollama';
    }
    // Model is required
    if (!config.model) {
        if (isStrictModelProvider) {
            errors.push(new StrictMissingModelIdError(config.authType));
        }
        else {
            const envKey = getDefaultModelEnvVar(config.authType);
            errors.push(new MissingModelError({ authType: config.authType, envKey }));
        }
    }
    return { valid: errors.length === 0, errors };
}
export function createContentGeneratorConfig(config, authType, generationConfig) {
    return resolveContentGeneratorConfigWithSources(config, authType, generationConfig).config;
}
export async function createContentGenerator(generatorConfig, config, _isInitialAuth) {
    const validation = validateModelConfig(generatorConfig, false);
    if (!validation.valid) {
        throw new Error(validation.errors.map((e) => e.message).join('\n'));
    }
    const authType = generatorConfig.authType;
    if (!authType) {
        throw new Error('ContentGeneratorConfig must have an authType');
    }
    // Only Ollama is supported
    if (authType !== AuthType.USE_OLLAMA) {
        throw new Error(`Error creating contentGenerator: Unsupported authType: ${authType}. Only 'ollama' is supported.`);
    }
    // Ollama uses OpenAI-compatible API
    const { createOpenAIContentGenerator } = await import('./openaiContentGenerator/index.js');
    const baseGenerator = createOpenAIContentGenerator(generatorConfig, config);
    return new LoggingContentGenerator(baseGenerator, config, generatorConfig);
}
//# sourceMappingURL=contentGenerator.js.map