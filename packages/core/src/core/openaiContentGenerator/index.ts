/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import { OpenAIContentGenerator } from './openaiContentGenerator.js';
import {
  OllamaOpenAICompatibleProvider,
  type OpenAICompatibleProvider,
} from './provider/index.js';

export { OpenAIContentGenerator } from './openaiContentGenerator.js';
export { ContentGenerationPipeline, type PipelineConfig } from './pipeline.js';

export {
  type OpenAICompatibleProvider,
  OllamaOpenAICompatibleProvider,
} from './provider/index.js';

export { OpenAIContentConverter } from './converter.js';

/**
 * Create an OpenAI-compatible content generator with Ollama provider
 */
export function createOpenAIContentGenerator(
  contentGeneratorConfig: ContentGeneratorConfig,
  cliConfig: Config,
): ContentGenerator {
  const provider = determineProvider(contentGeneratorConfig, cliConfig);
  return new OpenAIContentGenerator(
    contentGeneratorConfig,
    cliConfig,
    provider,
  );
}

/**
 * Determine the appropriate provider based on configuration
 * Only Ollama is supported in this version
 */
export function determineProvider(
  contentGeneratorConfig: ContentGeneratorConfig,
  cliConfig: Config,
): OpenAICompatibleProvider {
  // Always use Ollama provider
  return new OllamaOpenAICompatibleProvider(
    contentGeneratorConfig,
    cliConfig,
  );
}

export { type ErrorHandler, EnhancedErrorHandler } from './errorHandler.js';
