# Интеграция с Ollama Native API

Этот проект предоставляет нативный клиент Ollama API для прямой коммуникации с сервером Ollama.

## Поддерживаемые API эндпоинты

| Эндпоинт       | Метод | Описание                      |
| -------------- | ----- | ----------------------------- |
| `/api/version` | GET   | Получить версию Ollama        |
| `/api/tags`    | GET   | Список локальных моделей      |
| `/api/show`    | POST  | Информация о модели           |
| `/api/ps`      | GET   | Список запущенных моделей     |
| `/api/generate`| POST  | Генерация текста из промпта   |
| `/api/chat`    | POST  | Чат с моделью                 |
| `/api/embed`   | POST  | Генерация эмбеддингов         |
| `/api/pull`    | POST  | Загрузка модели               |
| `/api/push`    | POST  | Отправка модели               |
| `/api/copy`    | POST  | Копирование модели            |
| `/api/delete`  | DELETE| Удаление модели               |

## Быстрый старт

### Использование CLI

```bash
# Сборка проекта
npm run build

# Запуск CLI
node packages/cli/dist/index.js
```

### Тестирование API

```bash
# Тест с curl (из корня проекта)
bash scripts/test-ollama-api.sh qwen3-coder:30b

# Или тест с Node.js (из packages/core)
npm run test:ollama
```

### Использование curl

```bash
# Получить версию
curl http://localhost:11434/api/version

# Список моделей
curl http://localhost:11434/api/tags

# Информация о модели
curl http://localhost:11434/api/show -d '{"model": "qwen3-coder:30b"}'

# Генерация текста (без стриминга)
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3-coder:30b",
  "prompt": "Почему небо синее?",
  "stream": false
}'

# Генерация текста (со стримингом)
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3-coder:30b",
  "prompt": "Почему небо синее?",
  "stream": true
}'

# Чат (без стриминга)
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3-coder:30b",
  "messages": [
    {"role": "user", "content": "Привет!"}
  ],
  "stream": false
}'

# Чат (со стримингом)
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3-coder:30b",
  "messages": [
    {"role": "user", "content": "Привет!"}
  ],
  "stream": true
}'
```

## Программное использование

### Базовое использование

```typescript
import { createOllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = createOllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  keepAlive: '5m', // Время удержания модели для всех запросов
  timeout: 300000, // Таймаут запроса (5 минут)
  retry: {
    // Конфигурация повторных попыток
    maxRetries: 3,
    retryDelayMs: 1000,
  },
});

// Список моделей
const { models } = await client.listModels();
console.log(
  'Доступные модели:',
  models.map((m) => m.name),
);

// Информация о модели
const info = await client.showModel('qwen3-coder:30b');
console.log('Детали модели:', info.details);

// Генерация текста (без стриминга)
const response = await client.generate({
  model: 'qwen3-coder:30b',
  prompt: 'Напиши Hello World на Python.',
});
console.log(response.response);

// Генерация текста (со стримингом)
await client.generate(
  {
    model: 'qwen3-coder:30b',
    prompt: 'Напиши Hello World на Python.',
  },
  (chunk) => {
    process.stdout.write(chunk.response);
  },
);

// Чат (без стриминга)
const chatResponse = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [
    { role: 'system', content: 'Ты помощник программиста.' },
    {
      role: 'user',
      content: 'Напиши функцию для реверса строки на JavaScript.',
    },
  ],
});
console.log(chatResponse.message.content);

// Чат (со стримингом)
await client.chat(
  {
    model: 'qwen3-coder:30b',
    messages: [{ role: 'user', content: 'Привет!' }],
  },
  (chunk) => {
    if (chunk.message?.content) {
      process.stdout.write(chunk.message.content);
    }
  },
);
```

### С инструментами (Function Calling)

```typescript
const response = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [{ role: 'user', content: 'Какая погода в Москве?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Получить текущую погоду для локации',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Название города',
            },
          },
          required: ['location'],
        },
      },
    },
  ],
});

// Проверка вызовов инструментов
if (response.message.tool_calls) {
  for (const toolCall of response.message.tool_calls) {
    console.log('Инструмент:', toolCall.function.name);
    console.log('Аргументы:', toolCall.function.arguments);
  }
}
```

### Параметры модели

```typescript
const response = await client.generate({
  model: 'qwen3-coder:30b',
  prompt: 'Напиши код для сортировки массива.',
  options: {
    temperature: 0.7, // Креативность (0-1)
    top_p: 0.9,       // Nucleus sampling
    top_k: 40,        // Top-k sampling
    num_predict: 256, // Макс. токенов для генерации
    num_ctx: 4096,    // Размер контекстного окна
    stop: ['\n\n'],   // Стоп-последовательности
    seed: 42,         // Для воспроизводимости
  },
});
```

### Keep Alive

Управление временем удержания моделей в памяти:

```typescript
// Уровень клиента по умолчанию (5 минут)
const client = createOllamaNativeClient({
  keepAlive: '5m', // По умолчанию для всех запросов
});

// Переопределение для конкретного запроса
await client.chat(
  {
    model: 'llama3.2',
    messages: [{ role: 'user', content: 'Привет!' }],
  },
  undefined,
  { keepAlive: '10m' }, // Переопределение для этого запроса
);

// Удерживать модель бесконечно
await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Привет!' }],
  keep_alive: -1,
});

// Выгрузить модель сразу после запроса
await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Привет!' }],
  keep_alive: 0,
});

// Вспомогательные методы
await client.unloadModel('llama3.2'); // Выгрузить немедленно
await client.keepModelLoaded('llama3.2', '10m'); // Держать загруженной 10 минут
```

### Конфигурация Retry

Автоматические повторные попытки с экспоненциальным откатом:

```typescript
const client = createOllamaNativeClient({
  retry: {
    maxRetries: 3,      // Максимальное количество попыток
    retryDelayMs: 1000, // Начальная задержка (экспоненциальный откат)
    retryOnErrors: [
      // Ошибки для повторных попыток
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'network error',
    ],
  },
});

// Переопределение для конкретного запроса
await client.generate({ model: 'llama3.2', prompt: 'Привет' }, undefined, {
  retry: { maxRetries: 5 },
});
```

### Отмена запросов

Отмена длительных запросов с использованием AbortSignal:

```typescript
const controller = new AbortController();

// Отмена через 10 секунд
setTimeout(() => controller.abort(), 10000);

try {
  const response = await client.generate(
    {
      model: 'llama3.2',
      prompt: 'Напиши очень длинную историю...',
    },
    undefined,
    { signal: controller.signal },
  );
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Запрос был отменён');
  }
}
```

## Обработка ошибок

### Типы ошибок

```typescript
import {
  OllamaApiError,
  OllamaConnectionError,
  OllamaModelNotFoundError,
  OllamaTimeoutError,
  OllamaAbortError,
  OllamaContextLengthError,
  OllamaResourceError,
  detectOllamaError,
  getFriendlyOllamaErrorMessage,
} from '@ollama-code/ollama-code-core';

try {
  const response = await client.generate({
    model: 'unknown-model',
    prompt: 'Привет',
  });
} catch (error) {
  const ollamaError = detectOllamaError(error, { modelName: 'unknown-model' });

  if (ollamaError instanceof OllamaModelNotFoundError) {
    console.log('Модель не найдена. Выполните: ollama pull unknown-model');
  } else if (ollamaError instanceof OllamaConnectionError) {
    console.log('Не удаётся подключиться к Ollama. Он запущен?');
  } else if (ollamaError instanceof OllamaTimeoutError) {
    console.log('Превышено время ожидания запроса');
  } else if (ollamaError instanceof OllamaContextLengthError) {
    console.log('Контекст слишком длинный. Начните новый разговор.');
  } else if (ollamaError instanceof OllamaResourceError) {
    console.log('Недостаточно памяти GPU');
  }

  // Дружелюбное сообщение для пользователя
  console.log(getFriendlyOllamaErrorMessage(error));
}
```

### Детекция ошибок

```typescript
// Автоматическое определение ошибок из ответов Ollama
try {
  await client.chat({ model: 'missing-model', messages: [...] });
} catch (error) {
  const detected = detectOllamaError(error, {
    modelName: 'missing-model',
    timeoutMs: 30000,
  });

  console.log('Код ошибки:', detected.code);
  console.log('Сообщение:', detected.message);
  console.log('Детали:', detected.details);
}
```

## Конфигурация

### Переменные окружения

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=300000
OLLAMA_KEEP_ALIVE=5m
OLLAMA_API_KEY=your-api-key  # Опционально для удалённых инстансов
```

### Файл настроек (~/.ollama-code/settings.json)

```json
{
  "model": "qwen3-coder:30b",
  "baseUrl": "http://localhost:11434",
  "timeout": 300000,
  "keepAlive": "5m"
}
```

## Тестирование

### Запуск всех тестов

```bash
# Тест через shell скрипт (требуется запущенный Ollama)
bash scripts/test-ollama-api.sh qwen3-coder:30b

# Тест через Node.js
cd packages/core
npm run test:ollama
```

### Unit тесты

```bash
cd packages/core
npm test -- src/core/ollamaNativeClient.test.ts
```

## Справочник API

### OllamaNativeClient

#### Конструктор

```typescript
new OllamaNativeClient(options?: {
  baseUrl?: string;     // По умолчанию: http://localhost:11434
  timeout?: number;     // По умолчанию: 300000 (5 минут)
  keepAlive?: string | number;  // По умолчанию: '5m'
  retry?: Partial<RetryConfig>; // Конфигурация retry
  config?: Config;      // Опциональная конфигурация для расширенных настроек
})
```

#### Методы

| Метод                                    | Параметры                                                | Возврат                           | Описание                   |
| ---------------------------------------- | -------------------------------------------------------- | --------------------------------- | -------------------------- |
| `getVersion()`                           | -                                                        | `Promise<OllamaVersionResponse>`  | Получить версию Ollama     |
| `listModels()`                           | -                                                        | `Promise<OllamaTagsResponse>`     | Список локальных моделей   |
| `showModel(model)`                       | `string \| OllamaShowRequest`                            | `Promise<OllamaShowResponse>`     | Информация о модели        |
| `listRunningModels()`                    | -                                                        | `Promise<OllamaPsResponse>`       | Список запущенных моделей  |
| `generate(request, callback?, options?)` | `OllamaGenerateRequest, StreamCallback?, RequestOptions?`| `Promise<OllamaGenerateResponse>` | Генерация текста           |
| `chat(request, callback?, options?)`     | `OllamaChatRequest, StreamCallback?, RequestOptions?`    | `Promise<OllamaChatResponse>`     | Чат с моделью              |
| `embed(request)`                         | `OllamaEmbedRequest`                                     | `Promise<OllamaEmbedResponse>`    | Генерация эмбеддингов      |
| `pullModel(name, callback?)`             | `string, ProgressCallback?`                              | `Promise<void>`                   | Загрузка модели            |
| `pushModel(name, callback?)`             | `string, ProgressCallback?`                              | `Promise<void>`                   | Отправка модели            |
| `copyModel(source, dest)`                | `string, string`                                         | `Promise<void>`                   | Копирование модели         |
| `deleteModel(model)`                     | `string`                                                 | `Promise<void>`                   | Удаление модели            |
| `isServerRunning()`                      | -                                                        | `Promise<boolean>`                | Проверка запущен ли сервер |
| `isModelAvailable(name)`                 | `string`                                                 | `Promise<boolean>`                | Проверка существования модели |
| `ensureModelAvailable(name, callback?)`  | `string, ProgressCallback?`                              | `Promise<void>`                   | Загрузка модели при необходимости |
| `unloadModel(name)`                      | `string`                                                 | `Promise<void>`                   | Выгрузка модели из памяти  |
| `keepModelLoaded(name, duration?)`       | `string, string \| number?`                              | `Promise<void>`                   | Удержание модели загруженной |
| `getBaseUrl()`                           | -                                                        | `string`                          | Получить настроенный base URL |
| `getKeepAlive()`                         | -                                                        | `string \| number`                | Получить keep_alive по умолчанию |

#### RequestOptions

```typescript
interface RequestOptions {
  signal?: AbortSignal; // Для отмены запроса
  keepAlive?: string | number; // Переопределение keep_alive
  retry?: Partial<RetryConfig>; // Переопределение конфигурации retry
}

interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  retryOnErrors: string[];
}
```

## Отладка

### Конфигурация отладки VSCode

Проект включает готовые конфигурации отладки VSCode в `.vscode/launch.json`:

1. **Debug Ollama Code CLI** — Отладка CLI с настройками по умолчанию
2. **Debug Ollama Code CLI (with args)** — Отладка с пользовательскими аргументами
3. **Debug Current Test File** — Отладка текущего тестового файла
4. **Debug Core Package** — Отладка тестов core пакета

### Debug логирование

```typescript
import {
  createDebugLogger,
  setDebugLogSession,
} from '@ollama-code/ollama-code-core';

// Установка сессии для логирования
setDebugLogSession(session);

// Создание логгера с тегом
const logger = createDebugLogger('OllamaClient');

logger.debug('Запрос начат', { model: 'llama3.2' });
logger.info('Модель успешно загружена');
logger.warn('Длина контекста приближается к лимиту');
logger.error('Запрос не удался', error);
```

Debug логи сохраняются в `~/.ollama-code/debug/<session-id>.log`.

### Переменные окружения для отладки

```bash
DEBUG=1                       # Включить режим отладки
OLLAMA_CODE_DEBUG_LOG_FILE=1  # Включить логирование в файл
```

---

## Связанная документация

- [USAGE_GUIDE.md](./USAGE_GUIDE.md) — Руководство по использованию
- [FEATURES.ru.md](./FEATURES.ru.md) — Справочник функций
- [TOOLS.ru.md](./TOOLS.ru.md) — Справочник инструментов
