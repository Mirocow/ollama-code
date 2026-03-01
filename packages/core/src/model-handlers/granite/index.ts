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
 * Granite model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const graniteConfig: ModelHandlerConfig = {
  modelPattern: /granite/i,
  displayName: 'Granite',
  description: 'IBM Granite models',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 128000,
};

/**
 * Granite model handler.
 *
 * Supports IBM Granite models:
 * - granite-3b, granite-7b, granite-13b, granite-34b
 * - granite-code
 * - granite-instruct
 *
 * Granite models are enterprise-focused with strong tool calling support.
 */
export const GraniteModelHandler = createModelHandler('granite', graniteConfig);
