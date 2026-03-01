/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Monaco editor - dynamically imported to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center">Loading editor...</div> }
);

/**
 * File system item type
 */
interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
}

/**
 * Directory listing type
 */
interface DirectoryListing {
  path: string;
  type: 'directory';
  items: FileItem[];
}

/**
 * File content type
 */
interface FileContent {
  path: string;
  type: 'file';
  name: string;
  content: string;
  size: number;
  extension: string;
}

/**
 * Get language from file extension
 */
function getLanguageFromExtension(extension: string): string {
  const mapping: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.sh': 'shell',
    '.bash': 'shell',
    '.sql': 'sql',
    '.dockerfile': 'dockerfile',
    '.makefile': 'makefile',
  };

  return mapping[extension.toLowerCase()] || 'plaintext';
}

/**
 * File Explorer Component
 */
export function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch directory listing
  const fetchDirectory = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to load directory');
      }

      const data: DirectoryListing = await response.json();
      setItems(data.items);
      setCurrentPath(path);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch file content
  const fetchFile = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to load file');
      }

      const data: FileContent = await response.json();
      setSelectedFile(data);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save file
  const saveFile = useCallback(async () => {
    if (!selectedFile || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/fs?path=${encodeURIComponent(selectedFile.path)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: selectedFile.content }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save file');
      }

      setHasUnsavedChanges(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, hasUnsavedChanges]);

  // Handle editor content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      setSelectedFile({ ...selectedFile, content: value });
      setHasUnsavedChanges(true);
    }
  }, [selectedFile]);

  // Handle item click
  const handleItemClick = useCallback((item: FileItem) => {
    if (item.type === 'directory') {
      fetchDirectory(item.path);
    } else {
      fetchFile(item.path);
    }
  }, [fetchDirectory, fetchFile]);

  // Navigate up
  const navigateUp = useCallback(() => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    fetchDirectory(parentPath);
  }, [currentPath, fetchDirectory]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  // Initial load
  useEffect(() => {
    fetchDirectory('/');
  }, [fetchDirectory]);

  return (
    <div className="flex h-full">
      {/* File tree sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-border flex items-center px-4 gap-2">
          <button
            onClick={navigateUp}
            disabled={currentPath === '/'}
            className="p-1.5 hover:bg-muted rounded disabled:opacity-50"
            title="Go up"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <span className="text-sm truncate flex-1" title={currentPath}>
            {currentPath}
          </span>
          <button
            onClick={() => fetchDirectory(currentPath)}
            className="p-1.5 hover:bg-muted rounded"
            title="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground p-2">Loading...</div>
          ) : error ? (
            <div className="text-sm text-destructive p-2">{error}</div>
          ) : (
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                    selectedFile?.path === item.path ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  {item.type === 'directory' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2.0 2.0 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  )}
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">Empty directory</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            {/* Editor header */}
            <div className="h-12 border-b border-border flex items-center px-4 gap-4">
              <span className="text-sm font-medium">{selectedFile.name}</span>
              {hasUnsavedChanges && (
                <span className="text-xs text-muted-foreground">(unsaved)</span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedFile.size} bytes
                </span>
                <button
                  onClick={saveFile}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Monaco editor */}
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={getLanguageFromExtension(selectedFile.extension)}
                value={selectedFile.content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a file to view or edit
          </div>
        )}
      </div>
    </div>
  );
}

export default FileExplorer;
