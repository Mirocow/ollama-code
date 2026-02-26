/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ResumedSessionData, Config } from '@ollama-code/ollama-code-core';
import type { HistoryItem } from '../types.js';
/**
 * Builds the complete UI history items for a resumed session.
 *
 * This function takes the resumed session data, converts it to UI history format,
 * and assigns unique IDs to each item for use with loadHistory.
 *
 * @param sessionData The resumed session data from SessionService
 * @param config The config object for accessing tool registry
 * @param baseTimestamp Base timestamp for generating unique IDs
 * @returns Array of HistoryItem with proper IDs
 */
export declare function buildResumedHistoryItems(sessionData: ResumedSessionData, config: Config, baseTimestamp?: number): HistoryItem[];
