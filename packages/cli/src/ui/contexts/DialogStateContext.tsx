/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DialogStateContext - manages all dialog visibility states
 * Separated from UIStateContext to prevent unnecessary re-renders
 * when dialog states change independently of other UI state.
 */

import { createContext, useContext, useMemo, useState, useCallback } from 'react';

export interface DialogState {
  // Core dialogs
  isThemeDialogOpen: boolean;
  isAuthDialogOpen: boolean;
  isEditorDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isModelDialogOpen: boolean;
  isPermissionsDialogOpen: boolean;
  isApprovalModeDialogOpen: boolean;
  isResumeDialogOpen: boolean;
  isFolderTrustDialogOpen: boolean;
  
  // Feature dialogs
  isVisionSwitchDialogOpen: boolean;
  isSubagentCreateDialogOpen: boolean;
  isAgentsManagerDialogOpen: boolean;
  isFeedbackDialogOpen: boolean;
  
  // Welcome back dialog
  showWelcomeBackDialog: boolean;
  
  // Prompts
  shouldShowIdePrompt: boolean;
  showIdeRestartPrompt: boolean;
  shouldShowCommandMigrationNudge: boolean;
  
  // Computed
  dialogsVisible: boolean;
}

export interface DialogActions {
  // Theme dialog
  openThemeDialog: () => void;
  closeThemeDialog: () => void;
  
  // Auth dialog
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  
  // Editor dialog
  openEditorDialog: () => void;
  closeEditorDialog: () => void;
  
  // Settings dialog
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
  
  // Model dialog
  openModelDialog: () => void;
  closeModelDialog: () => void;
  
  // Permissions dialog
  openPermissionsDialog: () => void;
  closePermissionsDialog: () => void;
  
  // Approval mode dialog
  openApprovalModeDialog: () => void;
  closeApprovalModeDialog: () => void;
  
  // Resume dialog
  openResumeDialog: () => void;
  closeResumeDialog: () => void;
  
  // Folder trust dialog
  setIsFolderTrustDialogOpen: (value: boolean) => void;
  
  // Vision switch dialog
  setIsVisionSwitchDialogOpen: (value: boolean) => void;
  
  // Subagent dialogs
  setIsSubagentCreateDialogOpen: (value: boolean) => void;
  setIsAgentsManagerDialogOpen: (value: boolean) => void;
  
  // Feedback dialog
  setIsFeedbackDialogOpen: (value: boolean) => void;
  
  // Welcome back dialog
  setShowWelcomeBackDialog: (value: boolean) => void;
  
  // IDE prompts
  setShouldShowIdePrompt: (value: boolean) => void;
  setShowIdeRestartPrompt: (value: boolean) => void;
  setShouldShowCommandMigrationNudge: (value: boolean) => void;
}

interface DialogContextValue {
  state: DialogState;
  actions: DialogActions;
}

const DialogStateContext = createContext<DialogContextValue | null>(null);

export const useDialogState = (): DialogState => {
  const context = useContext(DialogStateContext);
  if (!context) {
    throw new Error('useDialogState must be used within a DialogStateProvider');
  }
  return context.state;
};

export const useDialogActions = (): DialogActions => {
  const context = useContext(DialogStateContext);
  if (!context) {
    throw new Error('useDialogActions must be used within a DialogStateProvider');
  }
  return context.actions;
};

export const useDialogContext = (): DialogContextValue => {
  const context = useContext(DialogStateContext);
  if (!context) {
    throw new Error('useDialogContext must be used within a DialogStateProvider');
  }
  return context;
};

interface DialogStateProviderProps {
  children: React.ReactNode;
  // Initial dialog states (passed from parent)
  initialState?: Partial<DialogState>;
  // External dialog control functions
  externalActions?: Partial<DialogActions>;
}

export const DialogStateProvider: React.FC<DialogStateProviderProps> = ({
  children,
  initialState,
  externalActions,
}) => {
  // Dialog states
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(initialState?.isThemeDialogOpen ?? false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(initialState?.isAuthDialogOpen ?? false);
  const [isEditorDialogOpen, setIsEditorDialogOpen] = useState(initialState?.isEditorDialogOpen ?? false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(initialState?.isSettingsDialogOpen ?? false);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(initialState?.isModelDialogOpen ?? false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(initialState?.isPermissionsDialogOpen ?? false);
  const [isApprovalModeDialogOpen, setIsApprovalModeDialogOpen] = useState(initialState?.isApprovalModeDialogOpen ?? false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(initialState?.isResumeDialogOpen ?? false);
  const [isFolderTrustDialogOpen, setIsFolderTrustDialogOpen] = useState(initialState?.isFolderTrustDialogOpen ?? false);
  const [isVisionSwitchDialogOpen, setIsVisionSwitchDialogOpen] = useState(initialState?.isVisionSwitchDialogOpen ?? false);
  const [isSubagentCreateDialogOpen, setIsSubagentCreateDialogOpen] = useState(initialState?.isSubagentCreateDialogOpen ?? false);
  const [isAgentsManagerDialogOpen, setIsAgentsManagerDialogOpen] = useState(initialState?.isAgentsManagerDialogOpen ?? false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(initialState?.isFeedbackDialogOpen ?? false);
  const [showWelcomeBackDialog, setShowWelcomeBackDialog] = useState(initialState?.showWelcomeBackDialog ?? false);
  const [shouldShowIdePrompt, setShouldShowIdePrompt] = useState(initialState?.shouldShowIdePrompt ?? false);
  const [showIdeRestartPrompt, setShowIdeRestartPrompt] = useState(initialState?.showIdeRestartPrompt ?? false);
  const [shouldShowCommandMigrationNudge, setShouldShowCommandMigrationNudge] = useState(initialState?.shouldShowCommandMigrationNudge ?? false);

  // Computed dialogsVisible
  const dialogsVisible = useMemo(() => (
    isThemeDialogOpen ||
    isAuthDialogOpen ||
    isEditorDialogOpen ||
    isSettingsDialogOpen ||
    isModelDialogOpen ||
    isPermissionsDialogOpen ||
    isApprovalModeDialogOpen ||
    isResumeDialogOpen ||
    isFolderTrustDialogOpen ||
    isVisionSwitchDialogOpen ||
    isSubagentCreateDialogOpen ||
    isAgentsManagerDialogOpen ||
    isFeedbackDialogOpen ||
    showWelcomeBackDialog ||
    shouldShowIdePrompt ||
    showIdeRestartPrompt ||
    shouldShowCommandMigrationNudge
  ), [
    isThemeDialogOpen,
    isAuthDialogOpen,
    isEditorDialogOpen,
    isSettingsDialogOpen,
    isModelDialogOpen,
    isPermissionsDialogOpen,
    isApprovalModeDialogOpen,
    isResumeDialogOpen,
    isFolderTrustDialogOpen,
    isVisionSwitchDialogOpen,
    isSubagentCreateDialogOpen,
    isAgentsManagerDialogOpen,
    isFeedbackDialogOpen,
    showWelcomeBackDialog,
    shouldShowIdePrompt,
    showIdeRestartPrompt,
    shouldShowCommandMigrationNudge,
  ]);

  const state: DialogState = useMemo(() => ({
    isThemeDialogOpen,
    isAuthDialogOpen,
    isEditorDialogOpen,
    isSettingsDialogOpen,
    isModelDialogOpen,
    isPermissionsDialogOpen,
    isApprovalModeDialogOpen,
    isResumeDialogOpen,
    isFolderTrustDialogOpen,
    isVisionSwitchDialogOpen,
    isSubagentCreateDialogOpen,
    isAgentsManagerDialogOpen,
    isFeedbackDialogOpen,
    showWelcomeBackDialog,
    shouldShowIdePrompt,
    showIdeRestartPrompt,
    shouldShowCommandMigrationNudge,
    dialogsVisible,
  }), [
    isThemeDialogOpen,
    isAuthDialogOpen,
    isEditorDialogOpen,
    isSettingsDialogOpen,
    isModelDialogOpen,
    isPermissionsDialogOpen,
    isApprovalModeDialogOpen,
    isResumeDialogOpen,
    isFolderTrustDialogOpen,
    isVisionSwitchDialogOpen,
    isSubagentCreateDialogOpen,
    isAgentsManagerDialogOpen,
    isFeedbackDialogOpen,
    showWelcomeBackDialog,
    shouldShowIdePrompt,
    showIdeRestartPrompt,
    shouldShowCommandMigrationNudge,
    dialogsVisible,
  ]);

  // Dialog actions with external override support
  const actions: DialogActions = useMemo(() => ({
    openThemeDialog: externalActions?.openThemeDialog ?? useCallback(() => setIsThemeDialogOpen(true), []),
    closeThemeDialog: externalActions?.closeThemeDialog ?? useCallback(() => setIsThemeDialogOpen(false), []),
    openAuthDialog: externalActions?.openAuthDialog ?? useCallback(() => setIsAuthDialogOpen(true), []),
    closeAuthDialog: externalActions?.closeAuthDialog ?? useCallback(() => setIsAuthDialogOpen(false), []),
    openEditorDialog: externalActions?.openEditorDialog ?? useCallback(() => setIsEditorDialogOpen(true), []),
    closeEditorDialog: externalActions?.closeEditorDialog ?? useCallback(() => setIsEditorDialogOpen(false), []),
    openSettingsDialog: externalActions?.openSettingsDialog ?? useCallback(() => setIsSettingsDialogOpen(true), []),
    closeSettingsDialog: externalActions?.closeSettingsDialog ?? useCallback(() => setIsSettingsDialogOpen(false), []),
    openModelDialog: externalActions?.openModelDialog ?? useCallback(() => setIsModelDialogOpen(true), []),
    closeModelDialog: externalActions?.closeModelDialog ?? useCallback(() => setIsModelDialogOpen(false), []),
    openPermissionsDialog: externalActions?.openPermissionsDialog ?? useCallback(() => setIsPermissionsDialogOpen(true), []),
    closePermissionsDialog: externalActions?.closePermissionsDialog ?? useCallback(() => setIsPermissionsDialogOpen(false), []),
    openApprovalModeDialog: externalActions?.openApprovalModeDialog ?? useCallback(() => setIsApprovalModeDialogOpen(true), []),
    closeApprovalModeDialog: externalActions?.closeApprovalModeDialog ?? useCallback(() => setIsApprovalModeDialogOpen(false), []),
    openResumeDialog: externalActions?.openResumeDialog ?? useCallback(() => setIsResumeDialogOpen(true), []),
    closeResumeDialog: externalActions?.closeResumeDialog ?? useCallback(() => setIsResumeDialogOpen(false), []),
    setIsFolderTrustDialogOpen: externalActions?.setIsFolderTrustDialogOpen ?? setIsFolderTrustDialogOpen,
    setIsVisionSwitchDialogOpen: externalActions?.setIsVisionSwitchDialogOpen ?? setIsVisionSwitchDialogOpen,
    setIsSubagentCreateDialogOpen: externalActions?.setIsSubagentCreateDialogOpen ?? setIsSubagentCreateDialogOpen,
    setIsAgentsManagerDialogOpen: externalActions?.setIsAgentsManagerDialogOpen ?? setIsAgentsManagerDialogOpen,
    setIsFeedbackDialogOpen: externalActions?.setIsFeedbackDialogOpen ?? setIsFeedbackDialogOpen,
    setShowWelcomeBackDialog: externalActions?.setShowWelcomeBackDialog ?? setShowWelcomeBackDialog,
    setShouldShowIdePrompt: externalActions?.setShouldShowIdePrompt ?? setShouldShowIdePrompt,
    setShowIdeRestartPrompt: externalActions?.setShowIdeRestartPrompt ?? setShowIdeRestartPrompt,
    setShouldShowCommandMigrationNudge: externalActions?.setShouldShowCommandMigrationNudge ?? setShouldShowCommandMigrationNudge,
  }), [
    externalActions,
    setIsThemeDialogOpen,
    setIsAuthDialogOpen,
    setIsEditorDialogOpen,
    setIsSettingsDialogOpen,
    setIsModelDialogOpen,
    setIsPermissionsDialogOpen,
    setIsApprovalModeDialogOpen,
    setIsResumeDialogOpen,
    setIsFolderTrustDialogOpen,
    setIsVisionSwitchDialogOpen,
    setIsSubagentCreateDialogOpen,
    setIsAgentsManagerDialogOpen,
    setIsFeedbackDialogOpen,
    setShowWelcomeBackDialog,
    setShouldShowIdePrompt,
    setShowIdeRestartPrompt,
    setShouldShowCommandMigrationNudge,
  ]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return (
    <DialogStateContext.Provider value={value}>
      {children}
    </DialogStateContext.Provider>
  );
};

export { DialogStateContext };
