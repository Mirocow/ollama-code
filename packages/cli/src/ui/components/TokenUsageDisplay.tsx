/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Token Usage Display Component
 * Real-time token usage statistics and visualization
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';

export interface TokenUsageDisplayProps {
  /** Total tokens used */
  totalTokens: number;
  /** Prompt tokens */
  promptTokens: number;
  /** Completion/output tokens */
  completionTokens: number;
  /** Cached tokens */
  cachedTokens?: number;
  /** Thinking tokens (for thinking models) */
  thinkingTokens?: number;
  /** Tool use tokens */
  toolTokens?: number;
  /** Tokens per second (generation speed) */
  tokensPerSecond?: number;
  /** Show detailed breakdown */
  detailed?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Context window size for the model */
  contextWindow?: number;
}

/**
 * Format token count with K/M suffix
 */
function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Calculate percentage with safety check
 */
function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Token Usage Display Component
 *
 * Displays real-time token usage statistics with optional visualization.
 * Supports both compact inline display and detailed breakdown view.
 *
 * @example
 * ```tsx
 * <TokenUsageDisplay
 *   totalTokens={1500}
 *   promptTokens={500}
 *   completionTokens={1000}
 *   tokensPerSecond={45}
 *   detailed
 * />
 * ```
 */
export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({
  totalTokens,
  promptTokens,
  completionTokens,
  cachedTokens = 0,
  thinkingTokens = 0,
  toolTokens = 0,
  tokensPerSecond,
  detailed = false,
  compact = false,
  contextWindow,
}) => {
  // Calculate percentages
  const cacheHitRate = calculatePercentage(cachedTokens, promptTokens);
  const contextUsage = contextWindow
    ? calculatePercentage(totalTokens, contextWindow)
    : null;

  if (compact) {
    return (
      <Box>
        <Text color={theme.text.secondary}>
          {t('Tokens')}:{' '}
          <Text color={theme.text.primary}>
            {formatTokenCount(totalTokens)}
          </Text>
        </Text>
        {tokensPerSecond && (
          <Box marginLeft={2}>
            <Text color={theme.text.secondary}>
              {t('Speed')}:{' '}
              <Text color={theme.text.accent}>
                {tokensPerSecond.toFixed(1)} t/s
              </Text>
            </Text>
          </Box>
        )}
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
        <Text bold color={theme.text.accent}>
          {t('Token Usage')}
        </Text>
        {tokensPerSecond && (
          <Box marginLeft={2}>
            <Text color={theme.status.success}>
              {tokensPerSecond.toFixed(1)} t/s
            </Text>
          </Box>
        )}
      </Box>

      {/* Total tokens bar */}
      <Box marginTop={1}>
        <TokenBar
          total={totalTokens}
          prompt={promptTokens}
          completion={completionTokens}
          cached={cachedTokens}
          thinking={thinkingTokens}
          tool={toolTokens}
          contextWindow={contextWindow ?? totalTokens}
        />
      </Box>

      {/* Context usage indicator */}
      {contextUsage !== null && contextWindow && (
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>
            {t('Context')}: {contextUsage}% ({formatTokenCount(totalTokens)}/
            {formatTokenCount(contextWindow)})
          </Text>
          {contextUsage > 90 && (
            <Box marginLeft={1}>
              <Text color={theme.status.warning}>⚠ {t('Near limit')}</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Detailed breakdown */}
      {detailed && (
        <Box flexDirection="column" marginTop={1}>
          {/* Prompt tokens */}
          <TokenRow
            label={t('Prompt')}
            value={promptTokens}
            total={totalTokens}
            color={theme.text.link}
          />

          {/* Cached tokens */}
          {cachedTokens > 0 && (
            <TokenRow
              label={t('  Cached')}
              value={cachedTokens}
              total={promptTokens}
              color={theme.status.success}
              isSubItem
            />
          )}

          {/* Completion tokens */}
          <TokenRow
            label={t('Completion')}
            value={completionTokens}
            total={totalTokens}
            color={theme.text.accent}
          />

          {/* Thinking tokens */}
          {thinkingTokens > 0 && (
            <TokenRow
              label={t('  Thinking')}
              value={thinkingTokens}
              total={completionTokens}
              color={theme.status.warning}
              isSubItem
            />
          )}

          {/* Tool tokens */}
          {toolTokens > 0 && (
            <TokenRow
              label={t('  Tools')}
              value={toolTokens}
              total={completionTokens}
              color={theme.text.link}
              isSubItem
            />
          )}

          {/* Cache hit rate */}
          {cachedTokens > 0 && (
            <Box marginTop={1}>
              <Text color={theme.text.secondary}>
                {t('Cache hit rate')}:{' '}
                <Text color={theme.status.success}>{cacheHitRate}%</Text>
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Summary */}
      <Box marginTop={1}>
        <Text bold color={theme.text.primary}>
          {t('Total')}: {totalTokens.toLocaleString()} tokens
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Token Bar Component
 * Visual bar showing token distribution
 */
interface TokenBarProps {
  total: number;
  prompt: number;
  completion: number;
  cached: number;
  thinking: number;
  tool: number;
  contextWindow: number;
}

const TokenBar: React.FC<TokenBarProps> = ({
  total,
  prompt,
  completion,
  cached,
  thinking,
  tool,
  contextWindow,
}) => {
  const width = 40;
  const base = contextWindow || total;

  // Calculate proportions
  const promptWidth = Math.round((prompt / base) * width);
  const completionWidth = Math.round((completion / base) * width);
  const cachedWidth = Math.round((cached / base) * width);
  const thinkingWidth = Math.round((thinking / base) * width);
  const toolWidth = Math.round((tool / base) * width);

  return (
    <Box>
      <Text color={theme.border.default}>│</Text>
      <Text color={theme.text.link}>
        {'█'.repeat(Math.max(0, promptWidth - cachedWidth))}
      </Text>
      {cached > 0 && (
        <Text color={theme.status.success}>{'█'.repeat(cachedWidth)}</Text>
      )}
      <Text color={theme.text.accent}>
        {'█'.repeat(Math.max(0, completionWidth - thinkingWidth - toolWidth))}
      </Text>
      {thinking > 0 && (
        <Text color={theme.status.warning}>{'█'.repeat(thinkingWidth)}</Text>
      )}
      {tool > 0 && <Text color={theme.text.link}>{'█'.repeat(toolWidth)}</Text>}
      <Text color={theme.border.default}>
        {'░'.repeat(Math.max(0, width - promptWidth - completionWidth))}
      </Text>
      <Text color={theme.border.default}>│</Text>
    </Box>
  );
};

/**
 * Token Row Component
 * Single row in the token breakdown
 */
interface TokenRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
  isSubItem?: boolean;
}

const TokenRow: React.FC<TokenRowProps> = ({
  label,
  value,
  total,
  color,
  isSubItem = false,
}) => {
  const percentage = calculatePercentage(value, total);

  return (
    <Box>
      <Text color={isSubItem ? theme.ui.comment : theme.text.secondary}>
        {label}:
      </Text>
      <Box marginLeft={1}>
        <Text color={color}>{value.toLocaleString()}</Text>
      </Box>
      <Box marginLeft={1}>
        <Text color={theme.ui.comment}>({percentage}%)</Text>
      </Box>
    </Box>
  );
};

/**
 * Live Token Counter Component
 * Shows updating token count during streaming
 */
export interface LiveTokenCounterProps {
  /** Current token count */
  tokenCount: number;
  /** Generation speed */
  speed?: number;
  /** Show animation */
  animate?: boolean;
}

export const LiveTokenCounter: React.FC<LiveTokenCounterProps> = ({
  tokenCount,
  speed,
  animate = true,
}) => (
    <Box>
      <Text color={theme.text.accent}>
        {animate ? '●' : '○'} {formatTokenCount(tokenCount)}
      </Text>
      {speed && (
        <Box marginLeft={2}>
          <Text color={theme.text.secondary}>@ {speed.toFixed(1)} t/s</Text>
        </Box>
      )}
    </Box>
  );

/**
 * Token Budget Display
 * Shows remaining token budget
 */
export interface TokenBudgetProps {
  /** Total context window */
  budget: number;
  /** Used tokens */
  used: number;
  /** Reserved tokens for response */
  reserved?: number;
}

export const TokenBudget: React.FC<TokenBudgetProps> = ({
  budget,
  used,
  reserved = 0,
}) => {
  const remaining = budget - used - reserved;
  const usedPercent = calculatePercentage(used, budget);
  const reservedPercent = calculatePercentage(reserved, budget);

  const getStatusColor = (): string => {
    if (remaining < budget * 0.1) return theme.status.error;
    if (remaining < budget * 0.25) return theme.status.warning;
    return theme.status.success;
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.text.secondary}>{t('Token Budget')}:</Text>
        <Box marginLeft={1}>
          <Text color={getStatusColor()}>
            {formatTokenCount(remaining)} {t('remaining')}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Box width={30}>
          {/* Used portion */}
          <Text color={theme.text.accent}>
            {'█'.repeat(Math.round(usedPercent * 0.3))}
          </Text>
          {/* Reserved portion */}
          <Text color={theme.text.secondary}>
            {'▓'.repeat(Math.round(reservedPercent * 0.3))}
          </Text>
          {/* Remaining portion */}
          <Text color={theme.border.default}>
            {'░'.repeat(30 - Math.round((usedPercent + reservedPercent) * 0.3))}
          </Text>
        </Box>
      </Box>

      <Box>
        <Text color={theme.ui.comment}>
          {t('Used')}: {formatTokenCount(used)} | {t('Reserved')}:{' '}
          {formatTokenCount(reserved)} | {t('Total')}:{' '}
          {formatTokenCount(budget)}
        </Text>
      </Box>
    </Box>
  );
};
