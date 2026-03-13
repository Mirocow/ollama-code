/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP API Route
 *
 * Manage MCP (Model Context Protocol) servers through Core
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCoreService } from '@/server/coreService';

/**
 * Ensure core service is initialized
 */
async function ensureCoreService() {
  const service = getCoreService();
  await service.initialize();
  return service;
}

/**
 * GET /api/mcp
 *
 * List all MCP servers
 */
export async function GET() {
  try {
    const service = await ensureCoreService();
    const servers = await service.listMCPServers();
    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Failed to list MCP servers:', error);
    return NextResponse.json(
      { error: 'Failed to list MCP servers' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/mcp
 *
 * Restart an MCP server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, action } = body;

    if (action === 'restart' && name) {
      const service = await ensureCoreService();
      await service.restartMCPServer(name);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing server name' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Failed to restart MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to restart MCP server' },
      { status: 500 },
    );
  }
}
