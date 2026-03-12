/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Tool definition type
 */
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
  category: string;
  enabled: boolean;
}

/**
 * Tool execution result
 */
interface ToolExecution {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  timestamp: number;
}

/**
 * Tools Panel Component
 */
export function ToolsPanel() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [_executions, _setExecutions] = useState<ToolExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>(
    'available',
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load tools
  useEffect(() => {
    async function loadTools() {
      try {
        const response = await fetch('/api/tools');
        if (response.ok) {
          const data = await response.json();
          setTools(data.tools || []);
        }
      } catch (error) {
        console.error('Failed to load tools:', error);
        // Set demo tools for preview
        setTools([
          {
            name: 'read_file',
            description: 'Read contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
              },
            },
            category: 'file',
            enabled: true,
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'Content to write' },
              },
            },
            category: 'file',
            enabled: true,
          },
          {
            name: 'edit_file',
            description: 'Edit a file with diff',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
              },
            },
            category: 'file',
            enabled: true,
          },
          {
            name: 'list_directory',
            description: 'List directory contents',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Directory path' },
              },
            },
            category: 'file',
            enabled: true,
          },
          {
            name: 'execute_shell',
            description: 'Execute a shell command',
            inputSchema: {
              type: 'object',
              properties: {
                command: { type: 'string', description: 'Command to execute' },
              },
            },
            category: 'shell',
            enabled: true,
          },
          {
            name: 'web_search',
            description: 'Search the web',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
              },
            },
            category: 'web',
            enabled: true,
          },
          {
            name: 'web_fetch',
            description: 'Fetch content from URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to fetch' },
              },
            },
            category: 'web',
            enabled: true,
          },
          {
            name: 'grep',
            description: 'Search files with pattern',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: { type: 'string', description: 'Search pattern' },
              },
            },
            category: 'search',
            enabled: true,
          },
          {
            name: 'glob',
            description: 'Find files by pattern',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: { type: 'string', description: 'Glob pattern' },
              },
            },
            category: 'search',
            enabled: true,
          },
          {
            name: 'git_status',
            description: 'Get git repository status',
            inputSchema: { type: 'object', properties: {} },
            category: 'git',
            enabled: true,
          },
          {
            name: 'git_diff',
            description: 'Get git diff',
            inputSchema: { type: 'object', properties: {} },
            category: 'git',
            enabled: true,
          },
          {
            name: 'save_memory',
            description: 'Save information to memory',
            inputSchema: {
              type: 'object',
              properties: {
                content: { type: 'string', description: 'Content to remember' },
              },
            },
            category: 'memory',
            enabled: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTools();
  }, []);

  // Get unique categories
  const categories = ['all', ...new Set(tools.map((t) => t.category))];

  // Filter tools
  const filteredTools = tools.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Toggle tool
  const toggleTool = async (name: string, enabled: boolean) => {
    try {
      await fetch(`/api/tools/${name}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      setTools(tools.map((t) => (t.name === name ? { ...t, enabled } : t)));
    } catch (error) {
      console.error('Failed to toggle tool:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading tools...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-md"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-md"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'available'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Available ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            History ({_executions.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'available' && (
          <div className="grid gap-3">
            {filteredTools.map((tool) => (
              <div
                key={tool.name}
                className="p-4 border border-border rounded-lg bg-card flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-semibold">
                      {tool.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">
                      {tool.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tool.description}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Parameters:{' '}
                    {Object.keys(tool.inputSchema.properties || {}).join(
                      ', ',
                    ) || 'None'}
                  </div>
                </div>
                <button
                  onClick={() => toggleTool(tool.name, !tool.enabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    tool.enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      tool.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
            {filteredTools.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No tools found
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {_executions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No tool executions yet
              </div>
            ) : (
              _executions.map((exec) => (
                <div
                  key={exec.id}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{exec.tool}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        exec.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : exec.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : exec.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {exec.status}
                    </span>
                  </div>
                  <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                    {JSON.stringify(exec.input, null, 2)}
                  </pre>
                  {exec.output !== undefined && (
                    <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                      {String(
                        typeof exec.output === 'string'
                          ? exec.output
                          : JSON.stringify(exec.output, null, 2),
                      )}
                    </pre>
                  )}
                  {exec.error && (
                    <p className="text-xs text-destructive mt-2">
                      {exec.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolsPanel;
