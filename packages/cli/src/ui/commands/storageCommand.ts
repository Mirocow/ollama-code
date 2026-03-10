/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StorageNamespaces,
  type StorageNamespace,
  getProjectInfo,
  type StorageEntry,
} from '@ollama-code/ollama-code-core';
import { MessageType } from '../types.js';
import type { SlashCommand, SlashCommandActionReturn } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// Storage paths
const getStorageDir = (scope: 'global' | 'project' = 'global'): string => {
  if (scope === 'global') {
    return path.join(os.homedir(), '.ollama-code', 'storage');
  }
  // For project scope, we'll use the current working directory
  return path.join(process.cwd(), '.ollama-code', 'storage');
};

const getNamespaceFilePath = (
  namespace: string,
  scope: 'global' | 'project' = 'global',
): string => path.join(getStorageDir(scope), `${namespace}.json`);

const readNamespaceData = async (
  namespace: string,
  scope: 'global' | 'project' = 'global',
): Promise<Record<string, StorageEntry>> => {
  const filePath = getNamespaceFilePath(namespace, scope);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    const error = err as Error & { code?: string };
    if (error.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
};

const listAvailableNamespaces = async (
  scope: 'global' | 'project' = 'global',
): Promise<string[]> => {
  const storageDir = getStorageDir(scope);
  try {
    const files = await fs.readdir(storageDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const storageCommand: SlashCommand = {
  name: 'storage',
  get description() {
    return t('Commands for managing AI model storage (persistent data).');
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'list',
      get description() {
        return t(
          'List all namespaces or keys in a namespace. Usage: /storage list [namespace]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: async (context, args): Promise<void> => {
        const trimmedArgs = args?.trim() || '';

        try {
          if (trimmedArgs) {
            // List keys in specific namespace
            const parts = trimmedArgs.split(/\s+/);
            const namespace = parts[0];
            const scope =
              parts[1] === '--project'
                ? 'project'
                : parts[1] === '--global'
                  ? 'global'
                  : 'global';

            const data = await readNamespaceData(namespace, scope);
            const keys = Object.keys(data);

            if (keys.length === 0) {
              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: t('Namespace "{{namespace}}" is empty.', { namespace }),
                },
                Date.now(),
              );
              return;
            }

            const keyList = keys
              .map((key) => {
                const entry = data[key];
                const ttlInfo = entry.metadata?.ttl
                  ? ` [TTL: ${entry.metadata.ttl}s]`
                  : '';
                const tagsInfo = entry.metadata?.tags?.length
                  ? ` [tags: ${entry.metadata.tags.join(', ')}]`
                  : '';
                const versionInfo = entry.metadata?.version
                  ? ` v${entry.metadata.version}`
                  : '';
                return `  - ${key}${versionInfo}${ttlInfo}${tagsInfo}`;
              })
              .join('\n');

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t(
                  'Keys in {{namespace}} ({{scope}}, {{count}} items):\n{{keys}}',
                  {
                    namespace,
                    scope,
                    count: String(keys.length),
                    keys: keyList,
                  },
                ),
              },
              Date.now(),
            );
          } else {
            // List all namespaces
            const [globalNs, projectNs] = await Promise.all([
              listAvailableNamespaces('global'),
              listAvailableNamespaces('project'),
            ]);

            const predefined = Object.values(StorageNamespaces);
            const allGlobal = [...new Set([...predefined, ...globalNs])];

            let message = t('Storage Namespaces:\n\n');

            if (allGlobal.length > 0) {
              message += t('📁 Global (~/.ollama-code/storage/):\n');
              for (const ns of allGlobal.sort()) {
                const exists = globalNs.includes(ns);
                const marker = exists ? '✓' : '○';
                const predefinedMarker = predefined.includes(
                  ns as StorageNamespace,
                )
                  ? ' [predefined]'
                  : '';
                message += `  ${marker} ${ns}${predefinedMarker}\n`;
              }
            }

            if (projectNs.length > 0) {
              message += '\n' + t('📁 Project (./.ollama-code/storage/):\n');
              for (const ns of projectNs.sort()) {
                message += `  ✓ ${ns}\n`;
              }
            }

            if (allGlobal.length === 0 && projectNs.length === 0) {
              message += t('No storage data found.\n');
              message += t(
                'Use /storage set <namespace> <key> <value> to create data.',
              );
            }

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: message,
              },
              Date.now(),
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Error listing storage: {{error}}', {
                error: errorMessage,
              }),
            },
            Date.now(),
          );
        }
      },
      subCommands: [
        {
          name: '--global',
          get description() {
            return t('List namespaces in global scope.');
          },
          kind: CommandKind.BUILT_IN,
          action: async (context) => {
            const namespaces = await listAvailableNamespaces('global');
            const predefined = Object.values(StorageNamespaces);
            const allNs = [...new Set([...predefined, ...namespaces])];

            let message = t('Global namespaces ({{count}}):\n', {
              count: String(allNs.length),
            });
            for (const ns of allNs.sort()) {
              const exists = namespaces.includes(ns);
              const marker = exists ? '✓' : '○';
              const predefinedMarker = predefined.includes(
                ns as StorageNamespace,
              )
                ? ' [predefined]'
                : '';
              message += `  ${marker} ${ns}${predefinedMarker}\n`;
            }

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: message,
              },
              Date.now(),
            );
          },
        },
        {
          name: '--project',
          get description() {
            return t('List namespaces in project scope.');
          },
          kind: CommandKind.BUILT_IN,
          action: async (context) => {
            const namespaces = await listAvailableNamespaces('project');

            if (namespaces.length === 0) {
              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: t('No project-level storage found.'),
                },
                Date.now(),
              );
              return;
            }

            let message = t('Project namespaces ({{count}}):\n', {
              count: String(namespaces.length),
            });
            for (const ns of namespaces.sort()) {
              message += `  ✓ ${ns}\n`;
            }

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: message,
              },
              Date.now(),
            );
          },
        },
      ],
    },
    {
      name: 'get',
      get description() {
        return t(
          'Get a value from storage. Usage: /storage get <namespace> <key> [--global|--project]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: async (
        context,
        args,
      ): Promise<void | SlashCommandActionReturn> => {
        const parts = args?.trim().split(/\s+/) || [];

        if (parts.length < 2) {
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /storage get <namespace> <key> [--global|--project]',
            ),
          };
        }

        const namespace = parts[0];
        const key = parts[1];
        const scope = parts.includes('--project') ? 'project' : 'global';

        try {
          const data = await readNamespaceData(namespace, scope);
          const entry = data[key];

          if (!entry) {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t(
                  'Key "{{key}}" not found in {{namespace}} ({{scope}})',
                  {
                    key,
                    namespace,
                    scope,
                  },
                ),
              },
              Date.now(),
            );
            return;
          }

          const includeMeta = parts.includes('--meta');
          if (includeMeta) {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t('{{key}} in {{namespace}} ({{scope}}):\n{{value}}', {
                  key,
                  namespace,
                  scope,
                  value: JSON.stringify(
                    { value: entry.value, metadata: entry.metadata },
                    null,
                    2,
                  ),
                }),
              },
              Date.now(),
            );
          } else {
            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t('{{key}} in {{namespace}} ({{scope}}):\n{{value}}', {
                  key,
                  namespace,
                  scope,
                  value: JSON.stringify(entry.value, null, 2),
                }),
              },
              Date.now(),
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Error getting value: {{error}}', {
                error: errorMessage,
              }),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'set',
      get description() {
        return t(
          'Set a value in storage. Usage: /storage set <namespace> <key> <value> [--global|--project] [--ttl=seconds] [--tags=a,b,c]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: (context, args): SlashCommandActionReturn | void => {
        const parts = args?.trim().split(/\s+/) || [];

        if (parts.length < 3) {
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /storage set <namespace> <key> <value> [--global|--project] [--ttl=seconds]',
            ),
          };
        }

        const namespace = parts[0];
        const key = parts[1];

        // Find the value part (everything after key until flags)
        let valueStr = '';
        let i = 2;
        for (; i < parts.length; i++) {
          if (parts[i].startsWith('--')) break;
          valueStr += (valueStr ? ' ' : '') + parts[i];
        }

        // Parse flags
        let scope: 'global' | 'project' = 'global';
        let ttl: number | undefined;
        let tags: string[] | undefined;

        for (; i < parts.length; i++) {
          if (parts[i] === '--project') scope = 'project';
          else if (parts[i] === '--global') scope = 'global';
          else if (parts[i].startsWith('--ttl=')) {
            ttl = parseInt(parts[i].substring(6), 10);
          } else if (parts[i].startsWith('--tags=')) {
            tags = parts[i].substring(7).split(',');
          }
        }

        // Try to parse value as JSON, otherwise use as string
        let value: unknown;
        try {
          value = JSON.parse(valueStr);
        } catch {
          value = valueStr;
        }

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Setting {{key}} in {{namespace}} ({{scope}})...', {
              key,
              namespace,
              scope,
            }),
          },
          Date.now(),
        );

        return {
          type: 'tool',
          toolName: 'model_storage',
          toolArgs: {
            operation: 'set',
            namespace,
            key,
            value,
            scope,
            ...(ttl && { ttl }),
            ...(tags && { tags }),
          },
        };
      },
    },
    {
      name: 'delete',
      get description() {
        return t(
          'Delete a key from storage. Usage: /storage delete <namespace> <key> [--global|--project]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: (context, args): SlashCommandActionReturn | void => {
        const parts = args?.trim().split(/\s+/) || [];

        if (parts.length < 2) {
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /storage delete <namespace> <key> [--global|--project]',
            ),
          };
        }

        const namespace = parts[0];
        const key = parts[1];
        const scope = parts.includes('--project') ? 'project' : 'global';

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Deleting {{key}} from {{namespace}} ({{scope}})...', {
              key,
              namespace,
              scope,
            }),
          },
          Date.now(),
        );

        return {
          type: 'tool',
          toolName: 'model_storage',
          toolArgs: {
            operation: 'delete',
            namespace,
            key,
            scope,
          },
        };
      },
    },
    {
      name: 'clear',
      get description() {
        return t(
          'Clear all keys in a namespace. Usage: /storage clear <namespace> [--global|--project]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: (context, args): SlashCommandActionReturn | void => {
        const parts = args?.trim().split(/\s+/) || [];

        if (parts.length < 1) {
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /storage clear <namespace> [--global|--project]',
            ),
          };
        }

        const namespace = parts[0];
        const scope = parts.includes('--project') ? 'project' : 'global';

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Clearing all data in {{namespace}} ({{scope}})...', {
              namespace,
              scope,
            }),
          },
          Date.now(),
        );

        return {
          type: 'tool',
          toolName: 'model_storage',
          toolArgs: {
            operation: 'clear',
            namespace,
            scope,
          },
        };
      },
    },
    {
      name: 'stats',
      get description() {
        return t(
          'Get storage statistics. Usage: /storage stats [namespace] [--global|--project]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: async (context, args): Promise<void> => {
        const parts = args?.trim().split(/\s+/) || [];
        const namespace =
          parts[0] && !parts[0].startsWith('--') ? parts[0] : null;
        const scope = parts.includes('--project') ? 'project' : 'global';

        try {
          if (namespace) {
            // Stats for specific namespace
            const data = await readNamespaceData(namespace, scope);
            const keys = Object.keys(data);

            let totalSize = 0;
            let expiredCount = 0;
            const now = new Date();

            for (const key of keys) {
              const entry = data[key];
              totalSize += JSON.stringify(entry.value).length;

              if (entry.metadata?.expiresAt) {
                if (new Date(entry.metadata.expiresAt) < now) {
                  expiredCount++;
                }
              }
            }

            const stats = {
              namespace,
              scope,
              keys: {
                total: keys.length,
                expired: expiredCount,
              },
              size: {
                bytes: totalSize,
                formatted: formatBytes(totalSize),
              },
            };

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t(
                  'Storage stats for {{namespace}} ({{scope}}):\n{{stats}}',
                  {
                    namespace,
                    scope,
                    stats: JSON.stringify(stats, null, 2),
                  },
                ),
              },
              Date.now(),
            );
          } else {
            // Stats for all namespaces
            const namespaces = await listAvailableNamespaces(scope);

            if (namespaces.length === 0) {
              context.ui.addItem(
                {
                  type: MessageType.INFO,
                  text: t('No storage data found in {{scope}} scope.', {
                    scope,
                  }),
                },
                Date.now(),
              );
              return;
            }

            let totalKeys = 0;
            let totalSize = 0;

            for (const ns of namespaces) {
              const data = await readNamespaceData(ns, scope);
              totalKeys += Object.keys(data).length;
              for (const key of Object.keys(data)) {
                totalSize += JSON.stringify(data[key].value).length;
              }
            }

            // Get project info
            const projectInfo = await getProjectInfo();

            const stats = {
              scope,
              namespaces: namespaces.length,
              totalKeys,
              totalSize: {
                bytes: totalSize,
                formatted: formatBytes(totalSize),
              },
              project: {
                id: projectInfo.id,
                name: projectInfo.name,
                type: projectInfo.type,
              },
            };

            context.ui.addItem(
              {
                type: MessageType.INFO,
                text: t('Storage statistics:\n{{stats}}', {
                  stats: JSON.stringify(stats, null, 2),
                }),
              },
              Date.now(),
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Error getting stats: {{error}}', {
                error: errorMessage,
              }),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'export',
      get description() {
        return t(
          'Export storage to a JSON file. Usage: /storage export <file.json> [namespace] [--global|--project]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: async (context, args): Promise<void> => {
        const parts = args?.trim().split(/\s+/) || [];

        if (parts.length < 1) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t(
                'Usage: /storage export <file.json> [namespace] [--global|--project]',
              ),
            },
            Date.now(),
          );
          return;
        }

        const filePath = parts[0];
        const namespace =
          parts[1] && !parts[1].startsWith('--') ? parts[1] : null;
        const scope = parts.includes('--project') ? 'project' : 'global';

        try {
          const exportData: Record<string, unknown> = {};

          if (namespace) {
            // Export specific namespace
            const data = await readNamespaceData(namespace, scope);
            exportData[namespace] = data;
          } else {
            // Export all namespaces
            const namespaces = await listAvailableNamespaces(scope);
            for (const ns of namespaces) {
              exportData[ns] = await readNamespaceData(ns, scope);
            }
          }

          await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('Exported {{count}} namespace(s) to {{file}}', {
                count: String(Object.keys(exportData).length),
                file: filePath,
              }),
            },
            Date.now(),
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Error exporting storage: {{error}}', {
                error: errorMessage,
              }),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'import',
      get description() {
        return t(
          'Import storage from a JSON file. Usage: /storage import <file.json> [--global|--project]',
        );
      },
      kind: CommandKind.BUILT_IN,
      action: async (context, args): Promise<void> => {
        const parts = args?.trim().split(/\s+/) || [];

        if (parts.length < 1) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t(
                'Usage: /storage import <file.json> [--global|--project]',
              ),
            },
            Date.now(),
          );
          return;
        }

        const filePath = parts[0];
        const scope = parts.includes('--project') ? 'project' : 'global';

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const importData = JSON.parse(content);

          const storageDir = getStorageDir(scope);
          await fs.mkdir(storageDir, { recursive: true });

          let namespaceCount = 0;
          let keyCount = 0;

          for (const [namespace, data] of Object.entries(importData)) {
            const filePath = getNamespaceFilePath(namespace, scope);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            namespaceCount++;
            keyCount += Object.keys(data as object).length;
          }

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t(
                'Imported {{keys}} keys from {{namespaces}} namespace(s) from {{file}}',
                {
                  keys: String(keyCount),
                  namespaces: String(namespaceCount),
                  file: filePath,
                },
              ),
            },
            Date.now(),
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Error importing storage: {{error}}', {
                error: errorMessage,
              }),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'info',
      get description() {
        return t('Show project and storage information.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context): Promise<void> => {
        try {
          const projectInfo = await getProjectInfo();

          const globalDir = getStorageDir('global');
          const projectDir = getStorageDir('project');

          const info = {
            project: {
              id: projectInfo.id,
              name: projectInfo.name,
              root: projectInfo.root,
              type: projectInfo.type,
            },
            storage: {
              global: globalDir,
              project: projectDir,
            },
            namespaces: {
              predefined: Object.values(StorageNamespaces),
            },
          };

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('Storage Information:\n{{info}}', {
                info: JSON.stringify(info, null, 2),
              }),
            },
            Date.now(),
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Error getting info: {{error}}', { error: errorMessage }),
            },
            Date.now(),
          );
        }
      },
    },
  ],
};
