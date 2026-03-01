/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Streaming state enum
 */
export enum StreamingState {
  Idle = 'Idle',
  Responding = 'Responding',
  WaitingForConfirmation = 'WaitingForConfirmation',
}

/**
 * Streaming store state interface
 */
export interface StreamingStoreState {
  streamingState: StreamingState;
  isResponding: boolean;
  isWaitingForConfirmation: boolean;
  abortController: AbortController | null;
  
  // Actions
  setStreamingState: (state: StreamingState) => void;
  setIsResponding: (responding: boolean) => void;
  setWaitingForConfirmation: (waiting: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelStream: () => void;
  reset: () => void;
}

/**
 * Streaming Store - Manages streaming-related state
 * 
 * This store handles the streaming lifecycle and provides
 * a clean interface for managing abort controllers and streaming state.
 * 
 * @example
 * // Subscribe to streaming state
 * const isResponding = useStreamingStore(state => state.isResponding);
 * 
 * @example
 * // Cancel current stream
 * useStreamingStore.getState().cancelStream();
 */
export const streamingStore = create<StreamingStoreState>()(
  subscribeWithSelector((set, get) => ({
    streamingState: StreamingState.Idle,
    isResponding: false,
    isWaitingForConfirmation: false,
    abortController: null,

    setStreamingState: (state: StreamingState) => {
      set({
        streamingState: state,
        isResponding: state === StreamingState.Responding,
        isWaitingForConfirmation: state === StreamingState.WaitingForConfirmation,
      });
    },

    setIsResponding: (responding: boolean) => {
      set(state => ({
        isResponding: responding,
        streamingState: responding 
          ? StreamingState.Responding 
          : state.isWaitingForConfirmation 
            ? StreamingState.WaitingForConfirmation 
            : StreamingState.Idle,
      }));
    },

    setWaitingForConfirmation: (waiting: boolean) => {
      set(state => ({
        isWaitingForConfirmation: waiting,
        streamingState: waiting 
          ? StreamingState.WaitingForConfirmation 
          : state.isResponding 
            ? StreamingState.Responding 
            : StreamingState.Idle,
      }));
    },

    setAbortController: (controller: AbortController | null) => {
      // Abort previous controller if exists and different
      const currentController = get().abortController;
      if (currentController && currentController !== controller && !currentController.signal.aborted) {
        currentController.abort();
      }
      set({ abortController: controller });
    },

    cancelStream: () => {
      const { abortController } = get();
      if (abortController && !abortController.signal.aborted) {
        abortController.abort();
      }
      set({
        streamingState: StreamingState.Idle,
        isResponding: false,
        isWaitingForConfirmation: false,
        abortController: null,
      });
    },

    reset: () => {
      const { abortController } = get();
      if (abortController && !abortController.signal.aborted) {
        abortController.abort();
      }
      set({
        streamingState: StreamingState.Idle,
        isResponding: false,
        isWaitingForConfirmation: false,
        abortController: null,
      });
    },
  }))
);

/**
 * Hook for using the streaming store
 */
export const useStreamingStore = streamingStore;
