/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
export interface FileContext {
    fileName: string;
    filePath: string;
    startLine?: number;
    endLine?: number;
}
export interface UserMessageProps {
    content: string;
    timestamp: number;
    onFileClick?: (path: string) => void;
    fileContext?: FileContext;
}
export declare const UserMessage: FC<UserMessageProps>;
