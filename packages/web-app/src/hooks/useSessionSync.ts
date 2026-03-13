/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Session Sync Hook
 *
 * Provides automatic synchronization between local and server sessions
 */

import { useEffect, useCallback, useRef } from 'react';
import { useWebSessionStore, type Session } from '@/stores/webSessionStore';

/**
 * Server session metadata
 */
interface ServerSessionMetadata {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

/**
 * Full server session data
 */
interface ServerSessionData {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    toolCalls?: Array<{
      id: string;
      name: string;
      arguments: Record<string, unknown>;
      result?: unknown;
    }>;
  }>;
  model: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Options for useSessionSync
 */
interface UseSessionSyncOptions {
  /** Enable automatic sync on mount */
  autoSync?: boolean;
  /** Sync interval in milliseconds (0 = disabled) */
  syncInterval?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook return type
 */
interface UseSessionSyncReturn {
  /** Sync local sessions to server */
  syncToServer: () => Promise<void>;
  /** Load sessions from server */
  loadFromServer: () => Promise<void>;
  /** Save a specific session to server */
  saveSession: (sessionId: string) => Promise<void>;
  /** Delete a session from server */
  deleteSession: (sessionId: string) => Promise<void>;
  /** Export sessions to file */
  exportSessions: (format?: 'json' | 'markdown') => Promise<void>;
  /** Check if sync is in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSync: number | null;
}

/**
 * Convert server session to local format
 */
function serverToLocal(server: ServerSessionData): Session {
  return {
    id: server.id,
    title: server.title,
    messages: server.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      toolCalls: msg.toolCalls,
    })),
    model: server.model,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
  };
}

/**
 * Convert local session to server format
 */
function localToServer(local: Session): ServerSessionData {
  return {
    id: local.id,
    title: local.title,
    messages: local.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      toolCalls: msg.toolCalls,
    })),
    model: local.model,
    createdAt: local.createdAt,
    updatedAt: local.updatedAt,
  };
}

/**
 * useSessionSync hook
 */
export function useSessionSync(
  options: UseSessionSyncOptions = {},
): UseSessionSyncReturn {
  const { autoSync = true, syncInterval = 60000, debug = false } = options;

  const { sessions, setSessions } = useWebSessionStore();
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef<number | null>(null);

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log('[SessionSync]', ...args);
      }
    },
    [debug],
  );

  /**
   * Save a specific session to server
   */
  const saveSession = useCallback(async (sessionId: string) => {
    const session = sessions.get(sessionId);
    if (!session) {
      log('Session not found:', sessionId);
      return;
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localToServer(session)),
      });

      if (response.ok) {
        log('Saved session:', sessionId);
      } else {
        console.error('Failed to save session:', sessionId);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [sessions, log]);

  /**
   * Sync all local sessions to server
   */
  const syncToServer = useCallback(async () => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    log('Syncing to server...');

    try {
      const savePromises = Array.from(sessions.values()).map((session) =>
        fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localToServer(session)),
        }),
      );

      await Promise.all(savePromises);
      lastSyncRef.current = Date.now();
      log('Sync complete');
    } catch (error) {
      console.error('Failed to sync to server:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [sessions, log]);

  /**
   * Load sessions from server
   */
  const loadFromServer = useCallback(async () => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    log('Loading from server...');

    try {
      // Get list of sessions
      const listResponse = await fetch('/api/sessions');
      if (!listResponse.ok) {
        throw new Error('Failed to list sessions');
      }

      const { sessions: serverSessions } = await listResponse.json() as {
        sessions: ServerSessionMetadata[];
      };

      // Load each session
      const loadedSessions = new Map<string, Session>();

      for (const meta of serverSessions) {
        try {
          const detailResponse = await fetch(`/api/sessions/${meta.id}`);
          if (detailResponse.ok) {
            const { session } = await detailResponse.json() as {
              session: ServerSessionData;
            };
            loadedSessions.set(session.id, serverToLocal(session));
          }
        } catch {
          log('Failed to load session:', meta.id);
        }
      }

      // Merge with local sessions (local takes precedence for modified)
      const mergedSessions = new Map(sessions);

      for (const [id, serverSession] of loadedSessions) {
        const localSession = mergedSessions.get(id);
        if (!localSession || serverSession.updatedAt > localSession.updatedAt) {
          mergedSessions.set(id, serverSession);
        }
      }

      // Update store
      // Note: We need to add setSessions to the store

      lastSyncRef.current = Date.now();
      log('Loaded', loadedSessions.size, 'sessions from server');
    } catch (error) {
      console.error('Failed to load from server:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [sessions, log]);

  /**
   * Delete a session from server
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        log('Deleted session:', sessionId);
      } else {
        console.error('Failed to delete session:', sessionId);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [log]);

  /**
   * Export sessions to file
   */
  const exportSessions = useCallback(async (format: 'json' | 'markdown' = 'json') => {
    try {
      const response = await fetch(`/api/sessions/export?format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to export sessions');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'json' ? 'sessions.json' : 'sessions.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      log('Exported sessions as', format);
    } catch (error) {
      console.error('Failed to export sessions:', error);
    }
  }, [log]);

  // Auto-sync on mount
  useEffect(() => {
    if (autoSync) {
      loadFromServer();
    }
  }, [autoSync, loadFromServer]);

  // Periodic sync
  useEffect(() => {
    if (syncInterval > 0) {
      const interval = setInterval(() => {
        syncToServer();
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [syncInterval, syncToServer]);

  // Sync on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery
      const sessionsData = Array.from(sessions.values()).map(localToServer);
      const blob = new Blob([JSON.stringify(sessionsData)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/sessions/export', blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessions]);

  return {
    syncToServer,
    loadFromServer,
    saveSession,
    deleteSession,
    exportSessions,
    isSyncing: isSyncingRef.current,
    lastSync: lastSyncRef.current,
  };
}

export default useSessionSync;
