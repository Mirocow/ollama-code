/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@ollama-code/ollama-code-core';
import type { AuthMethod } from './schema.js';

export function buildAuthMethods(): AuthMethod[] {
  return [
    {
      id: AuthType.USE_OLLAMA,
      name: 'Use Ollama',
      description:
        'Connect to local Ollama server (default: http://localhost:11434). No API key required for local instances.',
      type: 'terminal',
      args: ['--auth-type=ollama'],
    },
  ];
}

export function filterAuthMethodsById(
  authMethods: AuthMethod[],
  authMethodId: string,
): AuthMethod[] {
  return authMethods.filter((method) => method.id === authMethodId);
}

export function pickAuthMethodsForDetails(_details?: string): AuthMethod[] {
  // Only Ollama is supported, return all methods
  return buildAuthMethods();
}
