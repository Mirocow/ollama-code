/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tool name constants to avoid circular dependencies.
 * These constants are used across multiple files and should be kept in sync
 * with the actual tool class names.
 */
export const ToolNames = {
  EDIT: 'edit',
  WRITE_FILE: 'write_file',
  READ_FILE: 'read_file',
  READ_MANY_FILES: 'read_many_files',
  GREP: 'grep_search',
  GLOB: 'glob',
  SHELL: 'run_shell_command',
  TODO_WRITE: 'todo_write',
  MEMORY: 'save_memory',
  TASK: 'task',
  SKILL: 'skill',
  EXIT_PLAN_MODE: 'exit_plan_mode',
  WEB_FETCH: 'web_fetch',
  WEB_SEARCH: 'web_search',
  LS: 'list_directory',
  LSP: 'lsp',
  PYTHON: 'python_dev',
  NODEJS: 'nodejs_dev',
  GOLANG: 'golang_dev',
} as const;

export type ToolName = (typeof ToolNames)[keyof typeof ToolNames];

/**
 * Tool display name constants to avoid circular dependencies.
 * These constants are used across multiple files and should be kept in sync
 * with the actual tool display names.
 */
export const ToolDisplayNames = {
  EDIT: 'Edit',
  WRITE_FILE: 'WriteFile',
  READ_FILE: 'ReadFile',
  READ_MANY_FILES: 'ReadManyFiles',
  GREP: 'Grep',
  GLOB: 'Glob',
  SHELL: 'Shell',
  TODO_WRITE: 'TodoWrite',
  MEMORY: 'SaveMemory',
  TASK: 'Task',
  SKILL: 'Skill',
  EXIT_PLAN_MODE: 'ExitPlanMode',
  WEB_FETCH: 'WebFetch',
  WEB_SEARCH: 'WebSearch',
  LS: 'ListFiles',
  LSP: 'Lsp',
  PYTHON: 'PythonDev',
  NODEJS: 'NodeJsDev',
  GOLANG: 'GolangDev',
} as const;

// Migration from old tool names to new tool names
// These legacy tool names were used in earlier versions and need to be supported
// for backward compatibility with existing user configurations
export const ToolNamesMigration = {
  search_file_content: ToolNames.GREP, // Legacy name from grep tool
  replace: ToolNames.EDIT, // Legacy name from edit tool
} as const;

// Migration from old tool display names to new tool display names
// These legacy display names were used before the tool naming standardization
export const ToolDisplayNamesMigration = {
  SearchFiles: ToolDisplayNames.GREP, // Old display name for Grep
  FindFiles: ToolDisplayNames.GLOB, // Old display name for Glob
  ReadFolder: ToolDisplayNames.LS, // Old display name for ListFiles
} as const;

/**
 * Tool aliases - short names that can be used instead of canonical tool names.
 * This allows models to use shorter, more intuitive names for common tools.
 * For example: 'run' instead of 'run_shell_command'
 */
export const ToolAliases: Record<string, ToolName> = {
  // Shell tool aliases
  run: ToolNames.SHELL,
  shell: ToolNames.SHELL,
  exec: ToolNames.SHELL,
  cmd: ToolNames.SHELL,

  // Edit tool aliases
  edit: ToolNames.EDIT,
  replace: ToolNames.EDIT,

  // Write file aliases
  write: ToolNames.WRITE_FILE,
  create: ToolNames.WRITE_FILE,

  // Read file aliases
  read: ToolNames.READ_FILE,

  // Read many files aliases
  readmany: ToolNames.READ_MANY_FILES,
  read_all: ToolNames.READ_MANY_FILES,
  cat: ToolNames.READ_MANY_FILES,

  // Grep aliases
  grep: ToolNames.GREP,
  search: ToolNames.GREP,
  find: ToolNames.GREP,

  // Glob aliases
  glob: ToolNames.GLOB,
  files: ToolNames.GLOB,

  // List directory aliases
  ls: ToolNames.LS,
  list: ToolNames.LS,
  dir: ToolNames.LS,

  // Todo aliases
  todo: ToolNames.TODO_WRITE,
  todos: ToolNames.TODO_WRITE,

  // Memory aliases
  memory: ToolNames.MEMORY,
  save: ToolNames.MEMORY,

  // Web search aliases
  websearch: ToolNames.WEB_SEARCH,
  web: ToolNames.WEB_SEARCH,

  // Web fetch aliases
  webfetch: ToolNames.WEB_FETCH,
  fetch: ToolNames.WEB_FETCH,
  url: ToolNames.WEB_FETCH,

  // Task aliases
  agent: ToolNames.TASK,
  subagent: ToolNames.TASK,

  // Skill aliases
  skills: ToolNames.SKILL,

  // Exit plan mode aliases
  exit_plan: ToolNames.EXIT_PLAN_MODE,
  plan_done: ToolNames.EXIT_PLAN_MODE,

  // Python dev aliases
  python: ToolNames.PYTHON,
  py: ToolNames.PYTHON,
  pip: ToolNames.PYTHON,
  pytest: ToolNames.PYTHON,

  // Node.js dev aliases
  node: ToolNames.NODEJS,
  npm: ToolNames.NODEJS,
  yarn: ToolNames.NODEJS,
  pnpm: ToolNames.NODEJS,
  bun: ToolNames.NODEJS,

  // Golang dev aliases
  go: ToolNames.GOLANG,
  golang: ToolNames.GOLANG,
};

/**
 * Resolves a tool name or alias to its canonical tool name.
 * If the name is not found in aliases, returns the original name.
 *
 * @param name - The tool name or alias to resolve
 * @returns The canonical tool name
 */
export function resolveToolAlias(name: string): string {
  const normalizedName = name.trim().toLowerCase();

  // Check if it's a direct alias
  if (normalizedName in ToolAliases) {
    return ToolAliases[normalizedName];
  }

  // Check if it matches any canonical name directly
  const canonicalNames = Object.values(ToolNames);
  const matchingName = canonicalNames.find(
    (name) => name.toLowerCase() === normalizedName,
  );
  if (matchingName) {
    return matchingName;
  }

  // Return original name if no alias found
  return name;
}
