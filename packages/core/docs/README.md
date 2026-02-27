# @ollama-code/ollama-code-core

Ядро Ollama Code — предоставляет базовую функциональность для работы с Ollama API, инструменты для работы с файлами, систему логирования и обработки ошибок.

## Установка

```bash
npm install @ollama-code/ollama-code-core
```

## Основные компоненты

### OllamaNativeClient

Нативный клиент для работы с Ollama REST API.

```typescript
import { OllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = new OllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  timeout: 300000,
});

// Список моделей
const { models } = await client.listModels();

// Информация о модели
const info = await client.showModel('llama3.2');

// Чат с моделью
const response = await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Стриминг
await client.chat(
  { model: 'llama3.2', messages: [...] },
  (chunk) => console.log(chunk.message.content),
);

// Генерация
const gen = await client.generate({
  model: 'llama3.2',
  prompt: 'Write a function to sort an array',
});
```

### Обработка ошибок

```typescript
import {
  OllamaApiError,
  OllamaConnectionError,
  OllamaModelNotFoundError,
  detectOllamaError,
  getFriendlyOllamaErrorMessage,
} from '@ollama-code/ollama-code-core';

try {
  await client.chat({ model: 'unknown-model', messages: [...] });
} catch (error) {
  const ollamaError = detectOllamaError(error, { modelName: 'unknown-model' });

  if (ollamaError instanceof OllamaModelNotFoundError) {
    console.log('Модель не найдена. Выполните: ollama pull unknown-model');
  }

  // Дружелюбное сообщение
  console.log(getFriendlyOllamaErrorMessage(error));
}
```

### Debug логирование

```typescript
import {
  createDebugLogger,
  setDebugLogSession,
} from '@ollama-code/ollama-code-core';

// Создать логгер с тегом
const logger = createDebugLogger('MyModule');

logger.debug('Отладочное сообщение');
logger.info('Информационное сообщение');
logger.warn('Предупреждение');
logger.error('Ошибка', error);
```

### Инструменты

Ядро предоставляет набор инструментов для работы с файлами и системой:

- **read-file** — чтение файлов
- **write-file** — запись файлов
- **edit** — редактирование файлов
- **glob** — поиск файлов по паттерну
- **grep** — поиск в файлах
- **ls** — листинг директорий
- **shell** — выполнение команд
- **web-fetch** — загрузка веб-страниц
- **web-search** — веб-поиск
- **memory** — долгосрочная память
- **task** — субагенты

```typescript
import { ToolRegistry } from '@ollama-code/ollama-code-core';

const registry = new ToolRegistry();
const tools = registry.getToolDefinitions();
```

## Структура пакета

```
packages/core/
├── src/
│   ├── core/
│   │   ├── ollamaNativeClient.ts    # Нативный клиент Ollama
│   │   ├── ollamaNativeContentGenerator/  # Генератор контента
│   │   ├── logger.ts                # Логирование
│   │   └── prompts.ts               # Системные промпты
│   ├── tools/
│   │   ├── tools.ts                 # Регистрация инструментов
│   │   ├── tool-registry.ts         # Реестр инструментов
│   │   └── *.ts                     # Отдельные инструменты
│   ├── utils/
│   │   ├── errors.ts                # Базовые ошибки
│   │   ├── ollamaErrors.ts          # Ошибки Ollama
│   │   ├── debugLogger.ts           # Debug логирование
│   │   └── *.ts                     # Утилиты
│   ├── config/
│   │   ├── config.ts                # Конфигурация
│   │   └── storage.ts               # Хранилище
│   └── types/
│       └── content.ts               # Типы контента
└── dist/                            # Скомпилированный код
```

## API Reference

### OllamaNativeClient

#### Конструктор

```typescript
new OllamaNativeClient(options?: {
  baseUrl?: string;      // URL Ollama сервера
  timeout?: number;      // Таймаут в мс
  config?: Config;       // Конфигурация (для будущих расширений)
})
```

#### Методы

| Метод | Описание |
|-------|----------|
| `listModels()` | Список локальных моделей |
| `showModel(model)` | Информация о модели |
| `generate(request, callback?, options?)` | Генерация текста |
| `chat(request, callback?, options?)` | Чат с моделью |
| `embed(request)` | Эмбеддинги |
| `pullModel(name, progressCallback?)` | Загрузка модели |
| `isServerRunning()` | Проверка доступности сервера |
| `waitForServer(maxAttempts?, delayMs?)` | Ожидание сервера |
| `isModelAvailable(modelName)` | Проверка наличия модели |

### Типы

```typescript
// Сообщение чата
interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[];  // base64
  tool_calls?: OllamaToolCall[];
}

// Ответ генерации
interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}
```

## Разработка

### Сборка

```bash
npm run build
```

### Тесты

```bash
npm run test
```

### Тестирование Ollama API

```bash
npm run test:ollama
```

## Конфигурация

### Переменные окружения

| Переменная | Описание |
|------------|----------|
| `OLLAMA_BASE_URL` | URL Ollama сервера |
| `OLLAMA_API_KEY` | API ключ |
| `OLLAMA_CODE_DEBUG_LOG_FILE` | Включить логирование в файл |

### Файлы конфигурации

Конфигурация хранится в:
- `~/.ollama-code/settings.json` — настройки пользователя
- `~/.ollama-code/memory.json` — долгосрочная память
- `.ollamaignore` — игнорируемые файлы (в корне проекта)

## Лицензия

Apache License 2.0
