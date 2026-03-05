/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Model Storage Tool - универсальное хранилище для AI-модели.
 * Позволяет модели сохранять и извлекать структурированные данные:
 * - roadmap: планы развития и задачи
 * - session: временная память текущей сессии
 * - knowledge: база знаний модели
 * - context: контекст текущей задачи
 */

import type { ToolResult } from '../../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
} from '../../../tools/tools.js';
import type { FunctionDeclaration } from '../../../types/content.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Storage } from '../../../config/storage.js';
import { ToolDisplayNames, ToolNames } from '../../../tools/tool-names.js';
import { ToolErrorType } from '../../../tools/tool-error.js';
import { createDebugLogger } from '../../../utils/debugLogger.js';

const debugLogger = createDebugLogger('STORAGE_TOOL');

// ============================================================================
// Константы и типы
// ============================================================================

export const STORAGE_DIR = 'storage';

// Предопределённые namespace'ы для разных типов данных
export const StorageNamespaces = {
  ROADMAP: 'roadmap',       // Дорожная карта проекта
  SESSION: 'session',       // Временная память сессии
  KNOWLEDGE: 'knowledge',   // База знаний модели
  CONTEXT: 'context',       // Контекст текущей задачи
  LEARNING: 'learning',     // Обучение модели (алиасы, корректировки)
  METRICS: 'metrics',       // Метрики и статистика
} as const;

export type StorageNamespace = typeof StorageNamespaces[keyof typeof StorageNamespaces];

// JSON Schema для инструмента
const storageToolSchemaData: FunctionDeclaration = {
  name: 'model_storage',
  description: `Universal storage for AI model to persist structured data between sessions.

NAMESPACES (use as 'namespace' parameter):
- roadmap: Project roadmap, milestones, future plans
- session: Temporary session data (cleared between sessions)
- knowledge: Model's learned facts and patterns
- context: Current task context and state
- learning: Tool aliases and corrections learned by model
- metrics: Statistics and performance data

OPERATIONS:
- set: Store a value (overwrites existing)
- get: Retrieve a value by key
- delete: Remove a key
- list: List all keys in namespace
- append: Add item to array
- merge: Merge object with existing data
- clear: Clear all data in namespace`,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['set', 'get', 'delete', 'list', 'append', 'merge', 'clear'],
        description: 'Operation to perform on storage',
      },
      namespace: {
        type: 'string',
        description: 'Storage namespace (roadmap, session, knowledge, context, learning, metrics) or custom name',
      },
      key: {
        type: 'string',
        description: 'Key to store/retrieve (optional for list/clear operations)',
      },
      value: {
        description: 'Value to store (any JSON-serializable type: string, number, object, array, boolean)',
      },
      scope: {
        type: 'string',
        enum: ['global', 'project'],
        description: 'Storage scope: global (shared across projects) or project (current project only). Default: global',
      },
    },
    required: ['operation', 'namespace'],
  },
};

const storageToolDescription = `
# Model Storage Tool

Universal key-value storage for AI model to persist structured data between sessions.

## Namespaces

Predefined namespaces for organizing data:

| Namespace  | Purpose                              | Persistence     |
|------------|--------------------------------------|-----------------|
| roadmap    | Project roadmap, milestones, plans   | Persistent      |
| session    | Temporary session data               | Cleared on exit |
| knowledge  | Learned facts, patterns, preferences | Persistent      |
| context    | Current task context and state       | Per-task        |
| learning   | Tool aliases, corrections            | Persistent      |
| metrics    | Statistics, performance data         | Persistent      |

## Operations

### set - Store a value
\`\`\`json
{ "operation": "set", "namespace": "roadmap", "key": "v1.0", "value": {"features": ["auth", "api"], "status": "planning"} }
\`\`\`

### get - Retrieve a value
\`\`\`json
{ "operation": "get", "namespace": "roadmap", "key": "v1.0" }
\`\`\`

### delete - Remove a key
\`\`\`json
{ "operation": "delete", "namespace": "session", "key": "temp_data" }
\`\`\`

### list - List all keys in namespace
\`\`\`json
{ "operation": "list", "namespace": "roadmap" }
\`\`\`

### append - Add item to array
\`\`\`json
{ "operation": "append", "namespace": "roadmap", "key": "backlog", "value": "Add dark mode" }
\`\`\`

### merge - Merge object with existing data
\`\`\`json
{ "operation": "merge", "namespace": "knowledge", "key": "user_prefs", "value": {"theme": "dark"} }
\`\`\`

### clear - Clear all data in namespace
\`\`\`json
{ "operation": "clear", "namespace": "session" }
\`\`\`

## Scope

- **global**: Stored in \`~/.ollama-code/storage/\` (shared across all projects)
- **project**: Stored in \`<project>/.ollama-code/storage/\` (project-specific)

## Examples

### Save roadmap milestone:
\`\`\`
model_storage operation=set namespace=roadmap key="v0.18.0" value='{"features":["git-ui"],"status":"planning","due":"2025-03"}'
\`\`\`

### Get all roadmap items:
\`\`\`
model_storage operation=list namespace=roadmap
\`\`\`

### Remember user preference:
\`\`\`
model_storage operation=merge namespace=knowledge key="user_prefs" value='{"editor":"vscode"}'
\`\`\`
`;

// ============================================================================
// Интерфейсы параметров
// ============================================================================

interface StorageParams {
  operation: 'set' | 'get' | 'delete' | 'list' | 'append' | 'merge' | 'clear';
  namespace: string;
  key?: string;
  value?: unknown;
  scope?: 'global' | 'project';
}

// ============================================================================
// Утилиты для работы с файлами
// ============================================================================

function getStorageDir(scope: 'global' | 'project' = 'global'): string {
  if (scope === 'global') {
    return path.join(Storage.getGlobalOllamaDir(), STORAGE_DIR);
  }
  return path.join(process.cwd(), '.ollama-code', STORAGE_DIR);
}

function getNamespaceFilePath(namespace: string, scope: 'global' | 'project' = 'global'): string {
  return path.join(getStorageDir(scope), `${namespace}.json`);
}

async function ensureStorageDir(scope: 'global' | 'project'): Promise<void> {
  const dir = getStorageDir(scope);
  await fs.mkdir(dir, { recursive: true });
}

async function readNamespaceData(namespace: string, scope: 'global' | 'project'): Promise<Record<string, unknown>> {
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
}

async function writeNamespaceData(namespace: string, data: Record<string, unknown>, scope: 'global' | 'project'): Promise<void> {
  await ensureStorageDir(scope);
  const filePath = getNamespaceFilePath(namespace, scope);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// Операции хранилища
// ============================================================================

async function performSet(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, value, scope = 'global' } = params;
  
  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for set operation',
      returnDisplay: 'Error: key is required',
    };
  }
  
  const data = await readNamespaceData(namespace, scope);
  data[key] = value;
  await writeNamespaceData(namespace, data, scope);
  
  return {
    llmContent: `Stored ${key} in ${namespace} (${scope})`,
    returnDisplay: `Stored: ${key} = ${JSON.stringify(value).slice(0, 100)}...`,
  };
}

async function performGet(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, scope = 'global' } = params;
  
  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for get operation',
      returnDisplay: 'Error: key is required',
    };
  }
  
  const data = await readNamespaceData(namespace, scope);
  const value = data[key];
  
  if (value === undefined) {
    return {
      llmContent: `Key "${key}" not found in ${namespace} (${scope})`,
      returnDisplay: `Key not found: ${key}`,
    };
  }
  
  return {
    llmContent: JSON.stringify(value, null, 2),
    returnDisplay: `Retrieved: ${key}`,
  };
}

async function performDelete(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, scope = 'global' } = params;
  
  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for delete operation',
      returnDisplay: 'Error: key is required',
    };
  }
  
  const data = await readNamespaceData(namespace, scope);
  
  if (data[key] === undefined) {
    return {
      llmContent: `Key "${key}" not found in ${namespace} (${scope})`,
      returnDisplay: `Key not found: ${key}`,
    };
  }
  
  delete data[key];
  await writeNamespaceData(namespace, data, scope);
  
  return {
    llmContent: `Deleted ${key} from ${namespace} (${scope})`,
    returnDisplay: `Deleted: ${key}`,
  };
}

async function performList(params: StorageParams): Promise<ToolResult> {
  const { namespace, scope = 'global' } = params;
  
  const data = await readNamespaceData(namespace, scope);
  const keys = Object.keys(data);
  
  if (keys.length === 0) {
    return {
      llmContent: `Namespace "${namespace}" (${scope}) is empty`,
      returnDisplay: `Empty namespace: ${namespace}`,
    };
  }
  
  return {
    llmContent: `Keys in ${namespace} (${scope}):\n${keys.map(k => `- ${k}`).join('\n')}`,
    returnDisplay: `${keys.length} keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`,
  };
}

async function performAppend(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, value, scope = 'global' } = params;
  
  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for append operation',
      returnDisplay: 'Error: key is required',
    };
  }
  
  const data = await readNamespaceData(namespace, scope);
  const existing = data[key];
  
  if (existing === undefined) {
    data[key] = [value];
  } else if (Array.isArray(existing)) {
    existing.push(value);
    data[key] = existing;
  } else {
    return {
      llmContent: `Error: Cannot append to non-array value at ${key}. Current type: ${typeof existing}`,
      returnDisplay: 'Error: value is not an array',
    };
  }
  
  await writeNamespaceData(namespace, data, scope);
  
  const arr = data[key] as unknown[];
  return {
    llmContent: `Appended to ${key} in ${namespace} (${scope}). Array now has ${arr.length} items.`,
    returnDisplay: `Appended to: ${key} (${arr.length} items)`,
  };
}

async function performMerge(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, value, scope = 'global' } = params;
  
  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for merge operation',
      returnDisplay: 'Error: key is required',
    };
  }
  
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      llmContent: 'Error: "value" must be an object for merge operation',
      returnDisplay: 'Error: value must be an object',
    };
  }
  
  const data = await readNamespaceData(namespace, scope);
  const existing = data[key];
  
  if (existing === undefined) {
    data[key] = value;
  } else if (typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
    data[key] = { ...existing, ...value };
  } else {
    return {
      llmContent: `Error: Cannot merge into non-object value at ${key}. Current type: ${typeof existing}`,
      returnDisplay: 'Error: value is not an object',
    };
  }
  
  await writeNamespaceData(namespace, data, scope);
  
  return {
    llmContent: `Merged into ${key} in ${namespace} (${scope})`,
    returnDisplay: `Merged into: ${key}`,
  };
}

async function performClear(params: StorageParams): Promise<ToolResult> {
  const { namespace, scope = 'global' } = params;
  
  await writeNamespaceData(namespace, {}, scope);
  
  return {
    llmContent: `Cleared all data in ${namespace} (${scope})`,
    returnDisplay: `Cleared: ${namespace}`,
  };
}

// ============================================================================
// Invocation Class
// ============================================================================

class StorageToolInvocation extends BaseToolInvocation<StorageParams, ToolResult> {
  getDescription(): string {
    const { operation, namespace, key, scope = 'global' } = this.params;
    return `storage ${operation} ${namespace}${key ? `/${key}` : ''} (${scope})`;
  }

  override async shouldConfirmExecute(
    _abortSignal: AbortSignal,
  ): Promise<false> {
    // Storage operations don't require confirmation
    return false;
  }

  async execute(_signal: AbortSignal): Promise<ToolResult> {
    const { operation } = this.params;

    try {
      switch (operation) {
        case 'set':
          return await performSet(this.params);
        case 'get':
          return await performGet(this.params);
        case 'delete':
          return await performDelete(this.params);
        case 'list':
          return await performList(this.params);
        case 'append':
          return await performAppend(this.params);
        case 'merge':
          return await performMerge(this.params);
        case 'clear':
          return await performClear(this.params);
        default:
          return {
            llmContent: `Error: Unknown operation "${operation}"`,
            returnDisplay: `Error: unknown operation`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLogger.error(`[StorageTool] Error executing ${operation}:`, errorMessage);
      
      return {
        llmContent: `Storage error: ${errorMessage}`,
        returnDisplay: `Error: ${errorMessage}`,
        error: {
          message: errorMessage,
          type: ToolErrorType.STORAGE_EXECUTION_ERROR,
        },
      };
    }
  }
}

// ============================================================================
// Tool Class
// ============================================================================

export class StorageTool extends BaseDeclarativeTool<StorageParams, ToolResult> {
  static readonly Name: string = ToolNames.STORAGE;

  constructor() {
    super(
      StorageTool.Name,
      ToolDisplayNames.STORAGE,
      storageToolDescription,
      Kind.Think,
      storageToolSchemaData.parametersJsonSchema as Record<string, unknown>,
    );
  }

  protected override validateToolParamValues(params: StorageParams): string | null {
    const { operation, namespace } = params;

    if (!namespace || namespace.trim() === '') {
      return 'Parameter "namespace" is required and must be non-empty.';
    }

    const validOperations = ['set', 'get', 'delete', 'list', 'append', 'merge', 'clear'];
    if (!validOperations.includes(operation)) {
      return `Invalid operation "${operation}". Valid operations: ${validOperations.join(', ')}`;
    }

    // Key is required for most operations
    if (['set', 'get', 'delete', 'append', 'merge'].includes(operation) && !params.key) {
      return `Parameter "key" is required for ${operation} operation.`;
    }

    // Value is required for set/append/merge
    if (['set', 'append', 'merge'].includes(operation) && params.value === undefined) {
      return `Parameter "value" is required for ${operation} operation.`;
    }

    return null;
  }

  protected createInvocation(params: StorageParams): StorageToolInvocation {
    return new StorageToolInvocation(params);
  }
}

// ============================================================================
// Plugin Definition
// ============================================================================

export function createStorageToolsPlugin() {
  return {
    metadata: {
      id: 'storage-tools',
      name: 'Storage Tools',
      version: '1.0.0',
      description: 'Universal storage for AI model to persist data between sessions',
      enabledByDefault: true,
    },
    toolFactories: [
      () => new StorageTool(),
    ],
  };
}

export default createStorageToolsPlugin;
