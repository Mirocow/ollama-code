/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Backward compatibility re-exports from the unified authSetup module.
 * @deprecated Import directly from './authSetup.js' instead.
 */

export {
  performInitialAuth,
  performAuth,
  // Types
  type AuthConfig,
  type AuthResult,
} from './authSetup.js';
