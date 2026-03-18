/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Agents/Subagents API Route
 *
 * Manages subagents through Core SubagentManager
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
 * GET /api/agents
 *
 * List all available subagents
 */
export async function GET() {
  try {
    const service = await ensureCoreService();
    const agents = await service.listAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Failed to list agents:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agents
 *
 * Create a new subagent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, model, systemPrompt, tools } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const service = await ensureCoreService();
    await service.createAgent({
      name,
      description,
      systemPrompt,
      tools,
      modelConfig: model ? { model } : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/agents
 *
 * Update an existing subagent
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ...config } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const service = await ensureCoreService();
    await service.updateAgent(name, {
      ...config,
      modelConfig: config.model ? { model: config.model } : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agents
 *
 * Delete a subagent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 },
      );
    }

    const service = await ensureCoreService();
    await service.deleteAgent(name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 },
    );
  }
}
