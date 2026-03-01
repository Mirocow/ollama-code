/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';

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
 * Get color based on context usage percentage
 */
function getUsageColor(percentage: number): string {
  if (percentage > 0.9) return theme.status.error;
  if (percentage > 0.75) return theme.status.warning;
  return theme.text.accent;
}

export const ContextUsageDisplay = ({
  promptTokenCount,
  terminalWidth,
  contextWindowSize,
}: {
  promptTokenCount: number;
  terminalWidth: number;
  contextWindowSize: number;
}) => {
  if (promptTokenCount === 0) {
    return null;
  }

  const percentage = promptTokenCount / contextWindowSize;
  const percentageUsed = (percentage * 100).toFixed(1);
  const color = getUsageColor(percentage);

  // Format: "12.5K/128K (9.8%)" or shorter for narrow terminals
  const usedFormatted = formatTokenCount(promptTokenCount);
  const totalFormatted = formatTokenCount(contextWindowSize);

  // Show warning if near limit
  const showWarning = percentage > 0.9;

  if (terminalWidth < 80) {
    // Very compact: just percentage
    return (
      <Text color={color}>
        {percentageUsed}%
        {showWarning && <Text color={theme.status.warning}> ⚠</Text>}
      </Text>
    );
  }

  if (terminalWidth < 120) {
    // Medium: used/total percentage
    return (
      <Text>
        <Text color={color}>{percentageUsed}%</Text>
        <Text color={theme.text.secondary}> {t('context')}</Text>
        {showWarning && <Text color={theme.status.warning}> ⚠</Text>}
      </Text>
    );
  }

  // Full: "12.5K/128K (9.8% used)"
  return (
    <Text>
      <Text color={color} bold>
        {usedFormatted}
      </Text>
      <Text color={theme.text.secondary}>/{totalFormatted}</Text>
      <Text color={theme.text.secondary}> ({percentageUsed}% {t('used')})</Text>
      {showWarning && (
        <Text color={theme.status.warning}> ⚠ {t('Near limit')}</Text>
      )}
    </Text>
  );
};

/**
 * Extended context display with progress bar
 */
export const ContextUsageDisplayWithBar = ({
  promptTokenCount,
  contextWindowSize,
  width = 20,
}: {
  promptTokenCount: number;
  contextWindowSize: number;
  width?: number;
}) => {
  if (promptTokenCount === 0) {
    return null;
  }

  const percentage = promptTokenCount / contextWindowSize;
  const usedWidth = Math.round(percentage * width);
  const color = getUsageColor(percentage);

  const usedFormatted = formatTokenCount(promptTokenCount);
  const totalFormatted = formatTokenCount(contextWindowSize);

  return (
    <Text>
      <Text color={theme.text.secondary}>{t('Context')}: </Text>
      <Text color={color}>{usedFormatted}</Text>
      <Text color={theme.text.secondary}>/{totalFormatted}</Text>
      <Text color={theme.text.secondary}> [</Text>
      <Text color={color}>{'█'.repeat(Math.min(usedWidth, width))}</Text>
      <Text color={theme.border.default}>
        {'░'.repeat(Math.max(0, width - usedWidth))}
      </Text>
      <Text color={theme.text.secondary}>]</Text>
      <Text color={theme.text.secondary}> {(percentage * 100).toFixed(1)}%</Text>
    </Text>
  );
};
