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
 * Command model handler configuration.
 */
const commandConfig: ModelHandlerConfig = {
  modelPattern: /command/i,
  displayName: 'Command',
  description: 'Cohere Command models (command-r, command-r-plus)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 128000, // command-r-plus
};

/**
 * Check if Command model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Command-R Plus - best tool calling
  if (/command[-_]?r[-_]?plus/i.test(name)) return true;

  // Command-R - optimized for tools
  if (/command[-_]?r/i.test(name)) return true;

  // Command (base) - supports tools but not optimized
  if (/command$/i.test(name) || /command-light/i.test(name)) {
    return true;
  }

  // Default for Command family
  return true;
}

/**
 * Command model handler.
 *
 * Supports Cohere Command models:
 * - command-r (optimized for RAG and tools)
 * - command-r-plus (larger, better tool calling)
 * - command (general purpose)
 *
 * Command-R models are specifically designed for tool use and RAG.
 */
export const CommandModelHandler = createModelHandler(
  'command',
  commandConfig,
  {
    supportsToolsFn: supportsTools,
  },
);
