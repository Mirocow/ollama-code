/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ThoughtSummary } from '@ollama-code/ollama-code-core';
import type React from 'react';
import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useStreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';
import { OllamaRespondingSpinner } from './OllamaRespondingSpinner.js';
import { formatDuration } from '../utils/formatters.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { t } from '../../i18n/index.js';

interface LoadingIndicatorProps {
  currentLoadingPhrase?: string;
  elapsedTime: number;
  rightContent?: React.ReactNode;
  thought?: ThoughtSummary | null;
}

/**
 * LoadingIndicator component - shows loading status during streaming
 * Memoized to prevent unnecessary re-renders
 */
const LoadingIndicatorComponent: React.FC<LoadingIndicatorProps> = ({
  currentLoadingPhrase,
  elapsedTime,
  rightContent,
  thought,
}) => {
  const streamingState = useStreamingContext();
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);

  // Memoize computed values - MUST be called before any early return (Rules of Hooks)
  const primaryText = useMemo(
    () => thought?.subject || currentLoadingPhrase,
    [thought?.subject, currentLoadingPhrase],
  );

  const formattedTime = useMemo(() => elapsedTime < 60
      ? `${elapsedTime}s`
      : formatDuration(elapsedTime * 1000), [elapsedTime]);

  const cancelAndTimerContent = useMemo(() => streamingState !== StreamingState.WaitingForConfirmation
      ? t('(esc to cancel, {{time}})', { time: formattedTime })
      : null, [streamingState, formattedTime]);

  // Memoize spinner props
  const spinnerDisplay = useMemo(
    () => (streamingState === StreamingState.WaitingForConfirmation ? '⠏' : ''),
    [streamingState],
  );

  // Early return if not streaming - AFTER all hooks
  if (streamingState === StreamingState.Idle) {
    return null;
  }

  return (
    <Box paddingLeft={0} flexDirection="column">
      {/* Main loading line */}
      <Box
        width="100%"
        flexDirection={isNarrow ? 'column' : 'row'}
        alignItems={isNarrow ? 'flex-start' : 'center'}
      >
        <Box>
          <Box marginRight={1}>
            <OllamaRespondingSpinner nonRespondingDisplay={spinnerDisplay} />
          </Box>
          {primaryText && (
            <Text color={theme.text.accent} wrap="truncate-end">
              {primaryText}
            </Text>
          )}
          {!isNarrow && cancelAndTimerContent && (
            <Text color={theme.text.secondary}> {cancelAndTimerContent}</Text>
          )}
        </Box>
        {!isNarrow && <Box flexGrow={1}>{/* Spacer */}</Box>}
        {!isNarrow && rightContent && <Box>{rightContent}</Box>}
      </Box>
      {isNarrow && cancelAndTimerContent && (
        <Box>
          <Text color={theme.text.secondary}>{cancelAndTimerContent}</Text>
        </Box>
      )}
      {isNarrow && rightContent && <Box>{rightContent}</Box>}
    </Box>
  );
};

/**
 * Memoized LoadingIndicator component
 */
export const LoadingIndicator = memo(LoadingIndicatorComponent);
