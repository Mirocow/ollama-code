/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Token Graph Command
 *
 * Enhanced token usage visualization with sparkline graphs.
 */

import { MessageType } from '../types.js';
import type { SlashCommand, SlashCommandActionReturn } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import { tokenGraphService } from '@ollama-code/ollama-code-core';

/**
 * Token Graph command for visualizing token usage
 */
export const tokenGraphCommand: SlashCommand = {
  name: 'token-graph',
  get description() {
    return t('Visualize token usage with sparkline graphs.');
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'show',
      get description() {
        return t('Show detailed token usage graph.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        const graph = tokenGraphService.generateGraphOutput();
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: graph,
          },
          Date.now(),
        );
      },
    },
    {
      name: 'mini',
      get description() {
        return t('Show mini inline graph.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        const mini = tokenGraphService.generateMiniGraph();
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: mini,
          },
          Date.now(),
        );
      },
    },
    {
      name: 'stats',
      get description() {
        return t('Show token statistics summary.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        const stats = tokenGraphService.getStatistics();
        const byModel = tokenGraphService.getByModel();

        let message = t('Token Statistics\n');
        message += '═'.repeat(40) + '\n\n';

        message += t('Summary\n');
        message += '─'.repeat(20) + '\n';
        message += t('Messages: {{count}}\n', { count: String(stats.messageCount) });
        message += t('Total Prompt: {{tokens}}\n', {
          tokens: formatTokens(stats.totalPrompt),
        });
        message += t('Total Generated: {{tokens}}\n', {
          tokens: formatTokens(stats.totalGenerated),
        });
        if (stats.totalCached > 0) {
          message += t('Total Cached: {{tokens}} ({{rate}}%)\n', {
            tokens: formatTokens(stats.totalCached),
            rate: ((stats.totalCached / stats.totalPrompt) * 100).toFixed(1),
          });
        }

        message += '\n' + t('Averages\n');
        message += '─'.repeat(20) + '\n';
        message += t('Avg Prompt: {{tokens}}\n', { tokens: formatTokens(stats.avgPrompt) });
        message += t('Avg Generated: {{tokens}}\n', {
          tokens: formatTokens(stats.avgGenerated),
        });
        message += t('Avg Rate: {{rate}}\n', { rate: stats.avgRate.toFixed(2) });

        message += '\n' + t('Peaks\n');
        message += '─'.repeat(20) + '\n';
        message += t('Max Prompt: {{tokens}}\n', { tokens: formatTokens(stats.maxPrompt) });
        message += t('Max Generated: {{tokens}}\n', {
          tokens: formatTokens(stats.maxGenerated),
        });
        message += t('Peak Rate: {{rate}}\n', { rate: stats.peakRate.toFixed(2) });

        // By model breakdown
        const models = Object.entries(byModel);
        if (models.length > 1) {
          message += '\n' + t('By Model\n');
          message += '─'.repeat(20) + '\n';
          for (const [model, data] of models) {
            message += `${model}:\n`;
            message += `  ${t('Messages')}: ${data.count}\n`;
            message += `  ${t('Tokens')}: ${formatTokens(data.promptTokens + data.generatedTokens)}\n`;
          }
        }

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
      name: 'export',
      get description() {
        return t('Export token history. Usage: /token-graph export [json|csv]');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context, args): Promise<void> => {
        const format = args?.trim() || 'json';
        let output: string;
        let extension: string;

        if (format === 'csv') {
          output = tokenGraphService.exportCsv();
          extension = 'csv';
        } else {
          output = tokenGraphService.exportJson();
          extension = 'json';
        }

        const filename = `token-history-${Date.now()}.${extension}`;
        let message = t('Exported to: {{filename}}\n\n', { filename });
        message += '```' + extension + '\n';
        message += output.slice(0, 2000);
        if (output.length > 2000) {
          message += '\n... (truncated)';
        }
        message += '\n```';

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
      name: 'clear',
      get description() {
        return t('Clear token history.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        tokenGraphService.clear();
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Token history cleared.'),
          },
          Date.now(),
        );
      },
    },
    {
      name: 'history',
      get description() {
        return t('Show recent token usage records. Usage: /token-graph history [count]');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context, args): Promise<void> => {
        const count = parseInt(args?.trim() || '10', 10);
        const history = tokenGraphService.getRecentHistory(count);

        if (history.length === 0) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('No token history available.'),
            },
            Date.now(),
          );
          return;
        }

        let message = t('Recent Token Usage ({{count}} records)\n', {
          count: String(history.length),
        });
        message += '─'.repeat(60) + '\n';
        message += 'Index | Prompt  | Generated | Rate   | Model\n';
        message += '─'.repeat(60) + '\n';

        for (const record of history) {
          const rate = record.promptTokens > 0
            ? (record.generatedTokens / record.promptTokens).toFixed(2)
            : '0.00';
          message += `${String(record.messageIndex).padStart(5)} | `;
          message += `${formatTokens(record.promptTokens).padStart(7)} | `;
          message += `${formatTokens(record.generatedTokens).padStart(9)} | `;
          message += `${rate.padStart(6)} | `;
          message += `${record.model}\n`;
        }

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
  action: async (context): Promise<void | SlashCommandActionReturn> => {
    // Default: show graph
    const graph = tokenGraphService.generateGraphOutput();
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: graph,
      },
      Date.now(),
    );
  },
};

/**
 * Format token count
 */
function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export default tokenGraphCommand;
