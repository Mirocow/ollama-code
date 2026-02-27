/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import { Storage } from '@ollama-code/ollama-code-core';

/**
 * Check if this is the first run (no ~/.ollama-code directory exists)
 * @returns true if this is the first run
 */
export function isFirstRun(): boolean {
  const globalOllamaDir = Storage.getGlobalOllamaDir();
  return !fs.existsSync(globalOllamaDir);
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
