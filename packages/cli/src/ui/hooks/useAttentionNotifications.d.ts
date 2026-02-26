/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { StreamingState } from '../types.js';
import type { LoadedSettings } from '../../config/settings.js';
export declare const LONG_TASK_NOTIFICATION_THRESHOLD_SECONDS = 20;
interface UseAttentionNotificationsOptions {
    isFocused: boolean;
    streamingState: StreamingState;
    elapsedTime: number;
    settings: LoadedSettings;
}
export declare const useAttentionNotifications: ({ isFocused, streamingState, elapsedTime, settings, }: UseAttentionNotificationsOptions) => void;
export {};
