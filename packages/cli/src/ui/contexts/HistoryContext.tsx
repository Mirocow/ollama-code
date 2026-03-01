/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * HistoryContext - manages history-related state
 * Separated from UIStateContext to prevent unnecessary re-renders
 * when history changes independently of other UI state.
 */

import { createContext, useContext, useMemo } from 'react';
import type { HistoryItem, HistoryItemWithoutId } from '../types.js';
import type { UseHistoryManagerReturn } from '../hooks/useHistoryManager.js';

export interface HistoryState {
  // History items
  history: HistoryItem[];
  historyManager: UseHistoryManagerReturn;
  
  // Remount key for history component
  historyRemountKey: number;
  
  // Pending items
  pendingHistoryItems: HistoryItemWithoutId[];
  pendingSlashCommandHistoryItems: HistoryItemWithoutId[];
  pendingGeminiHistoryItems: HistoryItemWithoutId[];
}

interface HistoryContextValue {
  state: HistoryState;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export const useHistoryState = (): HistoryState => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistoryState must be used within a HistoryProvider');
  }
  return context.state;
};

export const useHistoryItems = (): HistoryItem[] => {
  const state = useHistoryState();
  return state.history;
};

export const useHistoryManager = (): UseHistoryManagerReturn => {
  const state = useHistoryState();
  return state.historyManager;
};

export const usePendingHistoryItems = (): HistoryItemWithoutId[] => {
  const state = useHistoryState();
  return state.pendingHistoryItems;
};

interface HistoryProviderProps {
  children: React.ReactNode;
  history: HistoryItem[];
  historyManager: UseHistoryManagerReturn;
  historyRemountKey: number;
  pendingHistoryItems: HistoryItemWithoutId[];
  pendingSlashCommandHistoryItems: HistoryItemWithoutId[];
  pendingGeminiHistoryItems: HistoryItemWithoutId[];
}

export const HistoryProvider: React.FC<HistoryProviderProps> = ({
  children,
  history,
  historyManager,
  historyRemountKey,
  pendingHistoryItems,
  pendingSlashCommandHistoryItems,
  pendingGeminiHistoryItems,
}) => {
  const state: HistoryState = useMemo(() => ({
    history,
    historyManager,
    historyRemountKey,
    pendingHistoryItems,
    pendingSlashCommandHistoryItems,
    pendingGeminiHistoryItems,
  }), [
    history,
    historyManager,
    historyRemountKey,
    pendingHistoryItems,
    pendingSlashCommandHistoryItems,
    pendingGeminiHistoryItems,
  ]);

  const value = useMemo(() => ({ state }), [state]);

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

export { HistoryContext };
