/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@ollama-code/ollama-code-core';
/**
 * Validate that the required credentials and configuration exist for the given auth method.
 * For Ollama, no API key is required for local instances.
 */
export declare function validateAuthMethod(authMethod: string, config?: Config): string | null;
