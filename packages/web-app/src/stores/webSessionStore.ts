/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Session Store - Manages chat sessions for the web UI.
 *
 * @module stores/webSessionStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Chat message type
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** Tool calls if any */
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }>;
  /** Thinking content for thinking models */
  thinking?: string;
}

/**
 * Session type
 */
export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
  /** Context for KV-cache reuse */
  context?: number[];
}

/**
 * Streaming state
 */
export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  thinkingContent?: string;
  abortController?: AbortController;
}

/**
 * Store state
 */
interface WebSessionState {
  // Sessions
  sessions: Map<string, Session>;
  activeSessionId: string | null;

  // Streaming
  streaming: StreamingState;

  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';

  // Selected model
  selectedModel: string;

  // Actions
  createSession: (model: string) => string;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  addMessage: (
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ) => void;
  updateMessage: (
    sessionId: string,
    messageId: string,
    updates: Partial<ChatMessage>,
  ) => void;
  clearSession: (sessionId: string) => void;

  // Streaming actions
  startStreaming: (abortController: AbortController) => void;
  appendStreamContent: (content: string) => void;
  setThinkingContent: (content: string) => void;
  finishStreaming: () => void;
  cancelStreaming: () => void;

  // UI actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSelectedModel: (model: string) => void;

  // Context caching
  setSessionContext: (sessionId: string, context: number[]) => void;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Web Session Store
 */
export const useWebSessionStore = create<WebSessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: new Map(),
      activeSessionId: null,
      streaming: {
        isStreaming: false,
        currentContent: '',
      },
      sidebarOpen: true,
      theme: 'system',
      selectedModel: 'llama3.2',

      // Session actions
      createSession: (model) => {
        const id = generateId();
        const session: Session = {
          id,
          title: 'New Chat',
          messages: [],
          model,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => {
          const sessions = new Map(state.sessions);
          sessions.set(id, session);
          return { sessions, activeSessionId: id };
        });

        return id;
      },

      deleteSession: (id) => {
        set((state) => {
          const sessions = new Map(state.sessions);
          sessions.delete(id);
          return {
            sessions,
            activeSessionId:
              state.activeSessionId === id ? null : state.activeSessionId,
          };
        });
      },

      setActiveSession: (id) => {
        set({ activeSessionId: id });
      },

      addMessage: (sessionId, message) => {
        const fullMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        };

        set((state) => {
          const sessions = new Map(state.sessions);
          const session = sessions.get(sessionId);
          if (session) {
            session.messages = [...session.messages, fullMessage];
            session.updatedAt = Date.now();
            // Update title from first user message
            if (message.role === 'user' && session.messages.length === 1) {
              session.title =
                message.content.slice(0, 50) +
                (message.content.length > 50 ? '...' : '');
            }
            sessions.set(sessionId, { ...session });
          }
          return { sessions };
        });
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => {
          const sessions = new Map(state.sessions);
          const session = sessions.get(sessionId);
          if (session) {
            session.messages = session.messages.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg,
            );
            session.updatedAt = Date.now();
            sessions.set(sessionId, { ...session });
          }
          return { sessions };
        });
      },

      clearSession: (sessionId) => {
        set((state) => {
          const sessions = new Map(state.sessions);
          const session = sessions.get(sessionId);
          if (session) {
            session.messages = [];
            session.context = undefined;
            session.updatedAt = Date.now();
            sessions.set(sessionId, { ...session });
          }
          return { sessions };
        });
      },

      // Streaming actions
      startStreaming: (abortController) => {
        set({
          streaming: {
            isStreaming: true,
            currentContent: '',
            abortController,
          },
        });
      },

      appendStreamContent: (content) => {
        set((state) => ({
          streaming: {
            ...state.streaming,
            currentContent: state.streaming.currentContent + content,
          },
        }));
      },

      setThinkingContent: (content) => {
        set((state) => ({
          streaming: {
            ...state.streaming,
            thinkingContent: content,
          },
        }));
      },

      finishStreaming: () => {
        const { streaming, activeSessionId } = get();

        if (activeSessionId && streaming.currentContent) {
          // Add assistant message to session
          get().addMessage(activeSessionId, {
            role: 'assistant',
            content: streaming.currentContent,
            thinking: streaming.thinkingContent,
          });
        }

        set({
          streaming: {
            isStreaming: false,
            currentContent: '',
          },
        });
      },

      cancelStreaming: () => {
        const { streaming } = get();
        streaming.abortController?.abort();

        set({
          streaming: {
            isStreaming: false,
            currentContent: '',
          },
        });
      },

      // UI actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setTheme: (theme) => {
        set({ theme });
      },

      setSelectedModel: (model) => {
        set({ selectedModel: model });
      },

      // Context caching
      setSessionContext: (sessionId, context) => {
        set((state) => {
          const sessions = new Map(state.sessions);
          const session = sessions.get(sessionId);
          if (session) {
            session.context = context;
            sessions.set(sessionId, { ...session });
          }
          return { sessions };
        });
      },
    }),
    {
      name: 'ollama-code-web-sessions',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: Array.from(state.sessions.entries()),
        activeSessionId: state.activeSessionId,
        theme: state.theme,
        selectedModel: state.selectedModel,
      }),
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          Array.isArray(
            (state as unknown as { sessions: Array<[string, Session]> }).sessions,
          )
        ) {
          // Convert array back to Map after rehydration
          const sessionsArray = (
            state as unknown as { sessions: Array<[string, Session]> }
          ).sessions;
          (state as WebSessionState).sessions = new Map(sessionsArray);
        }
      },
    },
  ),
);

export default useWebSessionStore;
