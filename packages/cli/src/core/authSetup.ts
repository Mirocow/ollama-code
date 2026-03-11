/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified authentication and setup module.
 * Combines first-run detection, configuration management, and authentication logic.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type AuthType,
  type Config,
  getErrorMessage,
  logAuth,
  AuthEvent,
  getOllamaDir,
  DEFAULT_OLLAMA_MODEL,
} from '@ollama-code/ollama-code-core';

// ============================================================================
// Types
// ============================================================================

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Ollama server URL */
  baseUrl: string;
  /** Model name */
  model: string;
  /** Auth type (always 'ollama' for this implementation) */
  authType: AuthType;
}

/**
 * Result of setup operation
 */
export interface SetupResult {
  /** Whether the setup was successful */
  success: boolean;
  /** Configuration that was saved (if successful) */
  config?: AuthConfig;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Result of connection test
 */
export interface ConnectionTestResult {
  /** Whether the connection was successful */
  success: boolean;
  /** Available models (if successful) */
  models?: Array<{ name: string; modelId: string }>;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Result of authentication operation
 */
export interface AuthResult {
  /** Whether the authentication was successful */
  success: boolean;
  /** Error message (if failed) */
  error?: string;
}

// ============================================================================
// Configuration Management
// ============================================================================

/**
 * Normalize Ollama server URL.
 * Removes /v1 suffix if present (OpenAI-compatible path).
 * Ollama native API uses /api/chat, /api/generate etc. directly.
 */
export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/v1\/?$/, ''); // Remove trailing /v1 or /v1/
}

/**
 * Check if this is the first run.
 * Returns true if:
 * 1. No ~/.ollama-code directory exists, OR
 * 2. No settings.json exists, OR
 * 3. settings.json exists but security.auth.selectedType is not set
 * 4. settings.json exists but model.name is not set
 * 5. settings.json exists but security.auth.baseUrl is not set
 * @returns true if this is the first run (no complete configuration exists)
 */
export function isFirstRun(): boolean {
  const globalOllamaDir = getOllamaDir();

  // Check if directory exists
  if (!fs.existsSync(globalOllamaDir)) {
    return true;
  }

  // Check if settings.json exists
  const settingsPath = path.join(globalOllamaDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    return true;
  }

  // Check if configuration is complete
  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content) as Record<string, unknown>;

    // Check for model.name
    const model = settings['model'];
    if (typeof model !== 'object' || model === null) {
      return true; // Model section not configured
    }
    const modelName = (model as Record<string, unknown>)['name'];
    if (typeof modelName !== 'string' || modelName.trim() === '') {
      return true; // Model name not configured
    }

    // Check for security.auth.selectedType
    const security = settings['security'];
    if (typeof security !== 'object' || security === null) {
      return true; // Security section not configured
    }
    const auth = (security as Record<string, unknown>)['auth'];
    if (typeof auth !== 'object' || auth === null) {
      return true; // Auth section not configured
    }
    const selectedType = (auth as Record<string, unknown>)['selectedType'];
    if (typeof selectedType !== 'string') {
      return true; // Auth type not configured
    }

    // Check for security.auth.baseUrl
    const baseUrl = (auth as Record<string, unknown>)['baseUrl'];
    if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
      return true; // Base URL not configured
    }

    return false; // All required fields are configured
  } catch {
    // If parsing fails, consider it first run
    return true;
  }
}

/**
 * Get the current authentication configuration.
 * @returns Current configuration or null if not configured
 */
export function getCurrentConfig(): AuthConfig | null {
  const globalOllamaDir = getOllamaDir();
  const settingsPath = path.join(globalOllamaDir, 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content) as Record<string, unknown>;

    const model = settings['model'];
    const security = settings['security'];
    
    if (typeof model !== 'object' || model === null) return null;
    if (typeof security !== 'object' || security === null) return null;
    
    const auth = (security as Record<string, unknown>)['auth'];
    if (typeof auth !== 'object' || auth === null) return null;

    const modelName = (model as Record<string, unknown>)['name'];
    const baseUrl = (auth as Record<string, unknown>)['baseUrl'];
    const selectedType = (auth as Record<string, unknown>)['selectedType'];

    if (
      typeof modelName !== 'string' ||
      typeof baseUrl !== 'string' ||
      typeof selectedType !== 'string'
    ) {
      return null;
    }

    return {
      baseUrl,
      model: modelName,
      authType: selectedType as AuthType,
    };
  } catch {
    return null;
  }
}

/**
 * Create the global configuration directory.
 */
export function createGlobalConfigDir(): void {
  const globalOllamaDir = getOllamaDir();
  if (!fs.existsSync(globalOllamaDir)) {
    fs.mkdirSync(globalOllamaDir, { recursive: true });
  }
}

/**
 * Save authentication configuration.
 * @param config Configuration to save
 * @returns Setup result
 */
export function saveAuthConfig(config: AuthConfig): SetupResult {
  try {
    createGlobalConfigDir();

    const globalOllamaDir = getOllamaDir();
    const settingsPath = path.join(globalOllamaDir, 'settings.json');

    // Normalize the base URL
    const normalizedBaseUrl = normalizeBaseUrl(config.baseUrl);

    // Read existing settings or create new
    let settings: Record<string, unknown> = {};
    if (fs.existsSync(settingsPath)) {
      try {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        settings = JSON.parse(content);
      } catch {
        // If parsing fails, start fresh
        settings = {};
      }
    }

    // Set model configuration
    if (!settings['model']) {
      settings['model'] = {};
    }
    if (typeof settings['model'] === 'object' && settings['model'] !== null) {
      (settings['model'] as Record<string, unknown>)['name'] = config.model;
    }

    // Set security/auth configuration
    if (!settings['security']) {
      settings['security'] = {};
    }
    if (
      typeof settings['security'] === 'object' &&
      settings['security'] !== null
    ) {
      if (!(settings['security'] as Record<string, unknown>)['auth']) {
        (settings['security'] as Record<string, unknown>)['auth'] = {};
      }
      const auth = (settings['security'] as Record<string, unknown>)['auth'];
      if (typeof auth === 'object' && auth !== null) {
        (auth as Record<string, unknown>)['baseUrl'] = normalizedBaseUrl;
        (auth as Record<string, unknown>)['selectedType'] = config.authType;
      }
    }

    // Add version
    settings['$version'] = 3;

    // Write settings
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

    return {
      success: true,
      config: {
        ...config,
        baseUrl: normalizedBaseUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Save initial configuration for first run (backward compatible wrapper).
 * @param baseUrl Ollama server URL (OLLAMA_HOST)
 * @param model Model name (OLLAMA_MODEL)
 */
export function saveInitialConfig(baseUrl: string, model: string): void {
  const result = saveAuthConfig({
    baseUrl,
    model,
    authType: 'ollama' as AuthType,
  });
  if (!result.success) {
    throw new Error(result.error || 'Failed to save configuration');
  }
}

/**
 * Set environment variables from configuration.
 * This allows the rest of the app to use process.env
 * @param baseUrl Ollama server URL
 * @param model Model name
 */
export function setConfigEnv(baseUrl: string, model: string): void {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!process.env['OLLAMA_HOST'] && !process.env['OLLAMA_BASE_URL']) {
    process.env['OLLAMA_HOST'] = normalizedBaseUrl;
    process.env['OLLAMA_BASE_URL'] = normalizedBaseUrl;
  }
  if (!process.env['OLLAMA_MODEL']) {
    process.env['OLLAMA_MODEL'] = model;
  }
}

// ============================================================================
// Connection Testing
// ============================================================================

/**
 * Test connection to Ollama server and get available models.
 * @param baseUrl Ollama server URL
 * @returns Connection test result
 */
export async function testConnection(
  baseUrl: string,
): Promise<ConnectionTestResult> {
  try {
    const normalizedUrl = normalizeBaseUrl(baseUrl);
    const response = await fetch(`${normalizedUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Server returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const models = (data.models || []).map((m) => ({
      name: m.name,
      modelId: m.name,
    }));

    return {
      success: true,
      models,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// ============================================================================
// Authentication
// ============================================================================

/**
 * Perform initial authentication flow.
 * For Ollama, this is primarily about verifying the connection.
 * @param config The application config
 * @param authType The selected auth type
 * @returns Auth result
 */
export async function performAuth(
  appConfig: Config,
  authType: AuthType | undefined,
): Promise<AuthResult> {
  if (!authType) {
    return { success: true };
  }

  try {
    await appConfig.refreshAuth(authType, true);

    // Log authentication success
    const authEvent = new AuthEvent(authType, 'auto', 'success');
    logAuth(appConfig, authEvent);

    return { success: true };
  } catch (e) {
    const errorMessage = `Failed to login. Message: ${getErrorMessage(e)}`;

    // Log authentication failure
    const authEvent = new AuthEvent(authType, 'auto', 'error', errorMessage);
    logAuth(appConfig, authEvent);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Perform initial authentication (backward compatible wrapper).
 * @param config The application config
 * @param authType The selected auth type
 * @returns An error message if authentication fails, otherwise null
 */
export async function performInitialAuth(
  config: Config,
  authType: AuthType | undefined,
): Promise<string | null> {
  const result = await performAuth(config, authType);
  return result.error || null;
}

// ============================================================================
// Complete Setup Flow
// ============================================================================

/**
 * Complete setup result
 */
export interface CompleteSetupResult {
  /** Whether setup was successful */
  success: boolean;
  /** Saved configuration */
  config?: AuthConfig;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Perform complete setup flow:
 * 1. Save configuration
 * 2. Set environment variables
 * @param baseUrl Ollama server URL
 * @param model Model name
 * @returns Complete setup result
 */
export function completeSetup(
  baseUrl: string,
  model: string,
): CompleteSetupResult {
  const config: AuthConfig = {
    baseUrl,
    model,
    authType: 'ollama' as AuthType,
  };

  const saveResult = saveAuthConfig(config);
  if (!saveResult.success) {
    return {
      success: false,
      error: saveResult.error,
    };
  }

  setConfigEnv(baseUrl, model);

  return {
    success: true,
    config: saveResult.config,
  };
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default Ollama server URL
 */
export const DEFAULT_BASE_URL = 'http://localhost:11434';

/**
 * Get default configuration
 */
export function getDefaultConfig(): AuthConfig {
  return {
    baseUrl: DEFAULT_BASE_URL,
    model: DEFAULT_OLLAMA_MODEL,
    authType: 'ollama' as AuthType,
  };
}
