# Рефакторинг ollama-code для работы только с Ollama API

## Цель
Рефакторинг проекта для работы **только** с Ollama API, удаление зависимостей от:
- `@google/genai` (67 файлов)
- `openai` SDK (7 файлов)
- `@anthropic-ai/sdk` (не используется)

## Поддерживаемые Ollama API методы
```bash
# Генерация текста
curl http://localhost:11434/api/generate -d '{"model": "llama3.2", "prompt": "..."}'

# Чат
curl http://localhost:11434/api/chat -d '{"model": "llama3.2", "messages": []}'

# Список моделей
curl http://localhost:11434/api/tags

# Информация о модели
curl http://localhost:11434/api/show -d '{"model": "llava"}'
```

---

## Этап 1: Создание типов Ollama API

### 1.1 Создать файл `packages/core/src/types/ollama.ts`
Определить типы для Ollama API:
- `OllamaMessage` - сообщение чата
- `OllamaChatRequest` - запрос к /api/chat
- `OllamaChatResponse` - ответ от /api/chat
- `OllamaGenerateRequest` - запрос к /api/generate
- `OllamaGenerateResponse` - ответ от /api/generate
- `OllamaTool` - определение инструмента
- `OllamaToolCall` - вызов инструмента
- `OllamaModel` - информация о модели
- `OllamaTagsResponse` - ответ от /api/tags

### 1.2 Создать файл `packages/core/src/types/content.ts`
Типы для контента (замена @google/genai типов):
- `Content` - сообщение в диалоге
- `Part` - часть сообщения (text, functionCall, functionResponse)
- `FunctionDeclaration` - объявление функции
- `FunctionCall` - вызов функции
- `FunctionResponse` - ответ функции

---

## Этап 2: Создание OllamaContentGenerator

### 2.1 Создать `packages/core/src/core/ollamaContentGenerator/index.ts`
Новый генератор контента, использующий нативный Ollama API:
- `OllamaContentGenerator` - реализация интерфейса ContentGenerator
- Использует `/api/chat` для генерации
- Поддержка стриминга
- Поддержка инструментов (tools)

### 2.2 Создать `packages/core/src/core/ollamaContentGenerator/converter.ts`
Конвертер типов:
- `contentToOllamaMessages()` - конвертация Content[] в OllamaMessage[]
- `ollamaResponseToContent()` - конвертация ответа Ollama в Content
- `functionDeclarationsToOllamaTools()` - конвертация инструментов

### 2.3 Создать `packages/core/src/core/ollamaContentGenerator/streaming.ts`
Обработка стриминга:
- Парсинг NDJSON ответов
- Агрегация чанков
- Обработка tool_calls

---

## Этап 3: Замена типов @google/genai

### 3.1 Обновить импорты в файлах
Заменить во всех 67 файлах:
```typescript
// Было
import type { Content, Part, FunctionDeclaration } from '@google/genai';

// Станет
import type { Content, Part, FunctionDeclaration } from '../types/content.js';
```

### 3.2 Удалить зависимости от @google/genai
Файлы для обновления:
- `src/core/contentGenerator.ts`
- `src/core/baseLlmClient.ts`
- `src/core/ollamaClient.ts`
- `src/core/prompts.ts`
- `src/tools/*.ts`
- `src/utils/*.ts`
- И все остальные (67 файлов)

---

## Этап 4: Удаление OpenAI SDK

### 4.1 Удалить OpenAI-зависимости
Файлы для рефакторинга:
- `src/core/openaiContentGenerator/` → переименовать в `ollamaContentGenerator/`
- `src/core/openaiContentGenerator/provider/ollama.ts` → удалить (использовать нативный API)

### 4.2 Обновить ContentGeneratorConfig
Убрать параметры, специфичные для OpenAI:
- `enableOpenAILogging`
- `openAILoggingDir`
- Добавить `ollamaBaseUrl` (по умолчанию http://localhost:11434)

---

## Этап 5: Обновление OllamaNativeClient

### 5.1 Расширить OllamaNativeClient
Добавить методы:
- `chat()` - уже есть, проверить соответствие API
- `generate()` - уже есть, проверить соответствие API
- `listModels()` - уже есть (/api/tags)
- `showModel()` - уже есть (/api/show)

### 5.2 Добавить поддержку инструментов
- Параметр `tools` в запросе
- Обработка `tool_calls` в ответе

---

## Этап 6: Обновление конфигурации

### 6.1 Упростить AuthType
Оставить только `USE_OLLAMA`:
```typescript
export enum AuthType {
  USE_OLLAMA = 'ollama',
}
```

### 6.2 Обновить настройки
Убрать параметры для других провайдеров:
- Убрать `apiKey` (не нужен для Ollama)
- Добавить `ollamaUrl` (по умолчанию http://localhost:11434)

---

## Этап 7: Тестирование и очистка

### 7.1 Обновить тесты
- Заменить моки @google/genai на моки Ollama API
- Обновить типы в тестах

### 7.2 Удалить неиспользуемый код
- Удалить файлы для OpenAI/Anthropic/Gemini
- Убрать зависимости из package.json

### 7.3 Обновить документацию
- README.md
- Примеры использования

---

## Порядок выполнения

1. **Этап 1** - Создание типов (можно делать параллельно)
2. **Этап 2** - Создание генератора (зависит от этапа 1)
3. **Этап 3** - Замена типов (зависит от этапа 1)
4. **Этап 4** - Удаление OpenAI (зависит от этапов 2, 3)
5. **Этап 5** - Обновление клиента (параллельно с этапом 2)
6. **Этап 6** - Конфигурация (зависит от этапов 2, 3, 4)
7. **Этап 7** - Тестирование (в конце)

---

## Коммиты (примерные)

1. `feat(types): add Ollama API types to replace @google/genai`
2. `feat(core): add OllamaContentGenerator using native API`
3. `refactor: replace @google/genai imports with local types`
4. `refactor: remove OpenAI SDK dependency`
5. `refactor: simplify AuthType to only support Ollama`
6. `test: update tests for Ollama API`
7. `docs: update README for Ollama-only usage`
