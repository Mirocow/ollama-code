/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Skills API Route
 *
 * Manages skills through Core SkillManager
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
 * GET /api/skills
 *
 * List all available skills
 */
export async function GET() {
  try {
    const service = await ensureCoreService();
    const skills = await service.listSkills();
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Failed to list skills:', error);
    return NextResponse.json(
      { error: 'Failed to list skills' },
      { status: 500 },
    );
  }
}
