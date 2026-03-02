# Ollama Code Core - Полное руководство разработчика

> Базовая библиотека для создания ИИ-ассистентов для кодинга с поддержкой локальных LLM через Ollama.

## Содержание

1. [Обзор](#обзор)
2. [Установка](#установка)
3. [Быстрый старт](#быстрый-старт)
4. [Основные компоненты](#основные-компоненты)
5. [Ollama Client](#ollama-client)
6. [Система инструментов](#система-инструментов)
7. [Система плагинов](#система-плагинов)
8. [Потоковая передача](#потоковая-передача)
9. [Кэширование](#кэширование)
10. [LSP интеграция](#lsp-интеграция)
11. [MCP поддержка](#mcp-поддержка)
12. [Субагенты](#субагенты)
13. [API справочник](#api-справочник)
14. [Лучшие практики](#лучшие-практики)

---

## Обзор

Ollama Code Core (`@ollama-code/ollama-code-core`) — фундаментальная библиотека, на которой построены Ollama Code CLI и Web UI. Она предоставляет комплексный набор инструментов и утилит для создания ИИ-ассистентов для кодинга с поддержкой локальных LLM.

### Основные возможности

| Возможность | Описание |
|-------------|----------|
| **Native Ollama Client** | Прямое REST API взаимодействие с Ollama |
| **Потоковая передача** | Вывод токен-за-токеном в реальном времени |
| **Кэширование контекста** | Повторное использование KV-кэша для быстрых ответов |
| **Система инструментов** | 30+ встроенных инструментов для операций с кодом |
| **Система плагинов** | Расширяемая архитектура с песочницей |
| **LSP интеграция** | Поддержка Language Server Protocol |
| **MCP поддержка** | Интеграция Model Context Protocol |
| **Субагенты** | Оркестрация мультиагентов |
| **Наблюдаемость** | Метрики, трассировка и логирование |

### Архитектура

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Слой приложения (CLI/Web UI)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Система    │  │   Реестр     │  │     Генератор контента   │  │
│  │   конфиг.    │  │   моделей    │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Система     │  │   Менеджер   │  │     Менеджер субагентов  │  │
│  │  инструментов│  │   плагинов   │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                        Основные сервисы                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Менеджер   │  │   Контроль   │  │     Наблюдаемость        │  │
│  │   кэша       │  │   потока     │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                        Ollama Native Client                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   HTTP       │  │   Контекст   │  │     Эмбеддинг            │  │
│  │   Клиент     │  │   Клиент     │  │     Клиент               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Ollama Сервер  │
                    │ (localhost:11434)│
                    └─────────────────┘
```

---

## Установка

### Установка пакета

```bash
# npm
npm install @ollama-code/ollama-code-core

# pnpm
pnpm add @ollama-code/ollama-code-core

# yarn
yarn add @ollama-code/ollama-code-core
```

### Peer зависимости

Базовый пакет требует следующие peer зависимости:

```json
{
  "peerDependencies": {
    "node": ">=20"
  },
  "optionalDependencies": {
    "@lydell/node-pty": "1.1.0"
  }
}
```

### Конфигурация TypeScript

Убедитесь, что ваш `tsconfig.json` включает:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

---

## Быстрый старт

### Базовое использование

```typescript
import {
  OllamaNativeClient,
  createOllamaNativeClient
} from '@ollama-code/ollama-code-core';

// Создание клиента
const client = createOllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  timeout: 300000, // 5 минут
});

// Список доступных моделей
const { models } = await client.listModels();
console.log('Доступные модели:', models.map(m => m.name));

// Генерация текста с потоковой передачей
await client.generate({
  model: 'llama3.2',
  prompt: 'Напиши программу Hello World на TypeScript',
  stream: true,
}, (chunk) => {
  process.stdout.write(chunk.response ?? '');
});
```

### Чат с историей

```typescript
import { OllamaChat } from '@ollama-code/ollama-code-core';

const chat = new OllamaChat({
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
});

// Добавить системное сообщение
chat.addSystemMessage('Ты полезный ИИ-ассистент для кодинга.');

// Отправить сообщение пользователя с потоковой передачей
const response = await chat.sendMessage('Напиши функцию сортировки массива', {
  stream: true,
  onChunk: (chunk) => {
    process.stdout.write(chunk.message?.content ?? '');
  },
});

console.log('\nОтвет:', response.message.content);
```

### Использование инструментов

```typescript
import {
  ToolRegistry,
  ReadFileTool,
  WriteFileTool,
  ShellTool,
} from '@ollama-code/ollama-code-core';

// Создать реестр инструментов
const registry = new ToolRegistry();

// Зарегистрировать инструменты
registry.registerTool(new ReadFileTool(config));
registry.registerTool(new WriteFileTool(config));
registry.registerTool(new ShellTool(config));

// Выполнить инструмент
const result = await registry.executeTool('read_file', {
  path: '/src/index.ts',
});

console.log(result.llmContent);
```

---

## Основные компоненты

### Система конфигурации

Система конфигурации управляет всеми настройками и предоставляет единый интерфейс для доступа к значениям конфигурации.

```typescript
import { Config, createConfig } from '@ollama-code/ollama-code-core';

const config = await createConfig({
  model: 'llama3.2',
  ollamaUrl: 'http://localhost:11434',
  projectId: 'my-project',
});

// Доступ к конфигурации
const model = config.getModel();
const url = config.getOllamaUrl();
const sessionId = config.getSessionId();
```

### Реестр моделей

Реестр моделей управляет определениями и возможностями моделей.

```typescript
import {
  ModelRegistry,
  getModelCapabilities,
  supportsTools,
  supportsVision,
} from '@ollama-code/ollama-code-core';

// Получить возможности модели
const caps = getModelCapabilities('llama3.2');
console.log('Поддержка инструментов:', caps.supportsTools);
console.log('Поддержка зрения:', caps.supportsVision);
console.log('Окно контекста:', caps.contextWindow);

// Проверить конкретные возможности
if (supportsTools('llama3.2')) {
  // Включить вызов инструментов
}

if (supportsVision('llava')) {
  // Включить обработку изображений
}
```

### Генератор контента

Генератор контента предоставляет высокоуровневый интерфейс для генерации контента.

```typescript
import {
  HybridContentGenerator,
  createHybridContentGenerator,
} from '@ollama-code/ollama-code-core';

const generator = createHybridContentGenerator({
  model: 'llama3.2',
  baseUrl: 'http://localhost:11434',
});

// Генерация контента
for await (const chunk of generator.generateStream({
  prompt: 'Объясни дженерики TypeScript',
})) {
  process.stdout.write(chunk.text);
}
```

---

## Ollama Client

### Native Client

`OllamaNativeClient` предоставляет прямой доступ к REST API Ollama.

```typescript
import { OllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = new OllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  timeout: 300000,
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### API методы

#### Список моделей

```typescript
const { models } = await client.listModels();

models.forEach(model => {
  console.log(`- ${model.name}`);
  console.log(`  Размер: ${model.size} байт`);
  console.log(`  Изменён: ${model.modified_at}`);
});
```

#### Информация о модели

```typescript
const info = await client.showModel({ name: 'llama3.2' });

console.log('Лицензия:', info.license);
console.log('Шаблон:', info.template);
console.log('Параметры:', info.parameters);
```

#### Генерация (потоковая)

```typescript
await client.generate({
  model: 'llama3.2',
  prompt: 'Напиши стих о программировании',
  stream: true,
  options: {
    temperature: 0.7,
    top_p: 0.9,
    num_predict: 500,
  },
}, (chunk) => {
  process.stdout.write(chunk.response ?? '');
});
```

#### Чат (потоковая)

```typescript
await client.chat({
  model: 'llama3.2',
  messages: [
    { role: 'system', content: 'Ты полезный ассистент.' },
    { role: 'user', content: 'Что такое TypeScript?' },
  ],
  stream: true,
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Получить текущую погоду',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
          },
          required: ['location'],
        },
      },
    },
  ],
}, (chunk) => {
  if (chunk.message?.content) {
    process.stdout.write(chunk.message.content);
  }
  if (chunk.message?.tool_calls) {
    console.log('Вызовы инструментов:', chunk.message.tool_calls);
  }
});
```

#### Эмбеддинги

```typescript
const { embedding } = await client.embed({
  model: 'nomic-embed-text',
  input: 'Привет, мир!',
});

console.log('Размерность эмбеддинга:', embedding.length);
```

#### Загрузка модели

```typescript
await client.pull({
  name: 'llama3.2',
  stream: true,
}, (progress) => {
  console.log(`Статус: ${progress.status}`);
  if (progress.completed && progress.total) {
    const percent = (progress.completed / progress.total * 100).toFixed(1);
    console.log(`Прогресс: ${percent}%`);
  }
});
```

### Контекстный клиент

Контекстный клиент обеспечивает повторное использование KV-кэша для быстрых ответов.

```typescript
import { OllamaContextClient } from '@ollama-code/ollama-code-core';

const contextClient = new OllamaContextClient({
  baseUrl: 'http://localhost:11434',
});

// Первый запрос - создаёт контекст
const result1 = await contextClient.generate({
  model: 'llama3.2',
  sessionId: 'chat-1',
  prompt: 'Привет!',
});

console.log('Контекст создан:', result1.context);

// Второй запрос - повторно использует контекст (быстрее!)
const result2 = await contextClient.generate({
  model: 'llama3.2',
  sessionId: 'chat-1',
  prompt: 'Как дела?',
  context: result1.context, // Передаём предыдущий контекст
});
```

---

## Система инструментов

### Обзор

Система инструментов предоставляет комплексный набор инструментов для операций с кодом.

### Встроенные инструменты

| Инструмент | Категория | Описание |
|------------|-----------|----------|
| `read_file` | Файл | Чтение содержимого файла |
| `write_file` | Файл | Запись содержимого файла |
| `edit_file` | Файл | Редактирование файлов с diff/patch |
| `list_directory` | Файл | Список содержимого директории |
| `glob` | Файл | Поиск файлов по паттерну |
| `grep` | Поиск | Поиск содержимого файлов |
| `ripGrep` | Поиск | Быстрый поиск с ripgrep |
| `shell` | Выполнение | Выполнение shell команд |
| `task` | Агент | Создание субагентов |
| `web_fetch` | Сеть | Получение веб-контента |
| `web_search` | Сеть | Поиск в интернете |
| `memory` | Состояние | Управление памятью |
| `skill` | ИИ | Выполнение ИИ навыков |
| `lsp` | Код | Language Server Protocol |
| `mcp` | Интеграция | MCP инструменты |

### Создание пользовательских инструментов

```typescript
import {
  BaseDeclarativeTool,
  ToolInvocation,
  ToolResult,
  Kind,
} from '@ollama-code/ollama-code-core';

// Определение интерфейса параметров
interface MyToolParams {
  input: string;
  options?: {
    verbose?: boolean;
  };
}

// Определение вызова
class MyToolInvocation implements ToolInvocation<MyToolParams, ToolResult> {
  constructor(readonly params: MyToolParams) {}

  getDescription(): string {
    return `Обработка: ${this.params.input}`;
  }

  toolLocations() {
    return [];
  }

  async shouldConfirmExecute(): Promise<false> {
    return false; // Подтверждение не требуется
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    // Реализация логики инструмента
    const result = await processData(this.params.input);

    return {
      llmContent: result,
      returnDisplay: `Обработано: ${this.params.input}`,
    };
  }
}

// Определение инструмента
class MyTool extends BaseDeclarativeTool<MyToolParams, ToolResult> {
  constructor() {
    super(
      'my_tool',           // name
      'Мой Инструмент',    // displayName
      'Обработка данных',  // description
      Kind.Other,          // kind
      {                    // JSON schema
        type: 'object',
        properties: {
          input: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              verbose: { type: 'boolean' },
            },
          },
        },
        required: ['input'],
      },
      true,                // isOutputMarkdown
      false,               // canUpdateOutput
    );
  }

  protected createInvocation(params: MyToolParams): ToolInvocation<MyToolParams, ToolResult> {
    return new MyToolInvocation(params);
  }
}
```

### Реестр инструментов

```typescript
import { ToolRegistry } from '@ollama-code/ollama-code-core';

const registry = new ToolRegistry();

// Регистрация инструмента
registry.registerTool(new MyTool());

// Список инструментов
const tools = registry.listTools();
console.log('Доступные инструменты:', tools.map(t => t.name));

// Выполнение инструмента
const result = await registry.executeTool('my_tool', {
  input: 'тестовые данные',
  options: { verbose: true },
});
```

---

## Система плагинов

### Обзор

Система плагинов обеспечивает расширяемость через пользовательские плагины.

### Структура плагина

```
my-plugin/
├── plugin.json           # Манифест плагина
├── src/
│   ├── index.ts         # Точка входа
│   ├── tools/           # Пользовательские инструменты
│   │   └── myTool.ts
│   ├── commands/        # Пользовательские команды
│   │   └── myCommand.ts
│   └── skills/          # ИИ навыки
│       └── mySkill.md
└── package.json
```

### Манифест плагина

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Мой пользовательский плагин",
  "main": "dist/index.js",
  "tools": ["tools/*.js"],
  "commands": ["commands/*.js"],
  "skills": ["skills/*.md"],
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": { "type": "string" }
    }
  }
}
```

### Загрузчик плагинов

```typescript
import { PluginLoader, PluginManager } from '@ollama-code/ollama-code-core';

const loader = new PluginLoader(config);
const manager = new PluginManager(config);

// Обнаружение плагинов
const plugins = await loader.discoverAll();

// Регистрация плагинов
for (const plugin of plugins) {
  await manager.registerPlugin(plugin);
}

// Включение плагина
await manager.enablePlugin('my-plugin');

// Отключение плагина
await manager.disablePlugin('my-plugin');
```

### Песочница плагинов

Плагины могут быть изолированы в песочнице для безопасности:

```typescript
import { PluginSandbox } from '@ollama-code/ollama-code-core';

const sandbox = new PluginSandbox({
  allowedPaths: ['/project/src'],
  deniedPaths: ['/project/.env'],
  allowedCommands: ['npm', 'git'],
  networkAccess: false,
});

await sandbox.execute(plugin, 'method', args);
```

---

## Потоковая передача

### Обзор

Модуль потоковой передачи предоставляет надёжные возможности потоковой передачи с контролем противодавления и отменой.

### Контроллер потоковой передачи

```typescript
import { StreamingController } from '@ollama-code/ollama-code-core';

const controller = new StreamingController({
  highWaterMark: 1024 * 1024, // 1MB буфер
  pauseThreshold: 0.8,        // Пауза при 80% ёмкости
});

// Запись чанков
controller.write(chunk1);
controller.write(chunk2);

// Чтение чанков
for await (const chunk of controller) {
  process.stdout.write(chunk);
}

// Завершение потока
controller.end();
```

### Отмена

```typescript
import { CancellationTokenSource } from '@ollama-code/ollama-code-core';

const source = new CancellationTokenSource({
  timeout: 30000, // 30 секунд таймаут
});

const token = source.token;

// Проверка отмены
if (token.isCancellationRequested) {
  throw new Error('Отменено');
}

// Передача в асинхронную операцию
await fetchData({
  signal: token.toAbortSignal(),
});

// Отмена по запросу
source.cancel('Пользователь запросил отмену');
```

### Контроль противодавления

```typescript
import { BackpressureController } from '@ollama-code/ollama-code-core';

const backpressure = new BackpressureController({
  maxSize: 10 * 1024 * 1024, // 10MB макс буфер
  strategy: 'drop-oldest',    // Когда буфер полон
});

// Проверка перед записью
if (backpressure.shouldPause()) {
  await backpressure.waitForDrain();
}

backpressure.write(data);
```

---

## Кэширование

### Кэширование контекста

Кэширование контекста обеспечивает повторное использование KV-кэша через API контекста Ollama.

```typescript
import { ContextCacheManager } from '@ollama-code/ollama-code-core';

const cacheManager = new ContextCacheManager({
  maxSize: 100,        // Макс 100 закэшированных контекстов
  ttl: 30 * 60 * 1000, // 30 минут TTL
});

// Сохранение контекста
await cacheManager.store('session-1', {
  model: 'llama3.2',
  context: [1, 2, 3, 4, 5],
  prompt: 'Привет!',
});

// Получение контекста
const cached = await cacheManager.retrieve('session-1');
if (cached) {
  console.log('Использование закэшированного контекста:', cached.context);
}
```

### Кэширование результатов инструментов

```typescript
import { ToolResultCache } from '@ollama-code/ollama-code-core';

const toolCache = new ToolResultCache({
  maxSize: 1000,
  ttl: 60 * 60 * 1000, // 1 час
});

// Кэширование результата инструмента
const cacheKey = toolCache.generateKey('read_file', { path: '/src/index.ts' });
await toolCache.set(cacheKey, result);

// Получение закэшированного результата
const cached = await toolCache.get(cacheKey);
```

### Кэширование эмбеддингов

```typescript
import { EmbeddingCache } from '@ollama-code/ollama-code-core';

const embeddingCache = new EmbeddingCache({
  maxSize: 10000,
});

// Кэширование эмбеддинга
await embeddingCache.set('Привет, мир!', embedding);

// Получение закэшированного эмбеддинга
const cached = await embeddingCache.get('Привет, мир!');
```

---

## LSP интеграция

### Обзор

Модуль LSP обеспечивает интеграцию Language Server Protocol для интеллектуальной работы с кодом.

### LSP Клиент

```typescript
import { NativeLspClient, LspConnectionFactory } from '@ollama-code/ollama-code-core';

// Создание LSP клиента
const lspClient = new NativeLspClient({
  serverCommand: ['typescript-language-server', '--stdio'],
  initializationOptions: {
    preferences: {
      includeInlayParameterNameHints: 'all',
    },
  },
});

// Запуск сервера
await lspClient.start();

// Получение дополнений
const completions = await lspClient.getCompletions({
  file: '/src/index.ts',
  line: 10,
  character: 5,
});

// Получение определений
const definitions = await lspClient.getDefinition({
  file: '/src/index.ts',
  line: 10,
  character: 5,
});

// Получение hover информации
const hover = await lspClient.getHover({
  file: '/src/index.ts',
  line: 10,
  character: 5,
});

// Завершение работы
await lspClient.shutdown();
```

### LSP Сервис

```typescript
import { NativeLspService } from '@ollama-code/ollama-code-core';

const lspService = new NativeLspService({
  servers: {
    typescript: {
      command: ['typescript-language-server', '--stdio'],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    python: {
      command: ['pylsp'],
      extensions: ['.py'],
    },
  },
});

// Автоопределение и использование соответствующего сервера
const result = await lspService.getCompletions({
  file: '/src/app.ts',
  line: 10,
  character: 5,
});
```

---

## MCP поддержка

### Обзор

Model Context Protocol (MCP) обеспечивает интеграцию с внешними инструментами и сервисами.

### MCP Клиент

```typescript
import { MCPClient } from '@ollama-code/ollama-code-core';

const mcpClient = new MCPClient({
  server: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/project'],
  },
  name: 'filesystem',
});

// Подключение к серверу
await mcpClient.connect();

// Список доступных инструментов
const tools = await mcpClient.listTools();

// Вызов инструмента
const result = await mcpClient.callTool('read_file', {
  path: '/src/index.ts',
});

// Список ресурсов
const resources = await mcpClient.listResources();

// Чтение ресурса
const content = await mcpClient.readResource('file:///src/index.ts');

// Отключение
await mcpClient.disconnect();
```

### OAuth аутентификация

```typescript
import { MCPOAuthProvider, KeychainTokenStorage } from '@ollama-code/ollama-code-core';

const auth = new MCPOAuthProvider({
  clientId: 'my-client-id',
  authorizationEndpoint: 'https://example.com/oauth/authorize',
  tokenEndpoint: 'https://example.com/oauth/token',
  scopes: ['read', 'write'],
  storage: new KeychainTokenStorage('my-app'),
});

// Запуск OAuth потока
await auth.authenticate();

// Проверка аутентификации
if (await auth.isAuthenticated()) {
  const tokens = await auth.getTokens();
  console.log('Access token:', tokens.accessToken);
}

// Выход
await auth.signOut();
```

---

## Субагенты

### Обзор

Субагенты — специализированные ИИ-агенты, которые могут выполнять сложные задачи.

### Менеджер субагентов

```typescript
import { SubagentManager, Subagent } from '@ollama-code/ollama-code-core';

const manager = new SubagentManager(config);

// Создание субагента
const agent = await manager.createAgent({
  name: 'code-reviewer',
  description: 'Проверяет код на качество и баги',
  systemPrompt: 'Ты рецензент кода...',
  tools: ['read_file', 'grep', 'lsp'],
  model: 'llama3.2',
});

// Выполнение задачи
const result = await agent.execute({
  task: 'Проверить модуль аутентификации',
  context: 'Проверить /src/auth на проблемы безопасности',
});

console.log(result.output);
console.log(result.stats);
```

### Встроенные агенты

```typescript
import { BuiltinAgents } from '@ollama-code/ollama-code-core';

// Список встроенных агентов
const agents = BuiltinAgents.list();
// [
//   { name: 'architect', description: '...' },
//   { name: 'debugger', description: '...' },
//   { name: 'tester', description: '...' },
// ]

// Получение определения агента
const architectDef = BuiltinAgents.get('architect');
```

### Пользовательские агенты

```typescript
import { Subagent, SubagentHooks } from '@ollama-code/ollama-code-core';

class MyCustomAgent extends Subagent {
  constructor(config) {
    super({
      name: 'my-custom-agent',
      description: 'Пользовательский агент для специфических задач',
      systemPrompt: '...',
      tools: ['read_file', 'write_file', 'shell'],
    });
  }

  // Пользовательские хуки
  hooks: SubagentHooks = {
    onToolCall: async (toolName, args) => {
      console.log(`Инструмент вызван: ${toolName}`);
    },
    onMessage: async (message) => {
      console.log(`Сообщение: ${message}`);
    },
    onComplete: async (result) => {
      console.log(`Завершено со статусом: ${result.status}`);
    },
  };
}
```

---

## API справочник

### OllamaNativeClient

```typescript
class OllamaNativeClient {
  constructor(config: {
    baseUrl?: string;      // по умолчанию: 'http://localhost:11434'
    timeout?: number;      // по умолчанию: 300000 (5 мин)
    headers?: Record<string, string>;
  });

  // Управление моделями
  listModels(): Promise<OllamaTagsResponse>;
  showModel(req: OllamaShowRequest): Promise<OllamaShowResponse>;
  pullModel(req: OllamaPullRequest, onProgress?: ProgressCallback): Promise<void>;
  pushModel(req: OllamaPushRequest, onProgress?: ProgressCallback): Promise<void>;
  copyModel(req: OllamaCopyRequest): Promise<void>;
  deleteModel(req: OllamaDeleteRequest): Promise<void>;

  // Генерация
  generate(req: OllamaGenerateRequest, onChunk?: StreamCallback): Promise<OllamaGenerateResponse>;
  chat(req: OllamaChatRequest, onChunk?: StreamCallback): Promise<OllamaChatResponse>;
  embed(req: OllamaEmbedRequest): Promise<OllamaEmbedResponse>;
  embeddings(req: OllamaEmbeddingsRequest): Promise<OllamaEmbeddingsResponse>;

  // Запущенные модели
  listRunning(): Promise<OllamaPsResponse>;

  // Версия
  version(): Promise<OllamaVersionResponse>;
}
```

### ToolRegistry

```typescript
class ToolRegistry {
  registerTool(tool: AnyDeclarativeTool): void;
  unregisterTool(name: string): void;
  getTool(name: string): AnyDeclarativeTool | undefined;
  listTools(): AnyDeclarativeTool[];
  executeTool(name: string, params: object): Promise<ToolResult>;
}
```

### SubagentManager

```typescript
class SubagentManager {
  createAgent(config: SubagentConfig): Promise<Subagent>;
  getAgent(name: string): Subagent | undefined;
  listAgents(): Subagent[];
  deleteAgent(name: string): void;
}
```

---

## Лучшие практики

### Обработка ошибок

```typescript
import { ToolErrorType } from '@ollama-code/ollama-code-core';

try {
  const result = await tool.execute(signal);
} catch (error) {
  if (error.type === ToolErrorType.FILE_NOT_FOUND) {
    console.log('Файл не найден');
  } else if (error.type === ToolErrorType.PERMISSION_DENIED) {
    console.log('Доступ запрещён');
  } else {
    throw error;
  }
}
```

### Очистка ресурсов

```typescript
// Используйте AbortController для очистки
const controller = new AbortController();

try {
  await client.chat({
    model: 'llama3.2',
    messages: [...],
    signal: controller.signal,
  });
} finally {
  controller.abort();
}
```

### Управление памятью

```typescript
// Сжимайте контекст, когда он становится большим
if (context.length > 10000) {
  context = await compressContext(context);
}

// Очищайте кэши периодически
cacheManager.clear();
```

### Параллельные операции

```typescript
// Используйте мьютекс для общего состояния
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

async function safeOperation() {
  const release = await mutex.acquire();
  try {
    // Критическая секция
  } finally {
    release();
  }
}
```

---

## Лицензия

Apache License 2.0
