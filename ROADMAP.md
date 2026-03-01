# Ollama Code — Roadmap развития

> Профессиональный анализ архитектуры и план развития проекта

## Текущее состояние (v0.11.0)

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

#### 5. Plugin System

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

#### 6. Prompt System Documentation

**Статус:** ✅ Реализовано

Полная документация системы промптов в `docs/PROMPT_SYSTEM.md`:

- `getCoreSystemPrompt()` — основной системный промпт
- `getCompressionPrompt()` — сжатие истории в XML
- `getProjectSummaryPrompt()` — суммаризация проекта
- `getToolCallFormatInstructions()` — инструкции для моделей без tools
- `getToolLearningContext()` — контекст обучения на ошибках
- `getEnvironmentInfo()` — информация об окружении

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
| Замена fetch на axios         | P0        | 3d     | ✅ Завершено |
| Request/Response interceptors | P1        | 2d     | ✅ Завершено |
| Retry logic                   | P1        | 1d     | ✅ Завершено |
| Request timeout handling      | P2        | 1d     | ✅ Завершено |

#### План миграции fetch → axios

**Причина миграции:**

- Единообразная обработка ошибок
- Автоматическая сериализация JSON
- Встроенная поддержка timeout
- Interceptors для логирования и аутентификации
- Retry logic из коробки
- Лучшая типизация

**Файлы для миграции:**

1. `packages/core/src/core/ollamaClient.ts` — основной Ollama клиент
2. `packages/core/src/core/ollamaNativeClient.ts` — native API клиент
3. `packages/core/src/core/ollamaContextClient.ts` — context-aware клиент
4. `packages/core/src/tools/web-fetch/*.ts` — web fetch инструменты
5. `packages/core/src/tools/web-search/providers/*.ts` — search providers

**Этапы миграции:**

| Этап | Описание                                        | Файлы                   | Риск    |
| ---- | ----------------------------------------------- | ----------------------- | ------- |
| 1    | Создание axios instance с базовой конфигурацией | `httpClient.ts`         | Низкий  |
| 2    | Добавление interceptors (logging, auth)         | `interceptors.ts`       | Низкий  |
| 3    | Миграция ollamaClient                           | `ollamaClient.ts`       | Средний |
| 4    | Миграция ollamaNativeClient                     | `ollamaNativeClient.ts` | Высокий |
| 5    | Миграция web-search providers                   | `web-search/`           | Низкий  |
| 6    | Тестирование всех API endpoints                 | `*.test.ts`             | Низкий  |

**Тестирование:**

- Все существующие 118+ тестов должны проходить
- Добавить интеграционные тесты для retry logic
- Добавить тесты для timeout handling
- Проверить streaming responses

**Откат:**

- Сохранить оригинальные fetch-based файлы как `.bak`
- Feature flag для переключения между fetch/axios

---

### v0.13.0 — Plugin System v2 ✅

**Цель:** Динамическая загрузка плагинов

| Задача                       | Приоритет | Оценка | Статус       |
| ---------------------------- | --------- | ------ | ------------ |
| PluginLoader для обнаружения | P0        | 3d     | ✅ Завершено |
| Dynamic plugin loading       | P0        | 4d     | ✅ Завершено |
| Plugin CLI команды           | P1        | 2d     | ✅ Завершено |
| Plugin marketplace           | P2        | 5d     | 🔴 Не начато |
| Security sandbox             | P1        | 3d     | 🔴 Не начато |

**Пример структуры плагина:**

```
@ollama-code/plugin-kubernetes/
├── package.json
├── plugin.json         # Manifest
├── src/
│   ├── index.ts        # Экспорт плагина
│   ├── tools/
│   │   ├── kubectl.ts  # KubectlTool
│   │   └── helm.ts     # HelmTool
│   └── hooks/
│       └── kubeconfig.ts
```

---

### v0.14.0 — Memory & Performance

**Цель:** Исправление memory leaks, оптимизация

| Задача                   | Приоритет | Оценка | Статус       |
| ------------------------ | --------- | ------ | ------------ |
| Memory leaks в streaming | P0        | 3d     | ✅ Завершено |
| AbortController cleanup  | P0        | 2d     | ✅ Завершено |
| React мемоизация         | P1        | 3d     | 🔴 Не начато |
| Virtual scrolling        | P2        | 3d     | 🔴 Не начато |
| Token counting fallback  | P1        | 1d     | 🔴 Не начато |

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

| Функция          | Ollama Code    | Claude Code | Aider       | Cursor      |
| ---------------- | -------------- | ----------- | ----------- | ----------- |
| Локальные модели | ✅             | ❌          | ✅          | ❌          |
| Open Source      | ✅             | ❌          | ✅          | ❌          |
| CLI интерфейс    | ✅             | ✅          | ✅          | ❌          |
| Web UI           | 🔴 Планируется | ✅          | ❌          | ✅          |
| Plugin System    | ✅             | ✅          | ✅          | ✅          |
| IDE Integration  | ✅ VSCode      | ✅ VSCode   | ✅ Multi    | ✅ Built-in |
| MCP Support      | ✅             | ✅          | ❌          | ❌          |
| Context Caching  | ✅             | ✅          | ⚠️ Частично | ✅          |
| Undo/Redo        | ✅             | ✅          | ❌          | ✅          |

---

## Приоритеты развития

### Q1 2025 ✅

1. **Performance** — Zustand миграция ✅
2. **Plugin System** — Динамические инструменты ✅
3. **Context Caching** — KV-cache reuse ✅

### Q2 2025 ✅

1. **HTTP Client** — Axios migration ✅
2. **Plugin Loader** — Динамическая загрузка
3. **Memory** — Исправление leaks

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

| Область        | Проблема                | Решение           | Оценка |
| -------------- | ----------------------- | ----------------- | ------ |
| Memory leaks   | AbortController cleanup | Cleanup handlers  | 2d     |
| Token counting | Fallback для прогресса  | Estimate fallback | 1d     |

### Средний приоритет

| Область       | Проблема                     | Решение            | Оценка |
| ------------- | ---------------------------- | ------------------ | ------ |
| Documentation | Не все API задокументированы | TSDoc              | 3d     |
| Logging       | Несогласованный формат       | Structured logging | 2d     |
| Config        | Много источников             | Единый schema      | 3d     |

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

Ollama Code v0.13.0 включает ключевые архитектурные улучшения:

1. **Zustand** — Оптимизация React-рендеринга ✅
2. **Event Bus** — Слабая связность компонентов ✅
3. **Command Pattern** — Undo/Redo для операций ✅
4. **Plugin System v2** — PluginLoader + CLI + Dynamic loading ✅
5. **Context Caching** — KV-cache reuse для производительности ✅
6. **Axios HTTP Client** — Interceptors, retry, timeout ✅

Следующие шаги — исправление memory leaks и Security sandbox для плагинов.

---

_Document version: 3.2.0_
_Last updated: 2025-03-01_
_Author: Architecture Team_
