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
  { ssr: false, loading: () => <LoadingPlaceholder /> },
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
  () =>
    import('@/components/settings/SettingsPanel').then(
      (mod) => mod.SettingsPanel,
    ),
  { ssr: false, loading: () => <LoadingPlaceholder /> },
);

const ExtensionsPanel = dynamic(
  () =>
    import('@/components/extensions/ExtensionsPanel').then(
      (mod) => mod.ExtensionsPanel,
    ),
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
  const [models, setModels] = useState<Array<{ name: string; size: number }>>(
    [],
  );
  const [_isLoadingModels, setIsLoadingModels] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null); // null = checking, true = connected, false = disconnected
  const [ollamaUrl, setOllamaUrl] = useState<string>('');
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
      type: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
      message: {
        role: msg.role,
        parts: [{ text: msg.content }],
      },
    }));
  })();

  // Fetch settings and models together for proper synchronization
  useEffect(() => {
    async function fetchSettingsAndModels() {
      try {
        // First fetch settings to get Ollama URL and default model
        const settingsResponse = await fetch('/api/settings');
        const settingsData = await settingsResponse.json();
        setOllamaUrl(settingsData.ollamaUrl || 'http://localhost:11434');

        // Then fetch models from Ollama server
        const modelsResponse = await fetch('/api/models');
        const modelsData = await modelsResponse.json();

        if (modelsData.error) {
          setOllamaConnected(false);
          setModels([]);
          // If Ollama is not connected, still use defaultModel from settings
          if (settingsData.defaultModel) {
            setSelectedModel(settingsData.defaultModel);
          }
        } else {
          setOllamaConnected(true);
          const loadedModels = modelsData.models || [];
          setModels(loadedModels);

          if (loadedModels.length > 0) {
            // Check if defaultModel from settings exists in the models list
            const defaultModel = settingsData.defaultModel;
            const modelExists =
              defaultModel &&
              loadedModels.some(
                (m: { name: string }) =>
                  m.name === defaultModel ||
                  m.name.startsWith(defaultModel + ':'),
              );

            if (modelExists) {
              // Use defaultModel from settings if it exists
              setSelectedModel(defaultModel);
            } else if (!selectedModel) {
              // Fall back to first model if no model is selected
              setSelectedModel(loadedModels[0].name);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings/models:', error);
        setOllamaConnected(false);
        setModels([]);
        setOllamaUrl('http://localhost:11434');
      } finally {
        setIsLoadingModels(false);
      }
    }

    fetchSettingsAndModels();
    // Poll every 30 seconds to check connection
    const interval = setInterval(fetchSettingsAndModels, 30000);
    return () => clearInterval(interval);
  }, []); // Remove dependencies to prevent re-runs

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

  // Handle model change - also save to settings
  const handleModelChange = useCallback(
    async (newModel: string) => {
      setSelectedModel(newModel);
      // Save to settings
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defaultModel: newModel }),
        });
      } catch (error) {
        console.error('Failed to save default model:', error);
      }
    },
    [setSelectedModel],
  );

  // Handle keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Retry connection
  const handleRetryConnection = async () => {
    setIsLoadingModels(true);
    setOllamaConnected(null);
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      if (data.error) {
        setOllamaConnected(false);
      } else {
        setOllamaConnected(true);
        setModels(data.models || []);
        if (data.models?.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (_error) {
      setOllamaConnected(false);
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Connection Status Banner */}
      {ollamaConnected === false && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <span>⚠️</span>
            <span className="text-sm">
              Ollama server is not connected. Make sure Ollama is running at{' '}
              <code className="px-1 bg-muted rounded">{ollamaUrl}</code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleRetryConnection}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

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
        <div className="ml-auto flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                ollamaConnected === null
                  ? 'bg-gray-400 animate-pulse'
                  : ollamaConnected
                    ? 'bg-green-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {ollamaConnected === null
                ? 'Checking...'
                : ollamaConnected
                  ? 'Connected'
                  : 'Disconnected'}
            </span>
          </div>

          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-md text-sm"
            disabled={!ollamaConnected || models.length === 0}
          >
            {models.length === 0 ? (
              <option value="">No models available</option>
            ) : (
              models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))
            )}
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
                  messages={[
                    ...chatMessages,
                    ...(streaming.isStreaming && streaming.currentContent
                      ? [
                          {
                            uuid: 'streaming',
                            timestamp: new Date().toISOString(),
                            type: 'assistant' as const,
                            message: {
                              role: 'assistant' as const,
                              parts: [{ text: streaming.currentContent }],
                            },
                          },
                        ]
                      : []),
                  ]}
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
