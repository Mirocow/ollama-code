/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PartListUnion } from '@google/genai';
import { type Config } from '@ollama-code/ollama-code-core';
import { type SlashCommand } from './ui/commands/types.js';
import type { LoadedSettings } from './config/settings.js';
/**
 * Built-in commands that are allowed in non-interactive modes (CLI and ACP).
 * Only safe, read-only commands that don't require interactive UI.
 *
 * These commands are:
 * - init: Initialize project configuration
 * - summary: Generate session summary
 * - compress: Compress conversation history
 */
export declare const ALLOWED_BUILTIN_COMMANDS_NON_INTERACTIVE: readonly ["init", "summary", "compress", "bug"];
/**
 * Result of handling a slash command in non-interactive mode.
 *
 * Supported types:
 * - 'submit_prompt': Submits content to the model (supports all modes)
 * - 'message': Returns a single message (supports non-interactive JSON/text only)
 * - 'stream_messages': Streams multiple messages (supports ACP only)
 * - 'unsupported': Command cannot be executed in this mode
 * - 'no_command': No command was found or executed
 */
export type NonInteractiveSlashCommandResult = {
    type: 'submit_prompt';
    content: PartListUnion;
} | {
    type: 'message';
    messageType: 'info' | 'error';
    content: string;
} | {
    type: 'stream_messages';
    messages: AsyncGenerator<{
        messageType: 'info' | 'error';
        content: string;
    }, void, unknown>;
} | {
    type: 'unsupported';
    reason: string;
    originalType: string;
} | {
    type: 'no_command';
};
/**
 * Processes a slash command in a non-interactive environment.
 *
 * @param rawQuery The raw query string (should start with '/')
 * @param abortController Controller to cancel the operation
 * @param config The configuration object
 * @param settings The loaded settings
 * @param allowedBuiltinCommandNames Optional array of built-in command names that are
 *   allowed. Defaults to ALLOWED_BUILTIN_COMMANDS_NON_INTERACTIVE (init, summary, compress).
 *   Pass an empty array to only allow file commands.
 * @returns A Promise that resolves to a `NonInteractiveSlashCommandResult` describing
 *   the outcome of the command execution.
 */
export declare const handleSlashCommand: (rawQuery: string, abortController: AbortController, config: Config, settings: LoadedSettings, allowedBuiltinCommandNames?: string[]) => Promise<NonInteractiveSlashCommandResult>;
/**
 * Retrieves all available slash commands for the current configuration.
 *
 * @param config The configuration object
 * @param abortSignal Signal to cancel the loading process
 * @param allowedBuiltinCommandNames Optional array of built-in command names that are
 *   allowed. Defaults to ALLOWED_BUILTIN_COMMANDS_NON_INTERACTIVE (init, summary, compress).
 *   Pass an empty array to only include file commands.
 * @returns A Promise that resolves to an array of SlashCommand objects
 */
export declare const getAvailableCommands: (config: Config, abortSignal: AbortSignal, allowedBuiltinCommandNames?: string[]) => Promise<SlashCommand[]>;
