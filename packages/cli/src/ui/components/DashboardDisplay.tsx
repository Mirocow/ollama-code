/**
 * Dashboard Display Component
 *
 * Visualizes session analytics and metrics in terminal UI
 */

import { Box, Text } from 'ink';
import { memo } from 'react';
import { theme } from '../semantic-colors.js';
import type { DashboardStats } from '@ollama-code/ollama-code-core';

interface DashboardDisplayProps {
  stats: DashboardStats;
  width?: number;
}

/**
 * Progress bar component
 */
const ProgressBar = ({
  value,
  max,
  width = 20,
}: {
  value: number;
  max: number;
  width?: number;
}) => {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const filled = Math.round((percent / 100) * width);

  return (
    <Text>
      <Text color={theme.text.accent}>{'█'.repeat(Math.min(filled, width))}</Text>
      <Text color={theme.text.secondary}>{'░'.repeat(Math.max(0, width - filled))}</Text>
    </Text>
  );
};

/**
 * Metric card component
 */
const MetricCard = ({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) => (
  <Box flexDirection="column" marginX={1}>
    <Text color={theme.text.secondary}>{label}</Text>
    <Text color={theme.text.accent} bold>
      {value}
    </Text>
    {subValue && <Text color={theme.text.secondary}>{subValue}</Text>}
  </Box>
);

/**
 * Main Dashboard Display component
 */
export const DashboardDisplay = memo(({ stats }: DashboardDisplayProps) => {
  const { currentSession, aggregated, daily } = stats;

  return (
    <Box flexDirection="column" paddingX={2}>
      <Text bold color={theme.text.accent}>
        ╔══════════════════════════════════════════════════════════════════════════╗
      </Text>
      <Text bold color={theme.text.accent}>
        ║                      📊 OLLAMA CODE DASHBOARD                            ║
      </Text>
      <Text bold color={theme.text.accent}>
        ╚══════════════════════════════════════════════════════════════════════════╝
      </Text>
      <Text> </Text>

      {/* Current Session */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={theme.text.primary}>📊 Current Session</Text>
        <Box flexDirection="row" marginTop={1}>
          <MetricCard
            label="Duration"
            value={formatDuration(currentSession.duration)}
          />
          <MetricCard
            label="Tokens"
            value={formatNumber(currentSession.promptTokens + currentSession.generatedTokens)}
            subValue={`↑${formatNumber(currentSession.promptTokens)} / ↓${formatNumber(currentSession.generatedTokens)}`}
          />
          <MetricCard
            label="Tool Calls"
            value={formatNumber(currentSession.toolCalls)}
          />
          <MetricCard
            label="Est. Cost"
            value={formatCost(currentSession.cost)}
          />
        </Box>
      </Box>

      {/* Aggregated Stats */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={theme.text.primary}>📈 All Sessions ({aggregated.totalSessions})</Text>
        <Box flexDirection="row" marginTop={1}>
          <MetricCard
            label="Total Tokens"
            value={formatNumber(aggregated.totalPromptTokens + aggregated.totalGeneratedTokens)}
          />
          <MetricCard
            label="Total Cost"
            value={formatCost(aggregated.totalCost)}
          />
          <MetricCard
            label="Avg Duration"
            value={formatDuration(aggregated.averageSessionDuration)}
          />
          <MetricCard
            label="Most Used"
            value={aggregated.mostUsedModel.slice(0, 20)}
          />
        </Box>
      </Box>

      {/* Daily Usage Chart */}
      {daily.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color={theme.text.primary}>📅 Daily Usage (Last 7 Days)</Text>
          <Box flexDirection="column" marginTop={1} marginLeft={2}>
            {daily.map((day) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const maxTokens = Math.max(...daily.map(d => d.tokens), 1);

              return (
                <Box key={day.date} flexDirection="row">
                  <Text color={theme.text.secondary}>{dayName} </Text>
                  <ProgressBar value={day.tokens} max={maxTokens} width={15} />
                  <Text color={theme.text.secondary}> {formatNumber(day.tokens)} tokens</Text>
                  {day.cost > 0 && (
                    <Text color={theme.text.accent}> ({formatCost(day.cost)})</Text>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Text> </Text>
      <Text color={theme.text.secondary} dimColor>
        Tip: Use /costs for detailed cost breakdown, /tokens for token graph
      </Text>
    </Box>
  );
});

DashboardDisplay.displayName = 'DashboardDisplay';

// Helper functions
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return '<$0.01';
  }
  return `$${cost.toFixed(2)}`;
}
