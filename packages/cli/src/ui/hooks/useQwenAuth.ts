/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stub for useQwenAuth - not needed for Ollama.
 * Ollama doesn't use OAuth authentication.
 */

import type { AuthType } from '@ollama-code/ollama-code-core';

export interface QwenAuthState {
  deviceAuth: null;
  authStatus: string;
  authMessage: string | null;
}

export function useQwenAuth(
  _pendingAuthType: AuthType | undefined,
  _isAuthenticating: boolean,
): {
  qwenAuthState: QwenAuthState;
  cancelQwenAuth: () => void;
} {
  return {
    qwenAuthState: {
      deviceAuth: null,
      authStatus: 'not_applicable',
      authMessage: null,
    },
    cancelQwenAuth: () => {
      // No-op for Ollama
    },
  };
}

export type { QwenAuthState as QwenAuthStateType };
