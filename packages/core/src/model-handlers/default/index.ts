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
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler is a fallback that can parse common tool call formats.
 */
const defaultConfig: ModelHandlerConfig = {
  modelPattern: /.*/, // Matches any model
  displayName: 'Default',
  description: 'Default handler with common tool call formats',
  supportsStructuredToolCalls: false,
  supportsTextToolCalls: true,
};

/**
 * Default model handler.
 *
 * This handler is used when no specific model handler matches.
 * It includes parsers for all common tool call formats.
 *
 * Unknown models will use model-definitions for capability detection.
 */
export const DefaultModelHandler = createModelHandler('default', defaultConfig);
