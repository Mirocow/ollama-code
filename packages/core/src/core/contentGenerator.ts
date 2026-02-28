/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
} from '../types/content.js';
import type { Config } from '../config/config.js';
import { LoggingContentGenerator } from './loggingContentGenerator/index.js';
import type {
  ConfigSource,
  ConfigSourceKind,
  ConfigSources,
} from '../utils/configResolver.js';
import {
  getDefaultModelEnvVar,
  MissingModelError,
  StrictMissingModelIdError,
} from '../models/modelConfigErrors.js';
import { PROVIDER_SOURCED_FIELDS } from '../models/modelsConfig.js';

/**
 * Interface abstracting the core functionalities for generating content and counting tokens.
 */
export interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;

  useSummarizedThinking(): boolean;

  /**
   * Check if the current model supports function calling (tools)
   * Returns undefined if not supported by this generator type
   */
  checkToolSupport?(): Promise<boolean>;
}

export enum AuthType {
  USE_OLLAMA = 'ollama',
}

export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  apiKeyEnvKey?: string;
  baseUrl?: string;
  authType?: AuthType | undefined;
  enableOpenAILogging?: boolean;
  openAILoggingDir?: string;
  timeout?: number; // Timeout configuration in milliseconds
  maxRetries?: number; // Maximum retries for failed requests
  samplingParams?: {
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    temperature?: number;
    max_tokens?: number;
  };
  reasoning?:
    | false
    | {
        effort?: 'low' | 'medium' | 'high';
        budget_tokens?: number;
      };
  proxy?: string | undefined;
  userAgent?: string;
  // Schema compliance mode for tool definitions
  schemaCompliance?: 'auto' | 'openapi_30';
  // Context window size override. If set to a positive number, it will override
  // the automatic detection. Leave undefined to use automatic detection.
  contextWindowSize?: number;
  // Custom HTTP headers to be sent with requests
  customHeaders?: Record<string, string>;
  // Extra body parameters to be merged into the request body
  extra_body?: Record<string, unknown>;
};

// Keep the public ContentGeneratorConfigSources API, but reuse the generic
// source-tracking types from utils/configResolver to avoid duplication.
export type ContentGeneratorConfigSourceKind = ConfigSourceKind;
export type ContentGeneratorConfigSource = ConfigSource;
export type ContentGeneratorConfigSources = ConfigSources;

export type ResolvedContentGeneratorConfig = {
  config: ContentGeneratorConfig;
  sources: ContentGeneratorConfigSources;
};

function setSource(
  sources: ContentGeneratorConfigSources,
  path: string,
  source: ContentGeneratorConfigSource,
): void {
  sources[path] = source;
}

function getSeedSource(
  seed: ContentGeneratorConfigSources | undefined,
  path: string,
): ContentGeneratorConfigSource | undefined {
  return seed?.[path];
}

/**
 * Resolve ContentGeneratorConfig while tracking the source of each effective field.
 */
export function resolveContentGeneratorConfigWithSources(
  config: Config,
  authType: AuthType | undefined,
  generationConfig?: Partial<ContentGeneratorConfig>,
  seedSources?: ContentGeneratorConfigSources,
  options?: { strictModelProvider?: boolean },
): ResolvedContentGeneratorConfig {
  const sources: ContentGeneratorConfigSources = { ...(seedSources || {}) };
  const strictModelProvider = options?.strictModelProvider === true;

  // Build config with computed fields
  const newContentGeneratorConfig: Partial<ContentGeneratorConfig> = {
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
  const seedOrUnknown = (path: string): ContentGeneratorConfigSource =>
    getSeedSource(seedSources, path) ?? { kind: 'unknown' };

  for (const field of PROVIDER_SOURCED_FIELDS) {
    if (generationConfig && field in generationConfig && !sources[field]) {
      setSource(sources, field, seedOrUnknown(field));
    }
  }

  // Validate required fields
  const validation = validateModelConfig(
    newContentGeneratorConfig as ContentGeneratorConfig,
    strictModelProvider,
  );
  if (!validation.valid) {
    throw new Error(validation.errors.map((e) => e.message).join('\n'));
  }

  return {
    config: newContentGeneratorConfig as ContentGeneratorConfig,
    sources,
  };
}

export interface ModelConfigValidationResult {
  valid: boolean;
  errors: Error[];
}

/**
 * Validate a resolved model configuration.
 * Ollama doesn't require an API key for local instances.
 */
export function validateModelConfig(
  config: ContentGeneratorConfig,
  isStrictModelProvider: boolean = false,
): ModelConfigValidationResult {
  const errors: Error[] = [];

  // Ollama doesn't require an API key for local instances
  // Set a placeholder API key if not provided
  if (!config.apiKey) {
    (config as { apiKey?: string }).apiKey = 'ollama';
  }

  // Model is required
  if (!config.model) {
    if (isStrictModelProvider) {
      errors.push(new StrictMissingModelIdError(config.authType));
    } else {
      const envKey = getDefaultModelEnvVar(config.authType);
      errors.push(new MissingModelError({ authType: config.authType, envKey }));
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createContentGeneratorConfig(
  config: Config,
  authType: AuthType | undefined,
  generationConfig?: Partial<ContentGeneratorConfig>,
): ContentGeneratorConfig {
  return resolveContentGeneratorConfigWithSources(
    config,
    authType,
    generationConfig,
  ).config;
}

export async function createContentGenerator(
  generatorConfig: ContentGeneratorConfig,
  config: Config,
  _isInitialAuth?: boolean,
): Promise<ContentGenerator> {
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
    throw new Error(
      `Error creating contentGenerator: Unsupported authType: ${authType}. Only 'ollama' is supported.`,
    );
  }

  // Use native Ollama API
  const { createOllamaNativeContentGenerator } =
    await import('./ollamaNativeContentGenerator/index.js');
  const baseGenerator = createOllamaNativeContentGenerator(
    generatorConfig,
    config,
  );

  return new LoggingContentGenerator(baseGenerator, config, generatorConfig);
}
