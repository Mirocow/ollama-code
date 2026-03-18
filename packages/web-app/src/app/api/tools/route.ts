/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Tools API Route
 *
 * Returns list of available tools from Core ToolRegistry
 */

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
 * GET /api/tools
 *
 * Returns list of available tools from ToolRegistry
 */
export async function GET() {
  try {
    const service = await ensureCoreService();
    const tools = await service.listTools();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Failed to list tools:', error);
    return NextResponse.json(
      { error: 'Failed to list tools' },
      { status: 500 },
    );
  }
}
