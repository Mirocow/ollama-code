/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0

 */
export const dynamic = 'force-dynamic';

/**
 * Sessions Export API Route
 *
 * Export sessions to various formats
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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
 * GET /api/sessions/export
 *
 * Export sessions to a file
 * Query params:
 * - ids: comma-separated session IDs (optional, if not provided exports all)
 * - format: 'json' | 'markdown' (default: 'json')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);
    const format = searchParams.get('format') || 'json';

    const dir = getSessionsDir();
    const files = await fs.readdir(dir);
    const sessions: SessionData[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        const session: SessionData = JSON.parse(content);

        // Filter by IDs if provided
        if (!ids || ids.includes(session.id)) {
          sessions.push(session);
        }
      } catch {
        // Skip invalid files
      }
    }

    if (format === 'markdown') {
      // Export as markdown
      const markdown = sessions
        .map((session) => {
          const lines = [
            `# ${session.title}`,
            '',
            `**Model:** ${session.model}`,
            `**Created:** ${new Date(session.createdAt).toISOString()}`,
            `**Updated:** ${new Date(session.updatedAt).toISOString()}`,
            '',
            '---',
            '',
          ];

          for (const msg of session.messages) {
            const role =
              msg.role === 'user' ? '👤 **User**' : '🤖 **Assistant**';
            lines.push(role);
            lines.push('');
            lines.push(msg.content);
            lines.push('');

            if (msg.toolCalls && msg.toolCalls.length > 0) {
              lines.push('**Tool Calls:**');
              for (const tc of msg.toolCalls) {
                lines.push(`- \`${tc.name}\``);
                if (tc.result) {
                  lines.push(
                    `  - Result: ${JSON.stringify(tc.result).slice(0, 100)}...`,
                  );
                }
              }
              lines.push('');
            }

            lines.push('---');
            lines.push('');
          }

          return lines.join('\n');
        })
        .join('\n\n---\n\n');

      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="sessions.md"',
        },
      });
    }

    // Default: JSON export
    return new Response(JSON.stringify(sessions, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="sessions.json"',
      },
    });
  } catch (error) {
    console.error('Failed to export sessions:', error);
    return NextResponse.json(
      { error: 'Failed to export sessions' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sessions/export
 *
 * Import sessions from a file
 */
export async function POST(request: NextRequest) {
  try {
    const sessions: SessionData[] = await request.json();

    if (!Array.isArray(sessions)) {
      return NextResponse.json(
        { error: 'Expected an array of sessions' },
        { status: 400 },
      );
    }

    const dir = getSessionsDir();
    await fs.mkdir(dir, { recursive: true });

    let imported = 0;
    let skipped = 0;

    for (const session of sessions) {
      if (!session.id) {
        skipped++;
        continue;
      }

      // Generate new ID if session already exists
      const filePath = path.join(dir, `${session.id}.json`);
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      const finalSession = exists
        ? { ...session, id: `${session.id}-${Date.now()}` }
        : session;

      finalSession.updatedAt = Date.now();

      await fs.writeFile(
        path.join(dir, `${finalSession.id}.json`),
        JSON.stringify(finalSession, null, 2),
        'utf-8',
      );

      imported++;
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error) {
    console.error('Failed to import sessions:', error);
    return NextResponse.json(
      { error: 'Failed to import sessions' },
      { status: 500 },
    );
  }
}
