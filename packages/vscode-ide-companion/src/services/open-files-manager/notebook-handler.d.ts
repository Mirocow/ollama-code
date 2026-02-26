/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import type { File } from '@ollama-code/ollama-code-core/src/ide/types.js';
export declare function addOrMoveToFrontNotebook(openFiles: File[], notebookEditor: vscode.NotebookEditor): void;
export declare function updateNotebookActiveContext(openFiles: File[], notebookEditor: vscode.NotebookEditor): void;
export declare function updateNotebookCellSelection(openFiles: File[], cellEditor: vscode.TextEditor, selections: readonly vscode.Selection[]): void;
