/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Common Windows console code pages (CP) used for encoding conversions.
 *
 * @remarks
 * - `UTF8` (65001): Unicode (UTF-8) — recommended for cross-language scripts.
 * - `GBK` (936): Simplified Chinese — default on most Chinese Windows systems.
 * - `BIG5` (950): Traditional Chinese.
 * - `LATIN1` (1252): Western European — default on many Western systems.
 */
export declare const CodePage: {
    readonly UTF8: 65001;
    readonly GBK: 936;
    readonly BIG5: 950;
    readonly LATIN1: 1252;
};
export type CodePage = (typeof CodePage)[keyof typeof CodePage];
/**
 * Checks if a query string potentially represents an '@' command.
 * It triggers if the query starts with '@' or contains '@' preceded by whitespace
 * and followed by a non-whitespace character.
 *
 * @param query The input query string.
 * @returns True if the query looks like an '@' command, false otherwise.
 */
export declare const isAtCommand: (query: string) => boolean;
/**
 * Checks if a query string potentially represents an '/' command.
 * It triggers if the query starts with '/' but excludes code comments like '//' and '/*'.
 *
 * @param query The input query string.
 * @returns True if the query looks like an '/' command, false otherwise.
 */
export declare const isSlashCommand: (query: string) => boolean;
export declare const copyToClipboard: (text: string) => Promise<void>;
export declare const getUrlOpenCommand: () => string;
