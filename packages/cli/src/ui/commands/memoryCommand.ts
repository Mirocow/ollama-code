/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getErrorMessage,
  loadServerHierarchicalMemory,
  OLLAMA_DIR,
  MEMORY_FILENAME,
} from '@ollama-code/ollama-code-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { MessageType } from '../types.js';
import type { SlashCommand, SlashCommandActionReturn } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const memoryCommand: SlashCommand = {
  name: 'memory',
  get description() {
    return t('Commands for interacting with memory.');
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'show',
      get description() {
        return t('Show the current memory contents.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context) => {
        const memoryContent = context.services.config?.getUserMemory() || '';
        const fileCount = context.services.config?.getGeminiMdFileCount() || 0;

        const messageContent =
          memoryContent.length > 0
            ? `${t('Current memory content from {{count}} file(s):', { count: String(fileCount) })}\n\n---\n${memoryContent}\n---`
            : t('Memory is currently empty.');

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: messageContent,
          },
          Date.now(),
        );
      },
      subCommands: [
        {
          name: '--project',
          get description() {
            return t('Show project-level memory contents.');
          },
          kind: CommandKind.BUILT_IN,
          action: async (context) => {
            try {
              const workingDir =
                context.services.config?.getWorkingDir?.() ?? process.cwd();
              const projectMemoryPath = path.join(
                workingDir,
                MEMORY_FILENAME,
              );
              const memoryContent = await fs.readFile(
                projectMemoryPath,
                'utf-8',
              );

              const messageContent =
                memoryContent.trim().length > 0
                  ? t(
                      'Project memory content from {{path}}:\n\n---\n{{content}}\n---',
                      {
                        path: projectMemoryPath,
                        content: memoryContent,
                      },
                    )
                  : t('Project memory is currently empty.');

              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: messageContent,
                },
                Date.now(),
              );
            } catch (_error) {
              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: t(
                    'Project memory file not found or is currently empty.',
                  ),
                },
                Date.now(),
              );
            }
          },
        },
        {
          name: '--global',
          get description() {
            return t('Show global memory contents.');
          },
          kind: CommandKind.BUILT_IN,
          action: async (context) => {
            try {
              const globalMemoryPath = path.join(
                os.homedir(),
                OLLAMA_DIR,
                MEMORY_FILENAME,
              );
              const globalMemoryContent = await fs.readFile(
                globalMemoryPath,
                'utf-8',
              );

              const messageContent =
                globalMemoryContent.trim().length > 0
                  ? t('Global memory content:\n\n---\n{{content}}\n---', {
                      content: globalMemoryContent,
                    })
                  : t('Global memory is currently empty.');

              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: messageContent,
                },
                Date.now(),
              );
            } catch (_error) {
              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: t(
                    'Global memory file not found or is currently empty.',
                  ),
                },
                Date.now(),
              );
            }
          },
        },
      ],
    },
    {
      name: 'add',
      get description() {
        return t(
          'Add content to the memory. Use --global for global memory or --project for project memory.',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: (context, args): SlashCommandActionReturn | void => {
        if (!args || args.trim() === '') {
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /memory add [--global|--project] <text to remember>',
            ),
          };
        }

        const trimmedArgs = args.trim();
        let scope: 'global' | 'project' | undefined;
        let fact: string;

        // Check for scope flags
        if (trimmedArgs.startsWith('--global ')) {
          scope = 'global';
          fact = trimmedArgs.substring('--global '.length).trim();
        } else if (trimmedArgs.startsWith('--project ')) {
          scope = 'project';
          fact = trimmedArgs.substring('--project '.length).trim();
        } else if (trimmedArgs === '--global' || trimmedArgs === '--project') {
          // Flag provided but no text after it
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /memory add [--global|--project] <text to remember>',
            ),
          };
        } else {
          // No scope specified, will be handled by the tool
          fact = trimmedArgs;
        }

        if (!fact || fact.trim() === '') {
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /memory add [--global|--project] <text to remember>',
            ),
          };
        }

        const scopeText = scope ? `(${scope})` : '';
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Attempting to save to memory {{scope}}: "{{fact}}"', {
              scope: scopeText,
              fact,
            }),
          },
          Date.now(),
        );

        return {
          type: 'tool',
          toolName: 'save_memory',
          toolArgs: scope ? { fact, scope } : { fact },
        };
      },
      subCommands: [
        {
          name: '--project',
          get description() {
            return t('Add content to project-level memory.');
          },
          kind: CommandKind.BUILT_IN,
          action: (context, args): SlashCommandActionReturn | void => {
            if (!args || args.trim() === '') {
              return {
                type: 'message',
                messageType: 'error',
                content: t('Usage: /memory add --project <text to remember>'),
              };
            }

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t('Attempting to save to project memory: "{{text}}"', {
                  text: args.trim(),
                }),
              },
              Date.now(),
            );

            return {
              type: 'tool',
              toolName: 'save_memory',
              toolArgs: { fact: args.trim(), scope: 'project' },
            };
          },
        },
        {
          name: '--global',
          get description() {
            return t('Add content to global memory.');
          },
          kind: CommandKind.BUILT_IN,
          action: (context, args): SlashCommandActionReturn | void => {
            if (!args || args.trim() === '') {
              return {
                type: 'message',
                messageType: 'error',
                content: t('Usage: /memory add --global <text to remember>'),
              };
            }

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t('Attempting to save to global memory: "{{text}}"', {
                  text: args.trim(),
                }),
              },
              Date.now(),
            );

            return {
              type: 'tool',
              toolName: 'save_memory',
              toolArgs: { fact: args.trim(), scope: 'global' },
            };
          },
        },
      ],
    },
    {
      name: 'init',
      get description() {
        return t(`Initialize a new ${MEMORY_FILENAME} file with a template for user facts.`);
      },
      kind: CommandKind.BUILT_IN,
      action: async (
        context,
        args,
      ): Promise<SlashCommandActionReturn | void> => {
        // Determine scope: --global or --project (default: project)
        const scope =
          args?.trim() === '--global'
            ? 'global'
            : args?.trim() === '--project'
              ? 'project'
              : 'project';

        const memoryFilePath =
          scope === 'global'
            ? path.join(os.homedir(), OLLAMA_DIR, MEMORY_FILENAME)
            : path.join(
                context.services.config?.getWorkingDir?.() ?? process.cwd(),
                MEMORY_FILENAME,
              );

        // Check if file already exists
        try {
          const existingContent = await fs.readFile(memoryFilePath, 'utf-8');
          if (existingContent.trim().length > 0) {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t(
                  `${MEMORY_FILENAME} already exists at ${memoryFilePath}. Use /memory add to add new facts.`,
                ),
              },
              Date.now(),
            );
            return;
          }
        } catch {
          // File doesn't exist, which is fine
        }

        // Create template content
        const templateContent = `# User Memory

This file stores user facts and preferences for Ollama Code.
You can add memories using the \`/memory add\` command or ask the AI to remember things.

## User Preferences

<!-- Add your preferences here, e.g.:
- I prefer TypeScript over JavaScript
- I use 2 spaces for indentation
- My favorite editor is VS Code
-->

## Project-Specific Notes

<!-- Add project-specific notes here -->

## Ollama Added Memories

<!-- Memories added via /memory add will appear here -->
`;

        try {
          // Ensure directory exists for global memory
          if (scope === 'global') {
            await fs.mkdir(path.dirname(memoryFilePath), { recursive: true });
          }

          await fs.writeFile(memoryFilePath, templateContent, 'utf-8');

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t(
                `Created ${MEMORY_FILENAME} at ${memoryFilePath}. You can now add memories using /memory add.`,
              ),
            },
            Date.now(),
          );

          // Refresh memory to load the new file
          const config = context.services.config;
          if (config) {
            const { memoryContent, fileCount } =
              await loadServerHierarchicalMemory(
                config.getWorkingDir(),
                config.shouldLoadMemoryFromIncludeDirectories()
                  ? config.getWorkspaceContext().getDirectories()
                  : [],
                config.getFileService(),
                config.getExtensionContextFilePaths(),
                config.getFolderTrust(),
                context.services.settings.merged.context?.importFormat ||
                  'tree',
              );
            config.setUserMemory(memoryContent);
            config.setGeminiMdFileCount(fileCount);
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: `Error creating ${MEMORY_FILENAME}: ${errorMessage}`,
            },
            Date.now(),
          );
        }
      },
      subCommands: [
        {
          name: '--global',
          get description() {
            return t(`Initialize ${MEMORY_FILENAME} in global directory.`);
          },
          kind: CommandKind.BUILT_IN,
          action: async (
            context,
          ): Promise<SlashCommandActionReturn | void> => {
            const globalMemoryPath = path.join(
              os.homedir(),
              OLLAMA_DIR,
              MEMORY_FILENAME,
            );

            try {
              const existingContent = await fs.readFile(
                globalMemoryPath,
                'utf-8',
              );
              if (existingContent.trim().length > 0) {
                context.ui.addItem(
                  {
                    type: MessageType.INFO,
                    text: t(
                      `${MEMORY_FILENAME} already exists at ${globalMemoryPath}.`,
                    ),
                  },
                  Date.now(),
                );
                return;
              }
            } catch {
              // File doesn't exist
            }

            const templateContent = `# Global User Memory

This file stores global user facts and preferences shared across all projects.
You can add memories using the \`/memory add --global\` command.

## User Preferences

<!-- Add your global preferences here -->

## Ollama Added Memories

<!-- Memories added via /memory add --global will appear here -->
`;

            try {
              await fs.mkdir(path.dirname(globalMemoryPath), {
                recursive: true,
              });
              await fs.writeFile(globalMemoryPath, templateContent, 'utf-8');

              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: t(
                    `Created global ${MEMORY_FILENAME} at ${globalMemoryPath}.`,
                  ),
                },
                Date.now(),
              );
            } catch (error) {
              const errorMessage = getErrorMessage(error);
              context.ui.addItem(
                {
                  type: MessageType.ERROR,
                  text: `Error creating global ${MEMORY_FILENAME}: ${errorMessage}`,
                },
                Date.now(),
              );
            }
          },
        },
        {
          name: '--project',
          get description() {
            return t(`Initialize ${MEMORY_FILENAME} in current project directory.`);
          },
          kind: CommandKind.BUILT_IN,
          action: async (
            context,
          ): Promise<SlashCommandActionReturn | void> => {
            const projectMemoryPath = path.join(
              context.services.config?.getWorkingDir?.() ?? process.cwd(),
              MEMORY_FILENAME,
            );

            try {
              const existingContent = await fs.readFile(
                projectMemoryPath,
                'utf-8',
              );
              if (existingContent.trim().length > 0) {
                context.ui.addItem(
                  {
                    type: MessageType.INFO,
                    text: t(
                      `${MEMORY_FILENAME} already exists at ${projectMemoryPath}.`,
                    ),
                  },
                  Date.now(),
                );
                return;
              }
            } catch {
              // File doesn't exist
            }

            const templateContent = `# Project Memory

This file stores project-specific user facts and preferences.
You can add memories using the \`/memory add --project\` command.

## User Preferences

<!-- Add your project-specific preferences here -->

## Project-Specific Notes

<!-- Add project-specific notes here -->

## Ollama Added Memories

<!-- Memories added via /memory add --project will appear here -->
`;

            try {
              await fs.writeFile(projectMemoryPath, templateContent, 'utf-8');

              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: t(
                    `Created project ${MEMORY_FILENAME} at ${projectMemoryPath}.`,
                  ),
                },
                Date.now(),
              );
            } catch (error) {
              const errorMessage = getErrorMessage(error);
              context.ui.addItem(
                {
                  type: MessageType.ERROR,
                  text: `Error creating project ${MEMORY_FILENAME}: ${errorMessage}`,
                },
                Date.now(),
              );
            }
          },
        },
      ],
    },
    {
      name: 'refresh',
      get description() {
        return t('Refresh the memory from the source.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context) => {
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Refreshing memory from source files...'),
          },
          Date.now(),
        );

        try {
          const config = context.services.config;
          if (config) {
            const { memoryContent, fileCount } =
              await loadServerHierarchicalMemory(
                config.getWorkingDir(),
                config.shouldLoadMemoryFromIncludeDirectories()
                  ? config.getWorkspaceContext().getDirectories()
                  : [],
                config.getFileService(),
                config.getExtensionContextFilePaths(),
                config.getFolderTrust(),
                context.services.settings.merged.context?.importFormat ||
                  'tree', // Use setting or default to 'tree'
              );
            config.setUserMemory(memoryContent);
            config.setGeminiMdFileCount(fileCount);

            const successMessage =
              memoryContent.length > 0
                ? `Memory refreshed successfully. Loaded ${memoryContent.length} characters from ${fileCount} file(s).`
                : 'Memory refreshed successfully. No memory content found.';

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: successMessage,
              },
              Date.now(),
            );
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: `Error refreshing memory: ${errorMessage}`,
            },
            Date.now(),
          );
        }
      },
    },
  ],
};
