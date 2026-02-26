/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthType,
  type Config,
  type ModelProvidersConfig,
  type ProviderModelConfig,
} from '@qwen-code/qwen-code-core';
import { loadEnvironment, loadSettings, type Settings } from './settings.js';
import { t } from '../i18n/index.js';

/**
 * Default environment variable names for Ollama auth type
 */
const DEFAULT_ENV_KEYS: Record<string, string> = {
  [AuthType.USE_OLLAMA]: 'OLLAMA_API_KEY', // Optional, for remote instances
};

/**
 * Find model configuration from modelProviders by authType and modelId
 */
function findModelConfig(
  modelProviders: ModelProvidersConfig | undefined,
  authType: string,
  modelId: string | undefined,
): ProviderModelConfig | undefined {
  if (!modelProviders || !modelId) {
    return undefined;
  }

  const models = modelProviders[authType];
  if (!Array.isArray(models)) {
    return undefined;
  }

  return models.find((m) => m.id === modelId);
}

/**
 * Check if API key is available for the given auth type and model configuration.
 * For Ollama, API key is optional (only needed for remote instances).
 */
function hasApiKeyForAuth(
  authType: string,
  settings: Settings,
  config?: Config,
): {
  hasKey: boolean;
  checkedEnvKey: string | undefined;
  isExplicitEnvKey: boolean;
} {
  const modelProviders = settings.modelProviders as
    | ModelProvidersConfig
    | undefined;

  // Use config.getModelsConfig().getModel() if available for accurate model ID resolution
  const modelId = config?.getModelsConfig().getModel() ?? settings.model?.name;

  // Try to find model-specific envKey from modelProviders
  const modelConfig = findModelConfig(modelProviders, authType, modelId);
  if (modelConfig?.envKey) {
    const hasKey = !!process.env[modelConfig.envKey];
    return {
      hasKey,
      checkedEnvKey: modelConfig.envKey,
      isExplicitEnvKey: true,
    };
  }

  // Using default environment variable
  const defaultEnvKey = DEFAULT_ENV_KEYS[authType];
  if (defaultEnvKey) {
    const hasKey = !!process.env[defaultEnvKey];
    if (hasKey) {
      return { hasKey, checkedEnvKey: defaultEnvKey, isExplicitEnvKey: false };
    }
  }

  // Check settings.security.auth.apiKey as fallback
  if (settings.security?.auth?.apiKey) {
    return {
      hasKey: true,
      checkedEnvKey: defaultEnvKey || undefined,
      isExplicitEnvKey: false,
    };
  }

  return {
    hasKey: false,
    checkedEnvKey: defaultEnvKey,
    isExplicitEnvKey: false,
  };
}

/**
 * Validate that the required credentials and configuration exist for the given auth method.
 * For Ollama, no API key is required for local instances.
 */
export function validateAuthMethod(
  authMethod: string,
  config?: Config,
): string | null {
  const settings = loadSettings();
  loadEnvironment(settings.merged);

  if (authMethod === AuthType.USE_OLLAMA) {
    // Ollama doesn't require an API key for local instances
    // The baseUrl (default: http://localhost:11434) is all that's needed
    // API key is only needed for remote Ollama instances

    const modelProviders = settings.merged.modelProviders as
      | ModelProvidersConfig
      | undefined;
    const modelId =
      config?.getModelsConfig().getModel() ?? settings.merged.model?.name;
    const modelConfig = findModelConfig(modelProviders, authMethod, modelId);

    // Check if using a remote instance that might need API key
    const baseUrl = modelConfig?.baseUrl || process.env['OLLAMA_BASE_URL'] || process.env['OLLAMA_HOST'];
    const isRemoteInstance = baseUrl && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1');

    if (isRemoteInstance) {
      // Remote instance - check for API key
      const { hasKey, checkedEnvKey } = hasApiKeyForAuth(
        authMethod,
        settings.merged,
        config,
      );
      if (!hasKey) {
        const envKeyHint = checkedEnvKey || 'OLLAMA_API_KEY';
        return t(
          'Remote Ollama instance detected. Set the {{envKeyHint}} environment variable for authentication.',
          { envKeyHint },
        );
      }
    }

    return null;
  }

  return t('Invalid auth method selected. Only USE_OLLAMA is supported.');
}
