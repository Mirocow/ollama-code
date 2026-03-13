/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Session Detail API Route
 *
 * Get, update, or delete a specific session
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Session storage directory
 */
function getSessionsDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
  return path.join(homeDir, '.ollama-code', 'sessions');
}

/**
 * Session data
 */
interface SessionData {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    toolCalls?: Array<{
      id: string;
      name: string;
      arguments: Record<string, unknown>;
      result?: unknown;
    }>;
  }>;
  model: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * GET /api/sessions/[id]
 *
 * Get a specific session
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const dir = getSessionsDir();
    const filePath = path.join(dir, `${id}.json`);

    const content = await fs.readFile(filePath, 'utf-8');
    const session: SessionData = JSON.parse(content);

    return NextResponse.json({ session });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    console.error('Failed to get session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/sessions/[id]
 *
 * Update a session
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const dir = getSessionsDir();
    const filePath = path.join(dir, `${id}.json`);

    // Read existing session
    let session: SessionData;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      session = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Apply updates
    const updatedSession: SessionData = {
      ...session,
      ...updates,
      id: session.id, // Don't allow changing ID
      updatedAt: Date.now(),
    };

    await fs.writeFile(filePath, JSON.stringify(updatedSession, null, 2), 'utf-8');

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/sessions/[id]
 *
 * Delete a session
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const dir = getSessionsDir();
    const filePath = path.join(dir, `${id}.json`);

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    console.error('Failed to delete session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 },
    );
  }
}
