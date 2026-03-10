/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyDeclarativeTool, AnyToolInvocation } from '../index.js';
import { isTool } from '../index.js';
import {
  ToolNamesMigration,
  ToolDisplayNamesMigration,
  ToolAliases,
  DynamicAliases,
  type ToolName,
} from '../tools/tool-names.js';

// Re-export ToolName for backward compatibility
export type { ToolName };

const normalizeIdentifier = (identifier: string): string =>
  identifier.trim().replace(/^_+/, '');

/**
 * Gets all known aliases for a tool name.
 * This includes:
 * - The canonical name itself
 * - Legacy names from ToolNamesMigration
 * - Legacy display names from ToolDisplayNamesMigration
 * - Aliases from ToolAliases and DynamicAliases
 */
function getAliasesForToolName(toolName: string): Set<string> {
  const aliases = new Set<string>();
  
  // Add the canonical name
  aliases.add(normalizeIdentifier(toolName));
  
  // Add legacy names that map to this tool
  for (const [legacyName, mappedName] of Object.entries(ToolNamesMigration)) {
    if (mappedName === toolName) {
      aliases.add(normalizeIdentifier(legacyName));
    }
  }
  
  // Add legacy display names that map to this tool
  for (const legacyDisplay of Object.keys(ToolDisplayNamesMigration)) {
    // Note: ToolDisplayNamesMigration maps display names, not tool names
    // We include them as potential aliases
    aliases.add(normalizeIdentifier(legacyDisplay));
  }
  
  // Add static aliases that map to this tool
  for (const [aliasName, mappedName] of Object.entries(ToolAliases)) {
    if (mappedName === toolName) {
      aliases.add(normalizeIdentifier(aliasName));
    }
  }
  
  // Add dynamic aliases that map to this tool
  for (const [aliasName, mappedName] of Object.entries(DynamicAliases)) {
    if (mappedName === toolName) {
      aliases.add(normalizeIdentifier(aliasName));
    }
  }
  
  return aliases;
}

const sanitizeExactIdentifier = (value: string): string =>
  normalizeIdentifier(value);

const sanitizePatternIdentifier = (value: string): string => {
  const openParenIndex = value.indexOf('(');
  if (openParenIndex === -1) {
    return normalizeIdentifier(value);
  }
  return normalizeIdentifier(value.slice(0, openParenIndex));
};

const filterList = (list?: string[]): string[] =>
  (list ?? []).filter((entry): entry is string =>
    Boolean(entry && entry.trim()),
  );

export function isToolEnabled(
  toolName: ToolName,
  coreTools?: string[],
  excludeTools?: string[],
): boolean {
  const aliasSet = getAliasesForToolName(toolName);
  const matchesIdentifier = (value: string): boolean =>
    aliasSet.has(sanitizeExactIdentifier(value));
  const matchesIdentifierWithArgs = (value: string): boolean =>
    aliasSet.has(sanitizePatternIdentifier(value));

  const filteredCore = filterList(coreTools);
  const filteredExclude = filterList(excludeTools);

  if (filteredCore.length === 0) {
    return !filteredExclude.some((entry) => matchesIdentifier(entry));
  }

  const isExplicitlyEnabled = filteredCore.some(
    (entry) => matchesIdentifier(entry) || matchesIdentifierWithArgs(entry),
  );

  if (!isExplicitlyEnabled) {
    return false;
  }

  return !filteredExclude.some((entry) => matchesIdentifier(entry));
}

const SHELL_TOOL_NAMES = ['run_shell_command', 'ShellTool'];

/**
 * Checks if a tool invocation matches any of a list of patterns.
 *
 * @param toolOrToolName The tool object or the name of the tool being invoked.
 * @param invocation The invocation object for the tool.
 * @param patterns A list of patterns to match against.
 *   Patterns can be:
 *   - A tool name (e.g., "ReadFileTool") to match any invocation of that tool.
 *   - A tool name with a prefix (e.g., "ShellTool(git status)") to match
 *     invocations where the arguments start with that prefix.
 * @returns True if the invocation matches any pattern, false otherwise.
 */
export function doesToolInvocationMatch(
  toolOrToolName: AnyDeclarativeTool | string,
  invocation: AnyToolInvocation,
  patterns: string[],
): boolean {
  let toolNames: string[];
  if (isTool(toolOrToolName)) {
    toolNames = [toolOrToolName.name, toolOrToolName.constructor.name];
  } else {
    toolNames = [toolOrToolName as string];
  }

  if (toolNames.some((name) => SHELL_TOOL_NAMES.includes(name))) {
    toolNames = [...new Set([...toolNames, ...SHELL_TOOL_NAMES])];
  }

  for (const pattern of patterns) {
    const openParen = pattern.indexOf('(');

    if (openParen === -1) {
      // No arguments, just a tool name
      if (toolNames.includes(pattern)) {
        return true;
      }
      continue;
    }

    const patternToolName = pattern.substring(0, openParen);
    if (!toolNames.includes(patternToolName)) {
      continue;
    }

    if (!pattern.endsWith(')')) {
      continue;
    }

    const argPattern = pattern.substring(openParen + 1, pattern.length - 1);

    if (
      'command' in invocation.params &&
      toolNames.includes('run_shell_command')
    ) {
      const argValue = String(
        (invocation.params as { command: string }).command,
      );
      if (argValue === argPattern || argValue.startsWith(argPattern + ' ')) {
        return true;
      }
    }
  }

  return false;
}
