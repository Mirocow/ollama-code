/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import type { DiffManager } from '../diff-manager.js';
import type { WebViewProvider } from '../webview/WebViewProvider.js';
type Logger = (message: string) => void;
export declare const runQwenCodeCommand = "ollama-code.run";
export declare const showDiffCommand = "ollamaCode.showDiff";
export declare const openChatCommand = "ollama-code.openChat";
export declare const openNewChatTabCommand = "ollamaCode.openNewChatTab";
export declare const loginCommand = "ollama-code.login";
export declare function registerNewCommands(context: vscode.ExtensionContext, log: Logger, diffManager: DiffManager, getWebViewProviders: () => WebViewProvider[], createWebViewProvider: () => WebViewProvider): void;
export {};
