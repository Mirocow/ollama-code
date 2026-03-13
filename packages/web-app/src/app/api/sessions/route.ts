/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sessions API Route
 *
 * Manages chat sessions with server-side persistence
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getOllamaUrl } from '@/lib/settings';

/**
 * Session storage directory
 */
function getSessionsDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
  return path.join(homeDir, '.ollama-code', 'sessions');
}

/**
 * Session metadata (without full messages)
 */
interface SessionMetadata {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

/**
 * Full session data
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
 * Ensure sessions directory exists
 */
async function ensureSessionsDir(): Promise<void> {
  const dir = getSessionsDir();
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Directory exists
  }
}

/**
 * GET /api/sessions
 *
 * List all sessions (metadata only)
 */
export async function GET() {
  try {
    await ensureSessionsDir();
    const dir = getSessionsDir();
    const files = await fs.readdir(dir);

    const sessions: SessionMetadata[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        const session: SessionData = JSON.parse(content);

        sessions.push({
          id: session.id,
          title: session.title,
          model: session.model,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messages.length,
        });
      } catch {
        // Skip invalid files
      }
    }

    // Sort by updatedAt descending
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sessions
 *
 * Save a session
 */
export async function POST(request: NextRequest) {
  try {
    const session: SessionData = await request.json();

    if (!session.id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await ensureSessionsDir();
    const dir = getSessionsDir();
    const filePath = path.join(dir, `${session.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');

    return NextResponse.json({ success: true, id: session.id });
  } catch (error) {
    console.error('Failed to save session:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/sessions
 *
 * Delete all sessions (with query param ?all=true) or cleanup old sessions
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('all') === 'true';
    const olderThan = searchParams.get('olderThan');

    const dir = getSessionsDir();

    if (deleteAll) {
      // Delete all sessions
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(dir, file));
        }
      }
      return NextResponse.json({ success: true, deleted: 'all' });
    }

    if (olderThan) {
      // Delete sessions older than specified days
      const days = parseInt(olderThan, 10);
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const files = await fs.readdir(dir);
      let deleted = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const session: SessionData = JSON.parse(content);

          if (session.updatedAt < cutoff) {
            await fs.unlink(path.join(dir, file));
            deleted++;
          }
        } catch {
          // Skip invalid files
        }
      }

      return NextResponse.json({ success: true, deleted });
    }

    return NextResponse.json({ error: 'Specify ?all=true or ?olderThan=days' }, { status: 400 });
  } catch (error) {
    console.error('Failed to delete sessions:', error);
    return NextResponse.json(
      { error: 'Failed to delete sessions' },
      { status: 500 },
    );
  }
}
