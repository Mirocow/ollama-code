/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SessionMetrics } from '@ollama-code/ollama-code-core';
import { uiTelemetryService } from '@ollama-code/ollama-code-core';

/**
 * Session store state interface
 */
export interface SessionStoreState {
  sessionId: string;
  sessionStartTime: Date;
  metrics: SessionMetrics;
  lastPromptTokenCount: number;
  promptCount: number;
  
  // Actions
  startNewSession: (sessionId: string) => void;
  startNewPrompt: () => void;
  getPromptCount: () => number;
  updateFromTelemetry: (data: { metrics: SessionMetrics; lastPromptTokenCount: number }) => void;
  reset: () => void;
}

/**
 * Default session state
 */
const createDefaultState = (sessionId: string = ''): Omit<SessionStoreState, 'startNewSession' | 'startNewPrompt' | 'getPromptCount' | 'updateFromTelemetry' | 'reset'> => ({
  sessionId,
  sessionStartTime: new Date(),
  metrics: uiTelemetryService.getMetrics(),
  lastPromptTokenCount: 0,
  promptCount: 0,
});

/**
 * Session Store - Manages session-related state
 * 
 * Uses subscribeWithSelector middleware for optimized subscriptions.
 * Components can subscribe to specific parts of the state:
 * 
 * @example
 * // Only re-renders when lastPromptTokenCount changes
 * const tokenCount = useSessionStore(state => state.lastPromptTokenCount);
 * 
 * @example
 * // Subscribe to multiple values with selector
 * const tokenInfo = useSessionStore(state => ({
 *   prompt: state.lastPromptTokenCount,
 *   total: state.metrics.totalPromptTokens,
 * }));
 */
export const sessionStore = create<SessionStoreState>()(
  subscribeWithSelector((set, get) => ({
    ...createDefaultState(),

    startNewSession: (sessionId: string) => {
      set({
        ...createDefaultState(sessionId),
        lastPromptTokenCount: uiTelemetryService.getLastPromptTokenCount(),
      });
    },

    startNewPrompt: () => {
      set(state => ({
        promptCount: state.promptCount + 1,
      }));
    },

    getPromptCount: () => get().promptCount,

    updateFromTelemetry: (data: { metrics: SessionMetrics; lastPromptTokenCount: number }) => {
      const currentState = get();
      
      // Only update if values actually changed (prevents unnecessary re-renders)
      if (
        currentState.lastPromptTokenCount !== data.lastPromptTokenCount ||
        JSON.stringify(currentState.metrics) !== JSON.stringify(data.metrics)
      ) {
        set({
          metrics: data.metrics,
          lastPromptTokenCount: data.lastPromptTokenCount,
        });
      }
    },

    reset: () => {
      set(createDefaultState());
    },
  }))
);

/**
 * Hook for using the session store
 * 
 * @example
 * // Get the entire state (not recommended - causes re-renders on any change)
 * const state = useSessionStore();
 * 
 * @example
 * // Get specific value (recommended - only re-renders when that value changes)
 * const tokenCount = useSessionStore(state => state.lastPromptTokenCount);
 */
export const useSessionStore = sessionStore;

/**
 * Initialize telemetry subscription
 * Call this once in your app initialization
 */
export function initializeSessionTelemetry(): () => void {
  const handleUpdate = (data: unknown) => {
    const { metrics, lastPromptTokenCount } = data as {
      metrics: SessionMetrics;
      lastPromptTokenCount: number;
    };
    sessionStore.getState().updateFromTelemetry({ metrics, lastPromptTokenCount });
  };

  uiTelemetryService.on('update', handleUpdate);
  
  // Set initial state
  handleUpdate({
    metrics: uiTelemetryService.getMetrics(),
    lastPromptTokenCount: uiTelemetryService.getLastPromptTokenCount(),
  });

  return () => {
    uiTelemetryService.off('update', handleUpdate);
  };
}
