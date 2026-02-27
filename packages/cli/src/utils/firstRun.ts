/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import { Storage } from '@ollama-code/ollama-code-core';

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
  const globalOllamaDir = Storage.getGlobalOllamaDir();

  // Check if directory exists
  if (!fs.existsSync(globalOllamaDir)) {
    return true;
  }

  // Check if settings.json exists
  const settingsPath = Storage.getGlobalSettingsPath();
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
 * Create the global configuration directory
 */
export function createGlobalConfigDir(): void {
  const globalOllamaDir = Storage.getGlobalOllamaDir();
  if (!fs.existsSync(globalOllamaDir)) {
    fs.mkdirSync(globalOllamaDir, { recursive: true });
  }
}

/**
 * Normalize Ollama server URL
 * Removes /v1 suffix if present (OpenAI-compatible path)
 * Ollama native API uses /api/chat, /api/generate etc. directly
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/v1\/?$/, ''); // Remove trailing /v1 or /v1/
}

/**
 * Save initial configuration for first run
 * @param baseUrl Ollama server URL (OLLAMA_HOST)
 * @param model Model name (OLLAMA_MODEL)
 */
export function saveInitialConfig(baseUrl: string, model: string): void {
  createGlobalConfigDir();

  const settingsPath = Storage.getGlobalSettingsPath();

  // Normalize the base URL
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

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

  // Set Ollama configuration
  // Store in settings.json with proper structure
  if (!settings['model']) {
    settings['model'] = {};
  }
  if (typeof settings['model'] === 'object' && settings['model'] !== null) {
    (settings['model'] as Record<string, unknown>)['name'] = model;
  }

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
      (auth as Record<string, unknown>)['selectedType'] = 'ollama';
    }
  }

  // Add version
  settings['$version'] = 3;

  // Write settings
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * Set environment variables from configuration
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
