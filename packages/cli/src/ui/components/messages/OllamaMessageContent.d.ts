/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface OllamaMessageContentProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
}
export declare const OllamaMessageContent: React.FC<OllamaMessageContentProps>;
export {};
