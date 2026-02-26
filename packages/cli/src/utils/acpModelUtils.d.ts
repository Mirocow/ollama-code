/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '@ollama-code/ollama-code-core';
/**
 * ACP model IDs are represented as `${modelId}(${authType})` in the ACP protocol.
 */
export declare function formatAcpModelId(modelId: string, authType: AuthType): string;
/**
 * Extracts the base model id from an ACP model id string.
 *
 * If the string ends with `(...)`, the suffix is removed; otherwise returns the
 * trimmed input as-is.
 */
export declare function parseAcpBaseModelId(value: string): string;
/**
 * Parses an ACP model option string into `{ modelId, authType? }`.
 *
 * Supports the following formats:
 * - `${modelId}(${authType})` - Standard registry model (e.g., "llama3.2(USE_OLLAMA)")
 * - `${snapshotId}(${authType})` - Runtime model snapshot (e.g., "$runtime|USE_OLLAMA|llama3.2(USE_OLLAMA)")
 *   where snapshotId is in format `$runtime|${authType}|${modelId}`
 * - Plain model ID - Returns as-is with no authType
 *
 * If the string ends with `(...)` and `...` is a valid `AuthType`, returns both;
 * otherwise returns the trimmed input as `modelId` only.
 */
export declare function parseAcpModelOption(input: string): {
    modelId: string;
    authType?: AuthType;
};
