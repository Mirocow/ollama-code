/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createModelHandler,
  type ModelHandlerConfig,
} from '../baseModelHandler.js';
import { phiParsers } from './parsers.js';

/**
 * Phi model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const phiConfig: ModelHandlerConfig = {
  modelPattern: /phi/i,
  displayName: 'Phi',
  description: 'Microsoft Phi models (phi-2, phi-3, phi-4)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 128000,
};

/**
 * Phi model handler.
 *
 * Supports Microsoft Phi models:
 * - phi-2 (older, limited tool support)
 * - phi-3 (mini, small, medium)
 * - phi-3.5
 * - phi-4 (latest with improved tool calling)
 *
 * Phi-3 and later models have native function calling support.
 */
export const PhiModelHandler = createModelHandler('phi', phiConfig, {
  parsers: phiParsers,
});
