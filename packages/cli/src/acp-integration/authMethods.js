/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '@ollama-code/ollama-code-core';
export function buildAuthMethods() {
    return [
        {
            id: AuthType.USE_OLLAMA,
            name: 'Use Ollama',
            description: 'Connect to local Ollama server (default: http://localhost:11434). No API key required for local instances.',
            type: 'terminal',
            args: ['--auth-type=ollama'],
        },
    ];
}
export function filterAuthMethodsById(authMethods, authMethodId) {
    return authMethods.filter((method) => method.id === authMethodId);
}
export function pickAuthMethodsForDetails(_details) {
    // Only Ollama is supported, return all methods
    return buildAuthMethods();
}
//# sourceMappingURL=authMethods.js.map