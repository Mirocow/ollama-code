/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Backward compatibility re-exports from the unified authSetup module.
 * @deprecated Import directly from '../core/authSetup.js' instead.
 */

export {
  isFirstRun,
  createGlobalConfigDir,
  saveInitialConfig,
  setConfigEnv,
  normalizeBaseUrl,
  DEFAULT_BASE_URL,
  // Types
  type AuthConfig,
  type SetupResult,
  type ConnectionTestResult,
  type AuthResult,
  type CompleteSetupResult,
  // New functions
  getCurrentConfig,
  saveAuthConfig,
  testConnection,
  performAuth,
  performInitialAuth,
  completeSetup,
  getDefaultConfig,
} from '../core/authSetup.js';
