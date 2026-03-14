/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Session Reminder Service
 *
 * Provides reminders about unfinished plans and todos when:
 * - Starting a new session
 * - Resuming a previous session (--resume)
 * - Periodic checks during long sessions
 *
 * Integrates with:
 * - model_storage (plans namespace) for active plans
 * - model_storage (todos namespace) for active todos
 */

import {
  storageGet,
  StorageNamespaces,
} from '../plugins/builtin/storage-tools/index.js';
import type { TodoItem } from '../plugins/builtin/productivity-tools/todo-write/index.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('SESSION_REMINDER');

// Namespaces
const PLANS_NAMESPACE = StorageNamespaces.PLANS;
const TODOS_NAMESPACE = StorageNamespaces.TODOS;
const PLANS_KEY = 'current';
const TODOS_KEY = 'items';

/**
 * Types of reminders
 */
export type ReminderType =
  | 'unfinished_plan'
  | 'resumed_session'
  | 'periodic_reminder';

/**
 * Priority levels for reminders
 */
export type ReminderPriority = 'high' | 'medium' | 'low';

/**
 * Session reminder content
 */
export interface SessionReminder {
  type: ReminderType;
  content: string;
  priority: ReminderPriority;
  planId?: string;
  progress?: number;
}

/**
 * Plan data structure (matches exit-plan-mode)
 */
export interface PlanData {
  id: string;
  plan: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  todos?: TodoItem[];
  progress?: number;
  sessionId: string;
}

/**
 * Todos data structure (matches todo-write)
 */
export interface TodosData {
  items: TodoItem[];
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  planId?: string;
  status: 'active' | 'completed' | 'abandoned';
}

/**
 * Get the active plan from storage
 */
export async function getActivePlan(): Promise<PlanData | null> {
  try {
    const data = await storageGet<PlanData>(PLANS_NAMESPACE, PLANS_KEY, {
      scope: 'project',
    });
    return data ?? null;
  } catch (err) {
    debugLogger.error('[SessionReminder] Error reading active plan:', err);
    return null;
  }
}

/**
 * Get the active todos from storage
 */
export async function getActiveTodos(): Promise<TodosData | null> {
  try {
    const data = await storageGet<TodosData>(TODOS_NAMESPACE, TODOS_KEY, {
      scope: 'project',
    });
    return data ?? null;
  } catch (err) {
    debugLogger.error('[SessionReminder] Error reading active todos:', err);
    return null;
  }
}

/**
 * Calculate time elapsed since a date
 */
function getTimeElapsed(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMins > 0) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
  }
  return 'just now';
}

/**
 * Format todo status icon
 */
function getTodoIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '▶️';
    case 'pending':
    default:
      return '⏸️';
  }
}

/**
 * Build reminder for active plan
 */
function buildPlanReminder(
  plan: PlanData,
  todos: TodosData | null,
  isResume: boolean,
): SessionReminder {
  const lines: string[] = [];
  const todoList = todos?.items || plan.todos || [];

  // Calculate progress
  const completed = todoList.filter((t) => t.status === 'completed').length;
  const total = todoList.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Header
  if (isResume) {
    lines.push('🔄 SESSION RESUMED');
    lines.push('');
  }
  lines.push(`📊 ACTIVE PLAN: "${plan.plan}"`);
  lines.push('');
  lines.push(`Progress: ${progress}% (${completed}/${total} completed)`);

  // Time info
  const elapsed = getTimeElapsed(plan.updatedAt);
  lines.push(`Last activity: ${elapsed} ago`);

  // Current task
  const inProgress = todoList.find((t) => t.status === 'in_progress');
  if (inProgress) {
    lines.push(``);
    lines.push(`Current task: ▶️ ${inProgress.content}`);
  }

  // Pending tasks
  const pending = todoList.filter((t) => t.status === 'pending');
  if (pending.length > 0) {
    lines.push('');
    lines.push('Pending tasks:');
    for (const t of pending.slice(0, 5)) {
      lines.push(`  ${getTodoIcon(t.status)} ${t.content}`);
    }
    if (pending.length > 5) {
      lines.push(`  ... and ${pending.length - 5} more`);
    }
  }

  // Completed tasks summary
  const completedTasks = todoList.filter((t) => t.status === 'completed');
  if (completedTasks.length > 0) {
    lines.push('');
    lines.push(
      `Completed: ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''}`,
    );
  }

  // Footer
  lines.push('');
  if (progress === 100) {
    lines.push(
      'All tasks completed! Consider starting a new plan or clearing this one.',
    );
  } else {
    lines.push('Continue from where you left off.');
  }

  return {
    type: isResume ? 'resumed_session' : 'unfinished_plan',
    content: lines.join('\n'),
    priority: progress < 100 ? 'high' : 'medium',
    planId: plan.id,
    progress,
  };
}

/**
 * Build reminder for old unfinished plan (periodic)
 */
function buildPeriodicReminder(plan: PlanData): SessionReminder {
  const elapsed = getTimeElapsed(plan.updatedAt);

  return {
    type: 'periodic_reminder',
    content: `⚠️ Old unfinished plan found: "${plan.plan}" (${elapsed} ago)

Progress: ${plan.progress || 0}%
Use /plan status to see details or /plan clear to abandon.`,
    priority: 'medium',
    planId: plan.id,
    progress: plan.progress,
  };
}

/**
 * Get session reminders
 *
 * @param sessionId - Current session ID
 * @param isResume - Whether this is a resumed session
 * @returns Array of reminders sorted by priority
 */
export async function getSessionReminders(
  sessionId?: string,
  isResume: boolean = false,
): Promise<SessionReminder[]> {
  const reminders: SessionReminder[] = [];

  try {
    // Check for active plan
    const plan = await getActivePlan();
    if (plan && plan.status === 'active') {
      // Get todos for this plan
      const todos = await getActiveTodos();

      // Check if plan has pending work
      const todoList = todos?.items || plan.todos || [];
      const hasPendingWork = todoList.some(
        (t) => t.status === 'pending' || t.status === 'in_progress',
      );

      if (hasPendingWork) {
        reminders.push(buildPlanReminder(plan, todos, isResume));
      }

      // Check for old plans (inactive for more than 24 hours)
      const lastUpdate = new Date(plan.updatedAt).getTime();
      const hoursSinceUpdate = (Date.now() - lastUpdate) / (60 * 60 * 1000);

      if (hoursSinceUpdate > 24 && !isResume) {
        reminders.push(buildPeriodicReminder(plan));
      }
    }

    debugLogger.info(
      `[SessionReminder] Generated ${reminders.length} reminders`,
    );
  } catch (err) {
    debugLogger.error('[SessionReminder] Error generating reminders:', err);
  }

  // Sort by priority (high first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  reminders.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return reminders;
}

/**
 * Format reminders for injection into system prompt
 */
export function formatRemindersForPrompt(reminders: SessionReminder[]): string {
  if (reminders.length === 0) {
    return '';
  }

  const lines: string[] = ['<system-reminder>', '📋 SESSION CONTEXT', ''];

  for (const reminder of reminders) {
    lines.push(reminder.content);
    lines.push('');
  }

  lines.push('</system-reminder>');

  return lines.join('\n');
}

/**
 * Get formatted session context for system prompt
 *
 * Main entry point for injecting reminders into prompts
 */
export async function getSessionContextForPrompt(
  sessionId?: string,
  isResume: boolean = false,
): Promise<string> {
  const reminders = await getSessionReminders(sessionId, isResume);
  return formatRemindersForPrompt(reminders);
}
