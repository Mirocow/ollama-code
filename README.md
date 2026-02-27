# Ollama Code

**Ollama Code** — это CLI-инструмент для работы с AI-ассистентом по программированию, использующий локальные модели Ollama. Проект предоставляет полный контроль над кодом и данными, работая полностью офлайн.

## Возможности

- 🚀 **Полностью локальная работа** — все модели запускаются локально через Ollama
- 💻 **CLI-интерфейс** — удобный терминальный интерфейс на базе Ink (React for CLI)
- 🔧 **Инструменты для кода** — чтение, редактирование, поиск файлов, выполнение команд
- 🔌 **MCP поддержка** — интеграция с Model Context Protocol серверами
- 🌐 **Веб-поиск** — интеграция с Tavily и Google Custom Search
- 📦 **Расширения** — система расширений для добавления новых возможностей
- 🐛 **Отладка** — встроенная поддержка отладки через VSCode
- 🧠 **Thinking Models** — поддержка моделей с рассуждениями (DeepSeek R1)
- 📊 **Code Analysis** — анализ качества кода с оценкой A-F
- 🎨 **Diagram Generator** — создание Mermaid и PlantUML диаграмм
- 🔀 **Git Advanced** — продвинутые git операции (stash, cherry-pick, rebase, bisect)
- 🌐 **API Tester** — тестирование REST API endpoints

## Требования

- **Node.js** >= 20.0.0
- **Ollama** установленный и запущенный (https://ollama.ai)

## Быстрый старт

### Установка зависимостей

```bash
# Клонировать репозиторий
git clone <repository-url>
cd ollama-code

# Установить зависимости
npm install

# Собрать проект
npm run build
```

### Запуск

```bash
# Интерактивный режим
npm run start

# С указанием модели
npm run start -- --model llama3.2

# Одноразовый запрос
npm run start -- "Объясни, как работает async/await в JavaScript"

# Режим отладки
npm run debug
```

## Новые возможности v0.12.0

### UI/UX Улучшения

```typescript
// Прогресс-бар для загрузки моделей
<ProgressBar
  progress={45}
  label="Downloading model"
  speed="5.2 MB/s"
  eta="2m 30s"
/>

// Thinking indicator для thinking моделей
<ThinkingIndicator
  message="Analyzing code..."
  elapsedTime={45}
  showContent
/>

// Token usage display
<TokenUsageDisplay
  totalTokens={1500}
  promptTokens={500}
  completionTokens={1000}
  tokensPerSecond={45}
/>

// GPU/Memory indicator
<GPUUsage
  name="NVIDIA RTX 4090"
  utilization={85}
  memoryUsed={20 * 1024 * 1024 * 1024}
  memoryTotal={24 * 1024 * 1024 * 1024}
/>
```

### Database Tool

```bash
> Выполни SELECT * FROM users LIMIT 10 в SQLite базе data.db
> Сохрани backup базы в /backup/db.sql
> Покажи схему таблицы users
```

### Docker Tool

```bash
> Запусти контейнер nginx на порту 8080
> Покажи логи контейнера my-app
> Останови все контейнеры
> Собери Docker образ из текущей директории
```

### Redis Tool

```bash
> Получи значение ключа session:user:123
> Установи cache:data со сроком 1 час
> Опубликуй сообщение в канал notifications
> Покажи все ключи с префиксом user:
```

### Performance

- **Response Caching**: Кэширование ответов LLM с LRU eviction
- **Embedding Caching**: Кэширование эмбеддингов для быстрого поиска

---

## Возможности v0.11.0

### Thinking Models (DeepSeek R1)

```typescript
// Модели с рассуждениями показывают процесс мышления
const response = await client.chat({
  model: 'deepseek-r1:8b',
  messages: [{ role: 'user', content: 'Реши задачу...' }],
  think: true,
});
```

### Structured Outputs (JSON Schema)

```typescript
// Структурированный вывод по схеме
const response = await client.generate({
  model: 'llama3.2',
  prompt: 'Извлеки данные...',
  format: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name'],
  },
});
```

### Code Analyzer Tool

```bash
> Проанализируй файл src/index.ts на качество кода

# Результат:
# Score: 85/100 (Grade: B)
# Issues: 2 warnings, 1 error
# Recommendations: Добавить обработку ошибок
```

### Git Advanced Tool

```bash
> Сохрани изменения в stash с сообщением "WIP"
> Перенеси коммит abc123 в текущую ветку
> Найди баг с помощью bisect между v1.0 и HEAD
```

### API Tester Tool

```bash
> Протестируй GET https://api.example.com/users
> Отправь POST на /api/users с данными {"name": "Test"}
```

### Diagram Generator

```bash
> Создай блок-схему процесса авторизации
> Нарисуй sequence diagram для API запроса
```

## Структура проекта

```
ollama-code/
├── packages/
│   ├── core/           # Ядро: Ollama клиент, инструменты, типы
│   ├── cli/            # CLI интерфейс на базе Ink
│   ├── webui/          # Веб-компоненты для UI
│   ├── sdk-typescript/ # SDK для программного использования
│   └── vscode-ide-companion/  # VSCode расширение
├── scripts/            # Скрипты сборки и запуска
├── integration-tests/  # Интеграционные тесты
└── docs/              # Документация
```

## Документация

| Документ                                       | Описание                     |
| ---------------------------------------------- | ---------------------------- |
| [USAGE_GUIDE.md](./docs/USAGE_GUIDE.md)        | Руководство по использованию |
| [EXAMPLES.md](./docs/EXAMPLES.md)              | Примеры использования        |
| [TUTORIAL.md](./docs/TUTORIAL.md)              | Туториал для начинающих      |
| [OLLAMA_API.md](./docs/OLLAMA_API.md)          | Документация API             |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Структура проекта            |
| [ROADMAP.md](./ROADMAP.md)                     | План развития                |

## Основные команды

| Команда             | Описание                   |
| ------------------- | -------------------------- |
| `npm run build`     | Собрать все пакеты         |
| `npm run start`     | Запустить CLI              |
| `npm run dev`       | Запуск в режиме разработки |
| `npm run debug`     | Запуск с отладчиком        |
| `npm run test`      | Запустить тесты            |
| `npm run lint`      | Проверить код линтером     |
| `npm run typecheck` | Проверка типов TypeScript  |

## Параметры CLI

```
Options:
  -d, --debug                     Режим отладки
  -m, --model                     Указать модель
  -s, --sandbox                   Запуск в песочнице
  -y, --yolo                      Автоматическое подтверждение всех действий
      --approval-mode             Режим подтверждения: plan, default, auto-edit, yolo
      --experimental-lsp          Включить экспериментальную поддержку LSP
      --ollama-base-url           URL Ollama сервера (по умолчанию: http://localhost:11434)
      --ollama-api-key            API ключ для удалённых инстансов
```

## Переменные окружения

| Переменная                   | Описание                                      |
| ---------------------------- | --------------------------------------------- |
| `OLLAMA_BASE_URL`            | URL Ollama сервера                            |
| `OLLAMA_API_KEY`             | API ключ (опционально)                        |
| `OLLAMA_MODEL`               | Модель по умолчанию                           |
| `OLLAMA_KEEP_ALIVE`          | Время удержания модели в памяти (default: 5m) |
| `DEBUG`                      | Включить режим отладки (1 или true)           |
| `OLLAMA_CODE_DEBUG_LOG_FILE` | Логирование в файл                            |

## Отладка в VSCode

Проект включает готовые конфигурации VSCode для отладки:

1. Откройте проект в VSCode
2. Нажмите F5 или выберите "Run and Debug"
3. Выберите конфигурацию:
   - **Debug Ollama Code CLI** — базовая отладка
   - **Debug Ollama Code CLI (with args)** — с аргументами
   - **Debug Current Test File** — отладка текущего теста

## API Ollama

Проект использует нативные API Ollama:

### Основные endpoints

| Endpoint        | Метод | Описание                 |
| --------------- | ----- | ------------------------ |
| `/api/tags`     | GET   | Список локальных моделей |
| `/api/show`     | POST  | Информация о модели      |
| `/api/generate` | POST  | Генерация текста         |
| `/api/chat`     | POST  | Чат с моделью            |
| `/api/embed`    | POST  | Эмбеддинги               |
| `/api/create`   | POST  | Создание модели          |
| `/api/pull`     | POST  | Загрузка модели          |
| `/api/ps`       | GET   | Запущенные модели        |
| `/api/version`  | GET   | Версия Ollama            |

Документация API: [OLLAMA_API.md](./docs/OLLAMA_API.md)

## Рекомендуемые модели

| Модель             | Назначение             | Размер |
| ------------------ | ---------------------- | ------ |
| `llama3.2`         | Общего назначения      | 3B     |
| `deepseek-r1:8b`   | Рассуждения (thinking) | 8B     |
| `codellama`        | Программирование       | 7B+    |
| `mistral`          | Общего назначения      | 7B     |
| `nomic-embed-text` | Эмбеддинги             | 274M   |

## Разработка

### Сборка отдельного пакета

```bash
# Сборка core
npm run build --workspace=packages/core

# Сборка cli
npm run build --workspace=packages/cli
```

### Запуск тестов

```bash
# Все тесты
npm run test

# Тесты core пакета
npm run test --workspace=packages/core

# Интеграционные тесты
npm run test:integration:sandbox:none
```

### Добавление нового инструмента

1. Создайте файл в `packages/core/src/tools/`
2. Реализуйте класс, наследующий `BaseDeclarativeTool`
3. Экспортируйте из `index.ts`

## Лицензия

Apache License 2.0

## Содействие

См. [CONTRIBUTING.md](./CONTRIBUTING.md) для руководства по участию в разработке.
