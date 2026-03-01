/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ConfirmationContext - manages confirmation requests and dialogs
 * Separated from UIStateContext to prevent unnecessary re-renders
 * when confirmation state changes independently of other UI state.
 */

import { createContext, useContext, useMemo } from 'react';
import type {
  ShellConfirmationRequest,
  ConfirmationRequest,
  LoopDetectionConfirmationRequest,
  SettingInputRequest,
  PluginChoiceRequest,
} from '../types.js';

export interface ConfirmationState {
  // Shell command confirmation
  shellConfirmationRequest: ShellConfirmationRequest | null;
  
  // General confirmation
  confirmationRequest: ConfirmationRequest | null;
  
  // Loop detection confirmation
  loopDetectionConfirmationRequest: LoopDetectionConfirmationRequest | null;
  
  // Extension update confirmations
  confirmUpdateExtensionRequests: ConfirmationRequest[];
  
  // Setting input requests
  settingInputRequests: SettingInputRequest[];
  
  // Plugin choice requests
  pluginChoiceRequests: PluginChoiceRequest[];
}

interface ConfirmationContextValue {
  state: ConfirmationState;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export const useConfirmationState = (): ConfirmationState => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmationState must be used within a ConfirmationProvider');
  }
  return context.state;
};

export const useShellConfirmation = (): ShellConfirmationRequest | null => {
  const state = useConfirmationState();
  return state.shellConfirmationRequest;
};

export const useConfirmationRequest = (): ConfirmationRequest | null => {
  const state = useConfirmationState();
  return state.confirmationRequest;
};

export const useHasPendingConfirmations = (): boolean => {
  const state = useConfirmationState();
  return (
    state.shellConfirmationRequest !== null ||
    state.confirmationRequest !== null ||
    state.loopDetectionConfirmationRequest !== null ||
    state.confirmUpdateExtensionRequests.length > 0 ||
    state.settingInputRequests.length > 0 ||
    state.pluginChoiceRequests.length > 0
  );
};

interface ConfirmationProviderProps {
  children: React.ReactNode;
  shellConfirmationRequest: ShellConfirmationRequest | null;
  confirmationRequest: ConfirmationRequest | null;
  loopDetectionConfirmationRequest: LoopDetectionConfirmationRequest | null;
  confirmUpdateExtensionRequests: ConfirmationRequest[];
  settingInputRequests: SettingInputRequest[];
  pluginChoiceRequests: PluginChoiceRequest[];
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({
  children,
  shellConfirmationRequest,
  confirmationRequest,
  loopDetectionConfirmationRequest,
  confirmUpdateExtensionRequests,
  settingInputRequests,
  pluginChoiceRequests,
}) => {
  const state: ConfirmationState = useMemo(() => ({
    shellConfirmationRequest,
    confirmationRequest,
    loopDetectionConfirmationRequest,
    confirmUpdateExtensionRequests,
    settingInputRequests,
    pluginChoiceRequests,
  }), [
    shellConfirmationRequest,
    confirmationRequest,
    loopDetectionConfirmationRequest,
    confirmUpdateExtensionRequests,
    settingInputRequests,
    pluginChoiceRequests,
  ]);

  const value = useMemo(() => ({ state }), [state]);

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
    </ConfirmationContext.Provider>
  );
};

export { ConfirmationContext };
