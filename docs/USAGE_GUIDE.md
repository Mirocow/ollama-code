# Полное руководство по использованию Ollama Code

## Содержание

1. [Введение](#введение)
2. [Установка и настройка](#установка-и-настройка)
3. [Запуск CLI](#запуск-cli)
4. [Использование API клиента](#использование-api-клиента)
5. [Конфигурация](#конфигурация)
6. [Отладка](#отладка)
7. [Тестирование](#тестирование)
8. [Устранение неполадок](#устранение-неполадок)

---

## Введение

**Ollama Code** — это CLI-инструмент для работы с AI-ассистентом через Ollama API. Проект предоставляет:
- Интерактивный терминальный интерфейс для общения с AI
- Нативный клиент для Ollama REST API
- Поддержку streaming (потокового вывода)
- Поддержку function calling (инструментов)
- Обработку ошибок с понятными сообщениями

---

## Установка и настройка

### Предварительные требования

1. **Node.js** >= 18.0.0
2. **pnpm** (рекомендуется) или npm
3. **Ollama** сервер (должен быть запущен)

### Установка Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Запуск сервера
ollama serve

# Загрузка модели
ollama pull qwen3-coder:30b
```

### Клонирование и сборка

```bash
# Клонирование репозитория
git clone <repository-url>
cd ollama-code

# Установка зависимостей
pnpm install

# Сборка проекта
pnpm build
```

### Проверка установки

```bash
# Проверка версии Ollama
curl http://localhost:11434/api/version

# Должно вернуть что-то вроде:
# {"version":"0.5.7"}
```

---

## Запуск CLI

### Базовый запуск

```bash
# Из корня проекта
pnpm start

# Или напрямую
node packages/cli/dist/index.js
```

### Режим отладки

```bash
# С включенным debug логированием
DEBUG=1 pnpm start

# С логированием в файл
OLLAMA_CODE_DEBUG_LOG_FILE=1 pnpm start
```

### С параметрами

```bash
# Указать модель
node packages/cli/dist/index.js --model llama3.2

# Указать URL Ollama
OLLAMA_BASE_URL=http://192.168.1.100:11434 pnpm start
```

### Интерактивное использование

После запуска CLI вы увидите интерактивное окно чата:

```
╭──────────────────────────────────────────────────────────────────╮
│ Ollama Code - AI Assistant                                       │
│ Model: qwen3-coder:30b                                           │
╰──────────────────────────────────────────────────────────────────╯

You: Привет! Напиши функцию для сортировки массива на Python.

AI: Конечно! Вот функция сортировки массива на Python:

```python
def sort_array(arr):
    """Сортирует массив в порядке возрастания."""
    return sorted(arr)

# Пример использования
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
sorted_numbers = sort_array(numbers)
print(sorted_numbers)  # [1, 1, 2, 3, 4, 5, 6, 9]
```

Эта функция использует встроенный метод `sorted()`...

You: _
```

### Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Enter` | Отправить сообщение |
| `Ctrl+C` | Отмена текущей операции |
| `Ctrl+C` дважды | Выход из CLI |
| `Ctrl+D` | Выход из CLI |
| `↑` / `↓` | История сообщений |

---

## Использование API клиента

### Импорт и создание клиента

```typescript
import { createOllamaNativeClient } from '@ollama-code/ollama-code-core';

// Создание клиента с настройками по умолчанию
const client = createOllamaNativeClient();

// Или с явными настройками
const client = createOllamaNativeClient({
  baseUrl: 'http://localhost:11434',  // URL Ollama сервера
  timeout: 300000,                     // Таймаут: 5 минут
  keepAlive: '5m',                     // Держать модель загруженной 5 минут
  retry: {                             // Retry конфигурация
    maxRetries: 3,
    retryDelayMs: 1000,
  },
});
```

### Управление моделями

```typescript
// Список локальных моделей
const { models } = await client.listModels();
console.log('Доступные модели:', models.map(m => m.name));
// Вывод: ['llama3.2:latest', 'qwen3-coder:30b', ...]

// Информация о конкретной модели
const info = await client.showModel('llama3.2');
console.log('Параметры:', info.parameters);
console.log('Шаблон:', info.template);
console.log('Детали:', info.details);
// details: { format: 'gguf', family: 'llama', parameter_size: '3B', ... }

// Список запущенных моделей
const { models: running } = await client.listRunningModels();
console.log('Запущенные модели:', running.map(m => m.name));

// Загрузка новой модели с прогрессом
await client.pullModel('llama3.2', (progress) => {
  console.log(`${progress.status}: ${progress.percentage?.toFixed(1)}%`);
});
// Вывод: pulling manifest: 100.0%
//        downloading: 45.2%
//        ...

// Удаление модели
await client.deleteModel('old-model:latest');

// Копирование модели
await client.copyModel('llama3.2', 'llama3-backup');
```

### Генерация текста

```typescript
// Без стриминга
const response = await client.generate({
  model: 'llama3.2',
  prompt: 'Почему небо синее?',
});
console.log(response.response);

// Со стримингом
await client.generate(
  { model: 'llama3.2', prompt: 'Расскажи историю' },
  (chunk) => process.stdout.write(chunk.response)
);

// С параметрами генерации
const response = await client.generate({
  model: 'llama3.2',
  prompt: 'Напиши код для сортировки',
  options: {
    temperature: 0.7,    // Креативность (0-1)
    top_p: 0.9,          // Nucleus sampling
    num_predict: 500,    // Макс. токенов
    stop: ['\n\n'],      // Стоп-слова
  },
});
```

### Чат с моделью

```typescript
// Простой чат
const response = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [
    { role: 'system', content: 'Ты помощник программиста.' },
    { role: 'user', content: 'Напиши Hello World на Python' },
  ],
});
console.log(response.message.content);

// Чат со стримингом
await client.chat(
  {
    model: 'qwen3-coder:30b',
    messages: [{ role: 'user', content: 'Привет!' }],
  },
  (chunk) => {
    if (chunk.message?.content) {
      process.stdout.write(chunk.message.content);
    }
  }
);

// Мультимодальный чат (с изображениями)
const response = await client.chat({
  model: 'llava',
  messages: [
    {
      role: 'user',
      content: 'Что на этом изображении?',
      images: ['<base64-encoded-image>'],
    },
  ],
});
```

### Function Calling (Инструменты)

```typescript
// Определение инструментов
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Получить текущую погоду для города',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'Название города',
          },
        },
        required: ['city'],
      },
    },
  },
];

// Запрос с инструментами
const response = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [{ role: 'user', content: 'Какая погода в Москве?' }],
  tools,
});

// Обработка tool calls
if (response.message.tool_calls) {
  for (const toolCall of response.message.tool_calls) {
    console.log('Инструмент:', toolCall.function.name);
    console.log('Аргументы:', toolCall.function.arguments);
    // Вывод: Инструмент: get_weather
    //        Аргументы: { city: 'Москва' }

    // Выполнение функции и отправка результата
    const result = await getWeather(toolCall.function.arguments.city);

    // Продолжение диалога с результатом
    const followUp = await client.chat({
      model: 'qwen3-coder:30b',
      messages: [
        { role: 'user', content: 'Какая погода в Москве?' },
        response.message,
        {
          role: 'tool',
          content: JSON.stringify({ temperature: '22°C', condition: 'sunny' }),
        },
      ],
      tools,
    });
  }
}
```

### Эмбеддинги

```typescript
// Новая версия API
const embedResponse = await client.embed({
  model: 'all-minilm',
  input: ['Привет, мир!', 'Как дела?'],
});
console.log('Эмбеддинги:', embedResponse.embeddings);
// embeddings: [[0.123, -0.456, ...], [0.789, 0.012, ...]]

// Legacy версия
const legacyResponse = await client.embeddings({
  model: 'all-minilm',
  prompt: 'Текст для векторизации',
});
console.log('Вектор:', legacyResponse.embedding);
```

### Управление памятью моделей

```typescript
// Выгрузить модель из памяти
await client.unloadModel('llama3.2');

// Держать модель загруженной 10 минут
await client.keepModelLoaded('llama3.2', '10m');

// Держать модель загруженной бесконечно
await client.keepModelLoaded('llama3.2', -1);

// Перепроверить доступность модели
const isAvailable = await client.isModelAvailable('llama3.2');
if (!isAvailable) {
  await client.ensureModelAvailable('llama3.2', (progress) => {
    console.log(`Загрузка: ${progress.percentage}%`);
  });
}
```

### Отмена запросов

```typescript
const controller = new AbortController();

// Отмена через 10 секунд
setTimeout(() => controller.abort(), 10000);

try {
  const response = await client.generate(
    { model: 'llama3.2', prompt: 'Долгий запрос...' },
    undefined,
    { signal: controller.signal }
  );
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Запрос отменен');
  }
}
```

---

## Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта или установите переменные:

```bash
# URL Ollama сервера
OLLAMA_BASE_URL=http://localhost:11434

# Таймаут запросов (миллисекунды)
OLLAMA_TIMEOUT=300000

# Время удержания модели в памяти
OLLAMA_KEEP_ALIVE=5m

# API ключ (для удаленных серверов)
OLLAMA_API_KEY=your-api-key

# Режим отладки
DEBUG=1
OLLAMA_CODE_DEBUG_LOG_FILE=1
```

### Файл настроек

Настройки хранятся в `~/.ollama-code/settings.json`:

```json
{
  "model": "qwen3-coder:30b",
  "baseUrl": "http://localhost:11434",
  "timeout": 300000,
  "keepAlive": "5m",
  "theme": "dark",
  "language": "ru"
}
```

### Конфигурация retry

```typescript
const client = createOllamaNativeClient({
  retry: {
    maxRetries: 3,           // Макс. попыток
    retryDelayMs: 1000,      // Начальная задержка (мс)
    retryOnErrors: [         // Ошибки для retry
      'ECONNRESET',          // Сброс соединения
      'ETIMEDOUT',           // Таймаут
      'ENOTFOUND',           // DNS ошибка
      'network error',       // Сетевая ошибка
    ],
  },
});
```

---

## Отладка

### VSCode отладка

Проект включает готовую конфигурацию VSCode (`.vscode/launch.json`):

1. **Debug Ollama Code CLI** — базовая отладка CLI
2. **Debug Ollama Code CLI (with args)** — с аргументами командной строки
3. **Debug Current Test File** — отладка текущего теста
4. **Debug Core Package** — отладка core пакета
5. **Attach to Process** — подключение к запущенному процессу

Для использования:
1. Откройте проект в VSCode
2. Нажмите `F5` или перейдите в Run and Debug
3. Выберите нужную конфигурацию

### Debug логирование

```typescript
import {
  createDebugLogger,
  setDebugLogSession
} from '@ollama-code/ollama-code-core';

// Установка сессии
setDebugLogSession(session);

// Создание логгера
const logger = createDebugLogger('MyComponent');

logger.debug('Отладочное сообщение', { data: 123 });
logger.info('Информационное сообщение');
logger.warn('Предупреждение');
logger.error('Ошибка', error);
```

Логи сохраняются в `~/.ollama-code/debug/<session-id>.log`.

### Включение debug режима

```bash
# Включить debug вывод
DEBUG=1 pnpm start

# Включить логирование в файл
OLLAMA_CODE_DEBUG_LOG_FILE=1 pnpm start

# Оба режима
DEBUG=1 OLLAMA_CODE_DEBUG_LOG_FILE=1 pnpm start
```

---

## Тестирование

### Unit тесты

```bash
# Все тесты
pnpm test

# Тесты core пакета
cd packages/core && pnpm test

# Конкретный файл
pnpm test -- ollamaNativeClient.test.ts

# С покрытием
pnpm test -- --coverage
```

### Интеграционные тесты

```bash
# Требуется запущенный Ollama сервер
OLLAMA_TEST_MODEL=llama3.2 pnpm run test:ollama

# Скрипт тестирования API
bash scripts/test-ollama-api.sh llama3.2
```

### Структура тестов

```
packages/core/src/
├── core/
│   ├── ollamaNativeClient.test.ts       # Тесты клиента
│   └── ollamaNativeContentGenerator/
│       └── ollamaNativeContentGenerator.test.ts
├── utils/
│   └── ollamaErrors.test.ts             # Тесты ошибок
└── types/
    └── content.test.ts                   # Тесты типов
```

---

## Устранение неполадок

### Ollama сервер не запущен

```
Error: Cannot connect to Ollama server
```

**Решение:**
```bash
# Проверьте статус
curl http://localhost:11434/api/version

# Запустите сервер
ollama serve
```

### Модель не найдена

```
Error: Model 'llama3.2' not found
```

**Решение:**
```bash
# Загрузите модель
ollama pull llama3.2

# Или список доступных
ollama list
```

### Таймаут запроса

```
Error: Request timed out after 300000ms
```

**Решение:**
```typescript
// Увеличьте таймаут
const client = createOllamaNativeClient({
  timeout: 600000,  // 10 минут
});
```

### Ошибка контекста

```
Error: Context length exceeded
```

**Решение:**
- Начните новую сессию чата
- Уменьшите размер контекста:
```typescript
await client.chat({
  model: 'llama3.2',
  messages: [...],
  options: { num_ctx: 2048 }  // Меньше контекст
});
```

### Проблемы с памятью GPU

```
Error: Not enough GPU memory
```

**Решение:**
```bash
# Выгрузите неиспользуемые модели
ollama stop llama3.2

# Или используйте модель меньшего размера
ollama run llama3.2:1b
```

### Проблемы со стримингом

Если стриминг не работает:

```typescript
// Проверьте, что callback передан
await client.generate(
  { model: 'llama3.2', prompt: 'Test' },
  (chunk) => console.log(chunk.response)  // ← Обязательный callback
);
```

### Логирование для диагностики

```bash
# Включите debug режим
DEBUG=1 OLLAMA_CODE_DEBUG_LOG_FILE=1 pnpm start

# Проверьте логи
cat ~/.ollama-code/debug/*.log
```

---

## Дополнительные ресурсы

| Ресурс | Описание |
|--------|----------|
| [README.md](../README.md) | Основная документация |
| [OLLAMA_API.md](OLLAMA_API.md) | Полное описание API |
| [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) | Структура проекта |
| [Ollama Docs](https://github.com/ollama/ollama/tree/main/docs) | Документация Ollama |

---

## Контакты и поддержка

- GitHub Issues: для сообщений об ошибках
- Документация Ollama: https://ollama.com/docs
