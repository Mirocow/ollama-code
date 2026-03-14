/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getActivePlan,
  clearActivePlan,
  type PlanData,
} from '@ollama-code/ollama-code-core';
import { MessageType } from '../types.js';
import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

/**
 * Format plan data for display
 */
function formatPlanDisplay(plan: PlanData): string {
  const lines: string[] = [];
  const todos = plan.todos || [];
  const completed = todos.filter((t) => t.status === 'completed').length;
  const total = todos.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  lines.push(`📊 **Active Plan**: "${plan.plan}"`);
  lines.push('');
  lines.push(`**Status**: ${plan.status}`);
  lines.push(`**Progress**: ${progress}% (${completed}/${total} completed)`);
  lines.push(`**Created**: ${new Date(plan.createdAt).toLocaleString()}`);
  lines.push(`**Updated**: ${new Date(plan.updatedAt).toLocaleString()}`);
  lines.push(`**ID**: ${plan.id}`);

  if (todos.length > 0) {
    lines.push('');
    lines.push('**Tasks**:');
    for (const todo of todos) {
      const icon =
        todo.status === 'completed'
          ? '✅'
          : todo.status === 'in_progress'
            ? '▶️'
            : '⏸️';
      lines.push(`  ${icon} ${todo.content}`);
    }
  }

  return lines.join('\n');
}

export const planCommand: SlashCommand = {
  name: 'plan',
  get description() {
    return t('Commands for managing active plans.');
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'status',
      get description() {
        return t('Show the current active plan.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context) => {
        try {
          const plan = await getActivePlan();

          if (!plan) {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t(
                  'No active plan found. Use exit_plan_mode to create a plan.',
                ),
              },
              Date.now(),
            );
            return;
          }

          if (plan.status !== 'active') {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t(
                  `Plan "${plan.plan}" is ${plan.status}. Use /plan clear to start fresh.`,
                ),
              },
              Date.now(),
            );
            return;
          }

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: formatPlanDisplay(plan),
            },
            Date.now(),
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t(`Error getting plan status: ${errorMessage}`),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'clear',
      get description() {
        return t('Clear the current active plan (mark as abandoned).');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context) => {
        try {
          const plan = await getActivePlan();

          if (!plan) {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t('No active plan to clear.'),
              },
              Date.now(),
            );
            return;
          }

          await clearActivePlan();

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t(
                `Plan "${plan.plan}" has been abandoned. You can start fresh with a new plan.`,
              ),
            },
            Date.now(),
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t(`Error clearing plan: ${errorMessage}`),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'todos',
      get description() {
        return t('Show todos linked to the current plan.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context) => {
        try {
          const plan = await getActivePlan();

          if (!plan) {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t('No active plan found.'),
              },
              Date.now(),
            );
            return;
          }

          const todos = plan.todos || [];

          if (todos.length === 0) {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t(
                  `Plan "${plan.plan}" has no todos yet. Use todo_write to add tasks.`,
                ),
              },
              Date.now(),
            );
            return;
          }

          const completed = todos.filter((t) => t.status === 'completed');
          const inProgress = todos.find((t) => t.status === 'in_progress');
          const pending = todos.filter((t) => t.status === 'pending');

          const lines: string[] = [];
          lines.push(`📋 **Todos for plan**: "${plan.plan}"`);
          lines.push('');

          if (inProgress) {
            lines.push(`▶️ **In Progress**: ${inProgress.content}`);
            lines.push('');
          }

          if (pending.length > 0) {
            lines.push('⏸️ **Pending**:');
            for (const t of pending) {
              lines.push(`  - ${t.content}`);
            }
            lines.push('');
          }

          if (completed.length > 0) {
            lines.push(`✅ **Completed** (${completed.length}):`);
            for (const t of completed) {
              lines.push(`  - ${t.content}`);
            }
          }

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: lines.join('\n'),
            },
            Date.now(),
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t(`Error getting plan todos: ${errorMessage}`),
            },
            Date.now(),
          );
        }
      },
    },
  ],
};
