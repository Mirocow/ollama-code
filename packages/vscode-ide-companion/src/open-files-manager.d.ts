/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import type { IdeContext } from '@ollama-code/ollama-code-core/src/ide/types.js';
/**
 * Keeps track of the workspace state, including open files, cursor position, and selected text.
 */
export declare class OpenFilesManager {
    private readonly context;
    private readonly onDidChangeEmitter;
    readonly onDidChange: vscode.Event<void>;
    private debounceTimer;
    private openFiles;
    constructor(context: vscode.ExtensionContext);
    private fireWithDebounce;
    get state(): IdeContext;
}
