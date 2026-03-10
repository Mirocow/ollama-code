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
 *
 * Улучшения v0.17.3:
 * - Автоопределение корня проекта
 * - TTL (Time-To-Live) для данных
 * - Метаданные (createdAt, updatedAt, version, tags)
 * - Batch операции
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
import * as os from 'node:os';
import { Storage } from '../../../config/storage.js';
import { ToolErrorType } from '../../../tools/tool-error.js';
import { createDebugLogger } from '../../../utils/debugLogger.js';
import { uiTelemetryService } from '../../../services/uiTelemetryService.js';

const debugLogger = createDebugLogger('STORAGE_TOOL');

// ============================================================================
// Константы и типы
// ============================================================================

export const STORAGE_DIR = 'storage';
const PROJECT_ROOT_CACHE_TTL = 60000; // 1 minute cache for project root

// Предопределённые namespace'ы для разных типов данных
export const StorageNamespaces = {
  ROADMAP: 'roadmap', // Дорожная карта проекта (persistent)
  SESSION: 'session', // Временная память сессии (session)
  KNOWLEDGE: 'knowledge', // База знаний модели (persistent)
  CONTEXT: 'context', // Контекст текущей задачи (session)
  LEARNING: 'learning', // Обучение модели (persistent)
  METRICS: 'metrics', // Метрики и статистика (persistent)
} as const;

// Namespace'ы с сессионным хранением по умолчанию
const SESSION_NAMESPACES = new Set(['session', 'context']);

// Маркеры для определения корня проекта
const PROJECT_MARKERS = [
  '.git',
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'settings.gradle',
  'composer.json',
  '.ollama-code',
];

export type StorageNamespace =
  (typeof StorageNamespaces)[keyof typeof StorageNamespaces];

// Интерфейс метаданных записи
export interface StorageMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  ttl?: number; // TTL в секундах
  expiresAt?: string; // ISO дата истечения
  tags?: string[];
  source?: string; // Источник данных (session, user, system)
}

// Интерфейс записи с метаданными
export interface StorageEntry {
  value: unknown;
  metadata: StorageMetadata;
}

// Интерфейс информации о проекте
export interface ProjectInfo {
  id: string;
  name: string;
  root: string;
  type: 'node' | 'python' | 'go' | 'rust' | 'java' | 'php' | 'unknown';
}

// In-memory хранилище для сессионных данных (с метаданными)
const sessionStorage: Map<string, Map<string, StorageEntry>> = new Map();

// ID текущей сессии
let currentSessionId: string | null = null;

// Кэш корня проекта
let cachedProjectRoot: string | null = null;
let projectRootCacheTime = 0;

// Background TTL cleanup
const TTL_CLEANUP_INTERVAL = 60000; // 1 minute
let ttlCleanupInterval: ReturnType<typeof setInterval> | null = null;
let isCleanupRunning = false;

// ============================================================================
// Утилиты для определения проекта
// ============================================================================

/**
 * Найти корень проекта по маркерам
 */
async function findProjectRoot(
  startDir: string = process.cwd(),
): Promise<string> {
  // Проверяем кэш
  const now = Date.now();
  if (
    cachedProjectRoot &&
    now - projectRootCacheTime < PROJECT_ROOT_CACHE_TTL
  ) {
    return cachedProjectRoot;
  }

  let currentDir = startDir;
  const root = os.homedir();

  while (currentDir !== root && currentDir !== '/') {
    for (const marker of PROJECT_MARKERS) {
      const markerPath = path.join(currentDir, marker);
      try {
        await fs.access(markerPath);
        cachedProjectRoot = currentDir;
        projectRootCacheTime = now;
        debugLogger.info(
          `[StorageTool] Project root found: ${currentDir} (marker: ${marker})`,
        );
        return currentDir;
      } catch {
        // Marker not found, continue searching
      }
    }
    currentDir = path.dirname(currentDir);
  }

  // Если не нашли маркеры, используем cwd
  cachedProjectRoot = startDir;
  projectRootCacheTime = now;
  debugLogger.info(
    `[StorageTool] No project markers found, using cwd: ${startDir}`,
  );
  return startDir;
}

/**
 * Определить тип проекта
 */
async function detectProjectType(
  projectRoot: string,
): Promise<ProjectInfo['type']> {
  const typeMarkers: Array<{ file: string; type: ProjectInfo['type'] }> = [
    { file: 'package.json', type: 'node' },
    { file: 'pyproject.toml', type: 'python' },
    { file: 'requirements.txt', type: 'python' },
    { file: 'setup.py', type: 'python' },
    { file: 'go.mod', type: 'go' },
    { file: 'Cargo.toml', type: 'rust' },
    { file: 'pom.xml', type: 'java' },
    { file: 'build.gradle', type: 'java' },
    { file: 'composer.json', type: 'php' },
  ];

  for (const { file, type } of typeMarkers) {
    try {
      await fs.access(path.join(projectRoot, file));
      return type;
    } catch {
      // Continue checking
    }
  }
  return 'unknown';
}

/**
 * Получить информацию о проекте
 */
export async function getProjectInfo(): Promise<ProjectInfo> {
  const root = await findProjectRoot();
  const type = await detectProjectType(root);
  const name = path.basename(root);

  // Генерируем ID на основе пути (хеш)
  const id = Buffer.from(root)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .substring(0, 16);

  return { id, name, root, type };
}

/**
 * Очистить кэш корня проекта
 */
export function clearProjectRootCache(): void {
  cachedProjectRoot = null;
  projectRootCacheTime = 0;
  debugLogger.info('[StorageTool] Project root cache cleared');
}

// ============================================================================
// Управление сессией
// ============================================================================

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

// ============================================================================
// Метаданные
// ============================================================================

/**
 * Создать метаданные для новой записи
 */
function createMetadata(ttl?: number, tags?: string[]): StorageMetadata {
  const now = new Date().toISOString();
  const metadata: StorageMetadata = {
    createdAt: now,
    updatedAt: now,
    version: 1,
    source: currentSessionId ? 'session' : 'user',
  };

  if (ttl && ttl > 0) {
    metadata.ttl = ttl;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    metadata.expiresAt = expiresAt.toISOString();
  }

  if (tags && tags.length > 0) {
    metadata.tags = tags;
  }

  return metadata;
}

/**
 * Обновить метаданные при изменении
 */
function updateMetadata(
  existing: StorageMetadata,
  ttl?: number,
  tags?: string[],
): StorageMetadata {
  const updated: StorageMetadata = {
    ...existing,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  };

  if (ttl !== undefined) {
    if (ttl > 0) {
      updated.ttl = ttl;
      updated.expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    } else {
      delete updated.ttl;
      delete updated.expiresAt;
    }
  }

  if (tags !== undefined) {
    updated.tags = tags.length > 0 ? tags : undefined;
  }

  return updated;
}

/**
 * Проверить, истёк ли TTL записи
 */
function isExpired(entry: StorageEntry): boolean {
  if (!entry?.metadata?.expiresAt) {
    return false;
  }
  try {
    return new Date(entry.metadata.expiresAt) < new Date();
  } catch {
    return false;
  }
}

/**
 * Конвертировать старый формат данных (без метаданных) в новый
 */
function ensureStorageEntry(value: unknown): StorageEntry {
  if (
    value &&
    typeof value === 'object' &&
    'value' in value &&
    'metadata' in value
  ) {
    // Already in new format
    return value as StorageEntry;
  }
  // Old format - wrap with metadata
  return {
    value,
    metadata: createMetadata(),
  };
}

// ============================================================================
// JSON Schema
// ============================================================================

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
- learning: Tool aliases, corrections (persistent)
- metrics: Statistics, performance data (persistent)

OPERATIONS:
- set: Store a value (overwrites existing)
- get: Retrieve a value by key
- delete: Remove a key
- list: List all keys in namespace
- append: Add item to array
- merge: Merge object with existing data
- clear: Clear all data in namespace
- exists: Check if key exists
- stats: Get storage statistics
- batch: Execute multiple operations atomically

FEATURES:
- TTL (Time-To-Live): Auto-expire data after specified seconds
- Tags: Categorize entries for filtering
- Metadata: Track createdAt, updatedAt, version
- Batch: Execute multiple operations in one call`,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: [
          'set',
          'get',
          'delete',
          'list',
          'append',
          'merge',
          'clear',
          'exists',
          'stats',
          'batch',
          'backup',
          'restore',
        ],
        description: 'Operation to perform on storage',
      },
      namespace: {
        type: 'string',
        description:
          'Storage namespace (roadmap, session, knowledge, context, learning, metrics) or custom name',
      },
      key: {
        type: 'string',
        description:
          'Key to store/retrieve (optional for list/clear operations)',
      },
      value: {
        description:
          'Value to store (any JSON-serializable type: string, number, object, array, boolean)',
      },
      persistent: {
        type: 'boolean',
        description:
          'Storage mode: true = save to disk, false = memory only. Auto-detected based on namespace if not specified.',
      },
      scope: {
        type: 'string',
        enum: ['global', 'project'],
        description:
          'Storage scope: global (shared across projects) or project (current project only). Default: global.',
      },
      ttl: {
        type: 'number',
        description:
          'Time-To-Live in seconds. Entry will auto-expire after this time.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorizing the entry',
      },
      includeMetadata: {
        type: 'boolean',
        description: 'Include metadata in get/list results (default: false)',
      },
      actions: {
        type: 'array',
        description: 'Array of actions for batch operation',
        items: {
          type: 'object',
          properties: {
            operation: { type: 'string' },
            namespace: { type: 'string' },
            key: { type: 'string' },
            value: {},
            ttl: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    required: ['operation', 'namespace'],
  },
};

const storageToolDescription = `
# Model Storage Tool

Universal key-value storage for AI model with persistence, TTL, and metadata support.

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

### set with TTL (expires in 1 hour)
\`\`\`json
{ "operation": "set", "namespace": "session", "key": "temp", "value": "data", "ttl": 3600 }
\`\`\`

### set with tags
\`\`\`json
{ "operation": "set", "namespace": "knowledge", "key": "pattern", "value": "...", "tags": ["important", "auth"] }
\`\`\`

### get - Retrieve a value
\`\`\`json
{ "operation": "get", "namespace": "roadmap", "key": "v1.0" }
\`\`\`

### get with metadata
\`\`\`json
{ "operation": "get", "namespace": "roadmap", "key": "v1.0", "includeMetadata": true }
\`\`\`

### exists - Check if key exists
\`\`\`json
{ "operation": "exists", "namespace": "roadmap", "key": "v1.0" }
\`\`\`

### stats - Get storage statistics
\`\`\`json
{ "operation": "stats", "namespace": "roadmap" }
\`\`\`

### batch - Multiple operations
\`\`\`json
{
  "operation": "batch",
  "namespace": "roadmap",
  "actions": [
    { "operation": "set", "key": "a", "value": 1 },
    { "operation": "set", "key": "b", "value": 2 },
    { "operation": "delete", "key": "c" }
  ]
}
\`\`\`

## Scope (persistent storage only)

- **global**: \`~/.ollama-code/storage/\` (shared across all projects)
- **project**: \`<project>/.ollama-code/storage/\` (auto-detected project root)
`;

// ============================================================================
// Интерфейсы параметров
// ============================================================================

interface StorageParams {
  operation:
    | 'set'
    | 'get'
    | 'delete'
    | 'list'
    | 'append'
    | 'merge'
    | 'clear'
    | 'exists'
    | 'stats'
    | 'batch'
    | 'backup'
    | 'restore';
  namespace: string;
  key?: string;
  value?: unknown;
  persistent?: boolean;
  scope?: 'global' | 'project';
  ttl?: number;
  tags?: string[];
  includeMetadata?: boolean;
  actions?: Array<{
    operation: string;
    namespace?: string;
    key?: string;
    value?: unknown;
    ttl?: number;
    tags?: string[];
  }>;
}

// ============================================================================
// Утилиты для работы с файлами
// ============================================================================

async function getStorageDir(
  scope: 'global' | 'project' = 'global',
): Promise<string> {
  if (scope === 'global') {
    return path.join(Storage.getGlobalOllamaDir(), STORAGE_DIR);
  }
  const projectRoot = await findProjectRoot();
  return path.join(projectRoot, '.ollama-code', STORAGE_DIR);
}

async function getNamespaceFilePath(
  namespace: string,
  scope: 'global' | 'project' = 'global',
): Promise<string> {
  return path.join(await getStorageDir(scope), `${namespace}.json`);
}

async function ensureStorageDir(scope: 'global' | 'project'): Promise<string> {
  const dir = await getStorageDir(scope);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// ============================================================================
// Session Storage (in-memory with metadata)
// ============================================================================

function getSessionNamespaceKey(namespace: string): string {
  return currentSessionId ? `${currentSessionId}:${namespace}` : namespace;
}

function getSessionData(namespace: string): Map<string, StorageEntry> {
  const key = getSessionNamespaceKey(namespace);
  if (!sessionStorage.has(key)) {
    sessionStorage.set(key, new Map());
  }
  return sessionStorage.get(key)!;
}

function setSessionEntry(
  namespace: string,
  key: string,
  entry: StorageEntry,
): void {
  const nsData = getSessionData(namespace);
  nsData.set(key, entry);
}

function getSessionEntry(
  namespace: string,
  key: string,
): StorageEntry | undefined {
  return getSessionData(namespace).get(key);
}

function deleteSessionEntry(namespace: string, key: string): boolean {
  return getSessionData(namespace).delete(key);
}

function clearSessionNamespace(namespace: string): void {
  const key = getSessionNamespaceKey(namespace);
  sessionStorage.delete(key);
}

function getSessionEntries(namespace: string): Map<string, StorageEntry> {
  return getSessionData(namespace);
}

// ============================================================================
// Persistent Storage (files with metadata)
// ============================================================================

async function readNamespaceData(
  namespace: string,
  scope: 'global' | 'project',
): Promise<Record<string, StorageEntry>> {
  const filePath = await getNamespaceFilePath(namespace, scope);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Проверяем и удаляем истёкшие записи, конвертируем старый формат
    const validData: Record<string, StorageEntry> = {};
    let hasChanges = false;

    for (const [key, rawEntry] of Object.entries(data)) {
      // Конвертируем старый формат в новый
      const storageEntry = ensureStorageEntry(rawEntry);

      if (!isExpired(storageEntry)) {
        validData[key] = storageEntry;
        // Если запись была сконвертирована из старого формата
        if (storageEntry !== rawEntry) {
          hasChanges = true;
        }
      } else {
        hasChanges = true;
        debugLogger.info(`[StorageTool] Expired entry removed: ${key}`);
      }
    }

    // Если были изменения (конвертация или удаление истёкших), перезаписываем файл
    if (hasChanges) {
      await writeNamespaceData(namespace, validData, scope);
    }

    return validData;
  } catch (err) {
    const error = err as Error & { code?: string };
    if (error.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

async function writeNamespaceData(
  namespace: string,
  data: Record<string, StorageEntry>,
  scope: 'global' | 'project',
): Promise<void> {
  await ensureStorageDir(scope);
  const filePath = await getNamespaceFilePath(namespace, scope);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// Универсальные операции
// ============================================================================

function shouldUseSessionStorage(params: StorageParams): boolean {
  if (params.persistent !== undefined) {
    return !params.persistent;
  }
  return isSessionNamespace(params.namespace);
}

// ============================================================================
// Background TTL Cleanup Service
// ============================================================================

/**
 * Очистка истёкших TTL записей (session + persistent storage)
 */
export async function cleanupExpiredEntries(): Promise<{
  session: number;
  persistent: number;
}> {
  let sessionCleaned = 0;
  let persistentCleaned = 0;

  // Очистка session storage
  for (const [, nsData] of sessionStorage.entries()) {
    for (const [key, entry] of nsData.entries()) {
      if (isExpired(entry)) {
        nsData.delete(key);
        sessionCleaned++;
        debugLogger.info(`[TTL] Cleaned session entry: ${key}`);
      }
    }
  }

  // Очистка persistent storage - сканируем все namespace файлы
  try {
    const globalStorageDir = path.join(
      Storage.getGlobalOllamaDir(),
      STORAGE_DIR,
    );
    const projectStorageDir = path.join(
      await findProjectRoot(),
      '.ollama-code',
      STORAGE_DIR,
    );

    for (const storageDir of [globalStorageDir, projectStorageDir]) {
      const files = await fs.readdir(storageDir).catch(() => [] as string[]);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(storageDir, file);

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          const validData: Record<string, StorageEntry> = {};
          let hasExpired = false;

          for (const [key, rawEntry] of Object.entries(data)) {
            const entry = ensureStorageEntry(rawEntry);
            if (isExpired(entry)) {
              persistentCleaned++;
              hasExpired = true;
              debugLogger.info(
                `[TTL] Cleaned persistent entry: ${file.replace('.json', '')}:${key}`,
              );
            } else {
              validData[key] = entry;
            }
          }

          if (hasExpired) {
            await fs.writeFile(
              filePath,
              JSON.stringify(validData, null, 2),
              'utf-8',
            );
          }
        } catch {
          // Ignore errors reading individual files
        }
      }
    }
  } catch {
    // Storage directory doesn't exist yet
  }

  if (sessionCleaned > 0 || persistentCleaned > 0) {
    debugLogger.info(
      `[TTL] Cleanup completed: ${sessionCleaned} session, ${persistentCleaned} persistent`,
    );
  }

  return { session: sessionCleaned, persistent: persistentCleaned };
}

/**
 * Запуск периодической очистки TTL записей
 */
export function startTTLBackgroundCleanup(): void {
  if (ttlCleanupInterval) {
    debugLogger.info('[TTL] Background cleanup already running');
    return;
  }

  debugLogger.info('[TTL] Starting background cleanup service');

  // Начальная очистка при старте
  cleanupExpiredEntries().catch((err) => {
    debugLogger.error('[TTL] Initial cleanup failed:', err);
  });

  // Периодическая очистка
  ttlCleanupInterval = setInterval(async () => {
    if (isCleanupRunning) return;
    isCleanupRunning = true;

    try {
      await cleanupExpiredEntries();
    } catch (err) {
      debugLogger.error('[TTL] Cleanup error:', err);
    } finally {
      isCleanupRunning = false;
    }
  }, TTL_CLEANUP_INTERVAL);

  // Не блокируем завершение процесса
  if (ttlCleanupInterval.unref) {
    ttlCleanupInterval.unref();
  }
}

/**
 * Остановка периодической очистки
 */
export function stopTTLBackgroundCleanup(): void {
  if (ttlCleanupInterval) {
    clearInterval(ttlCleanupInterval);
    ttlCleanupInterval = null;
    debugLogger.info('[TTL] Background cleanup stopped');
  }
}

/**
 * Проверка, запущен ли cleanup сервис
 */
export function isTTLBackgroundCleanupRunning(): boolean {
  return ttlCleanupInterval !== null;
}

// ============================================================================
// Операции
// ============================================================================

async function performSet(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, value, scope = 'global', ttl, tags } = params;

  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for set operation',
      returnDisplay: 'Error: key is required',
    };
  }

  const useSession = shouldUseSessionStorage(params);

  if (useSession) {
    const existing = getSessionEntry(namespace, key);
    const metadata = existing
      ? updateMetadata(existing.metadata, ttl, tags)
      : createMetadata(ttl, tags);

    setSessionEntry(namespace, key, { value, metadata });

    // Record telemetry with session prefix for consistency with initializeStorageMetrics
    uiTelemetryService.recordStorageOperation(
      `session:${getSessionNamespaceKey(namespace)}:${key}`,
      JSON.stringify(value).length,
    );

    const ttlInfo = ttl ? ` (TTL: ${ttl}s)` : '';
    return {
      llmContent: `Stored ${key} in ${namespace} (session${ttlInfo})`,
      returnDisplay: `Stored (session): ${key}`,
    };
  } else {
    const data = await readNamespaceData(namespace, scope);
    const existing = data[key];
    const metadata = existing
      ? updateMetadata(existing.metadata, ttl, tags)
      : createMetadata(ttl, tags);

    data[key] = { value, metadata };
    await writeNamespaceData(namespace, data, scope);

    // Record telemetry with scope prefix for consistency with initializeStorageMetrics
    uiTelemetryService.recordStorageOperation(
      `${scope}:${namespace}:${key}`,
      JSON.stringify(value).length,
    );

    const ttlInfo = ttl ? ` (TTL: ${ttl}s)` : '';
    return {
      llmContent: `Stored ${key} in ${namespace} (persistent/${scope}${ttlInfo})`,
      returnDisplay: `Stored (persistent): ${key}`,
    };
  }
}

async function performGet(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, scope = 'global', includeMetadata = false } = params;

  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for get operation',
      returnDisplay: 'Error: key is required',
    };
  }

  const useSession = shouldUseSessionStorage(params);

  let entry: StorageEntry | undefined;

  if (useSession) {
    entry = getSessionEntry(namespace, key);
  } else {
    const data = await readNamespaceData(namespace, scope);
    entry = data[key];
  }

  if (!entry || isExpired(entry)) {
    const mode = useSession ? 'session' : `persistent/${scope}`;
    return {
      llmContent: `Key "${key}" not found in ${namespace} (${mode})`,
      returnDisplay: `Key not found: ${key}`,
    };
  }

  if (includeMetadata) {
    return {
      llmContent: JSON.stringify(
        { value: entry.value, metadata: entry.metadata },
        null,
        2,
      ),
      returnDisplay: `Retrieved with metadata: ${key}`,
    };
  }

  return {
    llmContent: JSON.stringify(entry.value, null, 2),
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
    const deleted = deleteSessionEntry(namespace, key);
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

    if (!data[key]) {
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
  const { namespace, scope = 'global', includeMetadata = false } = params;

  const useSession = shouldUseSessionStorage(params);

  let entries: Array<{ key: string; entry: StorageEntry }>;
  let mode: string;

  if (useSession) {
    const nsData = getSessionEntries(namespace);
    entries = Array.from(nsData.entries()).map(([key, entry]) => ({
      key,
      entry,
    }));
    mode = 'session';
  } else {
    const data = await readNamespaceData(namespace, scope);
    entries = Object.entries(data).map(([key, entry]) => ({ key, entry }));
    mode = `persistent/${scope}`;
  }

  // Фильтруем истёкшие
  entries = entries.filter(({ entry }) => !isExpired(entry));

  if (entries.length === 0) {
    return {
      llmContent: `Namespace "${namespace}" (${mode}) is empty`,
      returnDisplay: `Empty namespace: ${namespace}`,
    };
  }

  if (includeMetadata) {
    const details = entries
      .map(({ key, entry }) => {
        const meta = entry.metadata;
        const ttlInfo = meta.ttl ? ` [TTL: ${meta.ttl}s]` : '';
        const tagsInfo = meta.tags ? ` [tags: ${meta.tags.join(', ')}]` : '';
        return `- ${key}${ttlInfo}${tagsInfo} (v${meta.version})`;
      })
      .join('\n');

    return {
      llmContent: `Keys in ${namespace} (${mode}):\n${details}`,
      returnDisplay: `${entries.length} keys`,
    };
  }

  const keys = entries.map(({ key }) => key);
  return {
    llmContent: `Keys in ${namespace} (${mode}):\n${keys.map((k) => `- ${k}`).join('\n')}`,
    returnDisplay: `${keys.length} keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`,
  };
}

async function performAppend(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, value, scope = 'global', ttl, tags } = params;

  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for append operation',
      returnDisplay: 'Error: key is required',
    };
  }

  const useSession = shouldUseSessionStorage(params);

  let entry: StorageEntry | undefined;

  if (useSession) {
    entry = getSessionEntry(namespace, key);
  } else {
    const data = await readNamespaceData(namespace, scope);
    entry = data[key];
  }

  let newArray: unknown[];
  let metadata: StorageMetadata;

  if (!entry || isExpired(entry)) {
    newArray = [value];
    metadata = createMetadata(ttl, tags);
  } else if (Array.isArray(entry.value)) {
    newArray = [...entry.value, value];
    metadata = updateMetadata(entry.metadata, ttl, tags);
  } else {
    return {
      llmContent: `Error: Cannot append to non-array value at ${key}. Current type: ${typeof entry.value}`,
      returnDisplay: 'Error: value is not an array',
    };
  }

  if (useSession) {
    setSessionEntry(namespace, key, { value: newArray, metadata });
  } else {
    const data = await readNamespaceData(namespace, scope);
    data[key] = { value: newArray, metadata };
    await writeNamespaceData(namespace, data, scope);
  }

  const mode = useSession ? 'session' : `persistent/${scope}`;
  return {
    llmContent: `Appended to ${key} in ${namespace} (${mode}). Array now has ${newArray.length} items.`,
    returnDisplay: `Appended to: ${key} (${newArray.length} items)`,
  };
}

async function performMerge(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, value, scope = 'global', ttl, tags } = params;

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

  let entry: StorageEntry | undefined;

  if (useSession) {
    entry = getSessionEntry(namespace, key);
  } else {
    const data = await readNamespaceData(namespace, scope);
    entry = data[key];
  }

  let newObject: Record<string, unknown>;
  let metadata: StorageMetadata;

  if (!entry || isExpired(entry)) {
    newObject = value as Record<string, unknown>;
    metadata = createMetadata(ttl, tags);
  } else if (
    typeof entry.value === 'object' &&
    entry.value !== null &&
    !Array.isArray(entry.value)
  ) {
    newObject = { ...entry.value, ...value };
    metadata = updateMetadata(entry.metadata, ttl, tags);
  } else {
    return {
      llmContent: `Error: Cannot merge into non-object value at ${key}. Current type: ${typeof entry.value}`,
      returnDisplay: 'Error: value is not an object',
    };
  }

  if (useSession) {
    setSessionEntry(namespace, key, { value: newObject, metadata });
  } else {
    const data = await readNamespaceData(namespace, scope);
    data[key] = { value: newObject, metadata };
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

async function performExists(params: StorageParams): Promise<ToolResult> {
  const { namespace, key, scope = 'global' } = params;

  if (!key) {
    return {
      llmContent: 'Error: "key" parameter is required for exists operation',
      returnDisplay: 'Error: key is required',
    };
  }

  const useSession = shouldUseSessionStorage(params);

  let entry: StorageEntry | undefined;

  if (useSession) {
    entry = getSessionEntry(namespace, key);
  } else {
    const data = await readNamespaceData(namespace, scope);
    entry = data[key];
  }

  const exists = entry && !isExpired(entry);
  const mode = useSession ? 'session' : `persistent/${scope}`;

  return {
    llmContent: `Key "${key}" ${exists ? 'exists' : 'does not exist'} in ${namespace} (${mode})`,
    returnDisplay: exists ? `Exists: ${key}` : `Not found: ${key}`,
  };
}

async function performStats(params: StorageParams): Promise<ToolResult> {
  const { namespace, scope = 'global' } = params;

  const useSession = shouldUseSessionStorage(params);
  const mode = useSession ? 'session' : `persistent/${scope}`;

  let totalKeys = 0;
  let totalSize = 0;
  let expiredKeys = 0;
  const tags: Set<string> = new Set();
  let oldestEntry: { key: string; date: string } | null = null;
  let newestEntry: { key: string; date: string } | null = null;

  if (useSession) {
    const nsData = getSessionEntries(namespace);
    for (const [key, entry] of nsData.entries()) {
      if (isExpired(entry)) {
        expiredKeys++;
        continue;
      }
      totalKeys++;
      totalSize += JSON.stringify(entry.value).length;
      if (entry.metadata.tags) {
        entry.metadata.tags.forEach((t) => tags.add(t));
      }
      if (!oldestEntry || entry.metadata.createdAt < oldestEntry.date) {
        oldestEntry = { key, date: entry.metadata.createdAt };
      }
      if (!newestEntry || entry.metadata.createdAt > newestEntry.date) {
        newestEntry = { key, date: entry.metadata.createdAt };
      }
    }
  } else {
    const data = await readNamespaceData(namespace, scope);
    for (const [key, entry] of Object.entries(data)) {
      if (isExpired(entry)) {
        expiredKeys++;
        continue;
      }
      totalKeys++;
      totalSize += JSON.stringify(entry.value).length;
      if (entry.metadata.tags) {
        entry.metadata.tags.forEach((t) => tags.add(t));
      }
      if (!oldestEntry || entry.metadata.createdAt < oldestEntry.date) {
        oldestEntry = { key, date: entry.metadata.createdAt };
      }
      if (!newestEntry || entry.metadata.createdAt > newestEntry.date) {
        newestEntry = { key, date: entry.metadata.createdAt };
      }
    }
  }

  const stats = {
    namespace,
    mode,
    keys: {
      total: totalKeys,
      expired: expiredKeys,
    },
    size: {
      bytes: totalSize,
      formatted:
        totalSize < 1024
          ? `${totalSize} B`
          : `${(totalSize / 1024).toFixed(2)} KB`,
    },
    tags: Array.from(tags),
    oldest: oldestEntry,
    newest: newestEntry,
  };

  // Update telemetry with current storage stats
  uiTelemetryService.updateStorageMetrics({
    recordCount: totalKeys,
    totalSize,
  });

  return {
    llmContent: JSON.stringify(stats, null, 2),
    returnDisplay: `Stats: ${totalKeys} keys, ${stats.size.formatted}`,
  };
}

async function performBatch(params: StorageParams): Promise<ToolResult> {
  const { actions, scope = 'global' } = params;

  if (!actions || actions.length === 0) {
    return {
      llmContent: 'Error: "actions" parameter is required for batch operation',
      returnDisplay: 'Error: actions required',
    };
  }

  const results: Array<{
    operation: string;
    key?: string;
    success: boolean;
    message: string;
  }> = [];

  for (const action of actions) {
    const actionParams: StorageParams = {
      operation: action.operation as StorageParams['operation'],
      namespace: action.namespace || params.namespace,
      key: action.key,
      value: action.value,
      scope,
      ttl: action.ttl,
      tags: action.tags,
    };

    try {
      switch (action.operation) {
        case 'set':
          await performSet(actionParams);
          results.push({
            operation: 'set',
            key: action.key,
            success: true,
            message: 'Stored',
          });
          break;
        case 'delete':
          await performDelete(actionParams);
          results.push({
            operation: 'delete',
            key: action.key,
            success: true,
            message: 'Deleted',
          });
          break;
        case 'append':
          await performAppend(actionParams);
          results.push({
            operation: 'append',
            key: action.key,
            success: true,
            message: 'Appended',
          });
          break;
        case 'merge':
          await performMerge(actionParams);
          results.push({
            operation: 'merge',
            key: action.key,
            success: true,
            message: 'Merged',
          });
          break;
        default:
          results.push({
            operation: action.operation,
            key: action.key,
            success: false,
            message: 'Unknown operation',
          });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.push({
        operation: action.operation,
        key: action.key,
        success: false,
        message: errorMessage,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return {
    llmContent: `Batch completed: ${successCount} succeeded, ${failCount} failed\n${JSON.stringify(results, null, 2)}`,
    returnDisplay: `Batch: ${successCount}/${results.length} succeeded`,
  };
}

// ============================================================================
// Backup & Restore Operations
// ============================================================================

/**
 * Создать backup всего storage
 */
async function performBackup(params: StorageParams): Promise<ToolResult> {
  const { scope = 'global' } = params;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.json`;

  try {
    const storageDir = await getStorageDir(scope);
    const backupDir = path.join(storageDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const backupData: {
      timestamp: string;
      scope: string;
      namespaces: Record<string, Record<string, StorageEntry>>;
    } = {
      timestamp: new Date().toISOString(),
      scope,
      namespaces: {},
    };

    // Читаем все namespace файлы
    const files = await fs.readdir(storageDir).catch(() => [] as string[]);

    for (const file of files) {
      if (!file.endsWith('.json') || file.startsWith('backup-')) continue;

      const namespace = file.replace('.json', '');
      const filePath = path.join(storageDir, file);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        // Фильтруем истёкшие записи
        const validData: Record<string, StorageEntry> = {};
        for (const [key, rawEntry] of Object.entries(data)) {
          const entry = ensureStorageEntry(rawEntry);
          if (!isExpired(entry)) {
            validData[key] = entry;
          }
        }

        if (Object.keys(validData).length > 0) {
          backupData.namespaces[namespace] = validData;
        }
      } catch {
        // Ignore errors reading individual files
      }
    }

    // Добавляем session storage если есть
    if (sessionStorage.size > 0) {
      backupData.namespaces['__session__'] = {};
      for (const [nsKey, nsData] of sessionStorage.entries()) {
        const validEntries: Record<string, StorageEntry> = {};
        for (const [key, entry] of nsData.entries()) {
          if (!isExpired(entry)) {
            validEntries[key] = entry;
          }
        }
        if (Object.keys(validEntries).length > 0) {
          backupData.namespaces['__session__'][nsKey] = {
            value: validEntries,
            metadata: createMetadata(),
          } as StorageEntry;
        }
      }
    }

    const backupPath = path.join(backupDir, backupFileName);
    await fs.writeFile(
      backupPath,
      JSON.stringify(backupData, null, 2),
      'utf-8',
    );

    const namespaceCount = Object.keys(backupData.namespaces).length;
    const totalKeys = Object.values(backupData.namespaces).reduce(
      (sum, ns) => sum + Object.keys(ns).length,
      0,
    );

    return {
      llmContent: `Backup created successfully:\n- File: ${backupPath}\n- Namespaces: ${namespaceCount}\n- Total keys: ${totalKeys}\n- Timestamp: ${backupData.timestamp}`,
      returnDisplay: `Backup: ${backupFileName} (${totalKeys} keys)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      llmContent: `Backup failed: ${errorMessage}`,
      returnDisplay: `Backup failed`,
      error: {
        message: errorMessage,
        type: ToolErrorType.EXECUTION_FAILED,
      },
    };
  }
}

/**
 * Восстановить storage из backup
 */
async function performRestore(params: StorageParams): Promise<ToolResult> {
  const { scope = 'global', key: backupFileName } = params;

  if (!backupFileName) {
    // Показать список доступных backup'ов
    try {
      const storageDir = await getStorageDir(scope);
      const backupDir = path.join(storageDir, 'backups');
      const files = await fs.readdir(backupDir).catch(() => [] as string[]);

      const backups = files
        .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 10);

      if (backups.length === 0) {
        return {
          llmContent:
            'No backups found.\n\nTo create a backup, use:\n{ "operation": "backup" }',
          returnDisplay: 'No backups found',
        };
      }

      const backupList = await Promise.all(
        backups.map(async (f) => {
          try {
            const content = await fs.readFile(path.join(backupDir, f), 'utf-8');
            const data = JSON.parse(content);
            const nsCount = Object.keys(data.namespaces || {}).length;
            const keyCount = Object.values(data.namespaces || {}).reduce(
              (sum: number, ns: unknown) =>
                sum + Object.keys(ns as object).length,
              0,
            );
            return `- ${f} (${nsCount} namespaces, ${keyCount} keys, ${data.timestamp || 'unknown date'})`;
          } catch {
            return `- ${f} (error reading backup)`;
          }
        }),
      );

      return {
        llmContent: `Available backups:\n${backupList.join('\n')}\n\nTo restore, use:\n{ "operation": "restore", "key": "backup-filename.json" }`,
        returnDisplay: `${backups.length} backups available`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error listing backups: ${errorMessage}`,
        returnDisplay: 'Error listing backups',
      };
    }
  }

  try {
    const storageDir = await getStorageDir(scope);
    const backupPath = path.join(storageDir, 'backups', backupFileName);

    const content = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(content);

    let restoredNamespaces = 0;
    let restoredKeys = 0;

    // Восстанавливаем namespaces
    for (const [namespace, data] of Object.entries(
      backupData.namespaces || {},
    )) {
      if (namespace === '__session__') {
        // Восстанавливаем session storage
        const sessionData = data as Record<string, StorageEntry>;
        for (const [nsKey, entry] of Object.entries(sessionData)) {
          if (entry.value && typeof entry.value === 'object') {
            const nsEntries = entry.value as Record<string, StorageEntry>;
            for (const [key, val] of Object.entries(nsEntries)) {
              if (!isExpired(val)) {
                const ns = nsKey.split(':')[1] || nsKey;
                setSessionEntry(ns, key, val);
                restoredKeys++;
              }
            }
          }
        }
      } else {
        // Восстанавливаем persistent storage
        const nsData = data as Record<string, StorageEntry>;
        const validData: Record<string, StorageEntry> = {};

        for (const [key, entry] of Object.entries(nsData)) {
          if (!isExpired(entry)) {
            validData[key] = entry;
            restoredKeys++;
          }
        }

        if (Object.keys(validData).length > 0) {
          await writeNamespaceData(namespace, validData, scope);
          restoredNamespaces++;
        }
      }
    }

    return {
      llmContent: `Restore completed successfully:\n- Backup: ${backupFileName}\n- Namespaces restored: ${restoredNamespaces}\n- Keys restored: ${restoredKeys}\n- Original timestamp: ${backupData.timestamp || 'unknown'}`,
      returnDisplay: `Restored: ${restoredKeys} keys from ${backupFileName}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      llmContent: `Restore failed: ${errorMessage}\n\nTo list available backups, use:\n{ "operation": "restore" }`,
      returnDisplay: `Restore failed`,
      error: {
        message: errorMessage,
        type: ToolErrorType.EXECUTION_FAILED,
      },
    };
  }
}

// ============================================================================
// Invocation Class
// ============================================================================

class StorageToolInvocation extends BaseToolInvocation<
  StorageParams,
  ToolResult
> {
  getDescription(): string {
    const { operation, namespace, key, scope = 'global' } = this.params;
    const useSession = shouldUseSessionStorage(this.params);
    const mode = useSession ? 'session' : `persistent/${scope}`;
    return `storage ${operation} ${namespace}${key ? `/${key}` : ''} (${mode})`;
  }

  override async shouldConfirmExecute(
    _abortSignal: AbortSignal,
  ): Promise<false> {
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
        case 'exists':
          return await performExists(this.params);
        case 'stats':
          return await performStats(this.params);
        case 'batch':
          return await performBatch(this.params);
        case 'backup':
          return await performBackup(this.params);
        case 'restore':
          return await performRestore(this.params);
        default:
          return {
            llmContent: `Error: Unknown operation "${operation}"`,
            returnDisplay: `Error: unknown operation`,
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugLogger.error(
        `[StorageTool] Error executing ${operation}:`,
        errorMessage,
      );

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

export class StorageTool extends BaseDeclarativeTool<
  StorageParams,
  ToolResult
> {
  static readonly Name: string = 'model_storage';

  constructor() {
    super(
      StorageTool.Name,
      'ModelStorage',
      storageToolDescription,
      Kind.Think,
      storageToolSchemaData.parametersJsonSchema as Record<string, unknown>,
    );
  }

  protected override validateToolParamValues(
    params: StorageParams,
  ): string | null {
    const { operation, namespace } = params;

    if (!namespace || namespace.trim() === '') {
      return 'Parameter "namespace" is required and must be non-empty.';
    }

    const validOperations = [
      'set',
      'get',
      'delete',
      'list',
      'append',
      'merge',
      'clear',
      'exists',
      'stats',
      'batch',
    ];
    if (!validOperations.includes(operation)) {
      return `Invalid operation "${operation}". Valid operations: ${validOperations.join(', ')}`;
    }

    // Key is required for most operations
    if (
      ['set', 'get', 'delete', 'append', 'merge', 'exists'].includes(
        operation,
      ) &&
      !params.key
    ) {
      return `Parameter "key" is required for ${operation} operation.`;
    }

    // Value is required for set/append/merge
    if (
      ['set', 'append', 'merge'].includes(operation) &&
      params.value === undefined
    ) {
      return `Parameter "value" is required for ${operation} operation.`;
    }

    // Actions is required for batch
    if (
      operation === 'batch' &&
      (!params.actions || params.actions.length === 0)
    ) {
      return 'Parameter "actions" is required for batch operation.';
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

import type { PluginDefinition } from '../../types.js';

/**
 * Initialize storage metrics on plugin load
 * Scans storage directory and counts existing records
 */
async function initializeStorageMetrics(): Promise<void> {
  try {
    let totalKeys = 0;
    let totalSize = 0;
    const keys: string[] = [];

    // Scan global storage
    const globalStorageDir = path.join(
      Storage.getGlobalOllamaDir(),
      STORAGE_DIR,
    );

    try {
      const files = await fs.readdir(globalStorageDir);

      for (const file of files) {
        if (!file.endsWith('.json') || file === 'backups') continue;

        const filePath = path.join(globalStorageDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          const namespace = file.replace('.json', '');

          for (const key of Object.keys(data)) {
            totalKeys++;
            keys.push(`global:${namespace}:${key}`);
            totalSize += JSON.stringify(data[key]).length;
          }
        } catch {
          // Ignore errors reading individual files
        }
      }
    } catch {
      // Global storage directory doesn't exist yet
    }

    // Scan project storage
    try {
      const projectRoot = await findProjectRoot();
      const projectStorageDir = path.join(
        projectRoot,
        '.ollama-code',
        STORAGE_DIR,
      );
      const files = await fs.readdir(projectStorageDir);

      for (const file of files) {
        if (!file.endsWith('.json') || file === 'backups') continue;

        const filePath = path.join(projectStorageDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          const namespace = file.replace('.json', '');

          for (const key of Object.keys(data)) {
            totalKeys++;
            keys.push(`project:${namespace}:${key}`);
            totalSize += JSON.stringify(data[key]).length;
          }
        } catch {
          // Ignore errors reading individual files
        }
      }
    } catch {
      // Project storage directory doesn't exist yet
    }

    // Count session storage
    for (const [nsKey, nsData] of sessionStorage.entries()) {
      for (const [key, entry] of nsData.entries()) {
        if (!isExpired(entry)) {
          totalKeys++;
          keys.push(`session:${nsKey}:${key}`);
          totalSize += JSON.stringify(entry.value).length;
        }
      }
    }

    // Update telemetry with initial storage stats
    uiTelemetryService.updateStorageMetrics({
      recordCount: totalKeys,
      keys: keys.slice(0, 100), // Limit to first 100 keys to avoid memory issues
      totalSize,
    });

    debugLogger.info(
      `[StorageTool] Initialized storage metrics: ${totalKeys} keys, ${totalSize} bytes`,
    );
  } catch (error) {
    debugLogger.error(
      '[StorageTool] Error initializing storage metrics:',
      error,
    );
  }
}

const storageToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'storage-tools',
    name: 'Storage Tools',
    version: '1.1.0',
    description:
      'Universal storage for AI model with TTL, metadata, and batch operations',
    enabledByDefault: true,
  },

  // Unified tools array - StorageTool doesn't need Config
  tools: [StorageTool],

  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    {
      alias: 'storage',
      canonicalName: 'model_storage',
      description: 'Universal storage for AI model',
    },
    {
      alias: 'model_storage',
      canonicalName: 'model_storage',
      description: 'Model storage',
    },
    {
      alias: 'store',
      canonicalName: 'model_storage',
      description: 'Store and retrieve data',
    },
    {
      alias: 'kv',
      canonicalName: 'model_storage',
      description: 'Key-value storage',
    },
    {
      alias: 'cache',
      canonicalName: 'model_storage',
      description: 'Cache storage',
    },
    {
      alias: 'roadmap',
      canonicalName: 'model_storage',
      description: 'Project roadmap storage',
    },
    {
      alias: 'persist',
      canonicalName: 'model_storage',
      description: 'Persistent storage',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Storage tool (model_storage) is universal key-value storage for AI models. Supports persistent and session storage, TTL, metadata, batch operations. Namespaces: roadmap, session, knowledge, context, learning, metrics.',
    },
    {
      priority: 2,
      content:
        'STORAGE OPERATIONS: set/get/delete for single items, list for keys, append for arrays, merge for objects, batch for multiple ops. Use TTL for temporary data, tags for categorization.',
    },
    {
      priority: 3,
      content:
        'NAMESPACE GUIDELINES: roadmap (project plans), session (temporary data), knowledge (learned patterns), context (current task), learning (corrections), metrics (statistics). Persistent by default except session/context.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: false,
    canAccessNetwork: false,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Storage Tools plugin loaded');

      // Ensure storage directory exists on load
      try {
        await ensureStorageDir('global');
        debugLogger.info('[StorageTool] Global storage directory ensured');
      } catch (err) {
        debugLogger.error(
          '[StorageTool] Failed to create storage directory:',
          err,
        );
      }

      // Initialize storage metrics on load
      await initializeStorageMetrics();
    },

    onEnable: async (context) => {
      context.logger.info('Storage Tools plugin enabled');
    },
  },
};

export default storageToolsPlugin;
