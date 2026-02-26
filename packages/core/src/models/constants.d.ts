/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ModelConfig } from './types.js';
type AuthType = import('../core/contentGenerator.js').AuthType;
/**
 * Field keys for model-scoped generation config.
 */
export declare const MODEL_GENERATION_CONFIG_FIELDS: readonly ["samplingParams", "timeout", "maxRetries", "schemaCompliance", "reasoning", "contextWindowSize", "customHeaders", "extra_body"];
/**
 * Credential-related fields that are part of ContentGeneratorConfig
 * but not ModelGenerationConfig.
 */
export declare const CREDENTIAL_FIELDS: readonly ["model", "apiKey", "apiKeyEnvKey", "baseUrl"];
/**
 * All provider-sourced fields that need to be tracked for source attribution
 * and cleared when switching from provider to manual credentials.
 */
export declare const PROVIDER_SOURCED_FIELDS: readonly ["model", "apiKey", "apiKeyEnvKey", "baseUrl", "samplingParams", "timeout", "maxRetries", "schemaCompliance", "reasoning", "contextWindowSize", "customHeaders", "extra_body"];
/**
 * Environment variable mappings for Ollama.
 */
export interface AuthEnvMapping {
    apiKey: string[];
    baseUrl: string[];
    model: string[];
}
export declare const AUTH_ENV_MAPPINGS: {
    readonly ollama: {
        readonly apiKey: ["OLLAMA_API_KEY"];
        readonly baseUrl: ["OLLAMA_BASE_URL", "OLLAMA_HOST"];
        readonly model: ["OLLAMA_MODEL"];
    };
};
export declare const DEFAULT_MODELS: Partial<Record<AuthType, string>>;
/**
 * Default Ollama model
 */
export declare const DEFAULT_OLLAMA_MODEL = "qwen2.5-coder";
/**
 * Default Ollama embedding model
 */
export declare const DEFAULT_OLLAMA_EMBEDDING_MODEL = "nomic-embed-text";
/**
 * Popular Ollama embedding models.
 */
export declare const OLLAMA_EMBEDDING_MODELS: ModelConfig[];
/**
 * Popular Ollama vision models.
 */
export declare const OLLAMA_VISION_MODELS: ModelConfig[];
/**
 * Popular Ollama models for local LLM inference.
 */
export declare const OLLAMA_MODELS: ModelConfig[];
export {};
