# Рефакторинг ollama-code для работы с Ollama API

## Статус: ЗАВЕРШЕНО ✅

## Цель
Рефакторинг проекта для работы **только** с Ollama API.

---

## Поддерживаемые Ollama API методы

### Основные методы

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `chat()` | POST /api/chat | Чат с моделью |
| `generate()` | POST /api/generate | Генерация текста |
| `listModels()` | GET /api/tags | Список локальных моделей |
| `showModel()` | POST /api/show | Информация о модели |

### Дополнительные методы

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `getVersion()` | GET /api/version | Версия Ollama |
| `listRunningModels()` | GET /api/ps | Запущенные модели |
| `embed()` | POST /api/embed | Эмбеддинги |
| `embeddings()` | POST /api/embeddings | Эмбеддинги (legacy) |
| `pullModel()` | POST /api/pull | Загрузка модели |
| `pushModel()` | POST /api/push | Отправка модели |
| `copyModel()` | POST /api/copy | Копирование модели |
| `deleteModel()` | DELETE /api/delete | Удаление модели |

---

## Архитектура

### OllamaNativeClient
Расположение: `packages/core/src/core/ollamaNativeClient.ts`

Нативный клиент для работы с Ollama REST API:
- Поддержка streaming и non-streaming режимов
- Поддержка tools (function calling)
- Поддержка AbortSignal для отмены запросов
- Обработка ошибок
- Автоматический парсинг NDJSON
- Поддержка keep_alive параметра

### OllamaNativeContentGenerator
Расположение: `packages/core/src/core/ollamaNativeContentGenerator/`

Генератор контента, использующий нативный Ollama API:
- Конвертация форматов (GenAI ↔ Ollama)
- Поддержка стриминга
- Поддержка инструментов
- Поддержка изображений (multimodal)
- Оценка токенов

### Типы данных
Расположение: `packages/core/src/types/content.ts`

Нативные типы для Ollama Code:
- `Content`, `Part`, `Role` - типы сообщений
- `FunctionDeclaration`, `FunctionCall`, `FunctionResponse` - типы функций
- `Tool`, `ToolConfig` - типы инструментов
- `GenerateContentParameters`, `GenerateContentResponse` - типы генерации

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
});

// Список моделей
const { models } = await client.listModels();
console.log('Available models:', models.map(m => m.name));

// Информация о модели
const info = await client.showModel('llama3.2');
console.log('Model details:', info.details);

// Генерация текста
const response = await client.generate({
  model: 'llama3.2',
  prompt: 'Why is the sky blue?',
  stream: false,
});
console.log(response.response);

// Чат
const chatResponse = await client.chat({
  model: 'llama3.2',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
  stream: false,
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
  }
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
  }
);
```

### Отмена запросов (AbortSignal)

```typescript
const controller = new AbortController();

// Отмена через 10 секунд
setTimeout(() => controller.abort(), 10000);

try {
  const response = await client.generate(
    {
      model: 'llama3.2',
      prompt: 'Write a long story...',
    },
    undefined,
    { signal: controller.signal }
  );
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

### Keep Alive

```typescript
// Держать модель загруженной 5 минут
await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Hello!' }],
  keep_alive: '5m',
});

// Держать модель загруженной бесконечно
await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Hello!' }],
  keep_alive: -1,
});

// Выгрузить модель сразу после запроса
await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Hello!' }],
  keep_alive: 0,
});
```

### Function Calling (Tools)

```typescript
const response = await client.chat({
  model: 'llama3.2',
  messages: [
    { role: 'user', content: 'What is the weather in Tokyo?' },
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city name',
            },
          },
          required: ['location'],
        },
      },
    },
  ],
  stream: false,
});

// Проверка на tool calls
if (response.message.tool_calls) {
  for (const toolCall of response.message.tool_calls) {
    console.log('Tool:', toolCall.function.name);
    console.log('Args:', toolCall.function.arguments);
  }
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

## Конфигурация

### Переменные окружения

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=300000
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

---

## Коммиты

1. `refactor: remove @google/genai references from comments`
2. `docs: update REFACTORING_PLAN with final status`
3. `feat: add ApiLogger, refactor OpenAILogger for backward compatibility`
4. `feat: add AbortSignal support to OllamaNativeClient`
5. `docs: update OLLAMA_API.md with keep_alive and AbortSignal examples`
6. `fix: update embedContent test to match actual API response`

---

## Документация

- [OLLAMA_API.md](docs/OLLAMA_API.md) - полное описание API
- [REFACTORING_PLAN.md](REFACTORING_PLAN.md) - этот документ
