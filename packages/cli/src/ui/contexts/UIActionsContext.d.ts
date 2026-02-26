/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Key } from '../hooks/useKeypress.js';
import { type IdeIntegrationNudgeResult } from '../IdeIntegrationNudge.js';
import { type CommandMigrationNudgeResult } from '../CommandFormatMigrationNudge.js';
import { type FolderTrustChoice } from '../components/FolderTrustDialog.js';
import { type AuthType, type EditorType, type ApprovalMode } from '@ollama-code/ollama-code-core';
import { type SettingScope } from '../../config/settings.js';
import type { AuthState } from '../types.js';
import { type VisionSwitchOutcome } from '../components/ModelSwitchDialog.js';
export interface OllamaCredentials {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}
export interface UIActions {
    openThemeDialog: () => void;
    openEditorDialog: () => void;
    handleThemeSelect: (themeName: string | undefined, scope: SettingScope) => void;
    handleThemeHighlight: (themeName: string | undefined) => void;
    handleApprovalModeSelect: (mode: ApprovalMode | undefined, scope: SettingScope) => void;
    handleAuthSelect: (authType: AuthType | undefined, credentials?: OllamaCredentials) => Promise<void>;
    setAuthState: (state: AuthState) => void;
    onAuthError: (error: string | null) => void;
    cancelAuthentication: () => void;
    handleEditorSelect: (editorType: EditorType | undefined, scope: SettingScope) => void;
    exitEditorDialog: () => void;
    closeSettingsDialog: () => void;
    closeModelDialog: () => void;
    closePermissionsDialog: () => void;
    setShellModeActive: (value: boolean) => void;
    vimHandleInput: (key: Key) => boolean;
    handleIdePromptComplete: (result: IdeIntegrationNudgeResult) => void;
    handleCommandMigrationComplete: (result: CommandMigrationNudgeResult) => void;
    handleFolderTrustSelect: (choice: FolderTrustChoice) => void;
    setConstrainHeight: (value: boolean) => void;
    onEscapePromptChange: (show: boolean) => void;
    onSuggestionsVisibilityChange: (visible: boolean) => void;
    refreshStatic: () => void;
    handleFinalSubmit: (value: string) => void;
    handleClearScreen: () => void;
    handleVisionSwitchSelect: (outcome: VisionSwitchOutcome) => void;
    handleWelcomeBackSelection: (choice: 'continue' | 'restart') => void;
    handleWelcomeBackClose: () => void;
    closeSubagentCreateDialog: () => void;
    closeAgentsManagerDialog: () => void;
    openResumeDialog: () => void;
    closeResumeDialog: () => void;
    handleResume: (sessionId: string) => void;
    openFeedbackDialog: () => void;
    closeFeedbackDialog: () => void;
    temporaryCloseFeedbackDialog: () => void;
    submitFeedback: (rating: number) => void;
}
export declare const UIActionsContext: import("react").Context<UIActions | null>;
export declare const useUIActions: () => UIActions;
