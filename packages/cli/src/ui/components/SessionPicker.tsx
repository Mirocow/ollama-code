/**
 * @license
 * Copyright 2025 Ollama Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import type {
  SessionListItem as SessionData,
  SessionService,
  ListSessionsResult,
} from '@ollama-code/ollama-code-core';
import { theme } from '../semantic-colors.js';
import { formatRelativeTime } from '../utils/formatters.js';
import {
  formatMessageCount,
  truncateText,
  SESSION_PAGE_SIZE,
} from '../utils/sessionPickerUtils.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';

export interface SessionPickerProps {
  sessionService: SessionService | null;
  onSelect: (sessionId: string) => void;
  onCancel: () => void;
  currentBranch?: string;

  /**
   * Scroll mode. When true, keep selection centered (fullscreen-style).
   * Defaults to true so dialog + standalone behave identically.
   */
  centerSelection?: boolean;

  /**
   * Enable/disable input handling.
   */
  isActive?: boolean;
}

interface SessionState {
  sessions: SessionData[];
  hasMore: boolean;
  nextCursor: number | undefined;
}

/**
 * Session picker component with model-selection-like UI.
 * Uses numbered items and consistent styling with model selection dialog.
 */
export function SessionPicker(props: SessionPickerProps) {
  const {
    sessionService,
    onSelect,
    onCancel,
    currentBranch,
    isActive = true,
  } = props;

  const { columns: width, rows: height } = useTerminalSize();

  // Calculate box width (marginX={2})
  const boxWidth = width - 4;

  // Reserved space: header (1), footer (1), separators (2), borders (2)
  const reservedLines = 6;
  // Each item takes 2 lines (prompt + metadata) + 1 line margin between items
  const itemHeight = 3;
  const maxVisibleItems = Math.max(
    1,
    Math.floor((height - reservedLines) / itemHeight),
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>({
    sessions: [],
    hasMore: true,
    nextCursor: undefined,
  });
  const [filterByBranch, setFilterByBranch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Filter sessions by branch if enabled
  const filteredSessions = useMemo(() => {
    if (!filterByBranch || !currentBranch) {
      return sessionState.sessions;
    }
    return sessionState.sessions.filter(
      (session) => session.gitBranch === currentBranch,
    );
  }, [sessionState.sessions, filterByBranch, currentBranch]);

  // Calculate visible sessions with scroll offset
  const visibleSessions = useMemo(
    () => filteredSessions.slice(scrollOffset, scrollOffset + maxVisibleItems),
    [filteredSessions, scrollOffset, maxVisibleItems],
  );

  const showScrollUp = scrollOffset > 0;
  const showScrollDown =
    scrollOffset + maxVisibleItems < filteredSessions.length;

  // Load initial sessions
  useEffect(() => {
    if (!sessionService) {
      return;
    }

    const loadInitialSessions = async () => {
      try {
        const result: ListSessionsResult = await sessionService.listSessions({
          size: SESSION_PAGE_SIZE,
        });
        setSessionState({
          sessions: result.items,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialSessions();
  }, [sessionService]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
    setScrollOffset(0);
  }, [filterByBranch]);

  // Ensure selectedIndex is valid when filtered sessions change
  useEffect(() => {
    if (
      selectedIndex >= filteredSessions.length &&
      filteredSessions.length > 0
    ) {
      setSelectedIndex(filteredSessions.length - 1);
    }
  }, [filteredSessions.length, selectedIndex]);

  // Load more sessions when needed
  const loadMoreSessions = useCallback(async () => {
    if (!sessionService || !sessionState.hasMore) {
      return;
    }

    const result: ListSessionsResult = await sessionService.listSessions({
      size: SESSION_PAGE_SIZE,
      cursor: sessionState.nextCursor,
    });
    setSessionState((prev) => ({
      sessions: [...prev.sessions, ...result.items],
      hasMore: result.hasMore && result.nextCursor !== undefined,
      nextCursor: result.nextCursor,
    }));
  }, [sessionService, sessionState.hasMore, sessionState.nextCursor]);

  // Auto-load more when near the end
  useEffect(() => {
    if (
      isLoading ||
      !sessionState.hasMore ||
      selectedIndex >= filteredSessions.length - 3
    ) {
      return;
    }

    if (selectedIndex >= filteredSessions.length - 3) {
      void loadMoreSessions();
    }
  }, [
    isLoading,
    sessionState.hasMore,
    filteredSessions.length,
    selectedIndex,
    loadMoreSessions,
  ]);

  // Keyboard navigation
  useKeypress(
    (key) => {
      const { name, sequence, ctrl } = key;

      if (name === 'escape' || (ctrl && name === 'c')) {
        onCancel();
        return;
      }

      if (name === 'return') {
        const session = filteredSessions[selectedIndex];
        if (session) {
          onSelect(session.sessionId);
        }
        return;
      }

      if (name === 'up' || name === 'k') {
        setSelectedIndex((prev) => {
          const newIndex = Math.max(0, prev - 1);
          // Adjust scroll offset if needed
          if (newIndex < scrollOffset) {
            setScrollOffset(newIndex);
          }
          return newIndex;
        });
        return;
      }

      if (name === 'down' || name === 'j') {
        if (filteredSessions.length === 0) {
          return;
        }

        setSelectedIndex((prev) => {
          const newIndex = Math.min(filteredSessions.length - 1, prev + 1);

          // Adjust scroll offset if needed
          if (newIndex >= scrollOffset + maxVisibleItems) {
            setScrollOffset(newIndex - maxVisibleItems + 1);
          }

          return newIndex;
        });
        return;
      }

      if (sequence === 'b' || sequence === 'B') {
        if (currentBranch) {
          setFilterByBranch((prev) => !prev);
        }
      }
    },
    { isActive },
  );

  // Number column width based on total items
  const numberColumnWidth = String(filteredSessions.length).length;

  return (
    <Box
      flexDirection="column"
      width={boxWidth}
      height={height - 1}
      overflow="hidden"
    >
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.border.default}
        width={boxWidth}
        height={height - 1}
        overflow="hidden"
      >
        {/* Header row */}
        <Box paddingX={1}>
          <Text bold color={theme.text.primary}>
            {t('Resume Session')}
          </Text>
          {filterByBranch && currentBranch && (
            <Text color={theme.text.secondary}>
              {' '}
              {t('(branch: {{branch}})', { branch: currentBranch })}
            </Text>
          )}
        </Box>

        {/* Separator */}
        <Box>
          <Text color={theme.border.default}>{'─'.repeat(boxWidth - 2)}</Text>
        </Box>

        {/* Session list */}
        <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
          {!sessionService || isLoading ? (
            <Box paddingY={1} justifyContent="center">
              <Text color={theme.text.secondary}>
                {t('Loading sessions...')}
              </Text>
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box paddingY={1} justifyContent="center">
              <Text color={theme.text.secondary}>
                {filterByBranch
                  ? t('No sessions found for branch "{{branch}}"', {
                      branch: currentBranch ?? '',
                    })
                  : t('No sessions found')}
              </Text>
            </Box>
          ) : (
            <>
              {/* Scroll up indicator */}
              {showScrollUp && (
                <Box marginBottom={1}>
                  <Text color={theme.text.secondary}>
                    ▲ more sessions above
                  </Text>
                </Box>
              )}

              {/* Session items with numbers */}
              {visibleSessions.map((session, visibleIndex) => {
                const actualIndex = scrollOffset + visibleIndex;
                const isSelected = actualIndex === selectedIndex;
                const timeAgo = formatRelativeTime(session.mtime);
                const messageText = formatMessageCount(session.messageCount);
                const promptText = session.prompt || '(empty prompt)';
                const truncatedPrompt = truncateText(promptText, boxWidth - 10);
                const itemNumber = String(actualIndex + 1).padStart(
                  numberColumnWidth,
                );

                return (
                  <Box
                    key={session.sessionId}
                    flexDirection="column"
                    marginBottom={1}
                  >
                    <Box>
                      {/* Radio indicator */}
                      <Box minWidth={2} flexShrink={0}>
                        <Text
                          color={
                            isSelected
                              ? theme.status.success
                              : theme.text.primary
                          }
                        >
                          {isSelected ? '●' : ' '}
                        </Text>
                      </Box>

                      {/* Number */}
                      <Box marginRight={1} flexShrink={0}>
                        <Text
                          color={
                            isSelected
                              ? theme.status.success
                              : theme.text.secondary
                          }
                        >
                          {itemNumber}.
                        </Text>
                      </Box>

                      {/* Prompt text */}
                      <Text
                        color={
                          isSelected ? theme.text.accent : theme.text.primary
                        }
                        bold={isSelected}
                      >
                        {truncatedPrompt}
                      </Text>
                    </Box>

                    {/* Metadata */}
                    <Box paddingLeft={2 + numberColumnWidth + 2}>
                      <Text color={theme.text.secondary}>
                        {timeAgo} · {messageText}
                        {session.gitBranch && ` · ${session.gitBranch}`}
                      </Text>
                    </Box>
                  </Box>
                );
              })}

              {/* Scroll down indicator */}
              {showScrollDown && (
                <Box>
                  <Text color={theme.text.secondary}>
                    ▼ more sessions below
                  </Text>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Separator */}
        <Box>
          <Text color={theme.border.default}>{'─'.repeat(boxWidth - 2)}</Text>
        </Box>

        {/* Footer */}
        <Box paddingX={1}>
          <Box flexDirection="row">
            {currentBranch && (
              <Text color={theme.text.secondary}>
                <Text
                  bold={filterByBranch}
                  color={filterByBranch ? theme.text.accent : undefined}
                >
                  B
                </Text>
                {t(' to toggle branch')} ·
              </Text>
            )}
            <Text color={theme.text.secondary}>
              {t('↑↓ to navigate · Enter to select · Esc to cancel')}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
