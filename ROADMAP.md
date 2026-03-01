# Ollama Code — Roadmap развития

> Профессиональный анализ архитектуры и план развития проекта

## Текущее состояние (v0.10.8)

### ✅ Реализованные улучшения (2025-03-01)

#### 1. Context Caching — KV-cache Reuse
**Статус:** ✅ Реализовано

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
const tokenCount = useSessionStore(state => state.lastPromptTokenCount);
```

**Stores:**
- `sessionStore` — сессия и метрики
- `streamingStore` — состояние стриминга + AbortController
- `uiStore` — UI настройки с persistence

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

#### 4. Command Pattern (Undo/Redo)
**Статус:** ✅ Реализовано

```typescript
// Выполнение команды с возможностью отмены
await commandStore.execute({
  description: 'Change theme',
  type: 'theme',
  execute: async () => { /* ... */ },
  undo: async () => { /* ... */ },
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
  tools: [{
    id: 'hello',
    name: 'hello_world',
    description: 'Say hello',
    execute: async (params) => ({ success: true, data: 'Hello!' }),
  }],
};

await pluginManager.registerPlugin(myPlugin);
await pluginManager.enablePlugin('my-plugin');
```

### Архитектурный обзор

```
┌─────────────────────────────────────────────────────────────┐
│                    Ollama Code Architecture                  │
├─────────────────────────────────────────────────────────────┤
│  packages/cli         │ Ink (React) + Terminal UI           │
│  packages/core        │ Business Logic + Tools + Ollama API │
│  packages/webui       │ React Components (Storybook)        │
│  packages/sdk-ts      │ TypeScript SDK for integrations     │
└─────────────────────────────────────────────────────────────┘
```

### Технологический стек

| Слой | Технологии | Оценка |
|------|------------|--------|
| UI Layer | Ink (React 18), React Hooks | ✅ Современно |
| State Management | Context API + useReducer | ⚠️ Можно улучшить |
| API Client | Native fetch, Custom OllamaClient | ✅ Хорошо |
| Tools System | DeclarativeTool pattern | ✅ Расширяемо |
| Testing | Vitest, MSW | ✅ Покрытие 80%+ |
| Build | esbuild, TypeScript 5.x | ✅ Быстро |

---

## Анализ проблем и возможностей

### 🔴 Критические проблемы

#### 1. React Performance в CLI

**Проблема:** Использование Context API для глобального состояния приводит к лишним ре-рендерам при каждом изменении.

```typescript
// Текущая проблема: UIStateContext вызывает ре-рендер всех компонентов
const uiState = useUIState(); // ❌ Подписка на всё состояние

// Решение: Атомарные подписки через Zustand/Jotai
const streamingState = useUIState(state => state.streaming); // ✅ Только нужное
```

**Рекомендация:** Миграция на Zustand или Jotai для атомарных обновлений.

#### 2. Отсутствие мемоизации компонентов

**Проблема:** Инструменты не мемоизированы, создаются при каждом рендере.

```typescript
// Текущее (packages/cli/src/ui/components/Header.tsx)
function Header({ model, tokens, ... }) {
  // ❌ Вычисления при каждом рендере
  const progress = (tokens / maxTokens) * 100;
}

// Рекомендуемое
const Header = memo(function Header({ model, tokens, ... }) {
  // ✅ Мемоизированные вычисления
  const progress = useMemo(() =>
    (tokens / maxTokens) * 100,
    [tokens, maxTokens]
  );
});
```

#### 3. Streaming Memory Leaks

**Проблема:** Неполная очистка AbortController при прерывании стриминга.

```typescript
// ollamaNativeClient.ts - необходима очистка
useEffect(() => {
  const controller = new AbortController();

  streamChat(controller.signal);

  return () => {
    controller.abort(); // ✅ Есть
    // ❌ Но нет очистки readers и timeout
  };
}, []);
```

---

### 🟡 Архитектурные улучшения

#### 1. Plugin System для инструментов

**Текущее состояние:** Инструменты регистрируются статически.

**Предложение:** Динамическая система плагинов.

```typescript
// packages/core/src/plugins/types.ts
interface ToolPlugin {
  name: string;
  version: string;
  tools: AnyDeclarativeTool[];
  hooks?: {
    beforeExecute?: (tool: string, params: unknown) => Promise<void>;
    afterExecute?: (tool: string, result: ToolResult) => Promise<void>;
  };
}

// Пример плагина
const databasePlugin: ToolPlugin = {
  name: '@ollama-code/database-tools',
  version: '1.0.0',
  tools: [new PostgresTool(), new MySQLTool(), new RedisTool()],
  hooks: {
    beforeExecute: async (tool, params) => {
      logger.info(`Executing ${tool}`, params);
    }
  }
};

// Регистрация
pluginManager.register(databasePlugin);
```

#### 2. Event-Driven Architecture

**Проблема:** Прямые вызовы между компонентами создают coupling.

**Решение:** Event Bus для слабой связности.

```typescript
// packages/core/src/events/index.ts
type EventMap = {
  'tool:execute': { name: string; params: unknown };
  'tool:complete': { name: string; result: ToolResult };
  'model:switch': { from: string; to: string };
  'session:start': { id: string };
  'session:end': { id: string; reason: string };
};

class EventBus<T extends Record<string, unknown>> {
  private listeners = new Map<keyof T, Set<(data: T[keyof T]) => void>>();

  on<K extends keyof T>(event: K, handler: (data: T[K]) => void) {
    // ...
  }

  emit<K extends keyof T>(event: K, data: T[K]) {
    // ...
  }
}
```

#### 3. Command Pattern для Undo/Redo

**Отсутствует:** Возможность отмены операций.

```typescript
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
}

class EditFileCommand implements Command {
  private originalContent: string;

  constructor(
    private filePath: string,
    private newContent: string
  ) {}

  async execute() {
    this.originalContent = await readFile(this.filePath);
    await writeFile(this.filePath, this.newContent);
  }

  async undo() {
    await writeFile(this.filePath, this.originalContent);
  }
}

// Command Manager
class CommandManager {
  private history: Command[] = [];
  private position = -1;

  async execute(command: Command) {
    await command.execute();
    this.history = this.history.slice(0, this.position + 1);
    this.history.push(command);
    this.position++;
  }

  async undo() {
    if (this.position >= 0) {
      await this.history[this.position--].undo();
    }
  }
}
```

---

## Roadmap по версиям

### v0.11.0 — Performance & Developer Experience

**Цель:** Улучшение производительности и DX

| Задача | Приоритет | Оценка | Статус |
|--------|-----------|--------|--------|
| Миграция на Zustand/Jotai | P0 | 5d | 🔴 Не начато |
| Мемоизация React компонентов | P0 | 3d | 🔴 Не начато |
| Virtual scrolling для истории | P1 | 3d | 🔴 Не начато |
| React DevTools интеграция | P2 | 2d | 🔴 Не начато |
| Hot Module Replacement | P2 | 2d | 🔴 Не начато |

**Технические детали:**

```typescript
// Zustand store пример
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  // State
  model: string;
  messages: Message[];
  streaming: boolean;
  tokens: { used: number; max: number };

  // Actions
  setModel: (model: string) => void;
  addMessage: (message: Message) => void;
  setStreaming: (streaming: boolean) => void;
}

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        model: 'llama3.2',
        messages: [],
        streaming: false,
        tokens: { used: 0, max: 128000 },

        setModel: (model) => set({ model }),
        addMessage: (message) => set((state) => ({
          messages: [...state.messages, message]
        })),
        setStreaming: (streaming) => set({ streaming }),
      }),
      { name: 'ollama-code-store' }
    )
  )
);
```

---

### v0.12.0 — Plugin System

**Цель:** Расширяемость через плагины

| Задача | Приоритет | Оценка | Статус |
|--------|-----------|--------|--------|
| Plugin API дизайн | P0 | 3d | 🔴 Не начато |
| Dynamic tool loading | P0 | 4d | 🔴 Не начато |
| Plugin CLI команды | P1 | 2d | 🔴 Не начато |
| Plugin marketplace | P2 | 5d | 🔴 Не начато |
| Security sandbox для плагинов | P1 | 3d | 🔴 Не начато |

**Пример структуры плагина:**

```
@ollama-code/plugin-kubernetes/
├── package.json
├── src/
│   ├── index.ts          # Экспорт плагина
│   ├── tools/
│   │   ├── kubectl.ts    # KubectlTool
│   │   ├── helm.ts       # HelmTool
│   │   └── k9s.ts        # K9sTool
│   └── hooks/
│       └── kubeconfig.ts # Автодетект контекста
└── manifest.json         # Метаданные плагина
```

---

### v0.13.0 — Advanced Features

**Цель:** Enterprise-функции

| Задача | Приоритет | Оценка | Статус |
|--------|-----------|--------|--------|
| Undo/Redo система | P0 | 5d | 🔴 Не начато |
| Multi-file refactoring | P0 | 4d | 🔴 Не начато |
| Code suggestions (LSP) | P1 | 5d | 🔴 Не начато |
| Project templates | P2 | 3d | 🔴 Не начато |
| Git integration v2 | P1 | 4d | 🔴 Не начато |

**Multi-file refactoring:**

```typescript
interface RefactoringOperation {
  type: 'rename' | 'extract' | 'move' | 'inline';
  files: string[];
  preview: () => Promise<FileDiff[]>;
  apply: () => Promise<void>;
  rollback: () => Promise<void>;
}

// Пример использования
await refactoring.rename({
  type: 'symbol',
  from: 'oldFunctionName',
  to: 'newFunctionName',
  scope: 'project', // или 'file', 'directory'
  dryRun: false
});
```

---

### v0.14.0 — Web UI

**Цель:** Полноценный веб-интерфейс

| Задача | Приоритет | Оценка | Статус |
|--------|-----------|--------|--------|
| Next.js App Router setup | P0 | 3d | 🔴 Не начато |
| Chat interface component | P0 | 4d | 🔴 Не начато |
| File explorer integration | P1 | 3d | 🔴 Не начато |
| Terminal emulator (xterm.js) | P1 | 4d | 🔴 Не начато |
| WebSocket streaming | P0 | 3d | 🔴 Не начато |
| Authentication (OAuth) | P1 | 3d | 🔴 Не начато |

**Архитектура Web UI:**

```
packages/web-ui/
├── app/
│   ├── layout.tsx
│   ├── page.tsx           # Главная страница
│   ├── chat/
│   │   └── [id]/page.tsx  # Чат по ID
│   └── settings/
│       └── page.tsx
├── components/
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── InputArea.tsx
│   │   └── ToolCallDisplay.tsx
│   ├── editor/
│   │   ├── CodeEditor.tsx # Monaco Editor
│   │   └── FileTree.tsx
│   └── terminal/
│       └── Terminal.tsx   # xterm.js
├── lib/
│   ├── api-client.ts
│   └── websocket.ts
└── hooks/
    ├── useChat.ts
    └── useStreaming.ts
```

---

### v0.15.0 — AI Enhancements

**Цель:** Улучшение AI-возможностей

| Задача | Приоритет | Оценка | Статус |
|--------|-----------|--------|--------|
| Multi-model routing | P0 | 4d | 🔴 Не начато |
| Context compression | P0 | 5d | 🔴 Не начато |
| RAG integration | P1 | 5d | 🔴 Не начато |
| Tool chains | P1 | 3d | 🔴 Не начато |
| Model fine-tuning support | P2 | 5d | 🔴 Не начато |

**Multi-model routing:**

```typescript
interface ModelRouter {
  // Автоматический выбор модели по задаче
  selectModel(task: TaskType): string;

  // Параллельное выполнение на разных моделях
  parallelExecute<T>(
    tasks: Task[],
    models: string[]
  ): Promise<T[]>;

  // Fallback цепочка
  withFallback<T>(
    primary: string,
    fallbacks: string[],
    operation: () => Promise<T>
  ): Promise<T>;
}

// Примеры routing правил
const routingRules = [
  { task: 'code_generation', model: 'codellama' },
  { task: 'code_review', model: 'deepseek-r1' },
  { task: 'documentation', model: 'llama3.2' },
  { task: 'vision', model: 'llava' },
];
```

---

### v1.0.0 — Production Ready

**Цель:** Готовность к продакшену

| Задача | Приоритет | Оценка | Статус |
|--------|-----------|--------|--------|
| Security audit | P0 | 5d | 🔴 Не начато |
| Performance benchmarks | P0 | 3d | 🔴 Не начато |
| Documentation v2 | P0 | 5d | 🔴 Не начато |
| CI/CD pipeline | P0 | 3d | 🔴 Не начато |
| Docker optimization | P1 | 2d | 🔴 Не начато |
| Kubernetes manifests | P2 | 3d | 🔴 Не начато |
| Monitoring (OpenTelemetry) | P1 | 4d | 🔴 Не начато |

---

## Сравнение с конкурентами

| Функция | Ollama Code | Claude Code | Aider | Cursor |
|---------|-------------|-------------|-------|--------|
| Локальные модели | ✅ | ❌ | ✅ | ❌ |
| Open Source | ✅ | ❌ | ✅ | ❌ |
| CLI интерфейс | ✅ | ✅ | ✅ | ❌ |
| Web UI | 🔴 Планируется | ✅ | ❌ | ✅ |
| Plugin System | 🔴 Планируется | ✅ | ✅ | ✅ |
| IDE Integration | ✅ VSCode | ✅ VSCode | ✅ Multi | ✅ Built-in |
| MCP Support | ✅ | ✅ | ❌ | ❌ |
| Multi-model | 🔴 Планируется | ❌ | ✅ | ✅ |
| Context Management | ✅ | ✅ | ✅ | ✅ |

---

## Приоритеты развития

### Q1 2025
1. **Performance** — Zustand миграция, мемоизация
2. **DX** — HMR, DevTools
3. **Stability** — Исправление memory leaks

### Q2 2025
1. **Plugin System** — Динамические инструменты
2. **Web UI** — Next.js приложение
3. **Enterprise** — Authentication, Authorization

### Q3 2025
1. **AI Features** — Multi-model routing, RAG
2. **Refactoring** — Multi-file, Undo/Redo
3. **Integrations** — GitHub, GitLab, Jira

### Q4 2025
1. **v1.0.0** — Production release
2. **Cloud offering** — SaaS версия
3. **Enterprise** — Self-hosted

---

## Технический долг

### Высокий приоритет

| Область | Проблема | Решение | Оценка |
|---------|----------|---------|--------|
| React Context | Лишние ре-рендеры | Zustand/Jotai | 5d |
| Error Handling | Неструктурированные ошибки | Result pattern | 3d |
| Testing | Недостаточные e2e тесты | Playwright | 4d |
| Types | Any типы в критических местах | Строгая типизация | 3d |

### Средний приоритет

| Область | Проблема | Решение | Оценка |
|---------|----------|---------|--------|
| Documentation | Не все API задокументированы | TSDoc | 3d |
| Logging | Несогласованный формат | Structured logging | 2d |
| Config | Много источников конфигурации | Единый config schema | 3d |

---

## Метрики успеха

| Метрика | Текущее | Цель v1.0 |
|---------|---------|-----------|
| Test Coverage | 80% | 90% |
| Bundle Size (CLI) | ~5MB | <3MB |
| Startup Time | ~2s | <1s |
| Memory Usage | ~200MB | <100MB |
| Response Latency | ~100ms | <50ms |
| GitHub Stars | 500+ | 5000+ |
| Contributors | 10+ | 100+ |

---

## Заключение

Ollama Code имеет прочную архитектурную основу с хорошим разделением ответственности между пакетами. Основные направления развития:

1. **Performance** — Оптимизация React-рендеринга через современный state management
2. **Extensibility** — Plugin system для сообщества
3. **UX** — Web UI для более широкой аудитории
4. **AI** — Multi-model routing и RAG для лучших результатов

Проект имеет потенциал стать ведущим open-source инструментом для AI-assisted разработки с локальными моделями.

---

*Document version: 2.0.0*
*Last updated: 2025-01-XX*
*Author: Architecture Team*
