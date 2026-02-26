/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AuthMethod } from './schema.js';
export declare function buildAuthMethods(): AuthMethod[];
export declare function filterAuthMethodsById(authMethods: AuthMethod[], authMethodId: string): AuthMethod[];
export declare function pickAuthMethodsForDetails(_details?: string): AuthMethod[];
