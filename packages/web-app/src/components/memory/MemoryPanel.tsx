/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Memory file info
 */
interface MemoryFileInfo {
  path: string;
  relativePath: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
}

/**
 * Memory content response
 */
interface MemoryContentResponse {
  content: string;
  files: MemoryFileInfo[];
  fileCount: number;
}

/**
 * Memory Panel component
 *
 * Displays and manages hierarchical memory (OLLAMA.md files)
 */
export function MemoryPanel() {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<MemoryFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Load memory content
   */
  const loadMemory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/memory');
      if (!response.ok) {
        throw new Error('Failed to load memory');
      }

      const data: MemoryContentResponse = await response.json();
      setContent(data.content);
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load memory on mount
   */
  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  /**
   * Start editing a file
   */
  const startEdit = async (filePath: string) => {
    try {
      const response = await fetch(`/api/memory?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const data = await response.json();
        setEditingFile(filePath);
        setEditContent(data.content || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    }
  };

  /**
   * Save edited content
   */
  const saveEdit = async () => {
    if (!editingFile) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editingFile, content: editContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to save memory');
      }

      setEditingFile(null);
      setEditContent('');
      await loadMemory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingFile(null);
    setEditContent('');
  };

  /**
   * Create new memory file
   */
  const createMemoryFile = async (filePath: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: '# Ollama Code Memory\n\nAdd your context and instructions here.\n',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create memory file');
      }

      await loadMemory();
      startEdit(filePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memory file');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Format file size
   */
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Memory Bank</h2>
        <p className="text-sm text-muted-foreground">
          Hierarchical context files (OLLAMA.md)
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-muted-foreground hover:text-foreground mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* File list */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Memory Files</h3>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      file.exists ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-mono text-sm truncate">
                    {file.relativePath || file.path}
                  </span>
                </div>
                {file.exists && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatSize(file.size)}
                    {file.lastModified && (
                      <span className="ml-2">
                        • Modified {new Date(file.lastModified).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.exists ? (
                  <button
                    onClick={() => startEdit(file.path)}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => createMemoryFile(file.path)}
                    className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                  >
                    Create
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      {editingFile && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Editing</h3>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                {editingFile}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 min-h-0">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full p-3 bg-background border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="# Ollama Code Memory

Add context, instructions, and preferences here..."
              disabled={isSaving}
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {!editingFile && content && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium">Combined Memory Content</h3>
            <p className="text-xs text-muted-foreground">
              Concatenated from {files.filter((f) => f.exists).length} file(s)
            </p>
          </div>
          <div className="flex-1 p-4 overflow-auto min-h-0">
            <pre className="text-sm font-mono whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
              {content || 'No memory content found. Create an OLLAMA.md file to add context.'}
            </pre>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!editingFile && !content && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">No Memory Files</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an OLLAMA.md file to add persistent context for your sessions.
            </p>
            <button
              onClick={() => {
                const homePath = files.find((f) => f.relativePath.includes('.ollama-code'))?.path;
                if (homePath) createMemoryFile(homePath);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Create Global Memory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemoryPanel;
