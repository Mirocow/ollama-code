/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extension by ID API Route
 *
 * Manage individual extensions
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { loadExtensions, saveExtensions } from '../route';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/extensions/[id]
 *
 * Get extension details
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const extensions = await loadExtensions();
  const extension = extensions.find((e) => e.id === id);

  if (!extension) {
    return NextResponse.json({ error: 'Extension not found' }, { status: 404 });
  }

  return NextResponse.json({ extension });
}

/**
 * PUT /api/extensions/[id]
 *
 * Update extension
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const extensions = await loadExtensions();
  const index = extensions.findIndex((e) => e.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Extension not found' }, { status: 404 });
  }

  const body = await request.json();
  extensions[index] = { ...extensions[index], ...body };
  await saveExtensions(extensions);

  return NextResponse.json({ success: true, extension: extensions[index] });
}

/**
 * DELETE /api/extensions/[id]
 *
 * Uninstall extension
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const extensions = await loadExtensions();
  const index = extensions.findIndex((e) => e.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Extension not found' }, { status: 404 });
  }

  // Mark as uninstalled instead of removing
  extensions[index] = {
    ...extensions[index],
    installed: false,
    enabled: false,
  };
  await saveExtensions(extensions);

  return NextResponse.json({ success: true });
}
