/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Skill Detail API Route
 *
 * Get a specific skill by name
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCoreService } from '@/server/coreService';

interface RouteParams {
  params: Promise<{ name: string }>;
}

/**
 * GET /api/skills/[name]
 *
 * Get a specific skill
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const service = getCoreService();
    await service.initialize();
    const skill = await service.getSkill(decodeURIComponent(name));

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({ skill });
  } catch (error) {
    console.error('Failed to get skill:', error);
    return NextResponse.json(
      { error: 'Failed to get skill' },
      { status: 500 },
    );
  }
}
