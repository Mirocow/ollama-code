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
 * Solar model handler configuration.
 *
 * Note: Capabilities (tools, thinking, vision) are defined in model-definitions.
 * This handler focuses on parsing tool calls from text output.
 */
const solarConfig: ModelHandlerConfig = {
  modelPattern: /solar/i,
  displayName: 'Solar',
  description: 'Upstage Solar models (solar-10.7b, solar-pro)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  maxContextLength: 32768,
};

/**
 * Solar model handler.
 *
 * Supports Upstage Solar models:
 * - solar-10.7b
 * - solar-pro
 *
 * Solar models are optimized for Korean and English, with good tool calling support.
 */
export const SolarModelHandler = createModelHandler('solar', solarConfig);
