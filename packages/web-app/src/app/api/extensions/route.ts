/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extensions API Route
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  installed: boolean;
  author: string;
}

// Demo extensions - in production these would come from the extension manager
const extensions: Extension[] = [
  { id: 'git-tools', name: 'Git Tools', version: '1.0.0', description: 'Git integration tools', enabled: true, installed: true, author: 'Ollama Code' },
  { id: 'web-search', name: 'Web Search', version: '1.2.0', description: 'Search the web for information', enabled: true, installed: true, author: 'Ollama Code' },
  { id: 'lsp-tools', name: 'LSP Tools', version: '0.9.0', description: 'Language Server Protocol integration', enabled: false, installed: true, author: 'Ollama Code' },
  { id: 'docker-tools', name: 'Docker Tools', version: '1.1.0', description: 'Docker container management', enabled: false, installed: false, author: 'Community' },
  { id: 'aws-tools', name: 'AWS Tools', version: '0.5.0', description: 'AWS cloud integration', enabled: false, installed: false, author: 'Community' },
  { id: 'database-tools', name: 'Database Tools', version: '1.0.0', description: 'Database connectivity and queries', enabled: false, installed: false, author: 'Community' },
];

/**
 * GET /api/extensions
 * List all extensions
 */
export async function GET() {
  return NextResponse.json({ extensions });
}

/**
 * POST /api/extensions
 * Install an extension
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { extensionId } = body;

  const extIndex = extensions.findIndex((e) => e.id === extensionId);
  if (extIndex >= 0) {
    extensions[extIndex].installed = true;
    extensions[extIndex].enabled = true;
  }

  return NextResponse.json({ success: true, extension: extensions[extIndex] });
}
