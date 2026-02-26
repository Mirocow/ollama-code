/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VSCodeAPI } from '../../hooks/useVSCode.js';
/**
 * Session management Hook
 * Manages session list, current session, session switching, and search
 */
export declare const useSessionManagement: (vscode: VSCodeAPI) => {
    qwenSessions: Record<string, unknown>[];
    currentSessionId: string | null;
    currentSessionTitle: string;
    showSessionSelector: boolean;
    sessionSearchQuery: string;
    filteredSessions: Record<string, unknown>[];
    savedSessionTags: string[];
    nextCursor: number | undefined;
    hasMore: boolean;
    isLoading: boolean;
    setQwenSessions: import("react").Dispatch<import("react").SetStateAction<Record<string, unknown>[]>>;
    setCurrentSessionId: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    setCurrentSessionTitle: import("react").Dispatch<import("react").SetStateAction<string>>;
    setShowSessionSelector: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    setSessionSearchQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    setSavedSessionTags: import("react").Dispatch<import("react").SetStateAction<string[]>>;
    setNextCursor: import("react").Dispatch<import("react").SetStateAction<number | undefined>>;
    setHasMore: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    setIsLoading: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    handleLoadQwenSessions: () => void;
    handleNewQwenSession: () => void;
    handleSwitchSession: (sessionId: string) => void;
    handleSaveSession: (tag: string) => void;
    handleSaveSessionResponse: (response: {
        success: boolean;
        message?: string;
    }) => void;
    handleLoadMoreSessions: () => void;
};
