/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * MCP Server type
 */
interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: string[];
  resources: string[];
  error?: string;
}

/**
 * MCP Panel Component
 */
export function MCPPanel() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'stdio' as MCPServer['type'],
    command: '',
    args: '',
    url: '',
  });

  // Load MCP servers
  useEffect(() => {
    async function loadServers() {
      try {
        const response = await fetch('/api/mcp');
        if (response.ok) {
          const data = await response.json();
          setServers(data.servers || []);
        }
      } catch (error) {
        console.error('Failed to load MCP servers:', error);
        // Set demo servers for preview
        setServers([
          {
            id: '1',
            name: 'filesystem',
            type: 'stdio',
            command: 'mcp-filesystem',
            args: ['/home/user/projects'],
            status: 'connected',
            tools: ['read_file', 'write_file', 'list_directory'],
            resources: ['file://'],
          },
          {
            id: '2',
            name: 'github',
            type: 'http',
            url: 'https://api.github.com/mcp',
            status: 'connected',
            tools: ['search_repos', 'get_issue', 'create_pr'],
            resources: ['github://'],
          },
          {
            id: '3',
            name: 'postgres',
            type: 'stdio',
            command: 'mcp-postgres',
            args: ['postgresql://localhost/mydb'],
            status: 'disconnected',
            tools: [],
            resources: [],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadServers();
  }, []);

  // Add or update server
  const saveServer = async () => {
    const serverData: Partial<MCPServer> = {
      name: formData.name,
      type: formData.type,
      ...(formData.type === 'stdio'
        ? {
            command: formData.command,
            args: formData.args.split(' ').filter(Boolean),
          }
        : {
            url: formData.url,
          }),
    };

    try {
      if (editingServer) {
        await fetch(`/api/mcp/${editingServer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serverData),
        });
        setServers(
          servers.map((s) =>
            s.id === editingServer.id ? { ...s, ...serverData } : s,
          ),
        );
      } else {
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serverData),
        });
        const newServer = await response.json();
        setServers([
          ...servers,
          {
            ...serverData,
            id: newServer.id || Date.now().toString(),
            status: 'disconnected',
            tools: [],
            resources: [],
          } as MCPServer,
        ]);
      }
      setShowAddDialog(false);
      setEditingServer(null);
      setFormData({ name: '', type: 'stdio', command: '', args: '', url: '' });
    } catch (error) {
      console.error('Failed to save server:', error);
    }
  };

  // Delete server
  const deleteServer = async (id: string) => {
    try {
      await fetch(`/api/mcp/${id}`, { method: 'DELETE' });
      setServers(servers.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  };

  // Connect/disconnect server
  const toggleConnection = async (id: string, connect: boolean) => {
    try {
      await fetch(`/api/mcp/${id}/${connect ? 'connect' : 'disconnect'}`, {
        method: 'POST',
      });
      setServers(
        servers.map((s) =>
          s.id === id
            ? { ...s, status: connect ? 'connected' : 'disconnected' }
            : s,
        ),
      );
    } catch (error) {
      console.error('Failed to toggle connection:', error);
    }
  };

  // Edit server
  const editServer = (server: MCPServer) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      type: server.type,
      command: server.command || '',
      args: server.args?.join(' ') || '',
      url: server.url || '',
    });
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading MCP servers...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">MCP Servers</h2>
          <p className="text-sm text-muted-foreground">
            Model Context Protocol integration
          </p>
        </div>
        <button
          onClick={() => {
            setEditingServer(null);
            setFormData({
              name: '',
              type: 'stdio',
              command: '',
              args: '',
              url: '',
            });
            setShowAddDialog(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + Add Server
        </button>
      </div>

      {/* Server list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className="p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{server.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        server.status === 'connected'
                          ? 'bg-green-100 text-green-800'
                          : server.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {server.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">
                      {server.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {server.type === 'stdio'
                      ? `${server.command} ${server.args?.join(' ')}`
                      : server.url}
                  </p>
                  {server.tools.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium">Tools: </span>
                      <span className="text-xs text-muted-foreground">
                        {server.tools.join(', ')}
                      </span>
                    </div>
                  )}
                  {server.error && (
                    <p className="text-xs text-destructive mt-2">
                      {server.error}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {server.status === 'connected' ? (
                    <button
                      onClick={() => toggleConnection(server.id, false)}
                      className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleConnection(server.id, true)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                    >
                      Connect
                    </button>
                  )}
                  <button
                    onClick={() => editServer(server)}
                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteServer(server.id)}
                    className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {servers.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No MCP servers configured. Click {'"'}Add Server{'"'} to add one.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingServer ? 'Edit Server' : 'Add MCP Server'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  placeholder="my-server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as MCPServer['type'],
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="stdio">Stdio</option>
                  <option value="http">HTTP</option>
                  <option value="websocket">WebSocket</option>
                </select>
              </div>

              {formData.type === 'stdio' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Command
                    </label>
                    <input
                      type="text"
                      value={formData.command}
                      onChange={(e) =>
                        setFormData({ ...formData, command: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                      placeholder="mcp-server"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Arguments (space-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.args}
                      onChange={(e) =>
                        setFormData({ ...formData, args: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                      placeholder="--arg1 value1 --arg2 value2"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    placeholder="https://example.com/mcp"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingServer(null);
                }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={saveServer}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {editingServer ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MCPPanel;
