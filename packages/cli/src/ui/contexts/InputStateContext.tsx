/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * InputStateContext - manages input-related state
 * Separated from UIStateContext to prevent unnecessary re-renders
 * when input state changes independently of other UI state.
 */

import { createContext, useContext, useMemo } from 'react';
import type { TextBuffer } from '../components/shared/text-buffer.js';

export interface InputState {
  // Buffer for text input
  buffer: TextBuffer;
  
  // Input state flags
  isInputActive: boolean;
  shellModeActive: boolean;
  
  // User messages history for autocomplete
  userMessages: string[];
  
  // Key press states
  ctrlCPressedOnce: boolean;
  ctrlDPressedOnce: boolean;
  showEscapePrompt: boolean;
}

interface InputContextValue {
  state: InputState;
}

const InputStateContext = createContext<InputContextValue | null>(null);

export const useInputState = (): InputState => {
  const context = useContext(InputStateContext);
  if (!context) {
    throw new Error('useInputState must be used within an InputStateProvider');
  }
  return context.state;
};

export const useInputBuffer = (): TextBuffer => {
  const state = useInputState();
  return state.buffer;
};

export const useInputActive = (): boolean => {
  const state = useInputState();
  return state.isInputActive;
};

export const useShellMode = (): boolean => {
  const state = useInputState();
  return state.shellModeActive;
};

export const useKeyPressState = () => {
  const state = useInputState();
  return useMemo(() => ({
    ctrlCPressedOnce: state.ctrlCPressedOnce,
    ctrlDPressedOnce: state.ctrlDPressedOnce,
    showEscapePrompt: state.showEscapePrompt,
  }), [
    state.ctrlCPressedOnce,
    state.ctrlDPressedOnce,
    state.showEscapePrompt,
  ]);
};

interface InputStateProviderProps {
  children: React.ReactNode;
  buffer: TextBuffer;
  isInputActive: boolean;
  shellModeActive: boolean;
  userMessages: string[];
  ctrlCPressedOnce: boolean;
  ctrlDPressedOnce: boolean;
  showEscapePrompt: boolean;
}

export const InputStateProvider: React.FC<InputStateProviderProps> = ({
  children,
  buffer,
  isInputActive,
  shellModeActive,
  userMessages,
  ctrlCPressedOnce,
  ctrlDPressedOnce,
  showEscapePrompt,
}) => {
  const state: InputState = useMemo(() => ({
    buffer,
    isInputActive,
    shellModeActive,
    userMessages,
    ctrlCPressedOnce,
    ctrlDPressedOnce,
    showEscapePrompt,
  }), [
    buffer,
    isInputActive,
    shellModeActive,
    userMessages,
    ctrlCPressedOnce,
    ctrlDPressedOnce,
    showEscapePrompt,
  ]);

  const value = useMemo(() => ({ state }), [state]);

  return (
    <InputStateContext.Provider value={value}>
      {children}
    </InputStateContext.Provider>
  );
};

export { InputStateContext };
