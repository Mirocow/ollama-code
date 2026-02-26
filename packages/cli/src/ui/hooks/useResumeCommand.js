/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { SessionService } from '@ollama-code/ollama-code-core';
import { buildResumedHistoryItems } from '../utils/resumeHistoryUtils.js';
export function useResumeCommand(options) {
    const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
    const openResumeDialog = useCallback(() => {
        setIsResumeDialogOpen(true);
    }, []);
    const closeResumeDialog = useCallback(() => {
        setIsResumeDialogOpen(false);
    }, []);
    const { config, historyManager, startNewSession, remount } = options ?? {};
    const handleResume = useCallback(async (sessionId) => {
        if (!config || !historyManager || !startNewSession) {
            return;
        }
        // Close dialog immediately to prevent input capture during async operations.
        closeResumeDialog();
        const cwd = config.getTargetDir();
        const sessionService = new SessionService(cwd);
        const sessionData = await sessionService.loadSession(sessionId);
        if (!sessionData) {
            return;
        }
        // Start new session in UI context.
        startNewSession(sessionId);
        // Reset UI history.
        const uiHistoryItems = buildResumedHistoryItems(sessionData, config);
        historyManager.clearItems();
        historyManager.loadHistory(uiHistoryItems);
        // Update session history core.
        config.startNewSession(sessionId, sessionData);
        await config.getOllamaClient()?.initialize?.();
        // Refresh terminal UI.
        remount?.();
    }, [closeResumeDialog, config, historyManager, startNewSession, remount]);
    return {
        isResumeDialogOpen,
        openResumeDialog,
        closeResumeDialog,
        handleResume,
    };
}
//# sourceMappingURL=useResumeCommand.js.map