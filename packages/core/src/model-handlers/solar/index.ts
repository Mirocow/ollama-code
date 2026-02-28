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
 */
const solarConfig: ModelHandlerConfig = {
  modelPattern: /solar/i,
  displayName: 'Solar',
  description: 'Upstage Solar models (solar-10.7b, solar-pro)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: true,
  maxContextLength: 32768,
};

/**
 * Check if Solar model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Solar Pro - supports tools
  if (/solar[-_]?pro/i.test(name)) return true;

  // Solar 10.7B instruct - supports tools
  if (/solar[-_]?10\.?7/i.test(name)) {
    return /instruct/i.test(name);
  }

  // Base Solar models - check for instruct
  return /instruct/i.test(name);
}

/**
 * Solar model handler.
 *
 * Supports Upstage Solar models:
 * - solar-10.7b
 * - solar-pro
 *
 * Solar models are optimized for Korean and English, with good tool calling support.
 */
export const SolarModelHandler = createModelHandler('solar', solarConfig, {
  supportsToolsFn: supportsTools,
});
