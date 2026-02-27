/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resource Indicator Component
 * Displays GPU and Memory usage for running models
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';

/**
 * Resource usage levels
 */
type _UsageLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Get color for usage level
 */
function getUsageColor(percentage: number): string {
  if (percentage >= 90) return theme.status.error;
  if (percentage >= 75) return theme.status.warning;
  if (percentage >= 50) return theme.text.accent;
  return theme.status.success;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export interface GPUUsageProps {
  /** GPU name/model */
  name?: string;
  /** GPU utilization percentage (0-100) */
  utilization: number;
  /** Memory used in bytes */
  memoryUsed: number;
  /** Total GPU memory in bytes */
  memoryTotal: number;
  /** Temperature in Celsius */
  temperature?: number;
  /** Power draw in watts */
  powerDraw?: number;
  /** Power limit in watts */
  powerLimit?: number;
  /** Show compact view */
  compact?: boolean;
}

/**
 * GPU Usage Indicator
 *
 * Displays GPU utilization, memory usage, temperature, and power consumption.
 *
 * @example
 * ```tsx
 * <GPUUsage
 *   name="NVIDIA RTX 4090"
 *   utilization={85}
 *   memoryUsed={20 * 1024 * 1024 * 1024}
 *   memoryTotal={24 * 1024 * 1024 * 1024}
 *   temperature={72}
 *   powerDraw={350}
 *   powerLimit={450}
 * />
 * ```
 */
export const GPUUsage: React.FC<GPUUsageProps> = ({
  name,
  utilization,
  memoryUsed,
  memoryTotal,
  temperature,
  powerDraw,
  powerLimit,
  compact = false,
}) => {
  const memoryPercent = Math.round((memoryUsed / memoryTotal) * 100);
  const utilColor = getUsageColor(utilization);
  const memColor = getUsageColor(memoryPercent);

  if (compact) {
    return (
      <Box>
        <Text color={theme.text.secondary}>GPU: </Text>
        <Text color={utilColor}>{utilization}%</Text>
        <Text color={theme.ui.comment}> | </Text>
        <Text color={memColor}>{formatBytes(memoryUsed)}</Text>
        {temperature && (
          <>
            <Text color={theme.ui.comment}> | </Text>
            <Text
              color={
                temperature > 80 ? theme.status.warning : theme.text.primary
              }
            >
              {temperature}°C
            </Text>
          </>
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
          🎮 {name || t('GPU')}
        </Text>
      </Box>

      {/* Utilization bar */}
      <Box marginTop={1} alignItems="center">
        <Box width={12}>
          <Text color={theme.text.secondary}>{t('Utilization')}</Text>
        </Box>
        <UsageBar percentage={utilization} width={20} />
        <Box marginLeft={1}>
          <Text color={utilColor}>{utilization}%</Text>
        </Box>
      </Box>

      {/* Memory bar */}
      <Box alignItems="center">
        <Box width={12}>
          <Text color={theme.text.secondary}>{t('Memory')}</Text>
        </Box>
        <UsageBar percentage={memoryPercent} width={20} />
        <Box marginLeft={1}>
          <Text color={memColor}>
            {formatBytes(memoryUsed)}/{formatBytes(memoryTotal)}
          </Text>
        </Box>
      </Box>

      {/* Temperature */}
      {temperature !== undefined && (
        <Box alignItems="center">
          <Box width={12}>
            <Text color={theme.text.secondary}>{t('Temperature')}</Text>
          </Box>
          <TemperatureIndicator temperature={temperature} />
        </Box>
      )}

      {/* Power */}
      {powerDraw !== undefined && powerLimit !== undefined && (
        <Box alignItems="center">
          <Box width={12}>
            <Text color={theme.text.secondary}>{t('Power')}</Text>
          </Box>
          <Text
            color={
              powerDraw > powerLimit * 0.9
                ? theme.status.warning
                : theme.text.primary
            }
          >
            {powerDraw}W / {powerLimit}W
          </Text>
        </Box>
      )}
    </Box>
  );
};

export interface MemoryUsageProps {
  /** RAM used in bytes */
  used: number;
  /** Total RAM in bytes */
  total: number;
  /** Show swap usage */
  swapUsed?: number;
  swapTotal?: number;
  /** Show compact view */
  compact?: boolean;
}

/**
 * System Memory Usage Indicator
 */
export const MemoryUsage: React.FC<MemoryUsageProps> = ({
  used,
  total,
  swapUsed,
  swapTotal,
  compact = false,
}) => {
  const percentage = Math.round((used / total) * 100);
  const color = getUsageColor(percentage);

  if (compact) {
    return (
      <Box>
        <Text color={theme.text.secondary}>RAM: </Text>
        <Text color={color}>
          {formatBytes(used)}/{formatBytes(total)}
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
        <Text bold color={theme.text.accent}>
          💾 {t('System Memory')}
        </Text>
      </Box>

      {/* RAM bar */}
      <Box marginTop={1} alignItems="center">
        <Box width={12}>
          <Text color={theme.text.secondary}>{t('RAM')}</Text>
        </Box>
        <UsageBar percentage={percentage} width={20} />
        <Box marginLeft={1}>
          <Text color={color}>
            {formatBytes(used)}/{formatBytes(total)}
          </Text>
        </Box>
      </Box>

      {/* Swap bar */}
      {swapUsed !== undefined && swapTotal !== undefined && swapTotal > 0 && (
        <Box alignItems="center">
          <Box width={12}>
            <Text color={theme.text.secondary}>{t('Swap')}</Text>
          </Box>
          <UsageBar
            percentage={Math.round((swapUsed / swapTotal) * 100)}
            width={20}
          />
          <Box marginLeft={1}>
            <Text color={theme.text.primary}>
              {formatBytes(swapUsed)}/{formatBytes(swapTotal)}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export interface ModelMemoryProps {
  /** Model name */
  modelName: string;
  /** Memory used by model */
  memoryUsed: number;
  /** VRAM used (if GPU) */
  vramUsed?: number;
  /** Model size */
  modelSize: number;
  /** Quantization level */
  quantization?: string;
  /** Layers loaded */
  layersLoaded?: number;
  layersTotal?: number;
}

/**
 * Model Memory Usage Display
 */
export const ModelMemory: React.FC<ModelMemoryProps> = ({
  modelName,
  memoryUsed,
  vramUsed,
  modelSize,
  quantization,
  layersLoaded,
  layersTotal,
}) => (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.border.default}
      paddingX={1}
    >
      {/* Header */}
      <Box>
        <Text bold color={theme.text.accent}>
          📦 {modelName}
        </Text>
        {quantization && (
          <Box marginLeft={1}>
            <Text color={theme.text.secondary}>({quantization})</Text>
          </Box>
        )}
      </Box>

      {/* Model size */}
      <Box marginTop={1}>
        <Text color={theme.text.secondary}>
          {t('Size')}:{' '}
          <Text color={theme.text.primary}>{formatBytes(modelSize)}</Text>
        </Text>
      </Box>

      {/* Memory usage */}
      <Box>
        <Text color={theme.text.secondary}>
          {t('Memory')}:{' '}
          <Text color={theme.text.primary}>{formatBytes(memoryUsed)}</Text>
        </Text>
        {vramUsed !== undefined && (
          <Box marginLeft={2}>
            <Text color={theme.text.secondary}>
              {t('VRAM')}:{' '}
              <Text color={theme.text.accent}>{formatBytes(vramUsed)}</Text>
            </Text>
          </Box>
        )}
      </Box>

      {/* Layer progress */}
      {layersLoaded !== undefined && layersTotal !== undefined && (
        <Box alignItems="center">
          <Text color={theme.text.secondary}>
            {t('Layers')}: {layersLoaded}/{layersTotal}
          </Text>
          <Box marginLeft={1}>
            <UsageBar
              percentage={Math.round((layersLoaded / layersTotal) * 100)}
              width={15}
            />
          </Box>
        </Box>
      )}
    </Box>
  );

/**
 * Usage Bar Component
 */
interface UsageBarProps {
  percentage: number;
  width?: number;
}

const UsageBar: React.FC<UsageBarProps> = ({ percentage, width = 20 }) => {
  const filledWidth = Math.round((percentage / 100) * width);
  const emptyWidth = width - filledWidth;
  const color = getUsageColor(percentage);

  return (
    <Box>
      <Text color={color}>{'█'.repeat(filledWidth)}</Text>
      <Text color={theme.border.default}>{'░'.repeat(emptyWidth)}</Text>
    </Box>
  );
};

/**
 * Temperature Indicator
 */
interface TemperatureIndicatorProps {
  temperature: number;
  unit?: 'C' | 'F';
}

const TemperatureIndicator: React.FC<TemperatureIndicatorProps> = ({
  temperature,
  unit = 'C',
}) => {
  const getColor = (): string => {
    if (temperature > 85) return theme.status.error;
    if (temperature > 75) return theme.status.warning;
    return theme.status.success;
  };

  const getIcon = (): string => {
    if (temperature > 85) return '🔥';
    if (temperature > 75) return '🌡️';
    return '❄️';
  };

  return (
    <Box>
      <Text>{getIcon()} </Text>
      <Text color={getColor()}>
        {temperature}°{unit}
      </Text>
    </Box>
  );
};

/**
 * Combined System Resources Display
 */
export interface SystemResourcesProps {
  /** GPU data */
  gpu?: Array<{
    name?: string;
    utilization: number;
    memoryUsed: number;
    memoryTotal: number;
    temperature?: number;
  }>;
  /** Memory data */
  memory?: {
    used: number;
    total: number;
    swapUsed?: number;
    swapTotal?: number;
  };
  /** Running models */
  models?: Array<{
    name: string;
    memoryUsed: number;
    size: number;
  }>;
  /** Show in compact mode */
  compact?: boolean;
}

export const SystemResources: React.FC<SystemResourcesProps> = ({
  gpu,
  memory,
  models,
  compact = false,
}) => {
  if (compact) {
    return (
      <Box>
        {gpu && gpu[0] && (
          <Box marginRight={2}>
            <GPUUsage {...gpu[0]} compact />
          </Box>
        )}
        {memory && <MemoryUsage {...memory} compact />}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* GPU section */}
      {gpu && gpu.length > 0 && (
        <Box flexDirection="column">
          {gpu.map((g, i) => (
            <Box key={i} marginBottom={1}>
              <GPUUsage {...g} />
            </Box>
          ))}
        </Box>
      )}

      {/* Memory section */}
      {memory && (
        <Box marginBottom={1}>
          <MemoryUsage {...memory} />
        </Box>
      )}

      {/* Running models */}
      {models && models.length > 0 && (
        <Box flexDirection="column">
          <Text bold color={theme.text.primary}>
            {t('Running Models')}
          </Text>
          {models.map((model, i) => (
            <Box key={i} marginTop={1}>
              <ModelMemory
                modelName={model.name}
                memoryUsed={model.memoryUsed}
                modelSize={model.size}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
