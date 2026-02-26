/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
/**
 * Find the editor group immediately to the left of the Qwen chat webview.
 * - If the chat webview group is the leftmost group, returns undefined.
 * - Uses the webview tab viewType 'mainThreadWebview-qwenCode.chat'.
 */
export declare function findLeftGroupOfChatWebview(): vscode.ViewColumn | undefined;
/**
 * Ensure there is an editor group directly to the left of the Qwen chat webview.
 * - If one exists, return its ViewColumn.
 * - If none exists, focus the chat panel and create a new group on its left,
 *   then return the new group's ViewColumn.
 * - If the chat webview cannot be located, returns undefined.
 */
export declare function ensureLeftGroupOfChatWebview(): Promise<vscode.ViewColumn | undefined>;
