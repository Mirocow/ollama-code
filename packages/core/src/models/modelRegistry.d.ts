/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../core/contentGenerator.js';
import { type ModelProvidersConfig, type ResolvedModelConfig, type AvailableModel } from './types.js';
export { OLLAMA_MODELS } from './constants.js';
/**
 * Central registry for managing model configurations.
 * Models are organized by authType.
 */
export declare class ModelRegistry {
    private modelsByAuthType;
    private getDefaultBaseUrl;
    constructor(modelProvidersConfig?: ModelProvidersConfig);
    /**
     * Register models for an authType.
     * If multiple models have the same id, the first one takes precedence.
     */
    private registerAuthTypeModels;
    /**
     * Get all models for a specific authType.
     */
    getModelsForAuthType(authType: AuthType): AvailableModel[];
    /**
     * Get model configuration by authType and modelId
     */
    getModel(authType: AuthType, modelId: string): ResolvedModelConfig | undefined;
    /**
     * Check if model exists for given authType
     */
    hasModel(authType: AuthType, modelId: string): boolean;
    /**
     * Get default model for an authType.
     */
    getDefaultModelForAuthType(authType: AuthType): ResolvedModelConfig | undefined;
    /**
     * Resolve model config by applying defaults
     */
    private resolveModelConfig;
    /**
     * Validate model configuration
     */
    private validateModelConfig;
    /**
     * Reload models from updated configuration.
     */
    reloadModels(modelProvidersConfig?: ModelProvidersConfig): void;
}
