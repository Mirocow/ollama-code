/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { formatDuration } from '../utils/formatters.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { t } from '../../i18n/index.js';

const METRIC_COL_WIDTH = 28;
const MODEL_COL_WIDTH = 22;

interface StatRowProps {
  title: string;
  values: Array<string | React.ReactElement>;
  isSubtle?: boolean;
  isSection?: boolean;
}

const StatRow: React.FC<StatRowProps> = ({
  title,
  values,
  isSubtle = false,
  isSection = false,
}) => (
  <Box>
    <Box width={METRIC_COL_WIDTH}>
      <Text
        bold={isSection}
        color={isSection ? theme.text.primary : theme.text.link}
      >
        {isSubtle ? `  ↳ ${title}` : title}
      </Text>
    </Box>
    {values.map((value, index) => (
      <Box width={MODEL_COL_WIDTH} key={index}>
        <Text color={theme.text.primary}>{value}</Text>
      </Box>
    ))}
  </Box>
);

interface ModelStatsDisplayProps {
  width?: number;
}

/**
 * ModelStatsDisplay shows per-model statistics.
 * 
 * The byModel data structure contains:
 * - promptTokens: number
 * - generatedTokens: number
 * - cachedTokens: number
 * - apiTime: number
 * 
 * Aggregate data (totalRequests, totalErrors) is in models.api.
 */
export const ModelStatsDisplay: React.FC<ModelStatsDisplayProps> = ({
  width,
}) => {
  const { stats } = useSessionStats();
  const { models } = stats.metrics;

  // Handle undefined/null models or api (can happen during resume with old session data)
  if (!models || !models.api) {
    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        paddingY={1}
        paddingX={2}
        width={width}
      >
        <Text color={theme.text.primary}>
          {t('No API calls have been made in this session.')}
        </Text>
      </Box>
    );
  }

  // Get per-model data from byModel
  const byModel = models.byModel || {};
  const activeModels = Object.entries(byModel).filter(
    ([, m]) => m && (m.promptTokens > 0 || m.generatedTokens > 0),
  );

  // If no per-model data, check if we have any API calls at all
  if (activeModels.length === 0 && models.api.totalRequests === 0) {
    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        paddingY={1}
        paddingX={2}
        width={width}
      >
        <Text color={theme.text.primary}>
          {t('No API calls have been made in this session.')}
        </Text>
      </Box>
    );
  }

  const modelNames = activeModels.map(([name]) => name);

  // Helper to get values from byModel entries
  // byModel entries have: promptTokens, generatedTokens, cachedTokens, apiTime
  const getModelValues = (
    getter: (metrics: { promptTokens: number; generatedTokens: number; cachedTokens: number; apiTime: number }) => string | React.ReactElement,
  ) => activeModels.map(([, m]) => getter(m));

  const hasCached = activeModels.some(([, m]) => m.cachedTokens > 0);

  // Calculate cache hit rate for a model
  const getCacheHitRate = (m: { promptTokens: number; cachedTokens: number }) => {
    if (m.promptTokens === 0) return 0;
    return (m.cachedTokens / m.promptTokens) * 100;
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
        {t('Model Stats For Nerds')}
      </Text>
      <Box height={1} />

      {/* Header */}
      <Box>
        <Box width={METRIC_COL_WIDTH}>
          <Text bold color={theme.text.primary}>
            {t('Metric')}
          </Text>
        </Box>
        {modelNames.map((name) => (
          <Box width={MODEL_COL_WIDTH} key={name}>
            <Text bold color={theme.text.primary}>
              {name}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Divider */}
      <Box
        borderStyle="single"
        borderBottom={true}
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderColor={theme.border.default}
      />

      {/* Aggregate API Stats Section */}
      <StatRow title={t('API (aggregate)')} values={[]} isSection />
      <StatRow
        title={t('Requests')}
        values={modelNames.map(() => models.api.totalRequests.toLocaleString())}
      />
      <StatRow
        title={t('Errors')}
        values={modelNames.map(() => (
          <Text
            color={
              models.api.totalErrors > 0 ? theme.status.error : theme.text.primary
            }
          >
            {models.api.totalErrors.toLocaleString()}
          </Text>
        ))}
      />
      <StatRow
        title={t('Avg Latency')}
        values={modelNames.map(() => {
          const avgLatency = models.api.totalRequests > 0
            ? models.api.totalLatencyMs / models.api.totalRequests
            : 0;
          return formatDuration(avgLatency);
        })}
      />

      <Box height={1} />

      {/* Per-Model Token Stats Section */}
      <StatRow title={t('Tokens')} values={[]} isSection />
      <StatRow
        title={t('Total')}
        values={getModelValues((m) => (
          <Text color={theme.status.warning}>
            {(m.promptTokens + m.generatedTokens).toLocaleString()}
          </Text>
        ))}
      />
      <StatRow
        title={t('Prompt')}
        isSubtle
        values={getModelValues((m) => m.promptTokens.toLocaleString())}
      />
      {hasCached && (
        <StatRow
          title={t('Cached')}
          isSubtle
          values={getModelValues((m) => {
            const cacheHitRate = getCacheHitRate(m);
            return (
              <Text color={theme.status.success}>
                {m.cachedTokens.toLocaleString()} ({cacheHitRate.toFixed(1)}%)
              </Text>
            );
          })}
        />
      )}
      <StatRow
        title={t('Output')}
        isSubtle
        values={getModelValues((m) => m.generatedTokens.toLocaleString())}
      />

      <Box height={1} />

      {/* Per-Model Time Stats Section */}
      <StatRow title={t('API Time')} values={[]} isSection />
      <StatRow
        title={t('Total')}
        values={getModelValues((m) => formatDuration(m.apiTime))}
      />
    </Box>
  );
};
