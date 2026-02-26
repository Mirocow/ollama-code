/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ApprovalMode, type Config } from '@ollama-code/ollama-code-core';
import type { HistoryItemWithoutId } from '../types.js';
export interface UseAutoAcceptIndicatorArgs {
    config: Config;
    addItem?: (item: HistoryItemWithoutId, timestamp: number) => void;
    onApprovalModeChange?: (mode: ApprovalMode) => void;
    shouldBlockTab?: () => boolean;
}
export declare function useAutoAcceptIndicator({ config, addItem, onApprovalModeChange, shouldBlockTab, }: UseAutoAcceptIndicatorArgs): ApprovalMode;
