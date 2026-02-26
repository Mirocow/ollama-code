/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function useQwenAuth(_pendingAuthType, _isAuthenticating) {
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
//# sourceMappingURL=useQwenAuth.js.map