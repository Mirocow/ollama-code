# Примеры использования Ollama Code

## Содержание

1. [Базовое использование CLI](#базовое-использование-cli)
2. [Работа с файлами](#работа-с-файлами)
3. [Git операции](#git-операции)
4. [Анализ кода](#анализ-кода)
5. [API тестирование](#api-тестирование)
6. [Диаграммы](#диаграммы)
7. [Программное использование](#программное-использование)

---

## Базовое использование CLI

### Запуск

```bash
# Стандартный запуск
npm run start

# С отладкой
npm run debug

# Сборка и запуск
npm run build && npm run start
```

### Основные команды

```bash
# В интерфейсе CLI:
> Помоги написать функцию сортировки на Python

> Объясни этот код:
```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
```

> Создай README.md для этого проекта
```

---

## Работа с файлами

### Чтение файлов

```bash
> Прочитай файл src/index.ts и объясни его структуру
```

### Редактирование файлов

```bash
> Добавь комментарии к функциям в файле utils.ts
```

### Создание файлов

```bash
> Создай файл tests/utils.test.ts с тестами для утилит
```

---

## Git операции

### Stash управление

```bash
> Сохрани текущие изменения в stash с сообщением "WIP: feature X"

# Ассистент использует git_advanced tool:
# operation: stash_save
# args: { message: "WIP: feature X" }
```

### Cherry-pick

```bash
> Перенеси коммит abc1234 из branch-feature в текущую ветку

# operation: cherry_pick
# args: { commit: "abc1234" }
```

### Bisect (поиск бага)

```bash
> Помоги найти коммит, который сломал тесты
# Ассистент будет использовать bisect_start, bisect_good, bisect_bad
```

---

## Анализ кода

### Анализ файла

```bash
> Проанализируй файл src/core/client.ts на качество кода

# Инструмент code_analyzer вернёт:
# - Метрики сложности
# - Проблемы безопасности
# - Паттерны проектирования
# - Оценку качества (A-F)
```

### Пример результата анализа

```
## Code Analysis: src/core/client.ts

**Language:** typescript
**Score:** 85/100 (Grade: B)

### Metrics
- Lines of Code: 450
- Cyclomatic Complexity: 12
- Functions: 25
- Classes: 3

### Issues Found: 3
- [WARNING] Moderate cyclomatic complexity (12)
- [INFO] File is moderately long (450 lines)
- [ERROR] Hardcoded API key detected (line 45)

### Recommendations
- Simplify complex logic
- Address security issues before deployment
```

---

## API тестирование

### GET запрос

```bash
> Протестируй GET https://api.example.com/users

# api_tester tool:
# url: "https://api.example.com/users"
# method: "GET"
```

### POST с данными

```bash
> Отправь POST запрос на https://api.example.com/users
  с данными {"name": "John", "email": "john@example.com"}

# api_tester tool:
# url: "https://api.example.com/users"
# method: "POST"
# body: {"name": "John", "email": "john@example.com"}
# headers: {"Content-Type": "application/json"}
```

### С аутентификацией

```bash
> Протестируй защищённый endpoint с Bearer токеном

# api_tester tool:
# url: "https://api.example.com/protected"
# auth: { type: "bearer", token: "your-token" }
```

### С валидацией схемы

```bash
> Проверь что ответ соответствует схеме:
{
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" }
  },
  "required": ["id", "name"]
}
```

---

## Диаграммы

### Mermaid диаграммы

```bash
> Создай блок-схему процесса авторизации

# diagram_generator tool:
# type: "mermaid"
# content: |
flowchart TD
    A[Start] --> B{User authenticated?}
    B -->|Yes| C[Show Dashboard]
    B -->|No| D[Show Login]
    D --> E[Enter Credentials]
    E --> F{Valid?}
    F -->|Yes| C
    F -->|No| D
```

### Sequence диаграмма

```bash
> Нарисуй sequence diagram для API запроса

sequenceDiagram
    participant Client
    participant Server
    participant Database
    Client->>Server: POST /api/users
    Server->>Database: INSERT INTO users
    Database-->>Server: Success
    Server-->>Client: 201 Created
```

### PlantUML

```bash
> Создай UML диаграмму классов

@startuml
class User {
  +id: number
  +name: string
  +email: string
}
class Order {
  +id: number
  +userId: number
  +total: number
}
User "1" --> "*" Order
@enduml
```

---

## Программное использование

### Инициализация клиента

```typescript
import { createOllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = createOllamaNativeClient({
  baseUrl: 'http://localhost:11434',
  keepAlive: '5m',
  timeout: 300000,
  retry: {
    maxRetries: 3,
    retryDelayMs: 1000,
  },
});
```

### Чат с моделью

```typescript
// Non-streaming
const response = await client.chat({
  model: 'llama3.2',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});
console.log(response.message.content);

// Streaming
await client.chat(
  {
    model: 'llama3.2',
    messages: [{ role: 'user', content: 'Tell me a story' }],
  },
  (chunk) => {
    process.stdout.write(chunk.message.content || '');
  }
);
```

### Thinking модели

```typescript
// DeepSeek R1, Qwen thinking models
const response = await client.chat({
  model: 'deepseek-r1:8b',
  messages: [{ role: 'user', content: 'Solve: x^2 + 5x + 6 = 0' }],
  think: true,  // Включить thinking mode
});

// response.message.thinking содержит рассуждения
// response.message.content содержит ответ
```

### Structured Outputs

```typescript
// JSON Schema для структурированного вывода
const response = await client.generate({
  model: 'llama3.2',
  prompt: 'Extract person info from: John is 25 years old',
  format: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name', 'age'],
  },
});

// response.response будет валидным JSON
const person = JSON.parse(response.response);
// { name: "John", age: 25 }
```

### Создание моделей

```typescript
// Создание модели из Modelfile
await client.createModel({
  name: 'my-assistant',
  modelfile: `
FROM llama3.2
SYSTEM You are a helpful coding assistant.
PARAMETER temperature 0.7
`,
}, (progress) => {
  console.log(`${progress.status}: ${progress.percentage}%`);
});

// Удобный метод
await client.createModelFrom('llama3.2', 'my-coder', {
  system: 'You are an expert programmer.',
  parameters: { temperature: 0.7 },
});
```

### Работа с инструментами

```typescript
// Function calling
const response = await client.chat({
  model: 'llama3.2',
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' },
          },
          required: ['location'],
        },
      },
    },
  ],
});

if (response.message.tool_calls) {
  for (const call of response.message.tool_calls) {
    console.log(`Tool: ${call.function.name}`);
    console.log(`Args: ${JSON.stringify(call.function.arguments)}`);
  }
}
```

### Обработка ошибок

```typescript
import {
  OllamaModelNotFoundError,
  OllamaConnectionError,
  OllamaTimeoutError,
  detectOllamaError,
  getFriendlyOllamaErrorMessage,
} from '@ollama-code/ollama-code-core';

try {
  await client.chat({
    model: 'unknown-model',
    messages: [{ role: 'user', content: 'Hello' }],
  });
} catch (error) {
  const ollamaError = detectOllamaError(error, { modelName: 'unknown-model' });
  
  if (ollamaError instanceof OllamaModelNotFoundError) {
    console.log('Model not found. Run: ollama pull unknown-model');
  } else if (ollamaError instanceof OllamaConnectionError) {
    console.log('Cannot connect. Is Ollama running?');
  } else if (ollamaError instanceof OllamaTimeoutError) {
    console.log('Request timed out');
  }
  
  // User-friendly message
  console.log(getFriendlyOllamaErrorMessage(error));
}
```

### Retry с exponential backoff

```typescript
const client = createOllamaNativeClient({
  retry: {
    maxRetries: 3,
    retryDelayMs: 1000, // Начальная задержка
    retryOnErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  },
});

// Задержки: 1s, 2s, 4s (exponential backoff)
```

### Request cancellation

```typescript
const controller = new AbortController();

// Отмена через 10 секунд
setTimeout(() => controller.abort(), 10000);

try {
  await client.generate(
    {
      model: 'llama3.2',
      prompt: 'Write a very long story...',
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

---

## Советы и лучшие практики

### 1. Выбор модели

```bash
# Для кода: qwen3-coder, codellama, deepseek-coder
# Для рассуждений: deepseek-r1, qwq
# Для общих задач: llama3.2, mistral
```

### 2. Оптимизация контекста

```typescript
// Установите размер контекста
await client.chat({
  model: 'llama3.2',
  messages: [...],
  options: { num_ctx: 8192 }, // Увеличенный контекст
});
```

### 3. Управление памятью

```typescript
// Держать модель загруженной
await client.keepModelLoaded('llama3.2', '10m');

// Выгрузить модель
await client.unloadModel('llama3.2');
```

### 4. Отладка

```bash
# Включить debug логирование
DEBUG=1 npm run start

# Логи сохраняются в ~/.ollama-code/debug/
```
