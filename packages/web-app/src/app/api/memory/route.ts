/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Memory API Route
 *
 * Provides access to hierarchical memory (OLLAMA.md files)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';

/**
 * Memory file info
 */
interface MemoryFileInfo {
  path: string;
  relativePath: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
}

/**
 * Memory content response
 */
interface MemoryContentResponse {
  content: string;
  files: MemoryFileInfo[];
  fileCount: number;
}

/**
 * Ollama config directory
 */
const OLLAMA_DIR = '.ollama-code';

/**
 * Memory filenames to look for
 */
const MEMORY_FILES = ['OLLAMA.md', 'GEMINI.md', 'CLAUDE.md'];

/**
 * GET /api/memory
 *
 * Get hierarchical memory content
 * Query params:
 * - cwd: working directory (defaults to process.cwd())
 * - path: specific file path to read
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cwd = searchParams.get('cwd') || process.cwd();
    const specificPath = searchParams.get('path');

    // If specific path provided, read that file
    if (specificPath) {
      try {
        const content = await fs.readFile(specificPath, 'utf-8');
        return NextResponse.json({ content, path: specificPath });
      } catch {
        return NextResponse.json({ content: '', path: specificPath });
      }
    }

    const home = homedir();
    const globalMemoryDir = path.join(home, OLLAMA_DIR);
    const files: MemoryFileInfo[] = [];
    const contentParts: string[] = [];

    // Check global memory files
    for (const memoryFile of MEMORY_FILES) {
      const globalPath = path.join(globalMemoryDir, memoryFile);
      try {
        const stats = await fs.stat(globalPath);
        const content = await fs.readFile(globalPath, 'utf-8');
        if (content.trim()) {
          contentParts.push(
            `--- Context from: ${globalPath} ---\n${content.trim()}\n--- End of Context ---`,
          );
        }
        files.push({
          path: globalPath,
          relativePath: `~/${OLLAMA_DIR}/${memoryFile}`,
          exists: true,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        });
      } catch {
        files.push({
          path: globalPath,
          relativePath: `~/${OLLAMA_DIR}/${memoryFile}`,
          exists: false,
        });
      }
    }

    // Check project memory files
    for (const memoryFile of MEMORY_FILES) {
      const projectPath = path.join(cwd, memoryFile);
      try {
        const stats = await fs.stat(projectPath);
        const content = await fs.readFile(projectPath, 'utf-8');
        if (content.trim()) {
          contentParts.push(
            `--- Context from: ${memoryFile} ---\n${content.trim()}\n--- End of Context ---`,
          );
        }
        files.push({
          path: projectPath,
          relativePath: memoryFile,
          exists: true,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        });
      } catch {
        files.push({
          path: projectPath,
          relativePath: memoryFile,
          exists: false,
        });
      }
    }

    const response: MemoryContentResponse = {
      content: contentParts.join('\n\n'),
      files,
      fileCount: files.filter((f) => f.exists).length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to load memory:', error);
    return NextResponse.json(
      { error: 'Failed to load memory' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/memory
 *
 * Save memory content to a file
 * Body: { path: string, content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(filePath, content, 'utf-8');

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Failed to save memory:', error);
    return NextResponse.json(
      { error: 'Failed to save memory' },
      { status: 500 },
    );
  }
}
