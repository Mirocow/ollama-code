/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stub for useCodingPlanUpdates - not needed for Ollama.
 * Coding Plan was a Ollama-specific feature.
 */

import type { AuthType, Config } from '@ollama-code/ollama-code-core';

export function useCodingPlanUpdates(
  _config: Config,
  _authType: AuthType | undefined,
  _settings: unknown,
): void {
  // No-op for Ollama
  // Coding Plan updates were specific to Ollama OAuth
}

export type { AuthType };
