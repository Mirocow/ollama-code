/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tools API Route
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  category: string;
  enabled: boolean;
}

// Demo tools - in production these would come from the tool registry
const tools: ToolDefinition[] = [
  { name: 'read_file', description: 'Read contents of a file', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'File path' } } }, category: 'file', enabled: true },
  { name: 'write_file', description: 'Write content to a file', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'File path' }, content: { type: 'string', description: 'Content to write' } } }, category: 'file', enabled: true },
  { name: 'edit_file', description: 'Edit a file with diff', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'File path' }, oldContent: { type: 'string', description: 'Content to replace' }, newContent: { type: 'string', description: 'New content' } } }, category: 'file', enabled: true },
  { name: 'list_directory', description: 'List directory contents', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Directory path' } } }, category: 'file', enabled: true },
  { name: 'glob', description: 'Find files by pattern', inputSchema: { type: 'object', properties: { pattern: { type: 'string', description: 'Glob pattern' } } }, category: 'file', enabled: true },
  { name: 'grep', description: 'Search files with pattern', inputSchema: { type: 'object', properties: { pattern: { type: 'string', description: 'Search pattern' }, path: { type: 'string', description: 'Search path' } } }, category: 'search', enabled: true },
  { name: 'execute_shell', description: 'Execute a shell command', inputSchema: { type: 'object', properties: { command: { type: 'string', description: 'Command to execute' }, timeout: { type: 'number', description: 'Timeout in milliseconds' } } }, category: 'shell', enabled: true },
  { name: 'web_search', description: 'Search the web', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search query' }, num: { type: 'number', description: 'Number of results' } } }, category: 'web', enabled: true },
  { name: 'web_fetch', description: 'Fetch content from URL', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'URL to fetch' } } }, category: 'web', enabled: true },
  { name: 'git_status', description: 'Get git repository status', inputSchema: { type: 'object', properties: {} }, category: 'git', enabled: true },
  { name: 'git_diff', description: 'Get git diff', inputSchema: { type: 'object', properties: { staged: { type: 'boolean', description: 'Show staged changes' } } }, category: 'git', enabled: true },
  { name: 'git_log', description: 'Get git commit history', inputSchema: { type: 'object', properties: { limit: { type: 'number', description: 'Number of commits' } } }, category: 'git', enabled: true },
  { name: 'save_memory', description: 'Save information to memory', inputSchema: { type: 'object', properties: { content: { type: 'string', description: 'Content to remember' } } }, category: 'memory', enabled: true },
  { name: 'recall_memory', description: 'Recall information from memory', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } } }, category: 'memory', enabled: true },
  { name: 'task', description: 'Create a sub-agent task', inputSchema: { type: 'object', properties: { description: { type: 'string', description: 'Task description' } } }, category: 'agent', enabled: true },
  { name: 'todo_write', description: 'Update todo list', inputSchema: { type: 'object', properties: { todos: { type: 'array', description: 'Todo items' } } }, category: 'productivity', enabled: true },
];

/**
 * GET /api/tools
 * List all available tools
 */
export async function GET() {
  return NextResponse.json({ tools });
}

/**
 * POST /api/tools
 * Execute a tool
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tool, input } = body;

  // In production, this would actually execute the tool
  console.log(`Executing tool: ${tool}`, input);

  return NextResponse.json({
    success: true,
    result: {
      tool,
      input,
      output: 'Tool execution simulated',
      timestamp: Date.now(),
    },
  });
}
