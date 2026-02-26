/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Updates a JSON file while preserving comments and formatting.
 */
export declare function updateSettingsFilePreservingFormat(filePath: string, updates: Record<string, unknown>): void;
export declare function applyUpdates(current: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown>;
