/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
import './ThinkingMessage.css';
/**
 * ThinkingMessage component props interface
 */
export interface ThinkingMessageProps {
    /** Thinking content */
    content: string;
    /** Message timestamp */
    timestamp: number;
    /** File click callback */
    onFileClick?: (path: string) => void;
    /** Whether to expand by default, defaults to false */
    defaultExpanded?: boolean;
    /** Status: 'loading' means thinking in progress, 'default' means thinking complete */
    status?: 'loading' | 'default';
}
/**
 * ThinkingMessage - Collapsible thinking message component
 *
 * Displays the LLM's thinking process, collapsed by default, click to expand and view details.
 * Style reference from Claude Code's thinking message design:
 * - Collapsed: gray dot + "Thinking" + down arrow
 * - Expanded: solid dot + "Thinking" + up arrow + thinking content
 * - Aligned with other message items, with status icon and connector line
 */
export declare const ThinkingMessage: FC<ThinkingMessageProps>;
