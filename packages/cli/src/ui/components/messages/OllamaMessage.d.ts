/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface OllamaMessageProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
}
export declare const OllamaMessage: React.FC<OllamaMessageProps>;
export {};
