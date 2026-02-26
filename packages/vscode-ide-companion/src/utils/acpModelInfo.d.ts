/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ModelInfo } from '../types/acpTypes.js';
/**
 * SessionModelState as returned from ACP session/new.
 */
export interface SessionModelState {
    availableModels: ModelInfo[];
    currentModelId: string;
}
/**
 * Extract complete model state from ACP `session/new` result.
 *
 * Returns both the list of available models and the current model ID.
 */
export declare const extractSessionModelState: (result: unknown) => SessionModelState | null;
/**
 * Extract model info from ACP `session/new` result.
 *
 * Per Agent Client Protocol draft schema, NewSessionResponse includes `models`.
 * We also accept legacy shapes for compatibility.
 */
export declare const extractModelInfoFromNewSessionResult: (result: unknown) => ModelInfo | null;
