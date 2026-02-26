/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionService } from '@ollama-code/ollama-code-core';
export interface SessionPickerProps {
    sessionService: SessionService | null;
    onSelect: (sessionId: string) => void;
    onCancel: () => void;
    currentBranch?: string;
    /**
     * Scroll mode. When true, keep selection centered (fullscreen-style).
     * Defaults to true so dialog + standalone behave identically.
     */
    centerSelection?: boolean;
}
export declare function SessionPicker(props: SessionPickerProps): import("react/jsx-runtime").JSX.Element;
