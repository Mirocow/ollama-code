/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageType } from '../types.js';
import type { SlashCommand, SlashCommandActionReturn } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import { formatDuration } from '../utils/formatters.js';

/**
 * Tool execution entry for timeline display
 */
interface ToolExecutionEntry {
  name: string;
  timestamp: string;
  duration: number;
  status: 'success' | 'error' | 'timeout' | 'running';
  decision?: 'accept' | 'reject' | 'modify' | 'auto_accept';
}

// In-memory store for tool executions (will be populated from telemetry)
const toolExecutions: ToolExecutionEntry[] = [];

/**
 * Add a tool execution to the timeline
 */
export function addToolExecution(entry: ToolExecutionEntry): void {
  toolExecutions.push(entry);
  // Keep only last 100 entries
  if (toolExecutions.length > 100) {
    toolExecutions.shift();
  }
}

/**
 * Get all tool executions
 */
export function getToolExecutions(): ToolExecutionEntry[] {
  return [...toolExecutions];
}

/**
 * Clear tool executions
 */
export function clearToolExecutions(): void {
  toolExecutions.length = 0;
}

/**
 * Format tool status with icon
 */
const formatStatus = (status: ToolExecutionEntry['status']): string => {
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
 * Format decision indicator
 */
const formatDecision = (decision?: ToolExecutionEntry['decision']): string => {
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
 * Timeline command for viewing tool execution history
 */
export const timelineCommand: SlashCommand = {
  name: 'timeline',
  get description() {
    return t('View tool execution timeline with durations and status.');
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'list',
      get description() {
        return t('List all tool executions. Usage: /timeline list [--limit=N]');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context, args): Promise<void> => {
        const limitMatch = args?.match(/--limit=(\d+)/);
        const limit = limitMatch ? parseInt(limitMatch[1], 10) : 20;
        const executions = getToolExecutions().slice(-limit);

        if (executions.length === 0) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('No tool executions recorded in this session.'),
            },
            Date.now(),
          );
          return;
        }

        // Calculate statistics
        const totalTime = executions.reduce((sum, e) => sum + e.duration, 0);
        const successCount = executions.filter(e => e.status === 'success').length;
        const errorCount = executions.filter(e => e.status === 'error').length;
        const avgTime = totalTime / executions.length;

        let message = t('Tool Execution Timeline ({{count}} entries)\n', {
          count: String(executions.length),
        });
        message += '─'.repeat(60) + '\n';
        message += t('Total: {{total}} | Success: {{success}} | Error: {{error}} | Avg: {{avg}}\n', {
          total: formatDuration(totalTime),
          success: String(successCount),
          error: String(errorCount),
          avg: formatDuration(avgTime),
        });
        message += '─'.repeat(60) + '\n\n';

        for (const entry of executions) {
          const statusIcon = formatStatus(entry.status);
          const decision = formatDecision(entry.decision);

          message += `${entry.timestamp} ${statusIcon} ${entry.name}${decision} - ${formatDuration(entry.duration)}\n`;
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
      name: 'stats',
      get description() {
        return t('Show tool execution statistics.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        const executions = getToolExecutions();

        if (executions.length === 0) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('No tool executions recorded in this session.'),
            },
            Date.now(),
          );
          return;
        }

        // Calculate statistics
        const totalTime = executions.reduce((sum, e) => sum + e.duration, 0);
        const successCount = executions.filter(e => e.status === 'success').length;
        const errorCount = executions.filter(e => e.status === 'error').length;
        const timeoutCount = executions.filter(e => e.status === 'timeout').length;
        const avgTime = totalTime / executions.length;
        const maxTime = Math.max(...executions.map(e => e.duration));
        const minTime = Math.min(...executions.map(e => e.duration));

        // Count by tool
        const byTool: Record<string, { count: number; time: number }> = {};
        for (const entry of executions) {
          if (!byTool[entry.name]) {
            byTool[entry.name] = { count: 0, time: 0 };
          }
          byTool[entry.name].count++;
          byTool[entry.name].time += entry.duration;
        }

        // Sort by count
        const sorted = Object.entries(byTool).sort((a, b) => b[1].count - a[1].count);

        let message = t('Tool Execution Statistics\n');
        message += '═'.repeat(40) + '\n\n';

        message += t('Summary\n');
        message += '─'.repeat(20) + '\n';
        message += t('Total Executions: {{count}}\n', { count: String(executions.length) });
        message += t('Success Rate: {{rate}}%\n', {
          rate: ((successCount / executions.length) * 100).toFixed(1),
        });
        message += t('Total Time: {{time}}\n', { time: formatDuration(totalTime) });
        message += t('Average: {{avg}}\n', { avg: formatDuration(avgTime) });
        message += t('Min: {{min}} | Max: {{max}}\n', {
          min: formatDuration(minTime),
          max: formatDuration(maxTime),
        });

        if (errorCount > 0) {
          message += t('Errors: {{count}}\n', { count: String(errorCount) });
        }
        if (timeoutCount > 0) {
          message += t('Timeouts: {{count}}\n', { count: String(timeoutCount) });
        }

        message += '\n' + t('By Tool\n');
        message += '─'.repeat(20) + '\n';

        for (const [name, stats] of sorted.slice(0, 15)) {
          const avg = formatDuration(stats.time / stats.count);
          message += `${name}: ${stats.count} calls, ${formatDuration(stats.time)} (avg ${avg})\n`;
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
      name: 'clear',
      get description() {
        return t('Clear tool execution history.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        clearToolExecutions();
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Tool execution history cleared.'),
          },
          Date.now(),
        );
      },
    },
  ],
  action: async (context): Promise<void | SlashCommandActionReturn> => {
    // Default action: show recent executions
    const executions = getToolExecutions().slice(-10);

    if (executions.length === 0) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'No tool executions recorded.\n\nUse /timeline list to see all entries or /timeline stats for statistics.',
          ),
        },
        Date.now(),
      );
      return;
    }

    let message = t('Recent Tool Executions ({{count}})\n', { count: String(executions.length) });
    message += '─'.repeat(50) + '\n';

    for (const entry of executions) {
      const statusIcon = formatStatus(entry.status);
      const decision = formatDecision(entry.decision);

      message += `${statusIcon} ${entry.name}${decision} - ${formatDuration(entry.duration)}\n`;
    }

    message += '\n' + t('Use /timeline list for full history or /timeline stats for statistics.');

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: message,
      },
      Date.now(),
    );
  },
};
