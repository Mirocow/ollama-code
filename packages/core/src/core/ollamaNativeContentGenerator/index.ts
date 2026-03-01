/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Native Ollama Content Generator module.
 * Provides direct integration with Ollama's native REST API endpoints.
 */

export { OllamaNativeContentGenerator } from './ollamaNativeContentGenerator.js';
export { OllamaContentConverter } from './converter.js';

import type { ContentGenerator, ContentGeneratorConfig } from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import { OllamaNativeContentGenerator } from './ollamaNativeContentGenerator.js';

/**
 * Create a native Ollama content generator.
 * Uses Ollama's native REST API (/api/chat, /api/generate) instead of
 * the OpenAI-compatible API.
 */
export function createOllamaNativeContentGenerator(
  contentGeneratorConfig: ContentGeneratorConfig,
  cliConfig: Config,
): ContentGenerator {
  return new OllamaNativeContentGenerator(contentGeneratorConfig, cliConfig);
}
