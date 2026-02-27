/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stub for useOllamaAuth - not needed for Ollama.
 * Ollama doesn't use OAuth authentication.
 */

import type { AuthType } from '@ollama-code/ollama-code-core';

export interface OllamaAuthState {
  deviceAuth: null;
  authStatus: string;
  authMessage: string | null;
}

export function useOllamaAuth(
  _pendingAuthType: AuthType | undefined,
  _isAuthenticating: boolean,
): {
  ollamaAuthState: OllamaAuthState;
  cancelOllamaAuth: () => void;
} {
  return {
    ollamaAuthState: {
      deviceAuth: null,
      authStatus: 'not_applicable',
      authMessage: null,
    },
    cancelOllamaAuth: () => {
      // No-op for Ollama
    },
  };
}

export type { OllamaAuthState as OllamaAuthStateType };
