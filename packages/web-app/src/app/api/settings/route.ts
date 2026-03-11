/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Settings API Route
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const SETTINGS_FILE = join(process.cwd(), '.ollama-code', 'settings.json');

interface Settings {
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

const defaultSettings: Settings = {
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
  const dir = join(process.cwd(), '.ollama-code');
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * GET /api/settings
 * Get current settings
 */
export async function GET() {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const content = await readFile(SETTINGS_FILE, 'utf-8');
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
 * Update settings
 */
export async function PUT(request: NextRequest) {
  try {
    const newSettings = await request.json();
    await ensureSettingsDir();
    await writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
