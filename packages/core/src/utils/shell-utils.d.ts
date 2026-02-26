/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type ExecFileOptions } from 'node:child_process';
/**
 * An identifier for the shell type.
 */
export type ShellType = 'cmd' | 'powershell' | 'bash';
/**
 * Defines the configuration required to execute a command string within a specific shell.
 */
export interface ShellConfiguration {
    /** The path or name of the shell executable (e.g., 'bash', 'cmd.exe'). */
    executable: string;
    /**
     * The arguments required by the shell to execute a subsequent string argument.
     */
    argsPrefix: string[];
    /** An identifier for the shell type. */
    shell: ShellType;
}
/**
 * Determines the appropriate shell configuration for the current platform.
 *
 * This ensures we can execute command strings predictably and securely across platforms
 * using the `spawn(executable, [...argsPrefix, commandString], { shell: false })` pattern.
 *
 * @returns The ShellConfiguration for the current environment.
 */
export declare function getShellConfiguration(): ShellConfiguration;
/**
 * Export the platform detection constant for use in process management (e.g., killing processes).
 */
export declare const isWindows: () => boolean;
/**
 * Escapes a string so that it can be safely used as a single argument
 * in a shell command, preventing command injection.
 *
 * @param arg The argument string to escape.
 * @param shell The type of shell the argument is for.
 * @returns The shell-escaped string.
 */
export declare function escapeShellArg(arg: string, shell: ShellType): string;
/**
 * Splits a shell command into a list of individual commands, respecting quotes.
 * This is used to separate chained commands (e.g., using &&, ||, ;).
 * @param command The shell command string to parse
 * @returns An array of individual command strings
 */
export declare function splitCommands(command: string): string[];
/**
 * Extracts the root command from a given shell command string.
 * This is used to identify the base command for permission checks.
 * @param command The shell command string to parse
 * @returns The root command name, or undefined if it cannot be determined
 * @example getCommandRoot("ls -la /tmp") returns "ls"
 * @example getCommandRoot("git status && npm test") returns "git"
 */
export declare function getCommandRoot(command: string): string | undefined;
export declare function getCommandRoots(command: string): string[];
export declare function stripShellWrapper(command: string): string;
/**
 * Detects command substitution patterns in a shell command, following bash quoting rules:
 * - Single quotes ('): Everything literal, no substitution possible
 * - Double quotes ("): Command substitution with $() and backticks unless escaped with \
 * - No quotes: Command substitution with $(), <(), and backticks
 *
 * This function also understands heredocs:
 * - If a heredoc delimiter is quoted (e.g. `<<'EOF'`), bash will not perform
 *   expansions in the heredoc body, so substitution-like text is allowed.
 * - If a heredoc delimiter is unquoted (e.g. `<<EOF`), bash will perform
 *   expansions in the heredoc body, so command substitution is blocked there too.
 * @param command The shell command string to check
 * @returns true if command substitution would be executed by bash
 */
export declare function detectCommandSubstitution(command: string): boolean;
/**
 * Checks a shell command against security policies and allowlists.
 *
 * This function operates in one of two modes depending on the presence of
 * the `sessionAllowlist` parameter:
 *
 * 1.  **"Default Deny" Mode (sessionAllowlist is provided):** This is the
 *     strictest mode, used for user-defined scripts like custom commands.
 *     A command is only permitted if it is found on the global `coreTools`
 *     allowlist OR the provided `sessionAllowlist`. It must not be on the
 *     global `excludeTools` blocklist.
 *
 * 2.  **"Default Allow" Mode (sessionAllowlist is NOT provided):** This mode
 *     is used for direct tool invocations (e.g., by the model). If a strict
 *     global `coreTools` allowlist exists, commands must be on it. Otherwise,
 *     any command is permitted as long as it is not on the `excludeTools`
 *     blocklist.
 *
 * @param command The shell command string to validate.
 * @param config The application configuration.
 * @param sessionAllowlist A session-level list of approved commands. Its
 *   presence activates "Default Deny" mode.
 * @returns An object detailing which commands are not allowed.
 */
export declare function checkCommandPermissions(command: string, config: Config, sessionAllowlist?: Set<string>): {
    allAllowed: boolean;
    disallowedCommands: string[];
    blockReason?: string;
    isHardDenial?: boolean;
};
/**
 * Executes a command with the given arguments without using a shell.
 *
 * This is a wrapper around Node.js's `execFile`, which spawns a process
 * directly without invoking a shell, making it safer than `exec`.
 * It's suitable for short-running commands with limited output.
 *
 * @param command The command to execute (e.g., 'git', 'osascript').
 * @param args Array of arguments to pass to the command.
 * @param options Optional spawn options including:
 *   - preserveOutputOnError: If false (default), rejects on error.
 *                           If true, resolves with output and error code.
 *   - Other standard spawn options (e.g., cwd, env).
 * @returns A promise that resolves with stdout, stderr strings, and exit code.
 * @throws Rejects with an error if the command fails (unless preserveOutputOnError is true).
 */
export declare function execCommand(command: string, args: string[], options?: {
    preserveOutputOnError?: boolean;
} & ExecFileOptions): Promise<{
    stdout: string;
    stderr: string;
    code: number;
}>;
/**
 * Resolves the path of a command in the system's PATH.
 * @param {string} command The command name (e.g., 'git', 'grep').
 * @returns {path: string | null; error?: Error} The path of the command, or null if it is not found and any error that occurred.
 */
export declare function resolveCommandPath(command: string): {
    path: string | null;
    error?: Error;
};
/**
 * Checks if a command is available in the system's PATH.
 * @param {string} command The command name (e.g., 'git', 'grep').
 * @returns {available: boolean; error?: Error} The availability of the command and any error that occurred.
 */
export declare function isCommandAvailable(command: string): {
    available: boolean;
    error?: Error;
};
export declare function isCommandAllowed(command: string, config: Config): {
    allowed: boolean;
    reason?: string;
};
export declare function isCommandNeedsPermission(command: string): {
    requiresPermission: boolean;
    reason?: string;
};
