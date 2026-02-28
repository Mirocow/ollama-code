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
 */
const graniteConfig: ModelHandlerConfig = {
  modelPattern: /granite/i,
  displayName: 'Granite',
  description: 'IBM Granite models',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 128000,
};

/**
 * Check if Granite model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Granite Code - supports tools for code tasks
  if (/granite[-_]?code/i.test(name)) return true;

  // Granite Instruct - supports tools
  if (/granite[-_]?instruct/i.test(name)) return true;

  // Granite 3.0+ - supports tools
  if (/granite[-_]?3/i.test(name)) return true;

  // Granite with instruct tag
  if (/granite/i.test(name) && /instruct/i.test(name)) return true;

  // Base Granite - no tools
  return false;
}

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
export const GraniteModelHandler = createModelHandler(
  'granite',
  graniteConfig,
  {
    supportsToolsFn: supportsTools,
  },
);
