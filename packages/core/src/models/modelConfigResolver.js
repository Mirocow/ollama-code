/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { DEFAULT_OLLAMA_MODEL } from '../config/models.js';
import { resolveField, resolveOptionalField, layer, envLayer, cliSource, settingsSource, modelProvidersSource, defaultSource, computedSource, } from '../utils/configResolver.js';
import { AUTH_ENV_MAPPINGS, DEFAULT_MODELS, MODEL_GENERATION_CONFIG_FIELDS, } from './constants.js';
export { validateModelConfig, } from '../core/contentGenerator.js';
/**
 * Resolve model configuration from all input sources.
 *
 * This is the single entry point for model configuration resolution.
 * It replaces the duplicate logic in:
 * - packages/cli/src/utils/modelProviderUtils.ts (resolveCliGenerationConfig)
 * - packages/core/src/core/contentGenerator.ts (resolveContentGeneratorConfigWithSources)
 *
 * @param input - All configuration sources
 * @returns Resolved configuration with source tracking
 */
export function resolveModelConfig(input) {
    const { authType, cli, settings, env, modelProvider, proxy } = input;
    const warnings = [];
    const sources = {};
    // Get auth-specific env var mappings.
    // If authType is not provided, do not read any auth env vars.
    const envMapping = authType
        ? AUTH_ENV_MAPPINGS[authType]
        : { model: [], apiKey: [], baseUrl: [] };
    // Build layers for each field in priority order
    // Priority: modelProvider > cli > env > settings > default
    // ---- Model ----
    const modelLayers = [];
    if (authType && modelProvider) {
        modelLayers.push(layer(modelProvider.id, modelProvidersSource(authType, modelProvider.id, 'model.id')));
    }
    if (cli?.model) {
        modelLayers.push(layer(cli.model, cliSource('--model')));
    }
    for (const envKey of envMapping.model) {
        modelLayers.push(envLayer(env, envKey));
    }
    if (settings?.model) {
        modelLayers.push(layer(settings.model, settingsSource('model.name')));
    }
    const defaultModel = authType ? DEFAULT_MODELS[authType] : DEFAULT_OLLAMA_MODEL;
    const modelResult = resolveField(modelLayers, defaultModel, defaultSource(defaultModel));
    sources['model'] = modelResult.source;
    // ---- API Key ----
    const apiKeyLayers = [];
    // For modelProvider, read from the specified envKey
    if (authType && modelProvider?.envKey) {
        const apiKeyFromEnv = env[modelProvider.envKey];
        if (apiKeyFromEnv) {
            apiKeyLayers.push(layer(apiKeyFromEnv, {
                kind: 'env',
                envKey: modelProvider.envKey,
                via: modelProvidersSource(authType, modelProvider.id, 'envKey'),
            }));
        }
    }
    if (cli?.apiKey) {
        apiKeyLayers.push(layer(cli.apiKey, cliSource('--ollamaApiKey')));
    }
    for (const envKey of envMapping.apiKey) {
        apiKeyLayers.push(envLayer(env, envKey));
    }
    if (settings?.apiKey) {
        apiKeyLayers.push(layer(settings.apiKey, settingsSource('security.auth.apiKey')));
    }
    const apiKeyResult = resolveOptionalField(apiKeyLayers);
    if (apiKeyResult) {
        sources['apiKey'] = apiKeyResult.source;
    }
    // ---- Base URL ----
    const baseUrlLayers = [];
    if (authType && modelProvider?.baseUrl) {
        baseUrlLayers.push(layer(modelProvider.baseUrl, modelProvidersSource(authType, modelProvider.id, 'baseUrl')));
    }
    if (cli?.baseUrl) {
        baseUrlLayers.push(layer(cli.baseUrl, cliSource('--ollamaBaseUrl')));
    }
    for (const envKey of envMapping.baseUrl) {
        baseUrlLayers.push(envLayer(env, envKey));
    }
    if (settings?.baseUrl) {
        baseUrlLayers.push(layer(settings.baseUrl, settingsSource('security.auth.baseUrl')));
    }
    const baseUrlResult = resolveOptionalField(baseUrlLayers);
    if (baseUrlResult) {
        sources['baseUrl'] = baseUrlResult.source;
    }
    // ---- API Key Env Key (for error messages) ----
    let apiKeyEnvKey;
    if (authType && modelProvider?.envKey) {
        apiKeyEnvKey = modelProvider.envKey;
        sources['apiKeyEnvKey'] = modelProvidersSource(authType, modelProvider.id, 'envKey');
    }
    // ---- Generation Config (from settings or modelProvider) ----
    const generationConfig = resolveGenerationConfig(settings?.generationConfig, modelProvider?.generationConfig, authType, modelProvider?.id, sources);
    // Build final config
    const config = {
        authType,
        model: modelResult.value || DEFAULT_OLLAMA_MODEL,
        apiKey: apiKeyResult?.value,
        apiKeyEnvKey,
        baseUrl: baseUrlResult?.value,
        proxy,
        ...generationConfig,
    };
    // Add proxy source
    if (proxy) {
        sources['proxy'] = computedSource('Config.getProxy()');
    }
    // Add authType source
    sources['authType'] = computedSource('provided by caller');
    return { config, sources, warnings };
}
/**
 * Resolve generation config fields (samplingParams, timeout, etc.)
 */
function resolveGenerationConfig(settingsConfig, modelProviderConfig, authType, modelId, sources) {
    const result = {};
    for (const field of MODEL_GENERATION_CONFIG_FIELDS) {
        // ModelProvider config takes priority over settings config
        if (authType && modelProviderConfig && field in modelProviderConfig) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result[field] = modelProviderConfig[field];
            sources[field] = modelProvidersSource(authType, modelId || '', `generationConfig.${field}`);
        }
        else if (settingsConfig && field in settingsConfig) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result[field] = settingsConfig[field];
            sources[field] = settingsSource(`model.generationConfig.${field}`);
        }
    }
    return result;
}
//# sourceMappingURL=modelConfigResolver.js.map