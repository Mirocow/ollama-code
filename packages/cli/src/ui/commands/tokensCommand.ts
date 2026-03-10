/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageType } from '../types.js';
import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import { uiTelemetryService } from '@ollama-code/ollama-code-core';

/**
 * Format token count for display
 */
const formatTokens = (count: number): string => {
  if (count < 1000) return String(count);
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

/**
 * Create ASCII bar graph
 */
const createBar = (value: number, max: number, width: number): string => {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(Math.min(filled, width)) + '░'.repeat(Math.max(0, width - filled));
};

/**
 * Tokens command for viewing token usage statistics
 */
export const tokensCommand: SlashCommand = {
  name: 'tokens',
  get description() {
    return t('View token usage statistics.');
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'bar',
      get description() {
        return t('Show token usage as bar graph.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        // Get telemetry data
        const metrics = uiTelemetryService.getMetrics();

        const totalPrompt = metrics.totalPromptTokens;
        const totalGenerated = metrics.totalGeneratedTokens;
        const totalCached = metrics.totalCachedTokens;
        const maxTokens = Math.max(totalPrompt, totalGenerated, totalCached, 1);
        const barWidth = 30;

        let message = t('Token Usage Bar Graph\n');
        message += '═'.repeat(50) + '\n\n';

        // Prompt bar
        message += t('Prompt:   {{bar}} {{count}}\n', {
          bar: createBar(totalPrompt, maxTokens, barWidth),
          count: formatTokens(totalPrompt),
        });

        // Generated bar
        message += t('Generated: {{bar}} {{count}}\n', {
          bar: createBar(totalGenerated, maxTokens, barWidth),
          count: formatTokens(totalGenerated),
        });

        // Cached bar
        message += t('Cached:   {{bar}} {{count}}\n', {
          bar: createBar(totalCached, maxTokens, barWidth),
          count: formatTokens(totalCached),
        });

        message += '\n' + t('Legend: █ used | ░ unused\n');

        // Show ratio
        const ratio = totalPrompt > 0 ? (totalGenerated / totalPrompt).toFixed(2) : '0';
        message += t('Input/Output Ratio: {{ratio}}\n', { ratio });

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: message,
          },
          Date.now(),
        );
      },
    },
    {
      name: 'history',
      get description() {
        return t('Show token usage by model.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        const metrics = uiTelemetryService.getMetrics();

        let message = t('Token Usage By Model\n');
        message += '═'.repeat(50) + '\n\n';

        // Show per-model breakdown
        const modelEntries = Object.entries(metrics.models.byModel);
        if (modelEntries.length === 0) {
          message += t('No model-specific data available.\n');
          message += t('Total Prompt:   {{count}}\n', { count: formatTokens(metrics.totalPromptTokens) });
          message += t('Total Generated: {{count}}\n', { count: formatTokens(metrics.totalGeneratedTokens) });
        } else {
          for (const [model, modelStats] of modelEntries) {
            message += `${model}\n`;
            message += '─'.repeat(40) + '\n';
            message += `  ${t('Prompt')}:   ${formatTokens(modelStats.promptTokens)}\n`;
            message += `  ${t('Generated')}: ${formatTokens(modelStats.generatedTokens)}\n`;
            if (modelStats.cachedTokens > 0) {
              message += `  ${t('Cached')}:   ${formatTokens(modelStats.cachedTokens)}\n`;
            }
            message += '\n';
          }
        }

        message += t('Tip: Use /timeline for tool execution history.');

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: message,
          },
          Date.now(),
        );
      },
    },
  ],
  action: async (context): Promise<void> => {
    // Default: show summary
    const metrics = uiTelemetryService.getMetrics();

    const totalPrompt = metrics.totalPromptTokens;
    const totalGenerated = metrics.totalGeneratedTokens;
    const totalCached = metrics.totalCachedTokens;

    let message = t('Token Usage\n');
    message += '═'.repeat(30) + '\n\n';

    // Mini bar graph
    const maxTokens = Math.max(totalPrompt, totalGenerated, 1);
    const barWidth = 20;

    message += `Prompt:   ${createBar(totalPrompt, maxTokens, barWidth)} ${formatTokens(totalPrompt)}\n`;
    message += `Generated: ${createBar(totalGenerated, maxTokens, barWidth)} ${formatTokens(totalGenerated)}\n`;

    if (totalCached > 0) {
      const cacheRate = ((totalCached / totalPrompt) * 100).toFixed(1);
      message += `Cached:   ${createBar(totalCached, maxTokens, barWidth)} ${formatTokens(totalCached)} (${cacheRate}%)\n`;
    }

    message += '\n' + t('Commands: /tokens bar, /tokens history');

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: message,
      },
      Date.now(),
    );
  },
};
