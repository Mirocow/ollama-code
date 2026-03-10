/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { memo, useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';

/**
 * Token usage data point
 */
export interface TokenDataPoint {
  timestamp: number;
  promptTokens: number;
  generatedTokens: number;
  cachedTokens: number;
}

/**
 * Props for TokenUsageGraph component
 */
interface TokenUsageGraphProps {
  /** History of token usage data points */
  dataPoints: TokenDataPoint[];
  /** Maximum number of data points to display */
  maxPoints?: number;
  /** Graph width in characters */
  width?: number;
  /** Graph height in lines */
  height?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Show current values */
  showCurrentValues?: boolean;
  /** Show total values */
  showTotals?: boolean;
}

/**
 * Characters for graph drawing
 */
const GRAPH_CHARS = {
  empty: '░',
  filled: '█',
  half: '▓',
  quarter: '▒',
};

/**
 * Format token count for display
 */
const formatTokens = (count: number): string => {
  if (count < 1000) return String(count);
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

/**
 * Create a sparkline graph for a single metric
 */
const Sparkline: React.FC<{
  values: number[];
  width: number;
  color: string;
  max?: number;
}> = memo(({ values, width, color, max }) => {
  if (values.length === 0) {
    return (
      <Text color={theme.text.secondary}>
        {GRAPH_CHARS.empty.repeat(width)}
      </Text>
    );
  }

  const maxValue = max ?? Math.max(...values, 1);
  const displayValues = values.slice(-width);

  // Scale to fit width
  const scaledValues: number[] = [];
  const scale = displayValues.length / width;
  for (let i = 0; i < width; i++) {
    const sourceIndex = Math.floor(i * scale);
    scaledValues.push(displayValues[sourceIndex] ?? 0);
  }

  // Convert to bar heights (0-4)
  const barHeights = scaledValues.map((v) => {
    const normalized = v / maxValue;
    if (normalized > 0.75) return 4;
    if (normalized > 0.5) return 3;
    if (normalized > 0.25) return 2;
    if (normalized > 0) return 1;
    return 0;
  });

  // Render as block characters
  const bars = barHeights.map((h) => {
    switch (h) {
      case 4:
        return '█';
      case 3:
        return '▓';
      case 2:
        return '▒';
      case 1:
        return '░';
      default:
        return ' ';
    }
  });

  return <Text color={color}>{bars.join('')}</Text>;
});

Sparkline.displayName = 'Sparkline';

/**
 * Mini bar graph for current values
 */
const MiniBar: React.FC<{
  value: number;
  max: number;
  width: number;
  color: string;
  label: string;
}> = memo(({ value, max, width, color, label }) => {
  const percentage = max > 0 ? value / max : 0;
  const filled = Math.round(percentage * width);
  const empty = width - filled;

  return (
    <Box>
      <Box width={12}>
        <Text color={theme.text.secondary}>{label}</Text>
      </Box>
      <Text color={color}>
        {GRAPH_CHARS.filled.repeat(Math.min(filled, width))}
        {GRAPH_CHARS.empty.repeat(Math.max(0, empty))}
      </Text>
      <Box width={10} justifyContent="flex-end">
        <Text color={color}>{formatTokens(value)}</Text>
      </Box>
    </Box>
  );
});

MiniBar.displayName = 'MiniBar';

/**
 * Token Usage Graph Component
 *
 * Displays real-time token usage visualization with:
 * - Sparkline graphs for prompt, generated, and cached tokens
 * - Current values with mini bar graphs
 * - Total statistics
 */
export const TokenUsageGraph: React.FC<TokenUsageGraphProps> = memo(
  ({
    dataPoints,
    maxPoints = 30,
    width = 40,
    height: _height = 3,
    showLegend = true,
    showCurrentValues = true,
    showTotals = true,
  }) => {
    if (dataPoints.length === 0) {
      return (
        <Box
          borderStyle="round"
          borderColor={theme.border.default}
          paddingX={1}
        >
          <Text color={theme.text.secondary}>
            {t('No token usage data available.')}
          </Text>
        </Box>
      );
    }

    // Get last N data points
    const recentPoints = dataPoints.slice(-maxPoints);

    // Extract values for each metric
    const promptValues = recentPoints.map((p) => p.promptTokens);
    const generatedValues = recentPoints.map((p) => p.generatedTokens);
    const cachedValues = recentPoints.map((p) => p.cachedTokens);

    // Calculate current and max values
    const lastPoint = recentPoints[recentPoints.length - 1];
    const maxPrompt = Math.max(...promptValues, 1);
    const maxGenerated = Math.max(...generatedValues, 1);
    const maxCached = Math.max(...cachedValues, 1);

    // Calculate totals
    const totalPrompt = recentPoints.reduce(
      (sum, p) => sum + p.promptTokens,
      0,
    );
    const totalGenerated = recentPoints.reduce(
      (sum, p) => sum + p.generatedTokens,
      0,
    );
    const totalCached = recentPoints.reduce(
      (sum, p) => sum + p.cachedTokens,
      0,
    );

    // Calculate average generation speed (tokens per second)
    const timeDiff =
      recentPoints.length > 1
        ? (recentPoints[recentPoints.length - 1].timestamp -
            recentPoints[0].timestamp) /
          1000
        : 1;
    const avgSpeed = timeDiff > 0 ? Math.round(totalGenerated / timeDiff) : 0;

    // Calculate cache hit rate
    const cacheHitRate =
      totalPrompt > 0 ? ((totalCached / totalPrompt) * 100).toFixed(1) : '0';

    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        flexDirection="column"
        paddingY={1}
        paddingX={2}
      >
        <Text bold color={theme.text.accent}>
          {t('Token Usage Graph')}
        </Text>

        {/* Sparkline graphs */}
        <Box height={1} />

        {/* Prompt tokens sparkline */}
        <Box>
          <Box width={10}>
            <Text color={theme.text.link}>{t('Prompt')}</Text>
          </Box>
          <Sparkline
            values={promptValues}
            width={width}
            color={theme.text.accent}
            max={maxPrompt}
          />
        </Box>

        {/* Generated tokens sparkline */}
        <Box>
          <Box width={10}>
            <Text color={theme.status.success}>{t('Generated')}</Text>
          </Box>
          <Sparkline
            values={generatedValues}
            width={width}
            color={theme.status.success}
            max={maxGenerated}
          />
        </Box>

        {/* Cached tokens sparkline */}
        <Box>
          <Box width={10}>
            <Text color={theme.text.secondary}>{t('Cached')}</Text>
          </Box>
          <Sparkline
            values={cachedValues}
            width={width}
            color={theme.text.secondary}
            max={maxCached}
          />
        </Box>

        {/* Current values */}
        {showCurrentValues && lastPoint && (
          <>
            <Box height={1} />
            <Text bold color={theme.text.primary}>
              {t('Current')}
            </Text>
            <MiniBar
              value={lastPoint.promptTokens}
              max={maxPrompt}
              width={width}
              color={theme.text.accent}
              label={t('Prompt')}
            />
            <MiniBar
              value={lastPoint.generatedTokens}
              max={maxGenerated}
              width={width}
              color={theme.status.success}
              label={t('Generated')}
            />
            <MiniBar
              value={lastPoint.cachedTokens}
              max={maxCached}
              width={width}
              color={theme.text.secondary}
              label={t('Cached')}
            />
          </>
        )}

        {/* Totals and statistics */}
        {showTotals && (
          <>
            <Box height={1} />
            <Box>
              <Text color={theme.text.secondary}>
                {t('Total: {{prompt}} in / {{generated}} out', {
                  prompt: formatTokens(totalPrompt),
                  generated: formatTokens(totalGenerated),
                })}
              </Text>
            </Box>
            <Box>
              <Text color={theme.text.secondary}>
                {t('Speed: {{speed}} tok/s | Cache: {{rate}}%', {
                  speed: String(avgSpeed),
                  rate: cacheHitRate,
                })}
              </Text>
            </Box>
          </>
        )}

        {/* Legend */}
        {showLegend && (
          <>
            <Box height={1} />
            <Box>
              <Text color={theme.text.accent}>█</Text>
              <Text color={theme.text.secondary}> {t('Prompt')} </Text>
              <Text color={theme.status.success}>█</Text>
              <Text color={theme.text.secondary}> {t('Generated')} </Text>
              <Text color={theme.text.secondary}>█</Text>
              <Text color={theme.text.secondary}> {t('Cached')}</Text>
            </Box>
          </>
        )}
      </Box>
    );
  },
);

TokenUsageGraph.displayName = 'TokenUsageGraph';

/**
 * Hook for managing token usage history
 */
export const useTokenUsageHistory = (maxPoints: number = 100) => {
  const [dataPoints, setDataPoints] = useState<TokenDataPoint[]>([]);

  const addDataPoint = (point: Omit<TokenDataPoint, 'timestamp'>) => {
    const newPoint: TokenDataPoint = {
      ...point,
      timestamp: Date.now(),
    };

    setDataPoints((prev) => {
      const newPoints = [...prev, newPoint];
      return newPoints.slice(-maxPoints);
    });
  };

  const clear = () => {
    setDataPoints([]);
  };

  return {
    dataPoints,
    addDataPoint,
    clear,
  };
};
