/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Tool Execution API Route
 *
 * Execute a specific tool by name
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir, unlink, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Execute a tool
 */
async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'read_file': {
      const filePath = args.file_path as string;
      if (!filePath) throw new Error('file_path is required');

      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await readFile(filePath, 'utf-8');
      const offset = (args.offset as number) || 0;
      const limit = args.limit as number | undefined;

      const lines = content.split('\n');
      const selectedLines = lines.slice(
        offset,
        limit ? offset + limit : undefined,
      );

      return {
        content: selectedLines.join('\n'),
        lineCount: lines.length,
      };
    }

    case 'write_file': {
      const filePath = args.file_path as string;
      const content = args.content as string;

      if (!filePath || content === undefined) {
        throw new Error('file_path and content are required');
      }

      // Create directory if needed
      const dir = join(filePath, '..');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(filePath, content, 'utf-8');
      return { success: true, path: filePath };
    }

    case 'edit_file': {
      const filePath = args.file_path as string;
      const oldString = args.old_string as string;
      const newString = args.new_string as string;
      const replaceAll = args.replace_all as boolean;

      if (!filePath || oldString === undefined || newString === undefined) {
        throw new Error('file_path, old_string, and new_string are required');
      }

      const content = await readFile(filePath, 'utf-8');

      let newContent: string;
      if (replaceAll) {
        newContent = content.split(oldString).join(newString);
      } else {
        if (!content.includes(oldString)) {
          throw new Error('old_string not found in file');
        }
        newContent = content.replace(oldString, newString);
      }

      await writeFile(filePath, newContent, 'utf-8');
      return { success: true, path: filePath };
    }

    case 'list_directory': {
      const dirPath = args.path as string;
      if (!dirPath) throw new Error('path is required');

      if (!existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }

      const entries = await readdir(dirPath, { withFileTypes: true });
      const items = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = join(dirPath, entry.name);
          let size = 0;
          try {
            const s = await stat(fullPath);
            size = s.size;
          } catch {
            // ignore
          }
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            size,
          };
        }),
      );

      return { path: dirPath, items };
    }

    case 'create_directory': {
      const dirPath = args.path as string;
      if (!dirPath) throw new Error('path is required');

      await mkdir(dirPath, { recursive: true });
      return { success: true, path: dirPath };
    }

    case 'delete_file': {
      const filePath = args.file_path as string;
      if (!filePath) throw new Error('file_path is required');

      await unlink(filePath);
      return { success: true, path: filePath };
    }

    case 'execute_shell': {
      // Shell execution is disabled in web for security
      return {
        error:
          'Shell execution is not available in web mode for security reasons',
        suggestion: 'Use the Terminal tab or CLI version for shell commands',
      };
    }

    case 'grep':
    case 'glob': {
      // Search tools - would need to implement or proxy
      return {
        error: 'Search tools require file system access',
        suggestion: 'Use the CLI version for file search capabilities',
      };
    }

    case 'git_status':
    case 'git_diff':
    case 'git_log': {
      // Git tools - would need to implement
      return {
        error: 'Git tools require git CLI access',
        suggestion: 'Use the CLI version for git operations',
      };
    }

    case 'web_search': {
      // Web search - can be implemented with external API
      return {
        error: 'Web search requires external API integration',
        suggestion: 'Configure web search provider in settings',
      };
    }

    case 'web_fetch': {
      const url = args.url as string;
      if (!url) throw new Error('url is required');

      try {
        const response = await fetch(url);
        const content = await response.text();
        return { url, content, status: response.status };
      } catch (error) {
        throw new Error(
          `Failed to fetch URL: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    case 'save_memory': {
      // Memory persistence would need implementation
      return { success: true, message: 'Memory saved (session only)' };
    }

    case 'load_memory': {
      return {
        content: '',
        message: 'No persistent memory available in web mode',
      };
    }

    case 'think': {
      // Think tool - returns the thought for transparency
      return { thought: args.thought, processed: true };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * POST /api/tools/[name]
 *
 * Execute a tool with the given arguments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  try {
    const body = await request.json();
    const args = body.args || body;

    const result = await executeTool(name, args);

    return NextResponse.json({
      success: true,
      tool: name,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        tool: name,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 400 },
    );
  }
}
