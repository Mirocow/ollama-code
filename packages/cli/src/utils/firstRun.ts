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
 * @returns true if this is the first run (no auth configuration exists)
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
  
  // Check if authType is configured
  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content);
    
    // Check for security.auth.selectedType
    const authType = (settings as Record<string, unknown>)?.security as Record<string, unknown> | undefined;
    const selectedType = authType?.auth as Record<string, unknown> | undefined;
    
    // If selectedType is not set, this is first run
    if (!selectedType?.selectedType) {
      return true;
    }
    
    return false;
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
 * Save initial configuration for first run
 * @param baseUrl Ollama server URL (OLLAMA_HOST)
 * @param model Model name (OLLAMA_MODEL)
 */
export function saveInitialConfig(baseUrl: string, model: string): void {
  createGlobalConfigDir();

  const settingsPath = Storage.getGlobalSettingsPath();

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
  if (typeof settings['security'] === 'object' && settings['security'] !== null) {
    if (!(settings['security'] as Record<string, unknown>)['auth']) {
      (settings['security'] as Record<string, unknown>)['auth'] = {};
    }
    const auth = (settings['security'] as Record<string, unknown>)['auth'];
    if (typeof auth === 'object' && auth !== null) {
      (auth as Record<string, unknown>)['baseUrl'] = baseUrl;
      (auth as Record<string, unknown>)['selectedType'] = 'USE_OLLAMA';
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
  if (!process.env['OLLAMA_HOST'] && !process.env['OLLAMA_BASE_URL']) {
    process.env['OLLAMA_HOST'] = baseUrl;
    process.env['OLLAMA_BASE_URL'] = baseUrl;
  }
  if (!process.env['OLLAMA_MODEL']) {
    process.env['OLLAMA_MODEL'] = model;
  }
}
