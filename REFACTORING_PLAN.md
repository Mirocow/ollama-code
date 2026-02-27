# Рефакторинг ollama-code для работы с Ollama API

## Статус: ЗАВЕРШЕНО ✅

## Цель

Рефакторинг проекта для работы **только** с Ollama API.

---

## Поддерживаемые Ollama API методы

### Основные методы

| Метод          | Endpoint           | Описание                 |
| -------------- | ------------------ | ------------------------ |
| `chat()`       | POST /api/chat     | Чат с моделью            |
| `generate()`   | POST /api/generate | Генерация текста         |
| `listModels()` | GET /api/tags      | Список локальных моделей |
| `showModel()`  | POST /api/show     | Информация о модели      |

### Дополнительные методы

| Метод                 | Endpoint             | Описание                   |
| --------------------- | -------------------- | -------------------------- |
| `getVersion()`        | GET /api/version     | Версия Ollama              |
| `listRunningModels()` | GET /api/ps          | Запущенные модели          |
| `embed()`             | POST /api/embed      | Эмбеддинги                 |
| `embeddings()`        | POST /api/embeddings | Эмбеддинги (legacy)        |
| `pullModel()`         | POST /api/pull       | Загрузка модели            |
| `pushModel()`         | POST /api/push       | Отправка модели            |
| `copyModel()`         | POST /api/copy       | Копирование модели         |
| `deleteModel()`       | DELETE /api/delete   | Удаление модели            |
| `unloadModel()`       | -                    | Выгрузка модели из памяти  |
| `keepModelLoaded()`   | -                    | Держать модель загруженной |

---

## Архитектура

### OllamaNativeClient

Расположение: `packages/core/src/core/ollamaNativeClient.ts`

Нативный клиент для работы с Ollama REST API:

- ✅ Поддержка streaming и non-streaming режимов
- ✅ Поддержка tools (function calling)
- ✅ Поддержка AbortSignal для отмены запросов
- ✅ Улучшенная обработка ошибок с классами OllamaApiError
- ✅ Автоматический retry с exponential backoff
- ✅ Автоматический парсинг NDJSON
- ✅ Поддержка keep_alive параметра (default: 5m)
- ✅ Поддержка multimodal (изображения)

### OllamaNativeContentGenerator

Расположение: `packages/core/src/core/ollamaNativeContentGenerator/`

Генератор контента, использующий нативный Ollama API:

- ✅ Конвертация форматов (GenAI ↔ Ollama)
- ✅ Поддержка стриминга
- ✅ Поддержка инструментов
- ✅ Поддержка изображений (multimodal)
- ✅ Оценка токенов

### Типы данных

Расположение: `packages/core/src/types/content.ts`

Нативные типы для Ollama Code:

- `Content`, `Part`, `Role` - типы сообщений
- `FunctionDeclaration`, `FunctionCall`, `FunctionResponse` - типы функций
- `Tool`, `ToolConfig` - типы инструментов
- `GenerateContentParameters`, `GenerateContentResponse` - типы генерации

### Обработка ошибок

Расположение: `packages/core/src/utils/ollamaErrors.ts`

Классы ошибок для Ollama API:

- `OllamaApiError` - базовый класс
- `OllamaConnectionError` - ошибки подключения
- `OllamaModelNotFoundError` - модель не найдена
- `OllamaTimeoutError` - таймаут запроса
- `OllamaAbortError` - отмена запроса
- `OllamaContextLengthError` - превышен контекст
- `OllamaResourceError` - нехватка ресурсов GPU
- `detectOllamaError()` - автоматическое определение ошибки
- `getFriendlyOllamaErrorMessage()` - дружелюбное сообщение

### ApiLogger

Расположение: `packages/core/src/utils/apiLogger.ts`

Логгер для API запросов:

- Логирование запросов и ответов
- Поддержка кастомных директорий
- Обратная совместимость с OpenAILogger

---

## Использование

### Базовый пример

```typescript
import { createOllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = createOllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  keepAlive: '5m', // Default keep_alive
  timeout: 300000, // 5 minutes
  retry: {
    // Retry configuration
    maxRetries: 3,
    retryDelayMs: 1000,
  },
});

// Список моделей
const { models } = await client.listModels();
console.log(
  'Available models:',
  models.map((m) => m.name),
);

// Информация о модели
const info = await client.showModel('llama3.2');
console.log('Model details:', info.details);

// Генерация текста
const response = await client.generate({
  model: 'llama3.2',
  prompt: 'Why is the sky blue?',
});
console.log(response.response);

// Чат
const chatResponse = await client.chat({
  model: 'llama3.2',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});
console.log(chatResponse.message.content);
```

### Стриминг

```typescript
// Генерация со стримингом
await client.generate(
  {
    model: 'llama3.2',
    prompt: 'Tell me a story',
  },
  (chunk) => {
    process.stdout.write(chunk.response);
  },
);

// Чат со стримингом
await client.chat(
  {
    model: 'llama3.2',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  (chunk) => {
    if (chunk.message?.content) {
      process.stdout.write(chunk.message.content);
    }
  },
);
```

### Retry с exponential backoff

```typescript
const client = createOllamaNativeClient({
  retry: {
    maxRetries: 3, // Maximum retry attempts
    retryDelayMs: 1000, // Initial delay (exponential backoff)
    retryOnErrors: [
      // Errors that trigger retry
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
    ],
  },
});

// Или per-request override
await client.generate({ model: 'llama3.2', prompt: 'Hello' }, undefined, {
  retry: { maxRetries: 5 },
});
```

### Обработка ошибок

```typescript
import {
  OllamaModelNotFoundError,
  OllamaConnectionError,
  detectOllamaError,
  getFriendlyOllamaErrorMessage,
} from '@ollama-code/ollama-code-core';

try {
  const response = await client.chat({
    model: 'unknown-model',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
} catch (error) {
  const ollamaError = detectOllamaError(error, { modelName: 'unknown-model' });

  if (ollamaError instanceof OllamaModelNotFoundError) {
    console.log('Model not found. Run: ollama pull unknown-model');
  } else if (ollamaError instanceof OllamaConnectionError) {
    console.log('Cannot connect to Ollama. Is it running?');
  }

  // User-friendly message
  console.log(getFriendlyOllamaErrorMessage(error));
}
```

---

## Тестирование

### Запуск тестов

```bash
# Unit тесты
cd packages/core
npm test

# Интеграционные тесты (требуется запущенный Ollama)
OLLAMA_TEST_MODEL=llama3.2 npm run test:ollama

# Скрипт тестирования API
bash scripts/test-ollama-api.sh llama3.2
```

### Результаты тестов

- OllamaNativeClient: 40 тестов (29 passed, 11 skipped)
- OllamaNativeContentGenerator: 19 тестов (все passed)
- OllamaContentConverter: 27 тестов (все passed)

---

## VSCode Debug

Конфигурация для отладки в `.vscode/`:

### launch.json

- `Debug Ollama Code CLI` - базовая отладка
- `Debug Ollama Code CLI (with args)` - с аргументами
- `Debug Current Test File` - отладка теста
- `Attach to Process` - подключение к процессу

### tasks.json

- `Build` - сборка всех пакетов
- `Test` - запуск тестов
- `Lint` - проверка кода
- `Start (Debug)` - запуск с отладчиком

---

## Конфигурация

### Переменные окружения

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=300000
OLLAMA_KEEP_ALIVE=5m
```

### Файл настроек (~/.ollama-code/settings.json)

```json
{
  "model": "llama3.2",
  "baseUrl": "http://localhost:11434"
}
```

---

## Выполненные работы

### Фаза 1: Базовый рефакторинг

1. ✅ Удалены зависимости от `@google/genai`
2. ✅ Созданы нативные типы данных
3. ✅ Реализован OllamaNativeClient
4. ✅ Реализован OllamaNativeContentGenerator
5. ✅ Добавлена поддержка стриминга
6. ✅ Добавлена поддержка function calling (tools)
7. ✅ Добавлена поддержка multimodal (изображения)

### Фаза 2: Улучшения API

8. ✅ Обновлены комментарии в коде
9. ✅ Написаны unit и integration тесты
10. ✅ Создан ApiLogger (замена OpenAILogger)
11. ✅ Добавлена поддержка AbortSignal
12. ✅ Документирован keep_alive параметр
13. ✅ Обновлена документация OLLAMA_API.md

### Фаза 3: Улучшения проекта

14. ✅ Исправлена совместимость react-devtools-core с ink
15. ✅ Добавлена VSCode конфигурация (launch.json, tasks.json)
16. ✅ Добавлены классы ошибок OllamaApiError
17. ✅ Добавлен retry с exponential backoff
18. ✅ Добавлен default keep_alive (5m)
19. ✅ Написана документация для core и CLI пакетов
20. ✅ Создан PROJECT_STRUCTURE.md с описанием файлов
21. ✅ Добавлены методы unloadModel(), keepModelLoaded()

---

## Коммиты

1. `refactor: remove @google/genai references from comments`
2. `docs: update REFACTORING_PLAN with final status`
3. `feat: add ApiLogger, refactor OpenAILogger for backward compatibility`
4. `feat: add AbortSignal support to OllamaNativeClient`
5. `docs: update OLLAMA_API.md with keep_alive and AbortSignal examples`
6. `fix: update embedContent test to match actual API response`
7. `feat: add improved error handling, VSCode debug config, and documentation`
8. `docs: add comprehensive project structure documentation`
9. `feat: add retry logic, keepAlive defaults, improved streaming`
10. `docs: update OLLAMA_API.md with new features`

---

## Документация

| Файл                                                         | Описание                      |
| ------------------------------------------------------------ | ----------------------------- |
| [README.md](README.md)                                       | Основная документация проекта |
| [OLLAMA_API.md](docs/OLLAMA_API.md)                          | Полное описание API           |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)                 | Описание всех файлов проекта  |
| [packages/core/docs/README.md](packages/core/docs/README.md) | Документация core пакета      |
| [packages/cli/docs/README.md](packages/cli/docs/README.md)   | Документация CLI              |
| [REFACTORING_PLAN.md](REFACTORING_PLAN.md)                   | Этот документ                 |
