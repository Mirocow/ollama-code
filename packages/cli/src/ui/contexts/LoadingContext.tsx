/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LoadingContext - manages loading and streaming state
 * Separated from UIStateContext to prevent unnecessary re-renders
 * when loading state changes frequently during streaming.
 */

import { createContext, useContext, useMemo } from 'react';
import { StreamingState, type ThoughtSummary } from '../types.js';

export interface LoadingState {
  // Streaming state
  streamingState: StreamingState;
  
  // Thought summary during streaming
  thought: ThoughtSummary | null;
  
  // Loading indicators
  elapsedTime: number;
  currentLoadingPhrase: string;
  
  // Error state
  initError: string | null;
}

interface LoadingContextValue {
  state: LoadingState;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const useLoadingState = (): LoadingState => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingState must be used within a LoadingProvider');
  }
  return context.state;
};

export const useStreamingState = (): StreamingState => {
  const state = useLoadingState();
  return state.streamingState;
};

export const useElapsedTime = (): number => {
  const state = useLoadingState();
  return state.elapsedTime;
};

export const useCurrentThought = (): ThoughtSummary | null => {
  const state = useLoadingState();
  return state.thought;
};

export const useIsLoading = (): boolean => {
  const state = useLoadingState();
  // Consider loading if streaming or if there's an init error
  return state.streamingState !== StreamingState.Idle || state.initError !== null;
};

interface LoadingProviderProps {
  children: React.ReactNode;
  streamingState: StreamingState;
  thought: ThoughtSummary | null;
  elapsedTime: number;
  currentLoadingPhrase: string;
  initError: string | null;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
  streamingState,
  thought,
  elapsedTime,
  currentLoadingPhrase,
  initError,
}) => {
  const state: LoadingState = useMemo(() => ({
    streamingState,
    thought,
    elapsedTime,
    currentLoadingPhrase,
    initError,
  }), [
    streamingState,
    thought,
    elapsedTime,
    currentLoadingPhrase,
    initError,
  ]);

  const value = useMemo(() => ({ state }), [state]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export { LoadingContext };
