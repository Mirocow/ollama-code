/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { memo, useState, useEffect } from 'react';
import { theme } from '../semantic-colors.js';
import { formatDuration } from '../utils/formatters.js';
import { t } from '../../i18n/index.js';

/**
 * Timeline entry for a tool execution
 */
export interface TimelineEntry {
  id: string;
  toolName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'success' | 'error' | 'timeout';
  decision?: 'accept' | 'reject' | 'modify' | 'auto_accept';
  error?: string;
}

interface ToolExecutionTimelineProps {
  entries: TimelineEntry[];
  maxEntries?: number;
  showTimestamps?: boolean;
  compact?: boolean;
  width?: number;
}

/**
 * Get color for tool status
 */
const getStatusColor = (status: TimelineEntry['status']): string => {
  switch (status) {
    case 'success':
      return theme.status.success;
    case 'error':
      return theme.status.error;
    case 'timeout':
      return theme.status.warning;
    case 'running':
      return theme.text.accent;
    default:
      return theme.text.primary;
  }
};

/**
 * Get icon for tool status
 */
const getStatusIcon = (status: TimelineEntry['status']): string => {
  switch (status) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'timeout':
      return '⚠';
    case 'running':
      return '⏳';
    default:
      return '○';
  }
};

/**
 * Get decision indicator
 */
const getDecisionIndicator = (decision?: TimelineEntry['decision']): string => {
  if (!decision) return '';
  switch (decision) {
    case 'accept':
      return ' [A]';
    case 'reject':
      return ' [R]';
    case 'modify':
      return ' [M]';
    case 'auto_accept':
      return ' [⚡]';
    default:
      return '';
  }
};

/**
 * Format timestamp to HH:MM:SS.mmm
 */
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Create a duration bar visualization
 */
const DurationBar: React.FC<{
  duration: number;
  maxDuration: number;
  width: number;
  status: TimelineEntry['status'];
}> = ({ duration, maxDuration, width, status }) => {
  const filled = Math.min(Math.round((duration / maxDuration) * width), width);
  const empty = width - filled;
  const color = getStatusColor(status);

  // Use different characters for different intensities
  const filledChar = '━';
  const emptyChar = '╺';

  return (
    <Text color={color}>
      {filledChar.repeat(filled)}
      {emptyChar.repeat(empty)}
    </Text>
  );
};

/**
 * Single timeline entry row
 */
const TimelineRow: React.FC<{
  entry: TimelineEntry;
  showTimestamp: boolean;
  maxDuration: number;
  barWidth: number;
  compact: boolean;
}> = memo(({ entry, showTimestamp, maxDuration, barWidth, compact }) => {
  const [elapsed, setElapsed] = useState(0);
  const isRunning = entry.status === 'running';

  // Update elapsed time for running entries
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - entry.startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, entry.startTime]);

  const duration = entry.duration ?? elapsed;
  const statusColor = getStatusColor(entry.status);
  const statusIcon = getStatusIcon(entry.status);
  const decisionIndicator = getDecisionIndicator(entry.decision);

  if (compact) {
    return (
      <Box>
        {showTimestamp && (
          <Box width={10}>
            <Text color={theme.text.secondary}>
              {formatTimestamp(entry.startTime)}
            </Text>
          </Box>
        )}
        <Box width={1}>
          <Text color={statusColor}>{statusIcon}</Text>
        </Box>
        <Box width={20}>
          <Text color={theme.text.link}>{entry.toolName}</Text>
        </Box>
        <Box width={8} justifyContent="flex-end">
          <Text color={statusColor}>{formatDuration(duration)}</Text>
        </Box>
        {entry.decision && (
          <Text color={theme.text.secondary}>{decisionIndicator}</Text>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={0}>
      <Box>
        {showTimestamp && (
          <Box width={10}>
            <Text color={theme.text.secondary}>
              {formatTimestamp(entry.startTime)}
            </Text>
          </Box>
        )}
        <Box width={1}>
          <Text color={statusColor}>{statusIcon}</Text>
        </Box>
        <Box width={24}>
          <Text bold color={theme.text.link}>
            {entry.toolName}
          </Text>
        </Box>
        <Box width={10} justifyContent="flex-end">
          <Text color={statusColor}>
            {isRunning ? `${formatDuration(duration)}...` : formatDuration(duration)}
          </Text>
        </Box>
        {entry.decision && (
          <Text color={theme.text.secondary}>{decisionIndicator}</Text>
        )}
      </Box>
      {!compact && maxDuration > 0 && (
        <Box marginLeft={showTimestamp ? 11 : 1}>
          <DurationBar
            duration={duration}
            maxDuration={maxDuration}
            width={barWidth}
            status={entry.status}
          />
        </Box>
      )}
      {entry.error && !compact && (
        <Box marginLeft={showTimestamp ? 11 : 1}>
          <Text color={theme.status.error}>  Error: {entry.error}</Text>
        </Box>
      )}
    </Box>
  );
});

TimelineRow.displayName = 'TimelineRow';

/**
 * Tool Execution Timeline Component
 * 
 * Displays a timeline of tool executions with:
 * - Timestamp
 * - Tool name
 * - Duration with visual bar
 * - Status (running, success, error, timeout)
 * - User decision indicator
 */
export const ToolExecutionTimeline: React.FC<ToolExecutionTimelineProps> = ({
  entries,
  maxEntries = 20,
  showTimestamps = true,
  compact = false,
  width,
}) => {
  // Limit entries
  const displayEntries = entries.slice(-maxEntries);
  
  // Calculate max duration for bar scaling
  const maxDuration = Math.max(
    ...displayEntries.map(e => e.duration ?? (Date.now() - e.startTime)),
    1000, // Minimum 1 second for scale
  );

  // Calculate bar width based on available space
  const barWidth = compact ? 0 : Math.min(30, (width ?? 80) - 45);

  if (displayEntries.length === 0) {
    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        paddingY={1}
        paddingX={2}
        width={width}
      >
        <Text color={theme.text.secondary}>
          {t('No tool executions recorded yet.')}
        </Text>
      </Box>
    );
  }

  // Count by status
  const statusCounts = {
    running: displayEntries.filter(e => e.status === 'running').length,
    success: displayEntries.filter(e => e.status === 'success').length,
    error: displayEntries.filter(e => e.status === 'error').length,
    timeout: displayEntries.filter(e => e.status === 'timeout').length,
  };

  return (
    <Box
      borderStyle="round"
      borderColor={theme.border.default}
      flexDirection="column"
      paddingY={1}
      paddingX={2}
      width={width}
    >
      <Text bold color={theme.text.accent}>
        {t('Tool Execution Timeline')}
      </Text>
      <Box height={1} />

      {/* Status summary */}
      <Box>
        <Text color={theme.text.secondary}>{t('Summary')}: </Text>
        {statusCounts.running > 0 && (
          <Box>
            <Text color={theme.text.accent}>
              {statusCounts.running} {t('running')}
            </Text>
            <Text color={theme.text.secondary}> | </Text>
          </Box>
        )}
        <Text color={theme.status.success}>
          {statusCounts.success} {t('ok')}
        </Text>
        {statusCounts.error > 0 && (
          <>
            <Text color={theme.text.secondary}> | </Text>
            <Text color={theme.status.error}>
              {statusCounts.error} {t('fail')}
            </Text>
          </>
        )}
        {statusCounts.timeout > 0 && (
          <>
            <Text color={theme.text.secondary}> | </Text>
            <Text color={theme.status.warning}>
              {statusCounts.timeout} {t('timeout')}
            </Text>
          </>
        )}
      </Box>

      <Box height={1} />

      {/* Timeline entries */}
      {displayEntries.map((entry) => (
        <TimelineRow
          key={entry.id}
          entry={entry}
          showTimestamp={showTimestamps}
          maxDuration={maxDuration}
          barWidth={barWidth}
          compact={compact}
        />
      ))}
    </Box>
  );
};

/**
 * Hook to manage timeline entries
 */
export const useToolTimeline = (maxEntries: number = 50) => {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  const startTool = (toolName: string): string => {
    const id = `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry: TimelineEntry = {
      id,
      toolName,
      startTime: Date.now(),
      status: 'running',
    };

    setEntries(prev => {
      const newEntries = [...prev, entry];
      return newEntries.slice(-maxEntries);
    });

    return id;
  };

  const endTool = (
    id: string,
    status: 'success' | 'error' | 'timeout',
    decision?: TimelineEntry['decision'],
    error?: string,
  ) => {
    setEntries(prev =>
      prev.map(entry => {
        if (entry.id !== id) return entry;

        const endTime = Date.now();
        return {
          ...entry,
          endTime,
          duration: endTime - entry.startTime,
          status,
          decision,
          error,
        };
      }),
    );
  };

  const clear = () => {
    setEntries([]);
  };

  return {
    entries,
    startTool,
    endTool,
    clear,
  };
};
