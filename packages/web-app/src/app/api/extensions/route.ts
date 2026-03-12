/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extensions API Route
 *
 * Manage extensions (similar to CLI ExtensionManager)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { getOllamaDir } from '@/lib/settings';

/**
 * Extension configuration
 */
export interface ExtensionConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  installed: boolean;
  author?: string;
  homepage?: string;
  commands?: string[];
  tools?: string[];
}

/**
 * Extensions config file path
 */
async function getExtensionsConfigPath(): Promise<string> {
  const dir = getOllamaDir();
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return join(dir, 'extensions.json');
}

/**
 * Load extensions from config
 */
export async function loadExtensions(): Promise<ExtensionConfig[]> {
  try {
    const configPath = await getExtensionsConfigPath();
    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.extensions || [];
    }
  } catch {
    // Ignore errors - return default extensions
  }

  // Return default built-in extensions
  return [
    {
      id: 'builtin-tools',
      name: 'Built-in Tools',
      version: '1.0.0',
      description: 'Core file, shell, and web tools',
      enabled: true,
      installed: true,
      author: 'Ollama Code',
      tools: [
        'read_file',
        'write_file',
        'edit_file',
        'execute_shell',
        'web_search',
        'web_fetch',
      ],
    },
    {
      id: 'git-tools',
      name: 'Git Tools',
      version: '1.0.0',
      description: 'Git integration tools for version control operations',
      enabled: true,
      installed: true,
      author: 'Ollama Code',
      tools: ['git_status', 'git_diff', 'git_log', 'git_commit'],
    },
    {
      id: 'memory-tools',
      name: 'Memory Tools',
      version: '1.0.0',
      description: 'Persistent memory for context across sessions',
      enabled: true,
      installed: true,
      author: 'Ollama Code',
      tools: ['save_memory', 'load_memory'],
    },
    {
      id: 'search-tools',
      name: 'Search Tools',
      version: '1.0.0',
      description: 'File and code search capabilities',
      enabled: true,
      installed: true,
      author: 'Ollama Code',
      tools: ['grep', 'glob', 'search_in_files'],
    },
  ];
}

/**
 * Save extensions to config
 */
export async function saveExtensions(
  extensions: ExtensionConfig[],
): Promise<void> {
  const configPath = await getExtensionsConfigPath();
  await writeFile(configPath, JSON.stringify({ extensions }, null, 2), 'utf-8');
}

/**
 * GET /api/extensions
 *
 * List all extensions
 */
export async function GET() {
  const extensions = await loadExtensions();
  return NextResponse.json({ extensions });
}

/**
 * POST /api/extensions
 *
 * Install a new extension
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const extensions = await loadExtensions();

    // Check if extension already exists
    const existing = extensions.find((e) => e.id === body.id);
    if (existing) {
      return NextResponse.json(
        { error: 'Extension already installed' },
        { status: 400 },
      );
    }

    const newExtension: ExtensionConfig = {
      id: body.id || Date.now().toString(),
      name: body.name,
      version: body.version || '1.0.0',
      description: body.description || '',
      enabled: true,
      installed: true,
      author: body.author,
      homepage: body.homepage,
      commands: body.commands || [],
      tools: body.tools || [],
    };

    extensions.push(newExtension);
    await saveExtensions(extensions);

    return NextResponse.json({ success: true, extension: newExtension });
  } catch {
    return NextResponse.json(
      { error: 'Failed to install extension' },
      { status: 500 },
    );
  }
}
