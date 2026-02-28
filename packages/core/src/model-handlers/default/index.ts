/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createModelHandler,
  type ModelHandlerConfig,
} from '../baseModelHandler.js';

/**
 * Default model handler configuration.
 */
const defaultConfig: ModelHandlerConfig = {
  modelPattern: /.*/, // Matches any model
  displayName: 'Default',
  description: 'Default handler with common tool call formats',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
  supportsTools: false, // Unknown models - assume no tool support
};

/**
 * Check if unknown model supports tools.
 * Uses conservative approach - return false by default.
 */
function supportsTools(modelName: string): boolean {
  // Known tool-capable models that might not have specific handlers
  const knownToolPatterns = [
    /command[-_]?r/i, // Command-R models
    /gemma[-_]?2/i, // Gemma 2 supports tools
    /phi[-_]?3/i, // Phi-3 supports tools
    /claude/i, // Claude models (via API)
    /gpt[-_]?[34]/i, // GPT models (via API)
  ];

  for (const pattern of knownToolPatterns) {
    if (pattern.test(modelName)) {
      return true;
    }
  }

  // Unknown model - assume no tool support
  // The caller can still try to use tools and parse from text
  return false;
}

/**
 * Default model handler.
 *
 * This handler is used when no specific model handler matches.
 * It includes parsers for all common tool call formats.
 */
export const DefaultModelHandler = createModelHandler(
  'default',
  defaultConfig,
  {
    supportsToolsFn: supportsTools,
  },
);
