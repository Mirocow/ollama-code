/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as vscode from 'vscode';
import type { File } from '@ollama-code/ollama-code-core/src/ide/types.js';
export declare function addOrMoveToFront(openFiles: File[], editor: vscode.TextEditor): void;
export declare function updateActiveContext(openFiles: File[], editor: vscode.TextEditor): void;
