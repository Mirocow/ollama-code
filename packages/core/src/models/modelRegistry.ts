/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../core/contentGenerator.js';
import { DEFAULT_OLLAMA_NATIVE_URL } from '../core/ollamaNativeClient.js';
import {
  type ModelConfig,
  type ModelProvidersConfig,
  type ResolvedModelConfig,
  type AvailableModel,
} from './types.js';
import { DEFAULT_OLLAMA_MODEL, OLLAMA_MODELS } from './constants.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('MODEL_REGISTRY');

export { OLLAMA_MODELS } from './constants.js';

/**
 * Validates if a string key is a valid AuthType enum value.
 * @param key - The key to validate
 * @returns The validated AuthType or undefined if invalid
 */
function validateAuthTypeKey(key: string): AuthType | undefined {
  // Check if the key is a valid AuthType enum value
  if (Object.values(AuthType).includes(key as AuthType)) {
    return key as AuthType;
  }

  // Invalid key
  return undefined;
}

/**
 * Central registry for managing model configurations.
 * Models are organized by authType.
 */
export class ModelRegistry {
  private modelsByAuthType: Map<AuthType, Map<string, ResolvedModelConfig>>;

  private getDefaultBaseUrl(_authType: AuthType): string {
    return DEFAULT_OLLAMA_NATIVE_URL;
  }

  constructor(modelProvidersConfig?: ModelProvidersConfig) {
    this.modelsByAuthType = new Map();

    // Register user-configured models first (they take precedence)
    if (modelProvidersConfig) {
      for (const [rawKey, models] of Object.entries(modelProvidersConfig)) {
        const authType = validateAuthTypeKey(rawKey);

        if (!authType) {
          debugLogger.warn(
            `Invalid authType key "${rawKey}" in modelProviders config. Expected: ollama. Skipping.`,
          );
          continue;
        }

        this.registerAuthTypeModels(authType, models);
      }
    }

    // Then register default Ollama models (only if not already registered by user)
    this.registerDefaultOllamaModels();
  }

  /**
   * Register default Ollama models (only if not already configured by user)
   */
  private registerDefaultOllamaModels(): void {
    const existingModels = this.modelsByAuthType.get(AuthType.USE_OLLAMA);
    const modelMap = existingModels || new Map<string, ResolvedModelConfig>();

    for (const config of OLLAMA_MODELS) {
      // Only add if not already registered by user
      if (!modelMap.has(config.id)) {
        const resolved = this.resolveModelConfig(config, AuthType.USE_OLLAMA);
        modelMap.set(config.id, resolved);
      }
    }

    this.modelsByAuthType.set(AuthType.USE_OLLAMA, modelMap);
  }

  /**
   * Register models for an authType.
   * If multiple models have the same id, the first one takes precedence.
   */
  private registerAuthTypeModels(
    authType: AuthType,
    models: ModelConfig[],
  ): void {
    const modelMap = new Map<string, ResolvedModelConfig>();

    for (const config of models) {
      // Skip if a model with the same id is already registered (first one wins)
      if (modelMap.has(config.id)) {
        debugLogger.warn(
          `Duplicate model id "${config.id}" for authType "${authType}". Using the first registered config.`,
        );
        continue;
      }
      const resolved = this.resolveModelConfig(config, authType);
      modelMap.set(config.id, resolved);
    }

    this.modelsByAuthType.set(authType, modelMap);
  }

  /**
   * Get all models for a specific authType.
   */
  getModelsForAuthType(authType: AuthType): AvailableModel[] {
    const models = this.modelsByAuthType.get(authType);
    if (!models) return [];

    return Array.from(models.values()).map((model) => ({
      id: model.id,
      label: model.name,
      description: model.description,
      capabilities: model.capabilities,
      authType: model.authType,
      isVision: model.capabilities?.vision ?? false,
      contextWindowSize: model.generationConfig.contextWindowSize,
    }));
  }

  /**
   * Get model configuration by authType and modelId
   */
  getModel(
    authType: AuthType,
    modelId: string,
  ): ResolvedModelConfig | undefined {
    const models = this.modelsByAuthType.get(authType);
    return models?.get(modelId);
  }

  /**
   * Check if model exists for given authType
   */
  hasModel(authType: AuthType, modelId: string): boolean {
    const models = this.modelsByAuthType.get(authType);
    return models?.has(modelId) ?? false;
  }

  /**
   * Get default model for an authType.
   */
  getDefaultModelForAuthType(
    authType: AuthType,
  ): ResolvedModelConfig | undefined {
    if (authType === AuthType.USE_OLLAMA) {
      return this.getModel(authType, DEFAULT_OLLAMA_MODEL);
    }
    const models = this.modelsByAuthType.get(authType);
    if (!models || models.size === 0) return undefined;
    return Array.from(models.values())[0];
  }

  /**
   * Resolve model config by applying defaults
   */
  private resolveModelConfig(
    config: ModelConfig,
    authType: AuthType,
  ): ResolvedModelConfig {
    this.validateModelConfig(config, authType);

    return {
      ...config,
      authType,
      name: config.name || config.id,
      baseUrl: config.baseUrl || this.getDefaultBaseUrl(authType),
      generationConfig: config.generationConfig ?? {},
      capabilities: config.capabilities || {},
    };
  }

  /**
   * Validate model configuration
   */
  private validateModelConfig(config: ModelConfig, authType: AuthType): void {
    if (!config.id) {
      throw new Error(
        `Model config in authType '${authType}' missing required field: id`,
      );
    }
  }

  /**
   * Reload models from updated configuration.
   */
  reloadModels(modelProvidersConfig?: ModelProvidersConfig): void {
    // Clear all existing models
    this.modelsByAuthType.clear();

    // Register user-configured models first (they take precedence)
    if (modelProvidersConfig) {
      for (const [rawKey, models] of Object.entries(modelProvidersConfig)) {
        const authType = validateAuthTypeKey(rawKey);

        if (!authType) {
          debugLogger.warn(
            `Invalid authType key "${rawKey}" in modelProviders config. Expected: ollama. Skipping.`,
          );
          continue;
        }

        this.registerAuthTypeModels(authType, models);
      }
    }

    // Then register default Ollama models (only if not already configured by user)
    this.registerDefaultOllamaModels();
  }
}
