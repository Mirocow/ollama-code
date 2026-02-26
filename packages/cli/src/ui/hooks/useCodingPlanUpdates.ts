/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stub for useCodingPlanUpdates - not needed for Ollama.
 * Coding Plan was a Qwen-specific feature.
 */

import type { AuthType, Config } from '@qwen-code/qwen-code-core';

export function useCodingPlanUpdates(
  _config: Config,
  _authType: AuthType | undefined,
  _settings: unknown,
): void {
  // No-op for Ollama
  // Coding Plan updates were specific to Qwen OAuth
}

export type { AuthType };
