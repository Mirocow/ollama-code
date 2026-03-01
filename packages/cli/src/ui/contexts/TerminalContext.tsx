/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TerminalContext - manages terminal dimensions and layout calculations
 * Separated from UIStateContext to prevent unnecessary re-renders
 * when terminal dimensions change independently of other UI state.
 */

import { createContext, useContext, useMemo } from 'react';

export interface TerminalState {
  // Raw terminal dimensions
  terminalWidth: number;
  terminalHeight: number;
  
  // Computed input dimensions
  inputWidth: number;
  suggestionsWidth: number;
  
  // Layout dimensions
  mainAreaWidth: number;
  availableTerminalHeight: number | undefined;
  staticAreaMaxItemHeight: number;
  staticExtraHeight: number;
}

interface TerminalContextValue {
  state: TerminalState;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

export const useTerminalState = (): TerminalState => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminalState must be used within a TerminalProvider');
  }
  return context.state;
};

export const useTerminalDimensions = () => {
  const state = useTerminalState();
  return useMemo(() => ({
    width: state.terminalWidth,
    height: state.terminalHeight,
    inputWidth: state.inputWidth,
    mainAreaWidth: state.mainAreaWidth,
  }), [
    state.terminalWidth,
    state.terminalHeight,
    state.inputWidth,
    state.mainAreaWidth,
  ]);
};

interface TerminalProviderProps {
  children: React.ReactNode;
  terminalWidth: number;
  terminalHeight: number;
  inputWidth: number;
  suggestionsWidth: number;
  mainAreaWidth: number;
  availableTerminalHeight: number | undefined;
  staticAreaMaxItemHeight: number;
  staticExtraHeight: number;
}

export const TerminalProvider: React.FC<TerminalProviderProps> = ({
  children,
  terminalWidth,
  terminalHeight,
  inputWidth,
  suggestionsWidth,
  mainAreaWidth,
  availableTerminalHeight,
  staticAreaMaxItemHeight,
  staticExtraHeight,
}) => {
  const state: TerminalState = useMemo(() => ({
    terminalWidth,
    terminalHeight,
    inputWidth,
    suggestionsWidth,
    mainAreaWidth,
    availableTerminalHeight,
    staticAreaMaxItemHeight,
    staticExtraHeight,
  }), [
    terminalWidth,
    terminalHeight,
    inputWidth,
    suggestionsWidth,
    mainAreaWidth,
    availableTerminalHeight,
    staticAreaMaxItemHeight,
    staticExtraHeight,
  ]);

  const value = useMemo(() => ({ state }), [state]);

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
};

export { TerminalContext };
