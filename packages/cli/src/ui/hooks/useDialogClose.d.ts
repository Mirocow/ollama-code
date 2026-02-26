/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { SettingScope } from '../../config/settings.js';
import type { AuthType, ApprovalMode } from '@ollama-code/ollama-code-core';
interface OpenAICredentials {
    apiKey: string;
    baseUrl?: string;
    model?: string;
}
export interface DialogCloseOptions {
    isThemeDialogOpen: boolean;
    handleThemeSelect: (theme: string | undefined, scope: SettingScope) => void;
    isApprovalModeDialogOpen: boolean;
    handleApprovalModeSelect: (mode: ApprovalMode | undefined, scope: SettingScope) => void;
    isAuthDialogOpen: boolean;
    handleAuthSelect: (authType: AuthType | undefined, credentials?: OpenAICredentials) => Promise<void>;
    pendingAuthType: AuthType | undefined;
    isEditorDialogOpen: boolean;
    exitEditorDialog: () => void;
    isSettingsDialogOpen: boolean;
    closeSettingsDialog: () => void;
    isFolderTrustDialogOpen: boolean;
    showWelcomeBackDialog: boolean;
    handleWelcomeBackClose: () => void;
}
/**
 * Hook that handles closing dialogs when Ctrl+C is pressed.
 * This mimics the ESC key behavior by calling the same handlers that ESC uses.
 * Returns true if a dialog was closed, false if no dialogs were open.
 */
export declare function useDialogClose(options: DialogCloseOptions): {
    closeAnyOpenDialog: () => boolean;
};
export {};
