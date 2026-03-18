/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Extensions API Route
 *
 * Manage extensions through Core ExtensionManager
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
 * GET /api/extensions
 *
 * List all extensions
 */
export async function GET() {
  try {
    const service = await ensureCoreService();
    const extensions = await service.listExtensions();
    return NextResponse.json({ extensions });
  } catch (error) {
    console.error('Failed to list extensions:', error);
    return NextResponse.json(
      { error: 'Failed to list extensions' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/extensions
 *
 * Install a new extension
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, type = 'local' } = body;

    if (!source) {
      return NextResponse.json(
        { error: 'Extension source is required' },
        { status: 400 },
      );
    }

    const service = await ensureCoreService();
    const extension = await service.installExtension(
      source,
      type as 'git' | 'local',
    );
    return NextResponse.json({ success: true, extension });
  } catch (error) {
    console.error('Failed to install extension:', error);
    return NextResponse.json(
      { error: 'Failed to install extension' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/extensions
 *
 * Enable/disable an extension
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, enabled } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Extension name is required' },
        { status: 400 },
      );
    }

    const service = await ensureCoreService();

    if (enabled) {
      await service.enableExtension(name);
    } else {
      await service.disableExtension(name);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update extension:', error);
    return NextResponse.json(
      { error: 'Failed to update extension' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/extensions
 *
 * Uninstall an extension
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Extension name is required' },
        { status: 400 },
      );
    }

    const service = await ensureCoreService();
    await service.uninstallExtension(name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to uninstall extension:', error);
    return NextResponse.json(
      { error: 'Failed to uninstall extension' },
      { status: 500 },
    );
  }
}
