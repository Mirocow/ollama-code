/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues with browser-only libraries
const ChatViewer = dynamic(
  () => import('@ollama-code/webui').then((mod) => mod.ChatViewer),
  { ssr: false, loading: () => <LoadingPlaceholder /> }
);

const FileExplorer = dynamic(
  () =>
    import('@/components/explorer/FileExplorer').then(
      (mod) => mod.FileExplorer,
    ),
  { ssr: false, loading: () => <LoadingPlaceholder /> },
);

const TerminalEmulator = dynamic(
  () =>
    import('@/components/terminal/TerminalEmulator').then(
      (mod) => mod.TerminalEmulator,
    ),
  { ssr: false, loading: () => <LoadingPlaceholder /> },
);

const SettingsPanel = dynamic(
  () => import('@/components/settings/SettingsPanel').then((mod) => mod.SettingsPanel),
  { ssr: false, loading: () => <LoadingPlaceholder /> },
);

const ExtensionsPanel = dynamic(
  () => import('@/components/extensions/ExtensionsPanel').then((mod) => mod.ExtensionsPanel),
  { ssr: false, loading: () => <LoadingPlaceholder /> },
);

const ToolsPanel = dynamic(
  () => import('@/components/tools/ToolsPanel').then((mod) => mod.ToolsPanel),
  { ssr: false, loading: () => <LoadingPlaceholder /> },
);

const MCPPanel = dynamic(
  () => import('@/components/mcp/MCPPanel').then((mod) => mod.MCPPanel),
  { ssr: false, loading: () => <LoadingPlaceholder /> },
);

import { useWebSessionStore } from '@/stores/webSessionStore';
import type { ChatMessageData } from '@ollama-code/webui';

/**
 * Tab configuration
 */
const tabs = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'files', label: 'Files', icon: '📁' },
  { id: 'terminal', label: 'Terminal', icon: '⌨️' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'extensions', label: 'Extensions', icon: '🧩' },
  { id: 'mcp', label: 'MCP', icon: '🔌' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;

type TabId = (typeof tabs)[number]['id'];

/**
 * Loading placeholder
 */
function LoadingPlaceholder() {
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
  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState<{ name: string; size: number }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    activeSessionId,
    streaming,
    selectedModel,
    createSession,
    setActiveSession,
    addMessage,
    startStreaming,
    appendStreamContent,
    finishStreaming,
    cancelStreaming,
    setSelectedModel,
    sidebarOpen,
    toggleSidebar,
  } = useWebSessionStore();

  // Convert session messages to ChatViewer format
  const chatMessages: ChatMessageData[] = (() => {
    const session = activeSessionId ? sessions.get(activeSessionId) : null;
    if (!session) return [];

    return session.messages.map((msg) => ({
      uuid: msg.id,
      timestamp: new Date(msg.timestamp).toISOString(),
      type: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      message: {
        role: msg.role,
        parts: [{ text: msg.content }],
      },
    }));
  })();

  // Fetch available models
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/models');
        const data = await response.json();
        setModels(data.models || []);
        if (data.models?.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].name);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    }

    fetchModels();
  }, [selectedModel, setSelectedModel]);

  // Create initial session
  useEffect(() => {
    if (sessions.size === 0) {
      createSession(selectedModel);
    }
  }, [sessions.size, createSession, selectedModel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streaming.currentContent, chatMessages.length]);

  // Get active session
  const activeSession = activeSessionId ? sessions.get(activeSessionId) : null;

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending || !activeSessionId) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Add user message
    addMessage(activeSessionId, {
      role: 'user',
      content: userMessage,
    });

    // Start streaming
    const abortController = new AbortController();
    startStreaming(abortController);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...(activeSession?.messages || []).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ],
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              appendStreamContent(parsed.message.content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      finishStreaming();
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Failed to send message:', error);
        finishStreaming();
      }
    } finally {
      setIsSending(false);
    }
  }, [
    inputValue,
    isSending,
    activeSessionId,
    activeSession,
    selectedModel,
    addMessage,
    startStreaming,
    appendStreamContent,
    finishStreaming,
  ]);

  // Handle keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
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
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-md text-sm"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            Ollama Code v0.11.0
          </span>
        </div>
      </header>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex h-full">
            {/* Sidebar */}
            {sidebarOpen && (
              <aside className="w-64 border-r border-border bg-muted/30 flex flex-col">
                <div className="p-4 border-b border-border">
                  <button
                    onClick={() => createSession(selectedModel)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    + New Chat
                  </button>
                </div>

                {/* Sessions list */}
                <div className="flex-1 overflow-auto p-2">
                  <div className="space-y-1">
                    {Array.from(sessions.values()).map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setActiveSession(session.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                          session.id === activeSessionId
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {session.title || 'New Chat'}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="h-10 border-b border-border flex items-center px-4 gap-4">
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-muted rounded"
                >
                  ☰
                </button>
                <span className="text-sm font-medium">
                  {activeSession?.title || 'New Chat'}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto">
                <ChatViewer
                  messages={[...chatMessages, ...(streaming.isStreaming && streaming.currentContent ? [{
                    uuid: 'streaming',
                    timestamp: new Date().toISOString(),
                    type: 'assistant' as const,
                    message: {
                      role: 'assistant' as const,
                      parts: [{ text: streaming.currentContent }],
                    },
                  }] : [])]}
                  emptyMessage="Start a conversation with Ollama..."
                />
              </div>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message... (Enter to send, Shift+Enter for new line)"
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={1}
                    disabled={isSending || streaming.isStreaming}
                  />
                  {streaming.isStreaming ? (
                    <button
                      onClick={cancelStreaming}
                      className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isSending}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'terminal' && <TerminalEmulator />}
        {activeTab === 'tools' && <ToolsPanel />}
        {activeTab === 'extensions' && <ExtensionsPanel />}
        {activeTab === 'mcp' && <MCPPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}
