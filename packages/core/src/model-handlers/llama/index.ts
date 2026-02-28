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
 * Llama model handler configuration.
 */
const llamaConfig: ModelHandlerConfig = {
  modelPattern: /llama|codellama/i,
  displayName: 'Llama',
  description: 'Meta Llama models (llama3.1, llama3.2, llama3.3, codellama)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 128000, // llama3.1
};

/**
 * Check if Llama model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Llama 3.1+ - all support tools (native function calling)
  if (/llama[-_]?3[._]?[123]/i.test(name)) return true;

  // Llama 3 - base model may not, instruct variant does
  if (/llama[-_]?3(?![-._]?[123])/i.test(name)) {
    return /instruct/i.test(name);
  }

  // Code Llama - supports tools for code generation
  if (/codellama|code[-_]?llama/i.test(name)) return true;

  // Llama 2 - instruct variants support tools
  if (/llama[-_]?2/i.test(name)) {
    return /instruct|chat/i.test(name);
  }

  // Generic llama - check for instruct/chat tags
  if (/llama/i.test(name)) {
    return /instruct|chat/i.test(name);
  }

  return false;
}

/**
 * Llama model handler.
 *
 * Supports Meta Llama models:
 * - llama3.1 (8B, 70B, 405B)
 * - llama3.2 (1B, 3B, 11B, 90B)
 * - llama3.3 (70B)
 * - codellama (7B, 13B, 34B)
 *
 * Llama 3.1+ models have native function calling support.
 */
export const LlamaModelHandler = createModelHandler('llama', llamaConfig, {
  supportsToolsFn: supportsTools,
});
