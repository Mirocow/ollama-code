/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const formatMemoryUsage: (bytes: number) => string;
/**
 * Formats a duration in milliseconds into a concise, human-readable string (e.g., "1h 5s").
 * It omits any time units that are zero.
 * @param milliseconds The duration in milliseconds.
 * @returns A formatted string representing the duration.
 */
/**
 * Formats a timestamp into a human-readable relative time string.
 * @param timestamp The timestamp in milliseconds since epoch.
 * @returns A formatted string like "just now", "5 minutes ago", "2 days ago".
 */
export declare const formatRelativeTime: (timestamp: number) => string;
export declare const formatDuration: (milliseconds: number) => string;
