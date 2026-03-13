/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

/**
 * Agents Panel Component
 *
 * Displays and manages subagents from Core SubagentManager
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, RefreshCw, Bot, Play } from 'lucide-react';

interface Agent {
  name: string;
  description: string;
  model?: string;
  tools?: string[];
  level: 'session' | 'project' | 'user' | 'extension' | 'builtin';
  path: string;
}

interface AgentsPanelProps {
  onSelectAgent?: (agent: Agent) => void;
  onRunAgent?: (agent: Agent) => void;
}

export function AgentsPanel({ onSelectAgent, onRunAgent }: AgentsPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tools, setTools] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to load agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name) return;

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          model: model || undefined,
          systemPrompt: systemPrompt || undefined,
          tools: tools ? tools.split(',').map((t) => t.trim()) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create agent');

      await loadAgents();
      setShowCreate(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    }
  };

  const handleUpdate = async () => {
    if (!editingAgent) return;

    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingAgent.name,
          description,
          model: model || undefined,
          systemPrompt: systemPrompt || undefined,
          tools: tools ? tools.split(',').map((t) => t.trim()) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update agent');

      await loadAgents();
      setEditingAgent(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    }
  };

  const handleDelete = async (agentName: string) => {
    if (!confirm(`Delete agent "${agentName}"?`)) return;

    try {
      const response = await fetch(
        `/api/agents?name=${encodeURIComponent(agentName)}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Failed to delete agent');

      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setDescription(agent.description || '');
    setModel(agent.model || '');
    setSystemPrompt('');
    setTools(agent.tools?.join(', ') || '');
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setModel('');
    setSystemPrompt('');
    setTools('');
  };

  const getLevelColor = (level: Agent['level']) => {
    switch (level) {
      case 'session':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'project':
        return 'bg-blue-500/20 text-blue-400';
      case 'user':
        return 'bg-green-500/20 text-green-400';
      case 'extension':
        return 'bg-purple-500/20 text-purple-400';
      case 'builtin':
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Agents
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadAgents}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Create Agent"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 m-4 bg-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Agents List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {agents.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No agents available
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.name}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => onSelectAgent?.(agent)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{agent.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${getLevelColor(
                      agent.level,
                    )}`}
                  >
                    {agent.level}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunAgent?.(agent);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    title="Run Agent"
                  >
                    <Play className="w-4 h-4 text-green-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(agent);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(agent.name);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              {agent.description && (
                <p className="text-sm text-gray-400 mt-1">
                  {agent.description}
                </p>
              )}
              {agent.model && (
                <p className="text-xs text-gray-500 mt-1">
                  Model: {agent.model}
                </p>
              )}
              {agent.tools && agent.tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-xs"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingAgent) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingAgent ? `Edit: ${editingAgent.name}` : 'Create New Agent'}
            </h3>

            {!editingAgent && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
                  placeholder="agent-name"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
                placeholder="Brief description"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Model (optional)
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
                placeholder="llama3.2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white font-mono text-sm"
                rows={6}
                placeholder="You are a specialized agent..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Tools (comma-separated)
              </label>
              <input
                type="text"
                value={tools}
                onChange={(e) => setTools(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
                placeholder="read_file, write_file, execute_shell"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditingAgent(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={editingAgent ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
              >
                {editingAgent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentsPanel;
