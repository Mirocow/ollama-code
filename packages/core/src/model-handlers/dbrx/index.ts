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
 * DBRX model handler configuration.
 */
const dbrxConfig: ModelHandlerConfig = {
  modelPattern: /dbrx/i,
  displayName: 'DBRX',
  description: 'Databricks DBRX models',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 32768,
};

/**
 * Check if DBRX model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // DBRX Instruct - supports tools
  if (/dbrx[-_]?instruct/i.test(name)) return true;

  // Base DBRX with instruct tag
  if (/dbrx/i.test(name) && /instruct/i.test(name)) return true;

  // Base DBRX - limited tools
  return false;
}

/**
 * DBRX model handler.
 *
 * Supports Databricks DBRX models:
 * - dbrx (dbrx-instruct)
 *
 * DBRX is a large MoE model optimized for enterprise use with strong tool calling support.
 */
export const DbrxModelHandler = createModelHandler('dbrx', dbrxConfig, {
  supportsToolsFn: supportsTools,
});
