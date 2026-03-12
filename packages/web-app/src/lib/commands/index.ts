/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SlashCommand,
  CommandContext,
  SlashCommandActionReturn,
} from './types';
import { builtinCommands } from './builtinCommands';

export * from './types';
export * from './builtinCommands';

/**
 * Command service - manages slash commands
 */
export class CommandService {
  private commands: Map<string, SlashCommand> = new Map();

  constructor() {
    // Load built-in commands
    for (const cmd of builtinCommands) {
      this.registerCommand(cmd);
    }
  }

  /**
   * Register a command
   */
  registerCommand(command: SlashCommand): void {
    this.commands.set(command.name, command);
    // Register alt names
    if (command.altNames) {
      for (const altName of command.altNames) {
        this.commands.set(altName, command);
      }
    }
    // Register subcommands
    if (command.subCommands) {
      for (const subCmd of command.subCommands) {
        this.commands.set(`${command.name} ${subCmd.name}`, subCmd);
      }
    }
  }

  /**
   * Get all commands
   */
  getCommands(): SlashCommand[] {
    const seen = new Set<string>();
    const result: SlashCommand[] = [];

    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        if (!cmd.hidden) {
          result.push(cmd);
        }
      }
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get command by name
   */
  getCommand(name: string): SlashCommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Check if a string is a command
   */
  isCommand(input: string): boolean {
    return input.startsWith('/');
  }

  /**
   * Parse command from input
   */
  parseCommand(input: string): { name: string; args: string } | null {
    if (!this.isCommand(input)) return null;

    const trimmed = input.slice(1).trim();
    const spaceIndex = trimmed.indexOf(' ');

    if (spaceIndex === -1) {
      return { name: trimmed, args: '' };
    }

    return {
      name: trimmed.slice(0, spaceIndex),
      args: trimmed.slice(spaceIndex + 1),
    };
  }

  /**
   * Execute a command
   */
  async executeCommand(
    input: string,
    context: CommandContext,
  ): Promise<SlashCommandActionReturn | null> {
    const parsed = this.parseCommand(input);
    if (!parsed) return null;

    // Try full command first (e.g., "export json")
    let command = this.commands.get(
      `${parsed.name} ${parsed.args.split(' ')[0]}`,
    );
    let args = parsed.args.split(' ').slice(1).join(' ');

    // If not found, try base command
    if (!command) {
      command = this.commands.get(parsed.name);
      args = parsed.args;
    }

    if (!command) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Unknown command: /${parsed.name}. Type /help for available commands.`,
      };
    }

    if (!command.action) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Command /${command.name} has no action defined.`,
      };
    }

    try {
      const result = command.action(context, args);
      // Handle async results
      if (result instanceof Promise) {
        return await result;
      }
      return result || null;
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Error executing command: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get completions for partial command
   */
  getCompletions(partial: string): SlashCommand[] {
    if (!partial.startsWith('/')) return [];

    const query = partial.slice(1).toLowerCase();
    const result: SlashCommand[] = [];
    const seen = new Set<string>();

    for (const [name, cmd] of this.commands) {
      if (
        name.toLowerCase().startsWith(query) &&
        !seen.has(cmd.name) &&
        !cmd.hidden
      ) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }

    return result;
  }
}

// Singleton instance
export const commandService = new CommandService();
