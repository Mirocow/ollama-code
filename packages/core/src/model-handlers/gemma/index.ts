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
 * Gemma model handler configuration.
 */
const gemmaConfig: ModelHandlerConfig = {
  modelPattern: /gemma/i,
  displayName: 'Gemma',
  description: 'Google Gemma models (gemma-2, gemma-3, codegemma)',
  supportsStructuredToolCalls: false, // Only Gemma 3 supports this
  supportsTextToolCalls: true,
  supportsTools: false, // Determined per model
  maxContextLength: 8192, // Varies by model (up to 32K for some)
};

/**
 * Check if Gemma model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Gemma 3 - supports tool calling
  if (/gemma[-_]?3/i.test(name)) return true;

  // CodeGemma - limited tool support for code tasks
  if (/codegemma/i.test(name)) return true;

  // Gemma 2 instruct - no native tools, but can follow format
  if (/gemma[-_]?2/i.test(name)) {
    return /it|instruct/i.test(name);
  }

  // Gemma 1 - no tool support
  return false;
}

/**
 * Gemma model handler.
 *
 * Supports Google Gemma models:
 * - gemma (gemma-2-2b, gemma-2-9b, gemma-2-27b)
 * - gemma-3 (latest generation)
 * - codegemma (code-focused variant)
 *
 * Gemma models have limited tool calling support:
 * - Gemma 2: No native tool calling (but can follow JSON format)
 * - Gemma 3: Added tool calling support
 * - CodeGemma: Limited tool calling for code tasks
 */
export const GemmaModelHandler = createModelHandler('gemma', gemmaConfig, {
  supportsToolsFn: supportsTools,
});
