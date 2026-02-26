/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import type { File } from '@ollama-code/ollama-code-core/src/ide/types.js';
export declare function isFileUri(uri: vscode.Uri): boolean;
export declare function isNotebookFileUri(uri: vscode.Uri): boolean;
export declare function isNotebookCellUri(uri: vscode.Uri): boolean;
export declare function removeFile(openFiles: File[], uri: vscode.Uri): void;
export declare function renameFile(openFiles: File[], oldUri: vscode.Uri, newUri: vscode.Uri): void;
export declare function deactivateCurrentActiveFile(openFiles: File[]): void;
export declare function enforceMaxFiles(openFiles: File[], maxFiles: number): void;
export declare function truncateSelectedText(selectedText: string | undefined, maxLength: number): string | undefined;
export declare function getNotebookUriFromCellUri(cellUri: vscode.Uri): vscode.Uri | null;
