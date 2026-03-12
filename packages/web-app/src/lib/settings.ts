/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Settings utilities for reading from ~/.ollama-code/settings.json
 *
 * This module provides functions to read settings from the global
 * Ollama Code settings file, which is the same location used by
 * the CLI and core packages.
 */

import { readFile } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);

/**
 * Get the global Ollama Code directory (~/.ollama-code/)
 */
export function getOllamaDir(): string {
  const homeDir = homedir();
  if (!homeDir) {
    // Fallback to current working directory if home is not available
    return join(process.cwd(), '.ollama-code');
  }
  return join(homeDir, '.ollama-code');
}

/**
 * Get the global settings file path (~/.ollama-code/settings.json)
 */
export function getSettingsPath(): string {
  return join(getOllamaDir(), 'settings.json');
}

/**
 * Settings interface
 */
export interface Settings {
  ollamaUrl?: string;
  defaultModel?: string;
  theme?: string;
  language?: string;
  approvalMode?: string;
  contextWindow?: number;
  maxTokens?: number;
  temperature?: number;
  enableTools?: boolean;
  enableMcp?: boolean;
  trustedFolders?: string[];
  [key: string]: unknown;
}

/**
 * Read settings from ~/.ollama-code/settings.json
 */
export async function readSettings(): Promise<Settings | null> {
  const settingsPath = getSettingsPath();
  try {
    if (existsSync(settingsPath)) {
      const content = await readFileAsync(settingsPath, 'utf-8');
      return JSON.parse(content) as Settings;
    }
  } catch (error) {
    console.error('Failed to read settings:', error);
  }
  return null;
}

/**
 * Get Ollama URL from settings or environment variable
 */
export async function getOllamaUrl(): Promise<string> {
  const settings = await readSettings();
  if (settings?.ollamaUrl) {
    return settings.ollamaUrl;
  }
  return process.env.OLLAMA_URL || 'http://localhost:11434';
}

/**
 * Get default model from settings
 */
export async function getDefaultModel(): Promise<string> {
  const settings = await readSettings();
  if (settings?.defaultModel) {
    return settings.defaultModel;
  }
  return 'llama3.2';
}
