/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Progress Bar Component
 * Displays download/processing progress with visual bar and percentage
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';

export interface ProgressBarProps {
  /** Current progress value (0-100) */
  progress: number;
  /** Total value (default 100) */
  total?: number;
  /** Width of the progress bar in characters */
  width?: number;
  /** Label to show before the bar */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Show fraction (current/total) */
  showFraction?: boolean;
  /** Show speed (e.g., MB/s) */
  speed?: string;
  /** Show ETA */
  eta?: string;
  /** Completed state */
  completed?: boolean;
  /** Custom color for the bar */
  barColor?: string;
  /** Custom character for filled portion */
  filledChar?: string;
  /** Custom character for empty portion */
  emptyChar?: string;
}

/**
 * Progress Bar Component
 *
 * Renders a visual progress bar with optional label, percentage, speed, and ETA.
 * Supports both determinate (known total) and indeterminate (unknown total) progress.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   progress={45}
 *   label="Downloading model"
 *   showPercentage
 *   speed="5.2 MB/s"
 *   eta="2m 30s"
 * />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total = 100,
  width = 30,
  label,
  showPercentage = true,
  showFraction = false,
  speed,
  eta,
  completed = false,
  barColor,
  filledChar = '█',
  emptyChar = '░',
}) => {
  // Clamp progress to valid range
  const clampedProgress = Math.min(Math.max(progress, 0), total);
  const percentage = Math.round((clampedProgress / total) * 100);

  // Calculate filled width
  const filledWidth = Math.round((clampedProgress / total) * width);
  const emptyWidth = width - filledWidth;

  // Build the bar string
  const filledBar = filledChar.repeat(filledWidth);
  const emptyBar = emptyChar.repeat(emptyWidth);

  // Determine bar color based on state
  const actualBarColor = completed
    ? theme.status.success
    : barColor || theme.text.accent;

  return (
    <Box flexDirection="column">
      {/* Label row */}
      {label && (
        <Box>
          <Text bold color={theme.text.primary}>
            {label}
          </Text>
          {completed && (
            <Text color={theme.status.success}> {t('✓ Complete')}</Text>
          )}
        </Box>
      )}

      {/* Progress bar row */}
      <Box alignItems="center">
        {/* Left bracket */}
        <Text color={actualBarColor}>[</Text>

        {/* Progress bar */}
        <Text color={actualBarColor}>{filledBar}</Text>
        <Text color={theme.border.default}>{emptyBar}</Text>

        {/* Right bracket */}
        <Text color={actualBarColor}>]</Text>

        {/* Percentage */}
        {showPercentage && (
          <Box marginLeft={1}>
            <Text color={theme.text.primary}>
              {percentage.toString().padStart(3)}%
            </Text>
          </Box>
        )}

        {/* Fraction */}
        {showFraction && (
          <Box marginLeft={1}>
            <Text color={theme.text.secondary}>
              ({clampedProgress.toLocaleString()}/{total.toLocaleString()})
            </Text>
          </Box>
        )}
      </Box>

      {/* Speed and ETA row */}
      {(speed || eta) && (
        <Box>
          {speed && (
            <Box marginRight={2}>
              <Text color={theme.text.secondary}>
                {t('Speed')}: {speed}
              </Text>
            </Box>
          )}
          {eta && !completed && (
            <Box>
              <Text color={theme.text.secondary}>
                {t('ETA')}: {eta}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

/**
 * Model Download Progress Component
 * Specialized progress bar for Ollama model downloads
 */
export interface ModelDownloadProgressProps {
  /** Model name being downloaded */
  modelName: string;
  /** Current bytes downloaded */
  downloaded: number;
  /** Total bytes to download (0 if unknown) */
  total: number;
  /** Download speed in bytes per second */
  speed?: number;
  /** Current digest being downloaded */
  digest?: string;
  /** Download status */
  status?: 'pulling' | 'verifying' | 'complete';
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Format speed to human-readable string
 */
function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

/**
 * Estimate time remaining
 */
function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export const ModelDownloadProgress: React.FC<ModelDownloadProgressProps> = ({
  modelName,
  downloaded,
  total,
  speed,
  digest,
  status = 'pulling',
}) => {
  const isComplete = status === 'complete';
  const hasTotal = total > 0;

  // Calculate progress percentage
  const progress = hasTotal ? (downloaded / total) * 100 : 0;

  // Calculate ETA
  const eta =
    speed && hasTotal && progress > 0
      ? formatETA((total - downloaded) / speed)
      : undefined;

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
          {isComplete ? '✓' : '⬇'} {modelName}
        </Text>
        {digest && (
          <Text color={theme.text.secondary}> {digest.substring(0, 12)}</Text>
        )}
      </Box>

      {/* Progress bar */}
      {hasTotal && (
        <ProgressBar
          progress={progress}
          total={100}
          width={40}
          showPercentage
          completed={isComplete}
          speed={speed ? formatSpeed(speed) : undefined}
          eta={eta}
        />
      )}

      {/* Indeterminate progress */}
      {!hasTotal && !isComplete && (
        <Box>
          <Text color={theme.text.secondary}>
            {t('Downloading...')} {formatBytes(downloaded)}
          </Text>
        </Box>
      )}

      {/* Status */}
      {status === 'verifying' && (
        <Box>
          <Text color={theme.status.warning}>{t('Verifying download...')}</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Multi-stage Progress Component
 * Shows progress through multiple stages of an operation
 */
export interface MultiStageProgressProps {
  /** Stages to display */
  stages: Array<{
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress?: number;
  }>;
  /** Title for the progress display */
  title?: string;
}

export const MultiStageProgress: React.FC<MultiStageProgressProps> = ({
  stages,
  title,
}) => {
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '●';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return theme.status.success;
      case 'in_progress':
        return theme.text.accent;
      case 'failed':
        return theme.status.error;
      default:
        return theme.text.secondary;
    }
  };

  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={1}>
          <Text bold color={theme.text.primary}>
            {title}
          </Text>
        </Box>
      )}

      {stages.map((stage, index) => (
        <Box key={index} flexDirection="column">
          <Box alignItems="center">
            <Text color={getStatusColor(stage.status)}>
              {getStatusIcon(stage.status)}
            </Text>
            <Text
              color={
                stage.status === 'pending'
                  ? theme.text.secondary
                  : theme.text.primary
              }
            >
              {' '}
              {stage.name}
            </Text>
          </Box>

          {stage.status === 'in_progress' && stage.progress !== undefined && (
            <Box marginLeft={2} marginTop={0}>
              <ProgressBar
                progress={stage.progress}
                width={30}
                showPercentage
              />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};
