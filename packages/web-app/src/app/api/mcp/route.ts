/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP API Route
 *
 * Manage MCP (Model Context Protocol) servers
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { getOllamaDir } from '@/lib/settings';

/**
 * MCP Server configuration
 */
interface MCPServerConfig {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
}

/**
 * MCP config file path
 */
async function getMCPConfigPath(): Promise<string> {
  const dir = getOllamaDir();
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return `${dir}/mcp.json`;
}

/**
 * Load MCP servers from config
 */
async function loadServers(): Promise<MCPServerConfig[]> {
  try {
    const configPath = await getMCPConfigPath();
    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.servers || [];
    }
  } catch (_error) {
    // Ignore errors - return empty list
  }
  return [];
}

/**
 * Save MCP servers to config
 */
async function saveServers(servers: MCPServerConfig[]): Promise<void> {
  const configPath = await getMCPConfigPath();
  await writeFile(configPath, JSON.stringify({ servers }, null, 2), 'utf-8');
}

/**
 * GET /api/mcp
 *
 * List all MCP servers
 */
export async function GET() {
  const servers = await loadServers();

  // Add status info
  const serversWithStatus = servers.map((server) => ({
    ...server,
    status: server.enabled ? 'connected' : 'disconnected',
    tools: [],
    resources: [],
  }));

  return NextResponse.json({ servers: serversWithStatus });
}

/**
 * POST /api/mcp
 *
 * Add a new MCP server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const servers = await loadServers();

    const newServer: MCPServerConfig = {
      id: Date.now().toString(),
      name: body.name,
      type: body.type || 'stdio',
      command: body.command,
      args: body.args,
      url: body.url,
      env: body.env,
      enabled: true,
    };

    servers.push(newServer);
    await saveServers(servers);

    return NextResponse.json({ success: true, server: newServer });
  } catch {
    return NextResponse.json(
      { error: 'Failed to add server' },
      { status: 500 },
    );
  }
}
