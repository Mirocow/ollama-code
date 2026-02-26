/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface OllamaThoughtMessageProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
}
/**
 * Displays model thinking/reasoning text with a softer, dimmed style
 * to visually distinguish it from regular content output.
 */
export declare const OllamaThoughtMessage: React.FC<OllamaThoughtMessageProps>;
export {};
