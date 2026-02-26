/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@ollama-code/ollama-code-core';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
export interface UseResumeCommandOptions {
    config: Config | null;
    historyManager: Pick<UseHistoryManagerReturn, 'clearItems' | 'loadHistory'>;
    startNewSession: (sessionId: string) => void;
    remount?: () => void;
}
export interface UseResumeCommandResult {
    isResumeDialogOpen: boolean;
    openResumeDialog: () => void;
    closeResumeDialog: () => void;
    handleResume: (sessionId: string) => void;
}
export declare function useResumeCommand(options?: UseResumeCommandOptions): UseResumeCommandResult;
