/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
/**
 * WebView HTML Content Generator
 * Responsible for generating the HTML content of the WebView
 */
export declare class WebViewContent {
    /**
     * Generate HTML content for the WebView
     * @param panel WebView Panel
     * @param extensionUri Extension URI
     * @returns HTML string
     */
    static generate(panel: vscode.WebviewPanel, extensionUri: vscode.Uri): string;
}
