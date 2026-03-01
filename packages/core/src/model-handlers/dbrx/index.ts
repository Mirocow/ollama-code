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
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const dbrxConfig: ModelHandlerConfig = {
  modelPattern: /dbrx/i,
  displayName: 'DBRX',
  description: 'Databricks DBRX models',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 32768,
};

/**
 * DBRX model handler.
 *
 * Supports Databricks DBRX models:
 * - dbrx (dbrx-instruct)
 *
 * DBRX is a large MoE model optimized for enterprise use with strong tool calling support.
 */
export const DbrxModelHandler = createModelHandler('dbrx', dbrxConfig);
