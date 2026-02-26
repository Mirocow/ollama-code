/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ModelConfig } from './types.js';

type AuthType = import('../core/contentGenerator.js').AuthType;
type ContentGeneratorConfig =
  import('../core/contentGenerator.js').ContentGeneratorConfig;

/**
 * Field keys for model-scoped generation config.
 */
export const MODEL_GENERATION_CONFIG_FIELDS = [
  'samplingParams',
  'timeout',
  'maxRetries',
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
 * Environment variable mappings for Ollama.
 */
export interface AuthEnvMapping {
  apiKey: string[];
  baseUrl: string[];
  model: string[];
}

export const AUTH_ENV_MAPPINGS = {
  ollama: {
    apiKey: ['OLLAMA_API_KEY'], // Optional, for remote instances
    baseUrl: ['OLLAMA_BASE_URL', 'OLLAMA_HOST'],
    model: ['OLLAMA_MODEL'],
  },
} as const satisfies Record<AuthType, AuthEnvMapping>;

export const DEFAULT_MODELS = {
  ollama: 'qwen2.5-coder',
} as Partial<Record<AuthType, string>>;

/**
 * Default Ollama model
 */
export const DEFAULT_OLLAMA_MODEL = 'qwen2.5-coder';

/**
 * Default Ollama embedding model
 */
export const DEFAULT_OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text';

/**
 * Popular Ollama embedding models.
 */
export const OLLAMA_EMBEDDING_MODELS: ModelConfig[] = [
  {
    id: 'nomic-embed-text',
    name: 'Nomic Embed Text',
    description: 'Nomic Embed Text - high quality embedding model',
    capabilities: { vision: false },
  },
  {
    id: 'mxbai-embed-large',
    name: 'MXBai Embed Large',
    description: 'MXBai Embed Large - large embedding model',
    capabilities: { vision: false },
  },
];

/**
 * Popular Ollama vision models.
 */
export const OLLAMA_VISION_MODELS: ModelConfig[] = [
  {
    id: 'llava',
    name: 'LLaVA',
    description: 'LLaVA - vision-language model',
    capabilities: { vision: true },
  },
  {
    id: 'llava:13b',
    name: 'LLaVA 13B',
    description: 'LLaVA 13B - larger vision-language model',
    capabilities: { vision: true },
  },
  {
    id: 'bakllava',
    name: 'BakLLaVA',
    description: 'BakLLaVA - vision-language model',
    capabilities: { vision: true },
  },
  {
    id: 'moondream',
    name: 'Moondream',
    description: 'Moondream - lightweight vision model',
    capabilities: { vision: true },
  },
];

/**
 * Popular Ollama models for local LLM inference.
 */
export const OLLAMA_MODELS: ModelConfig[] = [
  {
    id: 'qwen2.5-coder',
    name: 'Qwen 2.5 Coder',
    description: 'Qwen 2.5 Coder - excellent for coding tasks',
    capabilities: { vision: false },
  },
  {
    id: 'qwen2.5',
    name: 'Qwen 2.5',
    description: 'Qwen 2.5 - versatile model from Alibaba',
    capabilities: { vision: false },
  },
  {
    id: 'llama3.2',
    name: 'Llama 3.2',
    description: 'Meta Llama 3.2 - versatile model',
    capabilities: { vision: false },
  },
  {
    id: 'llama3.1',
    name: 'Llama 3.1',
    description: 'Meta Llama 3.1 - powerful general-purpose model',
    capabilities: { vision: false },
  },
  {
    id: 'llama3.3',
    name: 'Llama 3.3',
    description: 'Meta Llama 3.3 - latest Llama model',
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
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    description: 'DeepSeek R1 - reasoning model',
    capabilities: { vision: false },
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral - fast and efficient model',
    capabilities: { vision: false },
  },
  {
    id: 'codestral',
    name: 'Codestral',
    description: 'Codestral - Mistral AI code model',
    capabilities: { vision: false },
  },
  {
    id: 'phi3',
    name: 'Phi-3',
    description: 'Microsoft Phi-3 - small but capable model',
    capabilities: { vision: false },
  },
  {
    id: 'phi4',
    name: 'Phi-4',
    description: 'Microsoft Phi-4 - latest small model',
    capabilities: { vision: false },
  },
  {
    id: 'gemma2',
    name: 'Gemma 2',
    description: 'Google Gemma 2 - open model',
    capabilities: { vision: false },
  },
  {
    id: 'mixtral',
    name: 'Mixtral',
    description: 'Mixtral 8x7B - mixture of experts model',
    capabilities: { vision: false },
  },
];
