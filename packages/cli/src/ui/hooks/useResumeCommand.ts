/**
 * @license
 * Copyright 2025 Ollama Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { SessionService, type Config } from '@ollama-code/ollama-code-core';
import { buildResumedHistoryItems } from '../utils/resumeHistoryUtils.js';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
import { getSessionContextForPrompt } from '@ollama-code/ollama-code-core';

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

export function useResumeCommand(
  options?: UseResumeCommandOptions,
): UseResumeCommandResult {
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);

  const openResumeDialog = useCallback(() => {
    setIsResumeDialogOpen(true);
  }, []);

  const closeResumeDialog = useCallback(() => {
    setIsResumeDialogOpen(false);
  }, []);

  const { config, historyManager, startNewSession, remount } = options ?? {};

  const handleResume = useCallback(
    async (sessionId: string) => {
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

      // Get storage context reminder for resumed session
      try {
        const storageReminder = await getSessionContextForPrompt(
          sessionId,
          true,
        );
        if (storageReminder) {
          // Prepend storage reminder to the resumed session
          const reminderItem = {
            id: Date.now(),
            type: 'user' as const,
            text: storageReminder,
          };
          historyManager.loadHistory([reminderItem]);
        }
      } catch (error) {
        // Ignore errors getting storage reminder
        // eslint-disable-next-line no-console
        console.warn('[Resume] Failed to get storage reminder:', error);
      }

      // Reset UI history.
      const uiHistoryItems = buildResumedHistoryItems(sessionData, config);
      historyManager.clearItems();
      historyManager.loadHistory(uiHistoryItems);

      // Update session history core.
      config.startNewSession(sessionId, sessionData);
      await config.getOllamaClient()?.initialize?.();

      // Refresh terminal UI.
      remount?.();
    },
    [closeResumeDialog, config, historyManager, startNewSession, remount],
  );

  return {
    isResumeDialogOpen,
    openResumeDialog,
    closeResumeDialog,
    handleResume,
  };
}
