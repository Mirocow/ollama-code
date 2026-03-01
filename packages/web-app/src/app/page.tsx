/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Home() {
  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      <ChatInterface />
    </main>
  );
}
