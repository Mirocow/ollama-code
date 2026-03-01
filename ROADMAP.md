# Ollama Code — Roadmap развития

> Профессиональный анализ архитектуры и план развития проекта

## Текущее состояние (v0.11.3)

### ✅ Реализованные улучшения (2025-01)

#### 1. Context Caching — KV-cache Reuse

**Статус:** ✅ Реализовано и интегрировано

```typescript
// До: каждый запрос отправлял ВСЮ историю
// После: используется кэшированный context от Ollama

const client = new OllamaContextClient();

// Первое сообщение - полный процессинг
await client.generate({
  model: 'llama3.2',
  sessionId: 'chat-1',
  prompt: 'Привет!',
  system: 'Ты помощник.',
});
// → context: [1, 45, 789, ...] сохраняется

// Второе сообщение - ИСПОЛЬЗУЕТ КЭШ (быстро!)
await client.generate({
  model: 'llama3.2',
  sessionId: 'chat-1',
  prompt: 'Сколько будет 2+2?',
});
// → только новые токены обрабатываются!
```

**Производительность:**

- 1-е сообщение: 100% (baseline)
- 2-е сообщение: ~10-20% токенов
- 10-е сообщение: ~5-10% токенов

**Файлы:**

- `packages/core/src/cache/contextCacheManager.ts`
- `packages/core/src/core/ollamaContextClient.ts`
- `packages/core/src/core/hybridContentGenerator.ts`

#### 2. Zustand Migration

**Статус:** ✅ Реализовано

Заменен Context API на Zustand для оптимизации re-render'ов:

```typescript
// До: Context API - все компоненты re-render'ятся
const state = useContext(UIStateContext);

// После: Zustand - только нужные подписки
const tokenCount = useSessionStore((state) => state.lastPromptTokenCount);
```

**Stores:**

- `sessionStore` — сессия и метрики
- `streamingStore` — состояние стриминга + AbortController
- `uiStore` — UI настройки с persistence
- `commandStore` — Command Pattern для Undo/Redo
- `eventBus` — Event Bus для слабой связности

#### 3. Event Bus

**Статус:** ✅ Реализовано

Типизированный Event Bus для слабой связности:

```typescript
// Подписка на события
eventBus.subscribe('stream:finished', (data) => {
  console.log('Tokens used:', data.tokenCount);
});

// Эмиссия событий
eventBus.emit('stream:finished', { promptId: '123', tokenCount: 1500 });
```

**Поддерживаемые события:**

- `stream:started/chunk/finished/error/cancelled`
- `tool:started/progress/completed/error`
- `session:started/ended/cleared`
- `command:executed/undone/redone`
- `plugin:loaded/unloaded/error`

#### 4. Command Pattern (Undo/Redo)

**Статус:** ✅ Реализовано

```typescript
// Выполнение команды с возможностью отмены
await commandStore.execute({
  description: 'Change theme',
  type: 'theme',
  execute: async () => {
    /* ... */
  },
  undo: async () => {
    /* ... */
  },
  canUndo: true,
});

// Отмена последней команды
await commandStore.undo();

// Повтор отмененной команды
await commandStore.redo();
```

#### 5. Plugin System v2

**Статус:** ✅ Реализовано

```typescript
const myPlugin: PluginDefinition = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
  },
  tools: [
    {
      id: 'hello',
      name: 'hello_world',
      description: 'Say hello',
      parameters: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      execute: async (params) => ({ success: true, data: 'Hello!' }),
    },
  ],
  hooks: {
    onLoad: async (context) => context.logger.info('Plugin loaded'),
    onBeforeToolExecute: async (toolId, params) => true,
  },
};

await pluginManager.registerPlugin(myPlugin);
await pluginManager.enablePlugin('my-plugin');
```

**Builtin Plugins:**

- `core-tools` — echo, timestamp, env
- `dev-tools` — python_dev, nodejs_dev, golang_dev, rust_dev, etc.
- `file-tools` — read_file, write_file, edit_file, glob
- `search-tools` — grep, glob, web_fetch
- `shell-tools` — run_shell_command

**Plugin System Files:**

| Файл                   | Строк | Описание                              |
| ---------------------- | ----- | ------------------------------------- |
| `pluginLoader.ts`      | 11752 | Dynamic plugin discovery              |
| `plugin-cli.ts`        | 9679  | CLI commands (create, validate, list) |
| `pluginManager.ts`     | 11872 | Lifecycle management                  |
| `pluginRegistry.ts`    | 6780  | ToolRegistry integration              |
| `pluginSandbox.ts`     | 21765 | Security sandbox                      |
| `pluginMarketplace.ts` | 22868 | NPM-based marketplace                 |
| `pluginToolAdapter.ts` | 7112  | Tool adapter bridge                   |

#### 6. Prompt System Documentation

**Статус:** ✅ Реализовано

Полная документация системы промптов в `docs/PROMPT_SYSTEM.md`:

- `getCoreSystemPrompt()` — основной системный промпт
- `getCompressionPrompt()` — сжатие истории в XML
- `getProjectSummaryPrompt()` — суммаризация проекта
- `getToolCallFormatInstructions()` — инструкции для моделей без tools
- `getToolLearningContext()` — контекст обучения на ошибках
- `getEnvironmentInfo()` — информация об окружении

#### 7. HTTP Client (Axios Migration)

**Статус:** ✅ Реализовано

**Файл:** `packages/core/src/utils/httpClient.ts` (276 строк)

```typescript
// Создание axios instance с interceptors
const client = createHttpClient({
  baseURL: 'http://localhost:11434',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  debug: true,
});

// Автоматические возможности:
// - Request/Response logging
// - Retry with exponential backoff
// - Timeout handling
// - Auth header injection
```

**Мигрированные файлы:**

| Файл                    | Статус                         |
| ----------------------- | ------------------------------ |
| `ollamaNativeClient.ts` | ✅ Использует createHttpClient |
| `google-provider.ts`    | ✅ Использует axios            |
| `tavily-provider.ts`    | ✅ Использует axios            |

#### 8. Cancellation & Memory Leaks

**Статус:** ✅ Реализовано

**Файл:** `packages/core/src/streaming/cancellation.ts` (516 строк)

```typescript
// CancellationToken с timeout
const source = new CancellationTokenSource({ timeout: 30000 });
const token = source.token;

// Передача в fetch API
const response = await fetch(url, { signal: token.toAbortSignal() });

// Linked tokens
const linked = CancellationToken.link(userToken, timeoutToken);
```

**Возможности:**

- CancellationToken / CancellationTokenSource
- Timeout support
- Linked tokens
- AbortSignal conversion
- Proper cleanup handlers

---

## Архитектурный обзор

```
┌─────────────────────────────────────────────────────────────┐
│                    Ollama Code Architecture                  │
├─────────────────────────────────────────────────────────────┤
│  packages/cli         │ Ink (React) + Terminal UI           │
│  packages/core        │ Business Logic + Tools + Ollama API │
│  packages/webui       │ React Components (Storybook)        │
│  packages/sdk-typescript │ TypeScript SDK for integrations  │
└─────────────────────────────────────────────────────────────┘
```

### Технологический стек

| Слой             | Технологии                           | Оценка                |
| ---------------- | ------------------------------------ | --------------------- |
| UI Layer         | Ink (React 18), React Hooks          | ✅ Современно         |
| State Management | Zustand + Event Bus                  | ✅ Оптимизировано     |
| API Client       | Axios (interceptors, retry, timeout) | ✅ Миграция завершена |
| Tools System     | Plugin System + DeclarativeTool      | ✅ Расширяемо         |
| Testing          | Vitest, MSW                          | ✅ Покрытие 80%+      |
| Build            | esbuild, TypeScript 5.x              | ✅ Быстро             |

---

## Roadmap по версиям

### v0.11.0 — Performance & Developer Experience ✅

**Цель:** Улучшение производительности и DX

| Задача                      | Приоритет | Оценка | Статус       |
| --------------------------- | --------- | ------ | ------------ |
| Миграция на Zustand         | P0        | 5d     | ✅ Завершено |
| Event Bus                   | P0        | 3d     | ✅ Завершено |
| Command Pattern (Undo/Redo) | P0        | 4d     | ✅ Завершено |
| Plugin System               | P0        | 5d     | ✅ Завершено |
| Context Caching             | P0        | 4d     | ✅ Завершено |
| Prompt System Docs          | P1        | 2d     | ✅ Завершено |

---

### v0.12.0 — HTTP Client & API Improvements ✅

**Цель:** Замена fetch на axios, улучшение API

| Задача                        | Приоритет | Оценка | Статус       |
| ----------------------------- | --------- | ------ | ------------ |
| Создание httpClient.ts        | P0        | 1d     | ✅ Завершено |
| Request/Response interceptors | P1        | 2d     | ✅ Завершено |
| Retry logic                   | P1        | 1d     | ✅ Завершено |
| Request timeout handling      | P2        | 1d     | ✅ Завершено |
| Миграция ollamaNativeClient   | P0        | 2d     | ✅ Завершено |
| Миграция web-search providers | P1        | 1d     | ✅ Завершено |

#### Реализованные этапы миграции

| Этап | Описание                                        | Файлы                   | Статус       |
| ---- | ----------------------------------------------- | ----------------------- | ------------ |
| 1    | Создание axios instance с базовой конфигурацией | `httpClient.ts`         | ✅ Завершено |
| 2    | Добавление interceptors (logging, retry, auth)  | `httpClient.ts`         | ✅ Завершено |
| 3    | Миграция ollamaNativeClient                     | `ollamaNativeClient.ts` | ✅ Завершено |
| 4    | Миграция web-search providers                   | `google/tavily`         | ✅ Завершено |
| 5    | Тестирование                                    | `httpClient.test.ts`    | ✅ Завершено |

---

### v0.13.0 — Plugin System v2 ✅

**Цель:** Динамическая загрузка плагинов

| Задача                       | Приоритет | Оценка | Статус       |
| ---------------------------- | --------- | ------ | ------------ |
| PluginLoader для обнаружения | P0        | 3d     | ✅ Завершено |
| Dynamic plugin loading       | P0        | 4d     | ✅ Завершено |
| Plugin CLI команды           | P1        | 2d     | ✅ Завершено |
| Security sandbox             | P1        | 3d     | ✅ Завершено |
| Plugin marketplace           | P2        | 5d     | ✅ Завершено |

**Реализованные компоненты:**

| Компонент         | Файл                   | Функциональность                          |
| ----------------- | ---------------------- | ----------------------------------------- |
| PluginLoader      | `pluginLoader.ts`      | Discovery (builtin, user, project, npm)   |
| PluginCLI         | `plugin-cli.ts`        | create, validate, list, info              |
| PluginManager     | `pluginManager.ts`     | register, enable, disable, hooks          |
| PluginRegistry    | `pluginRegistry.ts`    | ToolRegistry integration                  |
| PluginSandbox     | `pluginSandbox.ts`     | Filesystem, network, command restrictions |
| PluginMarketplace | `pluginMarketplace.ts` | search, install, update, uninstall        |
| PluginToolAdapter | `pluginToolAdapter.ts` | Tool wrapper for DeclarativeTool          |

**Builtin Plugins (5 шт.):**

- `core-tools/` — echo, timestamp, get_env
- `dev-tools/` — python_dev, nodejs_dev, golang_dev, rust_dev, typescript_dev, java_dev, cpp_dev, swift_dev, php_dev
- `file-tools/` — read_file, write_file, edit_file, glob, list_directory
- `search-tools/` — grep, glob, web_fetch, web_search
- `shell-tools/` — run_shell_command, bash

---

### v0.14.0 — Memory & Performance ✅

**Цель:** Исправление memory leaks, оптимизация

| Задача                   | Приоритет | Оценка | Статус       |
| ------------------------ | --------- | ------ | ------------ |
| Memory leaks в streaming | P0        | 3d     | ✅ Завершено |
| AbortController cleanup  | P0        | 2d     | ✅ Завершено |
| React мемоизация         | P1        | 3d     | ✅ Завершено |
| Virtual scrolling        | P2        | 3d     | 🔴 Не начато |
| Token counting fallback  | P1        | 1d     | ✅ Завершено |

#### React Мемоизация — Детали

**Статус:** ✅ Завершено

**Специализированные контексты (6 шт.):**

| Контекст              | Файл                                | Хуки                                                                   |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `DialogStateContext`  | DialogStateContext.tsx (299 строк)  | useDialogState, useDialogActions, useDialogContext                     |
| `TerminalContext`     | TerminalContext.tsx (112 строк)     | useTerminalState, useTerminalDimensions                                |
| `InputStateContext`   | InputStateContext.tsx (123 строк)   | useInputState, useInputBuffer, useInputActive, useShellMode            |
| `HistoryContext`      | HistoryContext.tsx (104 строк)      | useHistoryState, useHistoryItems, useHistoryManager                    |
| `LoadingContext`      | LoadingContext.tsx (106 строк)      | useLoadingState, useStreamingState, useElapsedTime, useIsLoading       |
| `ConfirmationContext` | ConfirmationContext.tsx (122 строк) | useConfirmationState, useShellConfirmation, useHasPendingConfirmations |

**Мемоизированные компоненты (11 шт.):**

| Компонент            | Файл                   | Оптимизация                                         |
| -------------------- | ---------------------- | --------------------------------------------------- |
| `Footer`             | Footer.tsx             | memo + useMemo (sandboxInfo, rightItems)            |
| `AppHeader`          | AppHeader.tsx          | memo + useMemo (config, settings, sessionStats)     |
| `Header`             | Header.tsx             | memo                                                |
| `Composer`           | Composer.tsx           | memo + useMemo (17 state values)                    |
| `MainContent`        | MainContent.tsx        | memo                                                |
| `HistoryItemDisplay` | HistoryItemDisplay.tsx | memo + useMemo (dimensions, itemForDisplay)         |
| `LoadingIndicator`   | LoadingIndicator.tsx   | memo + useMemo (primaryText, formattedTime)         |
| `OllamaMessage`      | OllamaMessage.tsx      | memo                                                |
| `ToolMessage`        | ToolMessage.tsx        | memo (subcomponents)                                |
| `MarkdownDisplay`    | MarkdownDisplay.tsx    | memo (RenderCodeBlock, RenderListItem, RenderTable) |
| `PrepareLabel`       | PrepareLabel.tsx       | memo                                                |

---

### v0.15.0 — Web UI

**Цель:** Полноценный веб-интерфейс

| Задача                       | Приоритет | Оценка | Статус       |
| ---------------------------- | --------- | ------ | ------------ |
| Next.js App Router setup     | P0        | 3d     | 🔴 Не начато |
| Chat interface component     | P0        | 4d     | 🔴 Не начато |
| File explorer integration    | P1        | 3d     | 🔴 Не начато |
| Terminal emulator (xterm.js) | P1        | 4d     | 🔴 Не начато |
| WebSocket streaming          | P0        | 3d     | 🔴 Не начато |

---

### v1.0.0 — Production Ready

**Цель:** Готовность к продакшену

| Задача                     | Приоритет | Оценка | Статус       |
| -------------------------- | --------- | ------ | ------------ |
| Security audit             | P0        | 5d     | 🔴 Не начато |
| Performance benchmarks     | P0        | 3d     | 🔴 Не начато |
| Documentation v2           | P0        | 5d     | 🔴 Не начато |
| CI/CD pipeline             | P0        | 3d     | 🔴 Не начато |
| Monitoring (OpenTelemetry) | P1        | 4d     | 🔴 Не начато |

---

## Сравнение с конкурентами

| Функция            | Ollama Code    | Claude Code | Aider       | Cursor      |
| ------------------ | -------------- | ----------- | ----------- | ----------- |
| Локальные модели   | ✅             | ❌          | ✅          | ❌          |
| Open Source        | ✅             | ❌          | ✅          | ❌          |
| CLI интерфейс      | ✅             | ✅          | ✅          | ❌          |
| Web UI             | 🔴 Планируется | ✅          | ❌          | ✅          |
| Plugin System      | ✅             | ✅          | ✅          | ✅          |
| Plugin Sandbox     | ✅             | ✅          | ❌          | ⚠️ Частично |
| Plugin Marketplace | ✅             | ✅          | ❌          | ✅          |
| IDE Integration    | ✅ VSCode      | ✅ VSCode   | ✅ Multi    | ✅ Built-in |
| MCP Support        | ✅             | ✅          | ❌          | ❌          |
| Context Caching    | ✅             | ✅          | ⚠️ Частично | ✅          |
| Undo/Redo          | ✅             | ✅          | ❌          | ✅          |

---

## Приоритеты развития

### Q1 2025 ✅

1. **Performance** — Zustand миграция ✅
2. **Plugin System** — Динамические инструменты ✅
3. **Context Caching** — KV-cache reuse ✅

### Q2 2025 ✅

1. **HTTP Client** — Axios migration ✅
2. **Plugin Loader** — Динамическая загрузка ✅
3. **Memory** — Исправление leaks ✅
4. **Plugin Marketplace** — NPM-based ✅
5. **Security Sandbox** — Filesystem/Network restrictions ✅

### Q3 2025

1. **Web UI** — Next.js приложение
2. **Enterprise** — Authentication
3. **AI Features** — Multi-model routing

### Q4 2025

1. **v1.0.0** — Production release
2. **Cloud offering** — SaaS версия
3. **Documentation** — Полная документация

---

## Технический долг

### Высокий приоритет

| Область        | Проблема                | Решение           | Статус       |
| -------------- | ----------------------- | ----------------- | ------------ |
| Memory leaks   | AbortController cleanup | Cleanup handlers  | ✅ Завершено |
| Token counting | Fallback для прогресса  | Estimate fallback | ✅ Завершено |

### Средний приоритет

| Область       | Проблема                     | Решение            | Оценка | Статус       |
| ------------- | ---------------------------- | ------------------ | ------ | ------------ |
| Documentation | Не все API задокументированы | TSDoc              | 3d     | 🔴 Не начато |
| Logging       | Несогласованный формат       | Structured logging | 2d     | 🔴 Не начато |
| Config        | Много источников             | Единый schema      | 3d     | 🔴 Не начато |

---

## Метрики успеха

| Метрика           | Текущее | Цель v1.0 |
| ----------------- | ------- | --------- |
| Test Coverage     | 80%     | 90%       |
| Bundle Size (CLI) | ~5MB    | <3MB      |
| Startup Time      | ~2s     | <1s       |
| Memory Usage      | ~200MB  | <100MB    |
| Response Latency  | ~100ms  | <50ms     |
| GitHub Stars      | 500+    | 5000+     |
| Contributors      | 10+     | 100+      |

---

## Заключение

Ollama Code v0.14.0 включает ключевые архитектурные улучшения:

1. **Zustand** — Оптимизация React-рендеринга ✅
2. **Event Bus** — Слабая связность компонентов ✅
3. **Command Pattern** — Undo/Redo для операций ✅
4. **Plugin System v2** — PluginLoader + CLI + Dynamic loading ✅
5. **Context Caching** — KV-cache reuse для производительности ✅
6. **Axios HTTP Client** — Interceptors, retry, timeout ✅
7. **React Мемоизация** — 6 контекстов + 11 memo компонентов ✅
8. **Plugin Marketplace** — NPM-based search/install/update ✅
9. **Security Sandbox** — Filesystem, network, command restrictions ✅
10. **Cancellation Support** — CancellationToken, AbortController cleanup ✅

Следующие шаги — Virtual scrolling (P2) и Web UI (v0.15.0).

---

_Document version: 4.1.0_
_Last updated: 2025-03-01_
_Author: Architecture Team_
