/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_QWEN_MODEL } from '../config/models.js';

import type { ModelConfig } from './types.js';

type AuthType = import('../core/contentGenerator.js').AuthType;
type ContentGeneratorConfig =
  import('../core/contentGenerator.js').ContentGeneratorConfig;

/**
 * Field keys for model-scoped generation config.
 *
 * Kept in a small standalone module to avoid circular deps. The `import('...')`
 * usage is type-only and does not emit runtime imports.
 */
export const MODEL_GENERATION_CONFIG_FIELDS = [
  'samplingParams',
  'timeout',
  'maxRetries',
  'enableCacheControl',
  'schemaCompliance',
  'reasoning',
  'contextWindowSize',
  'customHeaders',
  'extra_body',
] as const satisfies ReadonlyArray<keyof ContentGeneratorConfig>;

/**
 * Credential-related fields that are part of ContentGeneratorConfig
 * but not ModelGenerationConfig.
 */
export const CREDENTIAL_FIELDS = [
  'model',
  'apiKey',
  'apiKeyEnvKey',
  'baseUrl',
] as const satisfies ReadonlyArray<keyof ContentGeneratorConfig>;

/**
 * All provider-sourced fields that need to be tracked for source attribution
 * and cleared when switching from provider to manual credentials.
 */
export const PROVIDER_SOURCED_FIELDS = [
  ...CREDENTIAL_FIELDS,
  ...MODEL_GENERATION_CONFIG_FIELDS,
] as const;

/**
 * Environment variable mappings per authType.
 */
export interface AuthEnvMapping {
  apiKey: string[];
  baseUrl: string[];
  model: string[];
}

export const AUTH_ENV_MAPPINGS = {
  openai: {
    apiKey: ['OPENAI_API_KEY'],
    baseUrl: ['OPENAI_BASE_URL'],
    model: ['OPENAI_MODEL', 'QWEN_MODEL'],
  },
  anthropic: {
    apiKey: ['ANTHROPIC_API_KEY'],
    baseUrl: ['ANTHROPIC_BASE_URL'],
    model: ['ANTHROPIC_MODEL'],
  },
  gemini: {
    apiKey: ['GEMINI_API_KEY'],
    baseUrl: [],
    model: ['GEMINI_MODEL'],
  },
  'vertex-ai': {
    apiKey: ['GOOGLE_API_KEY'],
    baseUrl: [],
    model: ['GOOGLE_MODEL'],
  },
  'qwen-oauth': {
    apiKey: [],
    baseUrl: [],
    model: [],
  },
  ollama: {
    apiKey: ['OLLAMA_API_KEY'], // Optional, for remote instances
    baseUrl: ['OLLAMA_BASE_URL', 'OLLAMA_HOST'],
    model: ['OLLAMA_MODEL'],
  },
} as const satisfies Record<AuthType, AuthEnvMapping>;

export const DEFAULT_MODELS = {
  openai: 'qwen3-coder-plus',
  'qwen-oauth': DEFAULT_QWEN_MODEL,
  ollama: 'qwen2.5-coder',
} as Partial<Record<AuthType, string>>;

export const QWEN_OAUTH_ALLOWED_MODELS = [
  DEFAULT_QWEN_MODEL,
  'vision-model',
] as const;

/**
 * Hard-coded Qwen OAuth models that are always available.
 * These cannot be overridden by user configuration.
 */
export const QWEN_OAUTH_MODELS: ModelConfig[] = [
  {
    id: 'coder-model',
    name: 'coder-model',
    description:
      'Qwen 3.5 Plus — efficient hybrid model with leading coding performance',
    capabilities: { vision: false },
  },
  {
    id: 'vision-model',
    name: 'vision-model',
    description: 'The latest Qwen Vision model from Alibaba Cloud ModelStudio',
    capabilities: { vision: true },
  },
];

/**
 * Popular Ollama models for local LLM inference.
 * These are provided as convenient defaults for Ollama users.
 */
export const OLLAMA_MODELS: ModelConfig[] = [
  {
    id: 'qwen2.5-coder',
    name: 'Qwen 2.5 Coder',
    description: 'Qwen 2.5 Coder - excellent for coding tasks',
    capabilities: { vision: false },
  },
  {
    id: 'llama3.2',
    name: 'Llama 3.2',
    description: 'Meta Llama 3.2 - versatile model',
    capabilities: { vision: false },
  },
  {
    id: 'codellama',
    name: 'Code Llama',
    description: 'Code Llama - specialized for code generation',
    capabilities: { vision: false },
  },
  {
    id: 'deepseek-coder-v2',
    name: 'DeepSeek Coder V2',
    description: 'DeepSeek Coder V2 - powerful coding model',
    capabilities: { vision: false },
  },
];
