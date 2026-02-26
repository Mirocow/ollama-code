/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SpinnerName } from 'cli-spinners';
interface OllamaRespondingSpinnerProps {
    /**
     * Optional string to display when not in Responding state.
     * If not provided and not Responding, renders null.
     */
    nonRespondingDisplay?: string;
    spinnerType?: SpinnerName;
}
export declare const OllamaRespondingSpinner: React.FC<OllamaRespondingSpinnerProps>;
interface OllamaSpinnerProps {
    spinnerType?: SpinnerName;
    altText?: string;
}
export declare const OllamaSpinner: React.FC<OllamaSpinnerProps>;
export {};
