/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useSuggestionEngineStore,
  type FileAccessRecord,
} from '../services/SuggestionEngine.js';

/**
 * Options for the useRecentFiles hook
 */
export interface UseRecentFilesOptions {
  /** Maximum number of recent files to return */
  limit?: number;
  /** Whether to automatically track files from file search patterns */
  autoTrackFromPatterns?: boolean;
  /** Filter by file extension (e.g., '.ts', '.js') */
  filterByExtension?: string | string[];
  /** Filter by directory */
  filterByDirectory?: string;
  /** Minimum access count to include */
  minAccessCount?: number;
  /** Maximum age in milliseconds */
  maxAge?: number;
}

/**
 * Return type for useRecentFiles hook
 */
export interface UseRecentFilesReturn {
  /** List of recent file records */
  recentFiles: FileAccessRecord[];
  /** Record a file access */
  recordFileAccess: (path: string, context?: string) => void;
  /** Get the most recently accessed file */
  getMostRecentFile: () => FileAccessRecord | undefined;
  /** Get files accessed within a time window */
  getFilesAccessedWithin: (ms: number) => FileAccessRecord[];
  /** Check if a file is in recent history */
  isRecentlyAccessed: (path: string) => boolean;
  /** Get access count for a file */
  getAccessCount: (path: string) => number;
  /** Clear all recent file history */
  clearRecentFiles: () => void;
  /** Get files matching a pattern */
  getFilesByPattern: (pattern: string | RegExp) => FileAccessRecord[];
  /** Get files with a specific context */
  getFilesByContext: (context: string) => FileAccessRecord[];
}

/**
 * Hook for tracking and accessing recently accessed files
 * 
 * This hook provides utilities for:
 * - Recording file accesses with context
 * - Retrieving recent files with various filters
 * - Checking file access patterns
 * 
 * @example
 * ```tsx
 * const { recentFiles, recordFileAccess } = useRecentFiles({
 *   limit: 10,
 *   filterByExtension: '.ts',
 * });
 * 
 * // Record a file access
 * recordFileAccess('/src/components/Button.tsx', 'editing');
 * 
 * // Get recent files
 * console.log(recentFiles);
 * ```
 */
export function useRecentFiles(options: UseRecentFilesOptions = {}): UseRecentFilesReturn {
  const {
    limit = 20,
    filterByExtension,
    filterByDirectory,
    minAccessCount = 0,
    maxAge,
  } = options;

  const store = useSuggestionEngineStore();

  // Track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Record a file access
   */
  const recordFileAccess = useCallback((path: string, context?: string) => {
    if (!isMountedRef.current) return;
    store.recordFileAccess(path, context);
  }, [store]);

  /**
   * Get filtered recent files
   */
  const recentFiles = useMemo(() => {
    let files = store.recentFiles.slice(0, limit * 2); // Get extra for filtering

    // Filter by extension
    if (filterByExtension) {
      const extensions = Array.isArray(filterByExtension)
        ? filterByExtension
        : [filterByExtension];
      files = files.filter(f =>
        extensions.some(ext => f.path.endsWith(ext))
      );
    }

    // Filter by directory
    if (filterByDirectory) {
      files = files.filter(f => f.path.startsWith(filterByDirectory));
    }

    // Filter by minimum access count
    if (minAccessCount > 0) {
      files = files.filter(f => f.accessCount >= minAccessCount);
    }

    // Filter by maximum age
    if (maxAge) {
      const cutoff = Date.now() - maxAge;
      files = files.filter(f => f.lastAccessed >= cutoff);
    }

    return files.slice(0, limit);
  }, [
    store.recentFiles,
    limit,
    filterByExtension,
    filterByDirectory,
    minAccessCount,
    maxAge,
  ]);

  /**
   * Get the most recently accessed file
   */
  const getMostRecentFile = useCallback(() => store.recentFiles[0], [store.recentFiles]);

  /**
   * Get files accessed within a time window
   */
  const getFilesAccessedWithin = useCallback((ms: number): FileAccessRecord[] => {
    const cutoff = Date.now() - ms;
    return store.recentFiles.filter(f => f.lastAccessed >= cutoff);
  }, [store.recentFiles]);

  /**
   * Check if a file is in recent history
   */
  const isRecentlyAccessed = useCallback((path: string) => store.recentFiles.some(f => f.path === path), [store.recentFiles]);

  /**
   * Get access count for a file
   */
  const getAccessCount = useCallback((path: string): number => {
    const file = store.recentFiles.find(f => f.path === path);
    return file?.accessCount ?? 0;
  }, [store.recentFiles]);

  /**
   * Clear all recent file history
   */
  const clearRecentFiles = useCallback(() => {
    store.clearHistory();
  }, [store]);

  /**
   * Get files matching a pattern
   */
  const getFilesByPattern = useCallback((pattern: string | RegExp): FileAccessRecord[] => {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern, 'i')
      : pattern;
    return store.recentFiles.filter(f => regex.test(f.path));
  }, [store.recentFiles]);

  /**
   * Get files with a specific context
   */
  const getFilesByContext = useCallback((context: string): FileAccessRecord[] => {
    const normalizedContext = context.toLowerCase();
    return store.recentFiles.filter(
      f => f.context?.toLowerCase().includes(normalizedContext)
    );
  }, [store.recentFiles]);

  return {
    recentFiles,
    recordFileAccess,
    getMostRecentFile,
    getFilesAccessedWithin,
    isRecentlyAccessed,
    getAccessCount,
    clearRecentFiles,
    getFilesByPattern,
    getFilesByContext,
  };
}

/**
 * Hook for tracking current file being edited
 * 
 * @example
 * ```tsx
 * const { currentFile, setCurrentFile } = useCurrentFile();
 * 
 * // Set current file when user navigates
 * setCurrentFile('/src/components/Button.tsx');
 * ```
 */
export function useCurrentFile() {
  const currentFileRef = useRef<string | undefined>(undefined);
  const { recordFileAccess } = useRecentFiles();

  const setCurrentFile = useCallback((path: string | undefined) => {
    currentFileRef.current = path;
    if (path) {
      recordFileAccess(path, 'current');
    }
  }, [recordFileAccess]);

  const getCurrentFile = useCallback(() => currentFileRef.current, []);

  return {
    currentFile: currentFileRef.current,
    setCurrentFile,
    getCurrentFile,
  };
}

/**
 * Hook for batch recording file accesses
 * 
 * @example
 * ```tsx
 * const { recordBatch } = useBatchFileAccess();
 * 
 * // Record multiple files at once
 * recordBatch([
 *   { path: '/src/a.ts', context: 'import' },
 *   { path: '/src/b.ts', context: 'import' },
 * ]);
 * ```
 */
export function useBatchFileAccess() {
  const { recordFileAccess } = useRecentFiles();

  const recordBatch = useCallback((files: Array<{ path: string; context?: string }>) => {
    for (const file of files) {
      recordFileAccess(file.path, file.context);
    }
  }, [recordFileAccess]);

  return { recordBatch };
}
