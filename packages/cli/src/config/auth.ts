/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType, type Config } from '@ollama-code/ollama-code-core';
import { loadEnvironment, loadSettings } from './settings.js';
import { t } from '../i18n/index.js';

/**
 * Validate that the required credentials and configuration exist for the given auth method.
 * For Ollama, no API key is required for local instances.
 */
export function validateAuthMethod(
  authMethod: string,
  _config?: Config,
): string | null {
  const settings = loadSettings();
  loadEnvironment(settings.merged);

  if (authMethod === AuthType.USE_OLLAMA) {
    // Ollama doesn't require an API key
    // The baseUrl (default: http://localhost:11434) is all that's needed
    return null;
  }

  return t('Invalid auth method selected. Only USE_OLLAMA is supported.');
}
