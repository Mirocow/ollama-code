/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Command kind - determines how command is loaded
 */
export enum CommandKind {
  BUILT_IN = 'built_in',
  FILE = 'file',
  MCP_PROMPT = 'mcp_prompt',
}

/**
 * Command completion item for autocomplete
 */
export interface CommandCompletionItem {
  name: string;
  description?: string;
}

/**
 * Message action return type
 */
export interface MessageActionReturn {
  type: 'message';
  messageType: 'info' | 'error' | 'success' | 'warning';
  content: string;
}

/**
 * Dialog action return type
 */
export interface OpenDialogActionReturn {
  type: 'dialog';
  dialog: 'model' | 'settings' | 'mcp' | 'tools' | 'extensions' | 'help';
}

/**
 * Quit action return type
 */
export interface QuitActionReturn {
  type: 'quit';
}

/**
 * Tool action return type
 */
export interface ToolActionReturn {
  type: 'tool';
  toolName: string;
  args: Record<string, unknown>;
}

/**
 * Stream messages action return type
 */
export interface StreamMessagesActionReturn {
  type: 'stream';
  messages: Array<{ role: string; content: string }>;
}

/**
 * Load history action return type
 */
export interface LoadHistoryActionReturn {
  type: 'load_history';
  history: unknown[];
}

/**
 * Submit prompt action return type
 */
export interface SubmitPromptActionReturn {
  type: 'submit_prompt';
  prompt: string;
}

/**
 * Confirm action return type
 */
export interface ConfirmActionReturn {
  type: 'confirm';
  message: string;
  onConfirm: () => void;
}

/**
 * Clear action return type
 */
export interface ClearActionReturn {
  type: 'clear';
}

/**
 * All possible action return types
 */
export type SlashCommandActionReturn =
  | MessageActionReturn
  | OpenDialogActionReturn
  | QuitActionReturn
  | ToolActionReturn
  | StreamMessagesActionReturn
  | LoadHistoryActionReturn
  | SubmitPromptActionReturn
  | ConfirmActionReturn
  | ClearActionReturn;

/**
 * Command context passed to command actions
 */
export interface CommandContext {
  /** Current model */
  model: string;
  /** Set model callback */
  setModel: (model: string) => void;
  /** Clear chat callback */
  clearChat: () => void;
  /** Export chat callback */
  exportChat: (format: 'json' | 'md' | 'html') => void;
  /** Show message callback */
  showMessage: (
    type: 'info' | 'error' | 'success' | 'warning',
    content: string,
  ) => void;
  /** Open dialog callback */
  openDialog: (dialog: OpenDialogActionReturn['dialog']) => void;
  /** Get available models */
  getModels: () => string[];
  /** Settings */
  settings: Record<string, unknown>;
  /** Update settings */
  updateSettings: (settings: Partial<Record<string, unknown>>) => void;
}

/**
 * Slash command definition
 */
export interface SlashCommand {
  /** Command name (without /) */
  name: string;
  /** Alternative names */
  altNames?: string[];
  /** Command description */
  description: string;
  /** Whether command is hidden from list */
  hidden?: boolean;
  /** Command kind */
  kind: CommandKind;
  /** Extension name if from extension */
  extensionName?: string;
  /** Command action */
  action?: (
    context: CommandContext,
    args?: string,
  ) => SlashCommandActionReturn | Promise<SlashCommandActionReturn> | void;
  /** Autocomplete handler */
  completion?: (
    context: CommandContext,
    partialArg: string,
  ) => Promise<CommandCompletionItem[] | null>;
  /** Sub commands */
  subCommands?: SlashCommand[];
}
