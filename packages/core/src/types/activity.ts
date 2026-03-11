/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Activity types that can be recorded.
 */
export type ActivityType =
  | 'tool_call'
  | 'file_read'
  | 'file_write'
  | 'file_edit'
  | 'shell_command'
  | 'model_request'
  | 'model_response'
  | 'user_action';

/**
 * Stored payload for activity log events.
 * Records significant actions for session memory and resume context.
 */
export interface ActivityLogRecordPayload {
  /** Type of activity */
  activityType: ActivityType;
  /** Timestamp when activity occurred */
  timestamp: number;
  /** Human-readable description */
  description: string;
  /** Tool name if applicable */
  toolName?: string;
  /** File path if applicable */
  filePath?: string;
  /** Command if shell command */
  command?: string;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Duration in milliseconds if applicable */
  durationMs?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
