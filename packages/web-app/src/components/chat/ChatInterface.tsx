/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWebSessionStore, type ChatMessage } from '@/stores/webSessionStore';
import { useWebSocket } from '@/hooks/useWebSocket';

/**
 * Model information from Ollama
 */
interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

/**
 * Skill information
 */
interface SkillInfo {
  name: string;
  description: string;
  level: string;
}

/**
 * Agent information
 */
interface AgentInfo {
  name: string;
  description: string;
  model?: string;
  tools?: string[];
}

/**
 * Streaming event types
 */
type StreamEvent =
  | { type: 'content'; content: string }
  | { type: 'tool_calls_start'; count: number }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'done' }
  | { type: 'error'; error: string };

/**
 * Main chat interface component with full tool execution support
 */
export function ChatInterface() {
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
    setActiveToolCalls,
    finishStreaming,
    cancelStreaming,
    setSelectedModel,
    sidebarOpen,
    toggleSidebar,
  } = useWebSessionStore();

  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [useTools, setUseTools] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // WebSocket connection (for status indicator)
  const { isConnected } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:11434/api/ws',
    onMessage: () => {},
    onError: () => {},
  });

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

  // Fetch skills and agents
  useEffect(() => {
    async function fetchResources() {
      try {
        const [skillsRes, agentsRes] = await Promise.all([
          fetch('/api/skills'),
          fetch('/api/agents'),
        ]);

        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          setSkills(skillsData.skills || []);
        }

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(agentsData.agents || []);
        }
      } catch (error) {
        console.error('Failed to fetch skills/agents:', error);
      }
    }

    fetchResources();
  }, []);

  // Create initial session
  useEffect(() => {
    if (sessions.size === 0) {
      createSession(selectedModel);
    }
  }, [sessions.size, createSession, selectedModel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streaming.currentContent, streaming.activeToolCalls]);

  // Get active session
  const activeSession = activeSessionId ? sessions.get(activeSessionId) : null;

  // Build system prompt from skill/agent
  const buildSystemPrompt = useCallback(async (): Promise<
    string | undefined
  > => {
    if (selectedAgent) {
      try {
        const res = await fetch(`/api/agents/${selectedAgent}`);
        if (res.ok) {
          const agent = await res.json();
          return agent.systemPrompt;
        }
      } catch {
        // Ignore errors
      }
    }

    if (selectedSkill) {
      try {
        const res = await fetch(`/api/skills/${selectedSkill}`);
        if (res.ok) {
          const skill = await res.json();
          return skill.systemPrompt;
        }
      } catch {
        // Ignore errors
      }
    }

    return undefined;
  }, [selectedAgent, selectedSkill]);

  // Handle send message with tool execution
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || streaming.isStreaming || !activeSessionId) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage(activeSessionId, {
      role: 'user',
      content: userMessage,
    });

    // Start streaming
    const abortController = new AbortController();
    startStreaming(abortController);

    // Clear previous tool calls
    setActiveToolCalls([]);

    // Get system prompt
    const systemPrompt = await buildSystemPrompt();

    // Build messages array
    const messages = [
      ...(systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt }]
        : []),
      ...(activeSession?.messages || []).map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    // Choose endpoint based on tool usage
    const endpoint = useTools ? '/api/chat/tools' : '/api/chat';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages,
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
      const currentToolCalls: ChatMessage['toolCalls'] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const event: StreamEvent = JSON.parse(line);

            switch (event.type) {
              case 'content':
                appendStreamContent(event.content);
                break;

              case 'tool_calls_start':
                // Initialize tool calls
                for (let i = 0; i < event.count; i++) {
                  currentToolCalls.push({
                    id: `tc-${Date.now()}-${i}`,
                    name: '',
                    arguments: {},
                    result: undefined,
                  });
                }
                setActiveToolCalls(currentToolCalls);
                break;

              case 'tool_call': {
                // Update first pending tool call with name and args
                const pendingCall = currentToolCalls.find(
                  (tc) => tc.name === '' && tc.result === undefined,
                );
                if (pendingCall) {
                  pendingCall.name = event.name;
                  pendingCall.arguments = event.args;
                  setActiveToolCalls([...currentToolCalls]);
                }
                break;
              }

              case 'tool_result': {
                // Update tool call with result
                const runningCall = currentToolCalls.find(
                  (tc) => tc.name === event.name && tc.result === undefined,
                );
                if (runningCall) {
                  runningCall.result = event.result;
                  setActiveToolCalls([...currentToolCalls]);
                }
                break;
              }

              case 'done':
                finishStreaming();
                break;

              case 'error':
                console.error('Stream error:', event.error);
                finishStreaming();
                break;
            }
          } catch {
            // For /api/chat endpoint (plain Ollama format)
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
      }

      // If we got here without 'done' event, finish anyway
      if (streaming.isStreaming) {
        finishStreaming();
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Failed to send message:', error);
        finishStreaming();
      }
    }
  }, [
    inputValue,
    streaming.isStreaming,
    activeSessionId,
    activeSession,
    selectedModel,
    useTools,
    addMessage,
    startStreaming,
    appendStreamContent,
    setActiveToolCalls,
    finishStreaming,
    buildSystemPrompt,
  ]);

  // Handle keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render tool call status
  const renderToolCall = (
    toolCall: NonNullable<ChatMessage['toolCalls']>[0],
    showResult = true,
  ) => {
    const hasResult = toolCall.result !== undefined;
    const isError =
      toolCall.result &&
      typeof toolCall.result === 'object' &&
      'error' in toolCall.result;

    return (
      <div
        key={toolCall.id}
        className={`mb-2 p-3 rounded-lg border ${
          !hasResult
            ? 'border-blue-300 dark:border-blue-700'
            : isError
              ? 'border-red-300 dark:border-red-700'
              : 'border-green-300 dark:border-green-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {hasResult ? (isError ? '❌' : '✅') : '🔄'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              !hasResult
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : isError
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                  : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
            }`}
          >
            {!hasResult ? 'running' : isError ? 'error' : 'completed'}
          </span>
          <span className="font-mono font-semibold">{toolCall.name}</span>
        </div>

        {Object.keys(toolCall.arguments).length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Arguments
            </summary>
            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </details>
        )}

        {showResult && toolCall.result !== undefined && (
          <details className="mt-2" open>
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Result
            </summary>
            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
              {typeof toolCall.result === 'string'
                ? toolCall.result
                : JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  // Render message tool calls
  const renderMessageToolCalls = (toolCalls: ChatMessage['toolCalls']) => {
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
      <div className="mt-2 border-t border-border pt-2">
        <div className="text-xs text-muted-foreground mb-2">
          Tool Calls ({toolCalls.length})
        </div>
        {toolCalls.map((tc) => renderToolCall(tc))}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 border-r border-border bg-muted/30 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Ollama Code</h2>
          </div>

          {/* Model selector */}
          <div className="p-4 border-b border-border">
            <label className="text-sm text-muted-foreground mb-2 block">
              Model
            </label>
            {isLoadingModels ? (
              <div className="text-sm text-muted-foreground">
                Loading models...
              </div>
            ) : (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Skill selector */}
          <div className="p-4 border-b border-border">
            <label className="text-sm text-muted-foreground mb-2 block">
              Skill (System Prompt)
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => {
                setSelectedSkill(e.target.value);
                setSelectedAgent(''); // Clear agent when skill selected
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
            >
              <option value="">None</option>
              {skills.map((skill) => (
                <option key={skill.name} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>

          {/* Agent selector */}
          <div className="p-4 border-b border-border">
            <label className="text-sm text-muted-foreground mb-2 block">
              Agent (Subagent)
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                setSelectedSkill(''); // Clear skill when agent selected
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
            >
              <option value="">None</option>
              {agents.map((agent) => (
                <option key={agent.name} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tools toggle */}
          <div className="p-4 border-b border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useTools}
                onChange={(e) => setUseTools(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable Tool Execution</span>
            </label>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
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

          {/* New chat button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                const id = createSession(selectedModel);
                setActiveSession(id);
              }}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              New Chat
            </button>
          </div>
        </aside>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="font-semibold">
            {activeSession?.title || 'New Chat'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {useTools && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Tools
              </span>
            )}
            {selectedSkill && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {selectedSkill}
              </span>
            )}
            {selectedAgent && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                {selectedAgent}
              </span>
            )}
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                isConnected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {activeSession?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'assistant' && message.thinking && (
                  <details className="mb-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Thinking...
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {message.thinking}
                    </pre>
                  </details>
                )}
                {message.content && (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                {message.role === 'assistant' &&
                  renderMessageToolCalls(message.toolCalls)}
              </div>
            </div>
          ))}

          {/* Active tool calls being executed */}
          {streaming.activeToolCalls &&
            streaming.activeToolCalls.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-muted border border-border">
                  <div className="text-sm font-medium mb-2 text-muted-foreground">
                    Executing Tools...
                  </div>
                  {streaming.activeToolCalls.map((tc) =>
                    renderToolCall(tc, false),
                  )}
                </div>
              </div>
            )}

          {/* Streaming response */}
          {streaming.isStreaming &&
            streaming.currentContent &&
            (!streaming.activeToolCalls ||
              streaming.activeToolCalls.length === 0) && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2 rounded-lg bg-muted">
                  <div className="whitespace-pre-wrap">
                    {streaming.currentContent}
                  </div>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
              disabled={streaming.isStreaming}
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
                disabled={!inputValue.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
