/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@ollama-code/ollama-code-core';
import { AuthType } from '@ollama-code/ollama-code-core';
import type { LoadedSettings } from '../../config/settings.js';
import { AuthState } from '../types.js';
import type { HistoryItem } from '../types.js';
/**
 * Ollama credentials (API key optional for remote instances)
 */
export interface OllamaCredentials {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}
export declare const useAuthCommand: (settings: LoadedSettings, config: Config, addItem: (item: Omit<HistoryItem, "id">, timestamp: number) => void, onAuthChange?: () => void) => {
    authState: AuthState;
    setAuthState: import("react").Dispatch<import("react").SetStateAction<AuthState>>;
    authError: string | null;
    onAuthError: (error: string | null) => void;
    isAuthDialogOpen: boolean;
    isAuthenticating: boolean;
    pendingAuthType: AuthType;
    qwenAuthState: undefined;
    handleAuthSelect: (authType: AuthType | undefined, credentials?: OllamaCredentials) => Promise<void>;
    handleCodingPlanSubmit: () => Promise<void>;
    openAuthDialog: () => void;
    cancelAuthentication: () => void;
};
