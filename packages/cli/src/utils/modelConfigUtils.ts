/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthType,
  type ContentGeneratorConfig,
  type ContentGeneratorConfigSources,
  resolveModelConfig,
  type ModelConfigSourcesInput,
  type ProviderModelConfig,
} from '@ollama-code/ollama-code-core';
import type { Settings } from '../config/settings.js';
import { writeStderrLine } from './stdioHelpers.js';

/**
 * Normalize Ollama server URL
 * Removes /v1 suffix if present (OpenAI-compatible path)
 * Ollama native API uses /api/chat, /api/generate etc. directly
 */
function normalizeBaseUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.replace(/\/v1\/?$/, '');
}

export interface CliGenerationConfigInputs {
  argv: {
    model?: string | undefined;
    ollamaApiKey?: string | undefined;
    ollamaBaseUrl?: string | undefined;
  };
  settings: Settings;
  selectedAuthType: AuthType | undefined;
  /**
   * Injectable env for testability. Defaults to process.env at callsites.
   */
  env?: Record<string, string | undefined>;
}

export interface ResolvedCliGenerationConfig {
  /** The resolved model id (may be empty string if not resolvable at CLI layer) */
  model: string;
  /** API key for Ollama auth (optional for local instances) */
  apiKey: string;
  /** Base URL for Ollama API */
  baseUrl: string;
  /** The full generation config to pass to core Config */
  generationConfig: Partial<ContentGeneratorConfig>;
  /** Source attribution for each resolved field */
  sources: ContentGeneratorConfigSources;
}

export function getAuthTypeFromEnv(): AuthType | undefined {
  // Ollama is the only supported auth type
  // Check for Ollama environment variables - this indicates explicit configuration
  if (process.env['OLLAMA_BASE_URL'] || process.env['OLLAMA_HOST']) {
    return AuthType.USE_OLLAMA;
  }

  // Return undefined if no explicit env vars are set
  // This allows the auth dialog to show for first-time users
  return undefined;
}

/**
 * Unified resolver for CLI generation config.
 *
 * Precedence (for Ollama auth):
 * - model: argv.model > OLLAMA_MODEL > settings.model.name
 * - apiKey: argv.ollamaApiKey > OLLAMA_API_KEY > settings.security.auth.apiKey
 * - baseUrl: argv.ollamaBaseUrl > OLLAMA_BASE_URL > settings.security.auth.baseUrl
 */
export function resolveCliGenerationConfig(
  inputs: CliGenerationConfigInputs,
): ResolvedCliGenerationConfig {
  const { argv, settings, selectedAuthType } = inputs;
  const env = inputs.env ?? (process.env as Record<string, string | undefined>);

  // Check if we have any credentials configured (explicit configuration)
  // This determines whether to show the auth dialog on first run
  const hasExplicitConfiguration =
    argv.ollamaBaseUrl ||
    argv.ollamaApiKey ||
    argv.model ||
    settings.security?.auth?.baseUrl ||
    settings.security?.auth?.apiKey ||
    settings.model?.name ||
    env['OLLAMA_BASE_URL'] ||
    env['OLLAMA_HOST'] ||
    env['OLLAMA_API_KEY'] ||
    env['OLLAMA_MODEL'];

  // Only set authType if we have explicit configuration or it was explicitly provided
  // This allows the auth dialog to show for first-time users without configuration
  const authType =
    selectedAuthType ||
    (hasExplicitConfiguration ? AuthType.USE_OLLAMA : undefined);

  // Find modelProvider from settings.modelProviders based on authType and model
  let modelProvider: ProviderModelConfig | undefined;
  if (authType && settings.modelProviders) {
    const providers = settings.modelProviders[authType];
    if (providers && Array.isArray(providers)) {
      // Try to find by requested model (from CLI or settings)
      const requestedModel = argv.model || settings.model?.name;
      if (requestedModel) {
        modelProvider = providers.find((p) => p.id === requestedModel) as
          | ProviderModelConfig
          | undefined;
      }
    }
  }

  const configSources: ModelConfigSourcesInput = {
    authType,
    cli: {
      model: argv.model,
      apiKey: argv.ollamaApiKey,
      baseUrl: normalizeBaseUrl(argv.ollamaBaseUrl),
    },
    settings: {
      model: settings.model?.name,
      apiKey: settings.security?.auth?.apiKey,
      baseUrl: normalizeBaseUrl(settings.security?.auth?.baseUrl),
      generationConfig: settings.model?.generationConfig as
        | Partial<ContentGeneratorConfig>
        | undefined,
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
  const generationConfig: Partial<ContentGeneratorConfig> = {
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
