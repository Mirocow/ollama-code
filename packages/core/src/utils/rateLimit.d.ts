/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface RetryInfo {
    /** Formatted error message for display, produced by parseAndFormatApiError. */
    message?: string;
    /** Current retry attempt (1-based). */
    attempt: number;
    /** Max retries allowed. */
    maxRetries: number;
    /** Delay in milliseconds before the retry happens. */
    delayMs: number;
}
/**
 * Detects rate-limit / throttling errors and returns retry info.
 */
export declare function isRateLimitError(error: unknown): boolean;
