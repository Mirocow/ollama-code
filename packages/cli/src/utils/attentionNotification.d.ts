/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum AttentionNotificationReason {
    ToolApproval = "tool_approval",
    LongTaskComplete = "long_task_complete"
}
export interface TerminalNotificationOptions {
    stream?: Pick<NodeJS.WriteStream, 'write' | 'isTTY'>;
    enabled?: boolean;
}
/**
 * Grabs the user's attention by emitting the terminal bell character.
 * This causes the terminal to flash or play a sound, alerting the user
 * to check the CLI for important events.
 *
 * @returns true when the bell was successfully written to the terminal.
 */
export declare function notifyTerminalAttention(_reason: AttentionNotificationReason, options?: TerminalNotificationOptions): boolean;
