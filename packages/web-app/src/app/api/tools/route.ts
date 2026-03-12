/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tools API Route
 *
 * Returns list of available tools (similar to CLI ToolRegistry)
 */

import { NextResponse } from 'next/server';

/**
 * Tool definition from core
 */
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<
      string,
      { type: string; description: string; enum?: string[] }
    >;
    required?: string[];
  };
  category: string;
  enabled: boolean;
}

/**
 * Built-in tools (mirrors CLI tools)
 */
const builtinTools: ToolDefinition[] = [
  // File tools
  {
    name: 'read_file',
    description:
      'Read the contents of a file. Returns the file content as a string.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to read',
        },
        offset: {
          type: 'number',
          description: 'Line number to start reading from',
        },
        limit: { type: 'number', description: 'Number of lines to read' },
      },
      required: ['file_path'],
    },
    category: 'file',
    enabled: true,
  },
  {
    name: 'write_file',
    description:
      'Write content to a file. Creates the file if it does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['file_path', 'content'],
    },
    category: 'file',
    enabled: true,
  },
  {
    name: 'edit_file',
    description:
      'Edit a file by replacing specific text. Uses exact string matching.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to edit',
        },
        old_string: { type: 'string', description: 'The text to replace' },
        new_string: {
          type: 'string',
          description: 'The text to replace it with',
        },
        replace_all: {
          type: 'boolean',
          description: 'Replace all occurrences',
        },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
    category: 'file',
    enabled: true,
  },
  {
    name: 'list_directory',
    description: 'List the contents of a directory.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute path to the directory to list',
        },
      },
      required: ['path'],
    },
    category: 'file',
    enabled: true,
  },
  {
    name: 'create_directory',
    description: 'Create a new directory.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute path of the directory to create',
        },
      },
      required: ['path'],
    },
    category: 'file',
    enabled: true,
  },
  {
    name: 'delete_file',
    description: 'Delete a file.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to delete',
        },
      },
      required: ['file_path'],
    },
    category: 'file',
    enabled: true,
  },
  // Shell tools
  {
    name: 'execute_shell',
    description: 'Execute a shell command. Use with caution.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command to execute' },
        cwd: {
          type: 'string',
          description: 'Working directory for the command',
        },
        timeout: { type: 'number', description: 'Timeout in milliseconds' },
      },
      required: ['command'],
    },
    category: 'shell',
    enabled: true,
  },
  // Search tools
  {
    name: 'grep',
    description: 'Search for a pattern in files using ripgrep.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'The pattern to search for' },
        path: {
          type: 'string',
          description: 'The directory or file to search in',
        },
        glob: { type: 'string', description: 'Glob pattern to filter files' },
        output_mode: {
          type: 'string',
          description: 'Output mode: content, files_with_matches, count',
        },
      },
      required: ['pattern'],
    },
    category: 'search',
    enabled: true,
  },
  {
    name: 'glob',
    description: 'Find files matching a glob pattern.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'The glob pattern to match' },
        path: { type: 'string', description: 'The directory to search in' },
      },
      required: ['pattern'],
    },
    category: 'search',
    enabled: true,
  },
  // Web tools
  {
    name: 'web_search',
    description: 'Search the web for information.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
        num: { type: 'number', description: 'Number of results to return' },
      },
      required: ['query'],
    },
    category: 'web',
    enabled: true,
  },
  {
    name: 'web_fetch',
    description: 'Fetch content from a URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to fetch' },
      },
      required: ['url'],
    },
    category: 'web',
    enabled: true,
  },
  // Git tools
  {
    name: 'git_status',
    description: 'Get the git status of the repository.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    category: 'git',
    enabled: true,
  },
  {
    name: 'git_diff',
    description: 'Get the git diff of changes.',
    inputSchema: {
      type: 'object',
      properties: {
        staged: { type: 'boolean', description: 'Show staged changes' },
      },
    },
    category: 'git',
    enabled: true,
  },
  {
    name: 'git_log',
    description: 'Get the git log history.',
    inputSchema: {
      type: 'object',
      properties: {
        max_count: { type: 'number', description: 'Maximum number of commits' },
      },
    },
    category: 'git',
    enabled: true,
  },
  // Memory tools
  {
    name: 'save_memory',
    description: 'Save information to persistent memory.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The content to remember' },
      },
      required: ['content'],
    },
    category: 'memory',
    enabled: true,
  },
  {
    name: 'load_memory',
    description: 'Load information from persistent memory.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    category: 'memory',
    enabled: true,
  },
  // Think tool
  {
    name: 'think',
    description: 'Think through a problem step by step.',
    inputSchema: {
      type: 'object',
      properties: {
        thought: { type: 'string', description: 'The thought to process' },
      },
      required: ['thought'],
    },
    category: 'reasoning',
    enabled: true,
  },
];

/**
 * GET /api/tools
 *
 * Returns list of available tools
 */
export async function GET() {
  return NextResponse.json({ tools: builtinTools });
}
