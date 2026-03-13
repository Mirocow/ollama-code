/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

/**
 * Skills Panel Component
 *
 * Displays and manages skills from Core SkillManager
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, RefreshCw, Code } from 'lucide-react';

interface Skill {
  name: string;
  description: string;
  level: 'project' | 'user' | 'extension' | 'builtin';
  path: string;
}

interface SkillsPanelProps {
  onSelectSkill?: (skill: Skill) => void;
}

export function SkillsPanel({ onSelectSkill }: SkillsPanelProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/skills');
      if (!response.ok) throw new Error('Failed to load skills');
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !content) return;

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, description }),
      });

      if (!response.ok) throw new Error('Failed to create skill');

      await loadSkills();
      setShowCreate(false);
      setName('');
      setContent('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create skill');
    }
  };

  const handleUpdate = async () => {
    if (!editingSkill || !content) return;

    try {
      const response = await fetch('/api/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingSkill.name,
          content,
          description,
        }),
      });

      if (!response.ok) throw new Error('Failed to update skill');

      await loadSkills();
      setEditingSkill(null);
      setContent('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update skill');
    }
  };

  const handleDelete = async (skillName: string) => {
    if (!confirm(`Delete skill "${skillName}"?`)) return;

    try {
      const response = await fetch(`/api/skills?name=${encodeURIComponent(skillName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete skill');

      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill');
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setContent(''); // Would need to load skill content from API
    setDescription(skill.description);
  };

  const getLevelColor = (level: Skill['level']) => {
    switch (level) {
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
          <Code className="w-5 h-5" />
          Skills
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadSkills}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Create Skill"
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

      {/* Skills List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {skills.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No skills available
          </div>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.name}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => onSelectSkill?.(skill)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{skill.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${getLevelColor(
                      skill.level,
                    )}`}
                  >
                    {skill.level}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(skill);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(skill.name);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              {skill.description && (
                <p className="text-sm text-gray-400 mt-1">
                  {skill.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingSkill) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingSkill ? `Edit: ${editingSkill.name}` : 'Create New Skill'}
            </h3>

            {!editingSkill && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
                  placeholder="skill-name"
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
                Content (Markdown)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white font-mono text-sm"
                rows={10}
                placeholder="# Skill instructions..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditingSkill(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={editingSkill ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
              >
                {editingSkill ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillsPanel;
