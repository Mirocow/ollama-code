/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WebSearchProviderConfig } from '@ollama-code/ollama-code-core';
import type { Settings } from './settings.js';

/**
 * CLI arguments related to web search configuration
 */
export interface WebSearchCliArgs {
  tavilyApiKey?: string;
  googleApiKey?: string;
  googleSearchEngineId?: string;
  webSearchDefault?: string;
}

/**
 * Web search configuration structure
 */
export interface WebSearchConfig {
  provider: WebSearchProviderConfig[];
  default: string;
}

/**
 * Build webSearch configuration from multiple sources with priority:
 * 1. settings.json (new format) - highest priority
 * 2. Command line args + environment variables
 * 3. Legacy tavilyApiKey (backward compatibility)
 * 4. google-scraper as fallback (no API key required)
 *
 * @param argv - Command line arguments
 * @param settings - User settings from settings.json
 * @returns WebSearch configuration or undefined if no providers available
 */
export function buildWebSearchConfig(
  argv: WebSearchCliArgs,
  settings: Settings,
  _authType?: string,
): WebSearchConfig | undefined {
  // Debug: log what we receive
  // console.error('[DEBUG] buildWebSearchConfig called');
  // console.error('[DEBUG] settings.webSearch:', JSON.stringify(settings.webSearch));
  // console.error('[DEBUG] argv:', JSON.stringify(argv));

  // Step 1: Collect providers from settings or command line/env
  let providers: WebSearchProviderConfig[] = [];
  let userDefault: string | undefined;

  if (settings.webSearch) {
    // Use providers from settings.json
    providers = [...settings.webSearch.provider];
    userDefault = settings.webSearch.default;
  } else {
    // Build providers from command line args and environment variables
    const tavilyKey =
      argv.tavilyApiKey ||
      settings.advanced?.tavilyApiKey ||
      process.env['TAVILY_API_KEY'];
    if (tavilyKey) {
      providers.push({
        type: 'tavily',
        apiKey: tavilyKey,
      } as WebSearchProviderConfig);
    }

    // Build providers from command line args and environment variables
    const googleKey = argv.googleApiKey || process.env['GOOGLE_API_KEY'];
    const googleEngineId =
      argv.googleSearchEngineId || process.env['GOOGLE_SEARCH_ENGINE_ID'];
    if (googleKey && googleEngineId) {
      providers.push({
        type: 'google',
        apiKey: googleKey,
        searchEngineId: googleEngineId,
      } as WebSearchProviderConfig);
    }
  }

  // Step 2: If no providers available, use google-scraper as fallback
  // This provides free web search without API key
  if (providers.length === 0) {
    providers.push({
      type: 'google-scraper',
    } as WebSearchProviderConfig);
  }

  // Step 3: Determine default provider
  // Priority: user explicit config > CLI arg > first available provider (tavily > google > google-scraper)
  const providerPriority: Array<'tavily' | 'google' | 'google-scraper'> = [
    'tavily',
    'google',
    'google-scraper',
  ];

  // Determine default provider based on availability
  let defaultProvider = userDefault || argv.webSearchDefault;
  if (!defaultProvider) {
    // Find first available provider by priority order
    for (const providerType of providerPriority) {
      if (providers.some((p) => p.type === providerType)) {
        defaultProvider = providerType;
        break;
      }
    }
    // Fallback to first available provider if none found in priority list
    if (!defaultProvider) {
      defaultProvider = providers[0]?.type || 'google-scraper';
    }
  }

  // At this point, defaultProvider is guaranteed to be a string
  // (either from user config, CLI arg, or fallback logic above)
  const result = {
    provider: providers,
    default: defaultProvider || 'google-scraper',
  };

  // console.error('[DEBUG] buildWebSearchConfig result:', JSON.stringify(result));
  return result;
}
