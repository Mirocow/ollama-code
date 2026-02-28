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
 */
const phiConfig: ModelHandlerConfig = {
  modelPattern: /phi/i,
  displayName: 'Phi',
  description: 'Microsoft Phi models (phi-2, phi-3, phi-4)',
  supportsStructuredToolCalls: true,
  supportsTextToolCalls: true,
  supportsTools: false, // Determined per model
  maxContextLength: 128000, // phi-3-medium
};

/**
 * Check if Phi model supports tools.
 */
function supportsTools(modelName: string): boolean {
  const name = modelName.toLowerCase();

  // Phi-4 - excellent tool calling
  if (/phi[-_]?4/i.test(name)) return true;

  // Phi-3.5 - supports tools
  if (/phi[-_]?3\.?5/i.test(name)) return true;

  // Phi-3 mini/small/medium - support tools
  if (/phi[-_]?3/i.test(name)) return true;

  // Phi-2 - no native tool support
  if (/phi[-_]?2/i.test(name)) return false;

  return false;
}

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
  supportsToolsFn: supportsTools,
});
