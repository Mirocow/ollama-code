/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP (Model Context Protocol) API Route
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: string[];
  resources: string[];
  error?: string;
}

// Demo MCP servers - in production these would come from the MCP manager
const mcpServers: MCPServer[] = [
  { id: '1', name: 'filesystem', type: 'stdio', command: 'mcp-filesystem', args: ['/home/user/projects'], status: 'connected', tools: ['read_file', 'write_file', 'list_directory'], resources: ['file://'] },
  { id: '2', name: 'github', type: 'http', url: 'https://api.github.com/mcp', status: 'connected', tools: ['search_repos', 'get_issue', 'create_pr'], resources: ['github://'] },
  { id: '3', name: 'postgres', type: 'stdio', command: 'mcp-postgres', args: ['postgresql://localhost/mydb'], status: 'disconnected', tools: [], resources: [] },
];

/**
 * GET /api/mcp
 * List all MCP servers
 */
export async function GET() {
  return NextResponse.json({ servers: mcpServers });
}

/**
 * POST /api/mcp
 * Add a new MCP server
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, command, args, url } = body;

  const newServer: MCPServer = {
    id: Date.now().toString(),
    name,
    type,
    command,
    args: args?.split(' ').filter(Boolean) || [],
    url,
    status: 'disconnected',
    tools: [],
    resources: [],
  };

  mcpServers.push(newServer);
  return NextResponse.json({ success: true, server: newServer });
}
