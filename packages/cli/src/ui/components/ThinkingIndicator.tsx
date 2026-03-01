/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thinking Indicator Component
 * Shows thinking/reasoning process for models like DeepSeek R1
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { useState, useEffect } from 'react';
import { theme } from '../semantic-colors.js';
import { useStreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';
import { t } from '../../i18n/index.js';

/**
 * Thinking animation frames
 */
const THINKING_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Brain icons for thinking
 */
const BRAIN_FRAMES = ['🧠', '💭', '🧠', '💭'];

export interface ThinkingIndicatorProps {
  /** Custom thinking message */
  message?: string;
  /** Show expanded thinking content */
  showContent?: boolean;
  /** Current thinking content being streamed */
  thinkingContent?: string;
  /** Elapsed time in seconds */
  elapsedTime?: number;
  /** Animation style */
  animationStyle?: 'dots' | 'brain' | 'pulse';
  /** Compact mode */
  compact?: boolean;
}

/**
 * Format elapsed time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Thinking Indicator Component
 *
 * Displays an animated indicator showing that a thinking model is processing.
 * Shows elapsed time and optionally displays the thinking content as it streams.
 *
 * @example
 * ```tsx
 * <ThinkingIndicator
 *   message="Analyzing code..."
 *   elapsedTime={45}
 *   showContent
 *   thinkingContent="Let me think about this..."
 * />
 * ```
 */
export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  message,
  showContent = false,
  thinkingContent,
  elapsedTime = 0,
  animationStyle = 'brain',
  compact = false,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const streamingState = useStreamingContext();

  // Animation loop
  useEffect(() => {
    if (streamingState !== StreamingState.Responding) return;

    const frames = animationStyle === 'dots' ? THINKING_FRAMES : BRAIN_FRAMES;
    const interval = setInterval(
      () => {
        setFrameIndex((prev) => (prev + 1) % frames.length);
      },
      animationStyle === 'dots' ? 80 : 300,
    );

    return () => clearInterval(interval);
  }, [streamingState, animationStyle]);

  if (streamingState !== StreamingState.Responding) {
    return null;
  }

  const frames = animationStyle === 'dots' ? THINKING_FRAMES : BRAIN_FRAMES;
  const currentFrame = frames[frameIndex];

  // Truncate thinking content for display
  const truncatedContent =
    thinkingContent && thinkingContent.length > 100
      ? thinkingContent.substring(0, 100) + '...'
      : thinkingContent;

  if (compact) {
    return (
      <Box>
        <Text color={theme.text.accent}>{currentFrame} </Text>
        <Text color={theme.text.secondary}>
          {message || t('Thinking...')} ({formatTime(elapsedTime)})
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.border.default}
      paddingX={1}
    >
      {/* Header */}
      <Box>
        <Text color={theme.text.accent}>{currentFrame} </Text>
        <Text bold color={theme.text.accent}>
          {message || t('Thinking')}
        </Text>
        <Box marginLeft={2}>
          <Text color={theme.text.secondary}>{formatTime(elapsedTime)}</Text>
        </Box>
      </Box>

      {/* Thinking content preview */}
      {showContent && truncatedContent && (
        <Box marginTop={1}>
          <Box
            borderStyle="round"
            borderColor={theme.border.default}
            paddingX={1}
          >
            <Text color={theme.text.secondary} dimColor>
              {truncatedContent}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

/**
 * Thinking Block Component
 * Displays a complete thinking section after thinking is done
 */
export interface ThinkingBlockProps {
  /** The thinking content to display */
  content: string;
  /** Whether the block is collapsed by default */
  collapsed?: boolean;
  /** Title for the thinking block */
  title?: string;
  /** Time spent thinking in seconds */
  duration?: number;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  collapsed = true,
  title,
  duration,
}) => {
  const [isExpanded] = useState(!collapsed);

  const lines = content.split('\n');
  const previewLines = lines.slice(0, 3);
  const hasMore = lines.length > 3;

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Header - using keyboard interaction instead of onClick */}
      <Box>
        <Text color={theme.text.accent}>
          {isExpanded ? '▼' : '▶'} {title || t('Thinking Process')}
        </Text>
        {duration && (
          <Box marginLeft={2}>
            <Text color={theme.text.secondary}>({formatTime(duration)})</Text>
          </Box>
        )}
        <Text color={theme.text.secondary}>
          {' '}
          {t('({{count}} lines)', { count: String(lines.length) })}
        </Text>
        <Text color={theme.text.link}>
          {' '}
          [Press Enter to {isExpanded ? 'collapse' : 'expand'}]
        </Text>
      </Box>

      {/* Content */}
      {isExpanded ? (
        <Box
          borderStyle="round"
          borderColor={theme.border.default}
          paddingX={1}
          marginTop={0}
        >
          <Text color={theme.text.secondary} dimColor>
            {content}
          </Text>
        </Box>
      ) : (
        <Box marginLeft={2}>
          <Text color={theme.text.secondary} dimColor>
            {previewLines.join('\n')}
            {hasMore && '...'}
          </Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Reasoning Step Component
 * Shows individual reasoning steps
 */
export interface ReasoningStepProps {
  /** Step number */
  step: number;
  /** Step content */
  content: string;
  /** Step status */
  status: 'thinking' | 'complete' | 'skipped';
}

export const ReasoningStep: React.FC<ReasoningStepProps> = ({
  step,
  content,
  status,
}) => {
  const getStatusIcon = (): string => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'skipped':
        return '○';
      default:
        return '●';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'complete':
        return theme.status.success;
      case 'skipped':
        return theme.text.secondary;
      default:
        return theme.text.accent;
    }
  };

  return (
    <Box>
      <Text color={getStatusColor()}>
        {getStatusIcon()} {step}.
      </Text>
      <Box marginLeft={1}>
        <Text
          color={
            status === 'skipped' ? theme.text.secondary : theme.text.primary
          }
          dimColor={status === 'skipped'}
        >
          {content}
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Thinking Stats Component
 * Shows statistics about the thinking process
 */
export interface ThinkingStatsProps {
  /** Total thinking duration */
  duration: number;
  /** Number of reasoning steps */
  steps?: number;
  /** Tokens used for thinking */
  tokens?: number;
  /** Model name */
  model?: string;
}

export const ThinkingStats: React.FC<ThinkingStatsProps> = ({
  duration,
  steps,
  tokens,
  model,
}) => (
    <Box borderStyle="round" borderColor={theme.border.default} paddingX={1}>
      <Box marginRight={3}>
        <Text color={theme.text.secondary}>
          {t('Think time')}:{' '}
          <Text color={theme.text.primary}>{formatTime(duration)}</Text>
        </Text>
      </Box>

      {steps && (
        <Box marginRight={3}>
          <Text color={theme.text.secondary}>
            {t('Steps')}: <Text color={theme.text.primary}>{steps}</Text>
          </Text>
        </Box>
      )}

      {tokens && (
        <Box marginRight={3}>
          <Text color={theme.text.secondary}>
            {t('Tokens')}:{' '}
            <Text color={theme.text.primary}>{tokens.toLocaleString()}</Text>
          </Text>
        </Box>
      )}

      {model && (
        <Box>
          <Text color={theme.text.secondary}>
            {t('Model')}: <Text color={theme.text.primary}>{model}</Text>
          </Text>
        </Box>
      )}
    </Box>
  );
