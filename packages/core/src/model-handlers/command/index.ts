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
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const commandConfig: ModelHandlerConfig = {
  modelPattern: /command/i,
  displayName: 'Command',
  description: 'Cohere Command models (command-r, command-r-plus)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 128000,
};

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
export const CommandModelHandler = createModelHandler('command', commandConfig);
