/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Settings API Route
 *
 * Reads settings from ~/.ollama-code/settings.json (global settings)
 * This is the same location used by the CLI and core packages.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { getOllamaDir, getSettingsPath, type Settings } from '@/lib/settings';

interface FullSettings extends Settings {
  ollamaUrl: string;
  defaultModel: string;
  theme: string;
  language: string;
  approvalMode: string;
  contextWindow: number;
  maxTokens: number;
  temperature: number;
  enableTools: boolean;
  enableMcp: boolean;
  trustedFolders: string[];
}

const defaultSettings: FullSettings = {
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  defaultModel: 'llama3.2',
  theme: 'dark',
  language: 'en',
  approvalMode: 'manual',
  contextWindow: 128000,
  maxTokens: 4096,
  temperature: 0.7,
  enableTools: true,
  enableMcp: true,
  trustedFolders: [],
};

async function ensureSettingsDir() {
  const dir = getOllamaDir();
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * GET /api/settings
 * Get current settings
 */
export async function GET() {
  const settingsPath = getSettingsPath();
  try {
    if (existsSync(settingsPath)) {
      const content = await readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      return NextResponse.json({ ...defaultSettings, ...settings });
    }
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Failed to read settings:', error);
    return NextResponse.json(defaultSettings);
  }
}

/**
 * PUT /api/settings
 * Update settings (merges with existing settings)
 */
export async function PUT(request: NextRequest) {
  const settingsPath = getSettingsPath();
  try {
    const newSettings = await request.json();

    // Read existing settings
    let existingSettings: Partial<FullSettings> = {};
    if (existsSync(settingsPath)) {
      try {
        const content = await readFile(settingsPath, 'utf-8');
        existingSettings = JSON.parse(content);
      } catch {
        // Ignore parse errors, start fresh
      }
    }

    // Merge with new settings (new settings take precedence)
    const mergedSettings = {
      ...defaultSettings,
      ...existingSettings,
      ...newSettings,
    };

    await ensureSettingsDir();
    await writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));
    return NextResponse.json({ success: true, settings: mergedSettings });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 },
    );
  }
}
