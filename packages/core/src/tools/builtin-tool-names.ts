/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Builtin Tool Names
 *
 * Central registry of canonical tool names used by builtin plugins.
 * These names are imported directly from plugin index files - single source of truth.
 *
 * See packages/core/src/plugins/builtin for plugin implementations.
 */

// Import tool names from each builtin plugin
import { TOOL_NAMES as FILE_TOOLS } from '../plugins/builtin/file-tools/index.js';
import { TOOL_NAMES as SHELL_TOOLS } from '../plugins/builtin/shell-tools/index.js';
import { TOOL_NAMES as SEARCH_TOOLS } from '../plugins/builtin/search-tools/index.js';
import { TOOL_NAMES as MEMORY_TOOLS } from '../plugins/builtin/memory-tools/index.js';
import { TOOL_NAMES as AGENT_TOOLS } from '../plugins/builtin/agent-tools/index.js';
import { TOOL_NAMES as PRODUCTIVITY_TOOLS } from '../plugins/builtin/productivity-tools/index.js';
import { TOOL_NAMES as DATABASE_TOOLS } from '../plugins/builtin/database-tools/index.js';
import { TOOL_NAMES as DEV_TOOLS } from '../plugins/builtin/dev-tools/index.js';
import { TOOL_NAMES as CODE_ANALYSIS_TOOLS } from '../plugins/builtin/code-analysis-tools/index.js';
import { TOOL_NAMES as GIT_TOOLS } from '../plugins/builtin/git-tools/index.js';
import { TOOL_NAMES as API_TOOLS } from '../plugins/builtin/api-tools/index.js';
import { TOOL_NAMES as LSP_TOOLS } from '../plugins/builtin/lsp-tools/index.js';
import { TOOL_NAMES as SSH_TOOLS } from '../plugins/builtin/ssh-tools/index.js';
import { TOOL_NAMES as MCP_TOOLS } from '../plugins/builtin/mcp-tools/index.js';
import { TOOL_NAMES as STORAGE_TOOLS } from '../plugins/builtin/storage-tools/index.js';

/**
 * All builtin tool names - merged from all plugins
 */
export const BUILTIN_TOOL_NAMES = {
  ...FILE_TOOLS,
  ...SHELL_TOOLS,
  ...SEARCH_TOOLS,
  ...MEMORY_TOOLS,
  ...AGENT_TOOLS,
  ...PRODUCTIVITY_TOOLS,
  ...STORAGE_TOOLS,
  ...DATABASE_TOOLS,
  ...DEV_TOOLS,
  ...LSP_TOOLS,
  ...API_TOOLS,
  ...SSH_TOOLS,
  ...MCP_TOOLS,
  ...CODE_ANALYSIS_TOOLS,
  ...GIT_TOOLS,
} as const;

/**
 * Type for all builtin tool names
 */
export type BuiltinToolName =
  (typeof BUILTIN_TOOL_NAMES)[keyof typeof BUILTIN_TOOL_NAMES];

/**
 * Set of all builtin tool names for quick lookup
 */
export const BUILTIN_TOOL_NAMES_SET = new Set<string>(
  Object.values(BUILTIN_TOOL_NAMES),
);

/**
 * Check if a tool name is a builtin tool
 */
export function isBuiltinTool(name: string): boolean {
  return BUILTIN_TOOL_NAMES_SET.has(name);
}

/**
 * Tools that modify files (require approval in default mode)
 */
export const FILE_MODIFYING_TOOLS = new Set<string>([
  BUILTIN_TOOL_NAMES.WRITE_FILE,
  BUILTIN_TOOL_NAMES.EDIT,
]);

/**
 * Tools that execute commands (require approval in default mode)
 */
export const COMMAND_EXECUTING_TOOLS = new Set<string>([
  BUILTIN_TOOL_NAMES.RUN_SHELL_COMMAND,
]);
