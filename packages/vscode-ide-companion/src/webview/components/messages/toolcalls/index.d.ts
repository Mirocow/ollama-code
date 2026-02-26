/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tool call component factory - routes to specialized components by kind
 * All UI components are now imported from @ollama-code/webui
 */
import type { FC } from 'react';
import type { BaseToolCallProps } from '@ollama-code/webui';
/**
 * Factory function that returns the appropriate tool call component based on kind
 */
export declare const getToolCallComponent: (kind: string) => FC<BaseToolCallProps>;
/**
 * Main tool call component that routes to specialized implementations
 */
export declare const ToolCallRouter: React.FC<BaseToolCallProps>;
export type { BaseToolCallProps, ToolCallData } from '@ollama-code/webui';
