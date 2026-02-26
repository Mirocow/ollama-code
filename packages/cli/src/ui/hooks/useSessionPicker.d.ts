/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionListItem, SessionService } from '@ollama-code/ollama-code-core';
import { type SessionState } from '../utils/sessionPickerUtils.js';
export interface UseSessionPickerOptions {
    sessionService: SessionService | null;
    currentBranch?: string;
    onSelect: (sessionId: string) => void;
    onCancel: () => void;
    maxVisibleItems: number;
    /**
     * If true, computes centered scroll offset (keeps selection near middle).
     * If false, uses follow mode (scrolls when selection reaches edge).
     */
    centerSelection?: boolean;
    /**
     * Enable/disable input handling.
     */
    isActive?: boolean;
}
export interface UseSessionPickerResult {
    selectedIndex: number;
    sessionState: SessionState;
    filteredSessions: SessionListItem[];
    filterByBranch: boolean;
    isLoading: boolean;
    scrollOffset: number;
    visibleSessions: SessionListItem[];
    showScrollUp: boolean;
    showScrollDown: boolean;
    loadMoreSessions: () => Promise<void>;
}
export declare function useSessionPicker({ sessionService, currentBranch, onSelect, onCancel, maxVisibleItems, centerSelection, isActive, }: UseSessionPickerOptions): UseSessionPickerResult;
