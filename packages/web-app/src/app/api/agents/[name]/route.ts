/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Agent Detail API Route
 *
 * Get a specific subagent by name
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCoreService } from '@/server/coreService';

interface RouteParams {
  params: Promise<{ name: string }>;
}

/**
 * GET /api/agents/[name]
 *
 * Get a specific subagent
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const service = getCoreService();
    await service.initialize();
    const agent = await service.getAgent(decodeURIComponent(name));

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Failed to get agent:', error);
    return NextResponse.json(
      { error: 'Failed to get agent' },
      { status: 500 },
    );
  }
}
