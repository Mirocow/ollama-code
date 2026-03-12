/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Models API Route
 *
 * Fetches available models from Ollama server.
 */

import { NextResponse } from 'next/server';
import { readFile, existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);
const SETTINGS_FILE = join(process.cwd(), '.ollama-code', 'settings.json');

async function getOllamaUrl(): Promise<string> {
  // First try settings file
  try {
    if (existsSync(SETTINGS_FILE)) {
      const content = await readFileAsync(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(content);
      if (settings.ollamaUrl) {
        return settings.ollamaUrl;
      }
    }
  } catch (error) {
    console.error('Failed to read settings:', error);
  }
  // Fall back to environment variable
  return process.env.OLLAMA_URL || 'http://localhost:11434';
}

/**
 * GET /api/models
 *
 * Returns list of available Ollama models
 */
export async function GET() {
  try {
    const ollamaUrl = await getOllamaUrl();
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Ollama returned ${response.status}`, models: [] },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Ollama server', models: [] },
      { status: 503 },
    );
  }
}
