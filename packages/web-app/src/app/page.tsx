/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues with browser-only libraries
const ChatInterface = dynamic(
  () =>
    import('@/components/chat/ChatInterface').then((mod) => mod.ChatInterface),
  { ssr: false, loading: () => <_LoadingPlaceholder /> },
);

const FileExplorer = dynamic(
  () =>
    import('@/components/explorer/FileExplorer').then(
      (mod) => mod.FileExplorer,
    ),
  { ssr: false, loading: () => <_LoadingPlaceholder /> },
);

const TerminalEmulator = dynamic(
  () =>
    import('@/components/terminal/TerminalEmulator').then(
      (mod) => mod.TerminalEmulator,
    ),
  { ssr: false, loading: () => <_LoadingPlaceholder /> },
);

/**
 * Tab configuration
 */
const tabs = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'files', label: 'Files', icon: '📁' },
  { id: 'terminal', label: 'Terminal', icon: '⌨️' },
] as const;

type TabId = (typeof tabs)[number]['id'];

/**
 * Loading placeholder
 */
function _LoadingPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}

/**
 * Main application page with tabbed interface
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');

  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      {/* Tab bar */}
      <header className="h-12 border-b border-border flex items-center px-4 bg-muted/30">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Ollama Code v0.11.0
          </span>
        </div>
      </header>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'terminal' && <TerminalEmulator />}
      </div>
    </main>
  );
}
