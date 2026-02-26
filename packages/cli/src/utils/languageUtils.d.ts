/**
 * @license
 * Copyright 2025 Qwen team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Special value meaning "detect from system settings" */
export declare const OUTPUT_LANGUAGE_AUTO = "auto";
/**
 * Checks if a value represents the "auto" setting.
 */
export declare function isAutoLanguage(value: string | undefined | null): boolean;
/**
 * Normalizes a language input to its canonical form.
 * Converts known locale codes (e.g., "zh", "ru") to full names (e.g., "Chinese", "Russian").
 * Unknown inputs are returned as-is to support any language name.
 */
export declare function normalizeOutputLanguage(language: string): string;
/**
 * Resolves the output language, converting 'auto' to the detected system language.
 */
export declare function resolveOutputLanguage(value: string | undefined | null): string;
/**
 * Writes the output language rule file with the given language.
 */
export declare function writeOutputLanguageFile(language: string): void;
/**
 * Updates the LLM output language rule file based on the setting value.
 * Resolves 'auto' to the detected system language before writing.
 */
export declare function updateOutputLanguageFile(settingValue: string): void;
/**
 * Initializes the LLM output language rule file on application startup.
 *
 * @param outputLanguage - The output language setting value (e.g., 'auto', 'Chinese', etc.)
 *
 * Behavior:
 * - Resolves the setting value ('auto' -> detected system language, or use as-is)
 * - Ensures the rule file matches the resolved language
 * - Creates the file if it doesn't exist
 */
export declare function initializeLlmOutputLanguage(outputLanguage?: string): void;
