/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Models API Route
 *
 * Fetches available models from Ollama server.
 * Reads settings from ~/.ollama-code/settings.json
 */

import { NextResponse } from 'next/server';
import { getOllamaUrl } from '@/lib/settings';

/**
 * GET /api/models
 *
 * Returns list of available Ollama models
 */
export async function GET() {
  try {
    const ollamaUrl = await getOllamaUrl();
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Ollama returned ${response.status}`, models: [] },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    // Connection refused is expected when Ollama is not running
    // Don't log to avoid console spam during polling
    return NextResponse.json(
      { error: 'Failed to connect to Ollama server', models: [] },
      { status: 503 },
    );
  }
}
