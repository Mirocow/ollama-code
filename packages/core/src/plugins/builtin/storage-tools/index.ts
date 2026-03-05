/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Model Storage Tool - универсальное хранилище для AI-модели.
 * Позволяет модели сохранять и извлекать структурированные данные:
 * - roadmap: планы развития и задачи (постоянное)
 * - session: временная память текущей сессии (очищается при выходе)
 * - knowledge: база знаний модели (постоянное)
 * - context: контекст текущей задачи (сессионное)
 * 
 * Режимы хранения:
 * - persistent: данные сохраняются в файлы между сессиями
 * - session: данные хранятся только в памяти текущей сессии
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
  ROADMAP: 'roadmap',       // Дорожная карта проекта (persistent)
  SESSION: 'session',       // Временная память сессии (session)
  KNOWLEDGE: 'knowledge',   // База знаний модели (persistent)
  CONTEXT: 'context',       // Контекст текущей задачи (session)
  LEARNING: 'learning',     // Обучение модели (persistent)
  METRICS: 'metrics',       // Метрики и статистика (persistent)
} as const;

// Namespace'ы с сессионным хранением по умолчанию
const SESSION_NAMESPACES = new Set(['session', 'context']);

export type StorageNamespace = typeof StorageNamespaces[keyof typeof StorageNamespaces];

// In-memory хранилище для сессионных данных
const sessionStorage: Map<string, Map<string, unknown>> = new Map();

// ID текущей сессии
let currentSessionId: string | null = null;

/**
 * Установить ID текущей сессии (вызывается при старте сессии)
 */
export function setSessionId(sessionId: string): void {
  currentSessionId = sessionId;
  debugLogger.info(`[StorageTool] Session ID set: ${sessionId}`);
}

/**
 * Получить ID текущей сессии
 */
export function getSessionId(): string | null {
  return currentSessionId;
}

/**
 * Очистить все сессионные данные (вызывается при завершении сессии)
 */
export function clearSessionStorage(): void {
  sessionStorage.clear();
  debugLogger.info('[StorageTool] Session storage cleared');
}

/**
 * Проверить, является ли namespace сессионным
 */
function isSessionNamespace(namespace: string): boolean {
  return SESSION_NAMESPACES.has(namespace.toLowerCase());
}

// JSON Schema для инструмента
const storageToolSchemaData: FunctionDeclaration = {
  name: 'model_storage',
  description: `Universal storage for AI model to persist structured data.

PERSISTENCE MODES:
- persistent: Data saved to files, survives between sessions (default for roadmap, knowledge, learning, metrics)
- session: Data kept in memory only, cleared when session ends (default for session, context)

NAMESPACES (predefined):
- roadmap: Project roadmap, milestones, future plans (persistent)
- session: Temporary session data (session-scoped)
- knowledge: Model's learned facts and patterns (persistent)
- context: Current task context and state (session-scoped)
- learning: Tool aliases and corrections (persistent)
- metrics: Statistics and performance data (persistent)

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
      persistent: {
        type: 'boolean',
        description: 'Storage mode: true = save to disk (default for roadmap/knowledge), false = memory only (default for session/context). Auto-detected based on namespace if not specified.',
      },
      scope: {
        type: 'string',
        enum: ['global', 'project'],
        description: 'Storage scope: global (shared across projects) or project (current project only). Default: global. Only applies to persistent storage.',
      },
    },
    required: ['operation', 'namespace'],
  },
};

const storageToolDescription = `
# Model Storage Tool

Universal key-value storage for AI model with two persistence modes.

## Persistence Modes

| Mode       | Storage     | Lifecycle            | Use For                    |
|------------|-------------|----------------------|----------------------------|
| persistent | Files       | Survives restarts    | roadmap, knowledge, learning|
| session    | Memory      | Cleared on exit      | temporary data, context    |

## Namespaces (Predefined)

| Namespace  | Purpose                              | Default Mode |
|------------|--------------------------------------|--------------|
| roadmap    | Project roadmap, milestones, plans   | persistent   |
| session    | Temporary session data               | session      |
| knowledge  | Learned facts, patterns, preferences | persistent   |
| context    | Current task context and state       | session      |
| learning   | Tool aliases, corrections            | persistent   |
| metrics    | Statistics, performance data         | persistent   |

## Operations

### set - Store a value
\`\`\`json
{ "operation": "set", "namespace": "roadmap", "key": "v1.0", "value": {"features": ["auth"]} }
\`\`\`

### get - Retrieve a value
\`\`\`json
{ "operation": "get", "namespace": "roadmap", "key": "v1.0" }
\`\`\`

### Session storage (cleared on exit)
\`\`\`json
{ "operation": "set", "namespace": "session", "key": "temp", "value": "temporary data" }
\`\`\`

### Force persistent storage
\`\`\`json
{ "operation": "set", "namespace": "custom", "key": "data", "value": "...", "persistent": true }
\`\`\`

## Scope (persistent storage only)

- **global**: \`~/.ollama-code/storage/\` (shared across all projects)
- **project**: \`<project>/.ollama-code/storage/\` (project-specific)
`;

// ============================================================================
// Интерфейсы параметров
// ============================================================================

interface StorageParams {
  operation: 'set' | 'get' | 'delete' | 'list' | 'append' | 'merge' | 'clear';
  namespace: string;
  key?: string;
  value?: unknown;
  persistent?: boolean;  // true = files, false = memory, undefined = auto-detect
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

// ============================================================================
// Session Storage (in-memory)
// ============================================================================

function getSessionNamespaceKey(namespace: string): string {
  return currentSessionId ? `${currentSessionId}:${namespace}` : namespace;
}

function getSessionData(namespace: string): Map<string, unknown> {
  const key = getSessionNamespaceKey(namespace);
  if (!sessionStorage.has(key)) {
    sessionStorage.set(key, new Map());
  }
  return sessionStorage.get(key)!;
}

function setSessionData(namespace: string, key: string, value: unknown): void {
  const nsData = getSessionData(namespace);
  nsData.set(key, value);
}

function getSessionValue(namespace: string, key: string): unknown | undefined {
  return getSessionData(namespace).get(key);
}

function deleteSessionValue(namespace: string, key: string): boolean {
  return getSessionData(namespace).delete(key);
}

function listSessionKeys(namespace: string): string[] {
  return Array.from(getSessionData(namespace).keys());
}

function clearSessionNamespace(namespace: string): void {
  const key = getSessionNamespaceKey(namespace);
  sessionStorage.delete(key);
}

// ============================================================================
// Persistent Storage (files)
// ============================================================================

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
// Универсальные операции (автоопределение режима)
// ============================================================================

function shouldUseSessionStorage(params: StorageParams): boolean {
  // Если persistent явно указан, используем его
  if (params.persistent !== undefined) {
    return !params.persistent;
  }
  // Иначе определяем по namespace
  return isSessionNamespace(params.namespace);
}

async function performSet(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, value, scope = 'global' } = params;
  
  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for set operation',
      returnDisplay: 'Error: key is required',
    };
  }
  
  const useSession = shouldUseSessionStorage(params);
  
  if (useSession) {
    // Session storage (in-memory)
    setSessionData(namespace, key, value);
    return {
      llmContent: `Stored ${key} in ${namespace} (session, cleared on exit)`,
      returnDisplay: `Stored (session): ${key}`,
    };
  } else {
    // Persistent storage (files)
    const data = await readNamespaceData(namespace, scope);
    data[key] = value;
    await writeNamespaceData(namespace, data, scope);
    
    return {
      llmContent: `Stored ${key} in ${namespace} (persistent, ${scope})`,
      returnDisplay: `Stored (persistent): ${key}`,
    };
  }
}

async function performGet(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, scope = 'global' } = params;
  
  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for get operation',
      returnDisplay: 'Error: key is required',
    };
  }
  
  const useSession = shouldUseSessionStorage(params);
  
  let value: unknown;
  
  if (useSession) {
    value = getSessionValue(namespace, key);
  } else {
    const data = await readNamespaceData(namespace, scope);
    value = data[key];
  }
  
  if (value === undefined) {
    const mode = useSession ? 'session' : `persistent/${scope}`;
    return {
      llmContent: `Key "${key}" not found in ${namespace} (${mode})`,
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
  
  const useSession = shouldUseSessionStorage(params);
  
  if (useSession) {
    const deleted = deleteSessionValue(namespace, key);
    if (!deleted) {
      return {
        llmContent: `Key "${key}" not found in ${namespace} (session)`,
        returnDisplay: `Key not found: ${key}`,
      };
    }
    return {
      llmContent: `Deleted ${key} from ${namespace} (session)`,
      returnDisplay: `Deleted: ${key}`,
    };
  } else {
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
}

async function performList(params: StorageParams): Promise<ToolResult> {
  const { namespace, scope = 'global' } = params;
  
  const useSession = shouldUseSessionStorage(params);
  
  let keys: string[];
  let mode: string;
  
  if (useSession) {
    keys = listSessionKeys(namespace);
    mode = 'session';
  } else {
    const data = await readNamespaceData(namespace, scope);
    keys = Object.keys(data);
    mode = `persistent/${scope}`;
  }
  
  if (keys.length === 0) {
    return {
      llmContent: `Namespace "${namespace}" (${mode}) is empty`,
      returnDisplay: `Empty namespace: ${namespace}`,
    };
  }
  
  return {
    llmContent: `Keys in ${namespace} (${mode}):\n${keys.map(k => `- ${k}`).join('\n')}`,
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
  
  const useSession = shouldUseSessionStorage(params);
  
  let existing: unknown;
  
  if (useSession) {
    existing = getSessionValue(namespace, key);
  } else {
    const data = await readNamespaceData(namespace, scope);
    existing = data[key];
  }
  
  let newArray: unknown[];
  
  if (existing === undefined) {
    newArray = [value];
  } else if (Array.isArray(existing)) {
    newArray = [...existing, value];
  } else {
    return {
      llmContent: `Error: Cannot append to non-array value at ${key}. Current type: ${typeof existing}`,
      returnDisplay: 'Error: value is not an array',
    };
  }
  
  if (useSession) {
    setSessionData(namespace, key, newArray);
  } else {
    const data = await readNamespaceData(namespace, scope);
    data[key] = newArray;
    await writeNamespaceData(namespace, data, scope);
  }
  
  const mode = useSession ? 'session' : `persistent/${scope}`;
  return {
    llmContent: `Appended to ${key} in ${namespace} (${mode}). Array now has ${newArray.length} items.`,
    returnDisplay: `Appended to: ${key} (${newArray.length} items)`,
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
  
  const useSession = shouldUseSessionStorage(params);
  
  let existing: unknown;
  
  if (useSession) {
    existing = getSessionValue(namespace, key);
  } else {
    const data = await readNamespaceData(namespace, scope);
    existing = data[key];
  }
  
  let newObject: Record<string, unknown>;
  
  if (existing === undefined) {
    newObject = value as Record<string, unknown>;
  } else if (typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
    newObject = { ...existing, ...value };
  } else {
    return {
      llmContent: `Error: Cannot merge into non-object value at ${key}. Current type: ${typeof existing}`,
      returnDisplay: 'Error: value is not an object',
    };
  }
  
  if (useSession) {
    setSessionData(namespace, key, newObject);
  } else {
    const data = await readNamespaceData(namespace, scope);
    data[key] = newObject;
    await writeNamespaceData(namespace, data, scope);
  }
  
  const mode = useSession ? 'session' : `persistent/${scope}`;
  return {
    llmContent: `Merged into ${key} in ${namespace} (${mode})`,
    returnDisplay: `Merged into: ${key}`,
  };
}

async function performClear(params: StorageParams): Promise<ToolResult> {
  const { namespace, scope = 'global' } = params;
  
  const useSession = shouldUseSessionStorage(params);
  
  if (useSession) {
    clearSessionNamespace(namespace);
    return {
      llmContent: `Cleared all data in ${namespace} (session)`,
      returnDisplay: `Cleared (session): ${namespace}`,
    };
  } else {
    await writeNamespaceData(namespace, {}, scope);
    return {
      llmContent: `Cleared all data in ${namespace} (${scope})`,
      returnDisplay: `Cleared: ${namespace}`,
    };
  }
}

// ============================================================================
// Invocation Class
// ============================================================================

class StorageToolInvocation extends BaseToolInvocation<StorageParams, ToolResult> {
  getDescription(): string {
    const { operation, namespace, key, scope = 'global' } = this.params;
    const useSession = shouldUseSessionStorage(this.params);
    const mode = useSession ? 'session' : `persistent/${scope}`;
    return `storage ${operation} ${namespace}${key ? `/${key}` : ''} (${mode})`;
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
