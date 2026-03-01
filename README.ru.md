<p align="center">
  <img src="./assets/logo.svg" alt="Ollama Code Logo" width="256" height="256">
</p>

<h1 align="center">Ollama Code</h1>

<p align="center">
  <strong>AI-ассистент для программирования с локальными моделями</strong>
</p>

<p align="center">
  <img src="./assets/interface-context-bar.png" alt="Interface Preview" width="800">
</p>

<p align="center">
  <a href="./README.md">English Version</a> •
  <a href="./docs/FEATURES.ru.md">Функции</a> •
  <a href="./docs/instruments.ru.md">Инструменты</a> •
  <a href="./docs/TOOLS.ru.md">Справочник</a>
</p>

---

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
- 🏷️ **Алиасы инструментов** — короткие имена для инструментов (`run` → `run_shell_command`)
- 🧠 **Самообучение** — автоматическое обучение правильным именам инструментов

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

## Новые возможности v0.11.0

### Архитектурные улучшения

Крупные улучшения архитектуры для лучшей производительности и расширяемости:

| Функция | Описание |
|---------|-------------|
| **Миграция на Zustand** | Заменил Context API, устраняет лишние ре-рендеры |
| **Event Bus** | Типизированная система pub/sub для слабой связности |
| **Command Pattern** | Полная поддержка Undo/Redo для обратимых операций |
| **Plugin System v1** | Динамическая загрузка инструментов, builtin плагины, lifecycle hooks |
| **Context Caching** | KV-cache reuse для 80-90% более быстрых диалогов |
| **Документация промптов** | Полная документация системы формирования промптов |

### Новые Stores

| Store | Назначение |
|-------|---------|
| `sessionStore` | Состояние сессии и метрики |
| `streamingStore` | Состояние стриминга + AbortController |
| `uiStore` | UI настройки с персистентностью |
| `commandStore` | Command pattern для undo/redo |
| `eventBus` | Система событий pub/sub |

### Plugin System

Динамическая архитектура плагинов с lifecycle hooks:

```typescript
const plugin: PluginDefinition = {
  metadata: { id: 'my-plugin', name: 'My Plugin', version: '1.0.0' },
  tools: [{ id: 'hello', name: 'hello', execute: async () => ({ success: true }) }],
  hooks: {
    onLoad: async (ctx) => ctx.logger.info('Загружен'),
    onBeforeToolExecute: async (id, params) => true,
  },
};
```

**Builtin Плагины:**
- `core-tools` — echo, timestamp, get_env
- `dev-tools` — python_dev, nodejs_dev, golang_dev, rust_dev, typescript_dev
- `file-tools` — read_file, write_file, edit_file
- `search-tools` — grep, glob, web_fetch
- `shell-tools` — run_shell_command

### Event Bus

Типизированные события для коммуникации между компонентами:

```typescript
// Подписка на события
eventBus.subscribe('stream:finished', (data) => {
  console.log('Токены:', data.tokenCount);
});

// Эмиссия событий
eventBus.emit('command:executed', { commandId: '123', type: 'edit' });
```

### Документация системы промптов

Новая комплексная документация в `docs/PROMPT_SYSTEM.md`:
- `getCoreSystemPrompt()` — построение основного системного промпта
- `getCompressionPrompt()` — сжатие истории в XML
- `getToolCallFormatInstructions()` — для моделей без нативных tools
- `getToolLearningContext()` — обучение на прошлых ошибках
- `getEnvironmentInfo()` — контекст runtime окружения

---

## Новые возможности v0.10.7

### Система самообучения для вызова инструментов

Система теперь автоматически обучается на ошибках вызова инструментов и создаёт динамические алиасы:

| Функция                     | Описание                                                             |
| --------------------------- | -------------------------------------------------------------------- |
| **Автоматическое обучение** | Записывает ошибки вызова инструментов и создаёт алиасы автоматически |
| **Нечёткое сопоставление**  | Использует расстояние Левенштейна для предложения правильных имён    |
| **Сохранение данных**       | Данные обучения сохраняются в `~/.ollama-code/learning/`             |
| **Динамические алиасы**     | Создание алиасов во время выполнения без изменения кода              |

**Как это работает:**

1. Модель вызывает несуществующий инструмент → Система записывает ошибку
2. Система использует нечёткое сопоставление для поиска похожего инструмента
3. После достижения порога → Создаётся динамический алиас
4. Будущие вызовы с неправильным именем → Перенаправляются на правильный инструмент

---

## Новые возможности v0.10.6

### Инструменты разработки

Добавлены три комплексных инструмента для разработки:

| Инструмент   | Алиасы                                  | Описание                                                     |
| ------------ | --------------------------------------- | ------------------------------------------------------------ |
| `python_dev` | `py`, `python`, `pip`, `pytest`         | Разработка на Python (run, test, lint, venv, pip)            |
| `nodejs_dev` | `node`, `npm`, `yarn`, `pnpm`, `bun`    | Разработка на Node.js с автоопределением пакетного менеджера |
| `golang_dev` | `go`, `golang`                          | Разработка на Go (run, build, test, mod)                     |
| `php_dev`    | `php`, `composer`, `phpunit`, `artisan` | Разработка на PHP с поддержкой Composer и Laravel            |

### Оповещение об окружении

Модель теперь получает детальную информацию об окружении в начале сессии:

- Конфигурация Ollama (base URL, модель, статус API ключа)
- Системная информация (версия Node.js, платформа, рабочая директория)
- Настройки отладки

### Расширенная документация

Новая комплексная документация:

- [FEATURES.ru.md](./docs/FEATURES.ru.md) - Полный справочник функций
- [TOOLS.ru.md](./docs/TOOLS.ru.md) - Справочник инструментов
- [FEATURES.md](./docs/FEATURES.md) - English feature reference
- [TOOLS.md](./docs/TOOLS.md) - English tools reference

---

## Новые возможности v0.10.5

### Система алиасов инструментов

Модели теперь могут использовать короткие имена инструментов:

| Алиас                         | Каноническое имя    |
| ----------------------------- | ------------------- |
| `run`, `shell`, `exec`, `cmd` | `run_shell_command` |
| `read`                        | `read_file`         |
| `write`, `create`             | `write_file`        |
| `grep`, `search`, `find`      | `grep_search`       |
| `glob`, `files`               | `glob`              |
| `ls`, `list`, `dir`           | `list_directory`    |
| `todo`, `todos`               | `todo_write`        |
| `memory`, `save`              | `save_memory`       |
| `websearch`, `web`            | `web_search`        |
| `webfetch`, `fetch`, `url`    | `web_fetch`         |
| `agent`, `subagent`           | `task`              |

### Отображение Session ID

ID текущей сессии теперь отображается в заголовке для удобства отладки и логирования.

### Проверка UTF-8 локали

Добавлено предупреждение при старте, если терминал не настроен на UTF-8 кодировку.

---

## Возможности v0.12.0

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
│   └── sdk-typescript/ # SDK для программного использования
├── scripts/            # Скрипты сборки и запуска
├── integration-tests/  # Интеграционные тесты
└── docs/              # Документация
```

## Документация

### Краткий справочник

| Документ                                | Описание                      |
| --------------------------------------- | ----------------------------- |
| [FEATURES.ru.md](./docs/FEATURES.ru.md) | **Полный справочник функций** |
| [TOOLS.ru.md](./docs/TOOLS.ru.md)       | **Справочник инструментов**   |
| [USAGE_GUIDE.md](./docs/USAGE_GUIDE.md) | Руководство по использованию  |
| [EXAMPLES.md](./docs/EXAMPLES.md)       | Примеры использования         |
| [OLLAMA_API.md](./docs/OLLAMA_API.md)   | Документация API              |

### Английская документация (English Documentation)

| Document                          | Description                    |
| --------------------------------- | ------------------------------ |
| [FEATURES.md](./docs/FEATURES.md) | **Complete feature reference** |
| [TOOLS.md](./docs/TOOLS.md)       | **Tools reference**            |
| [README.md](./README.md)          | README in English              |

### Ресурсы проекта

| Документ                                       | Описание               |
| ---------------------------------------------- | ---------------------- |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Структура проекта      |
| [ROADMAP.md](./ROADMAP.md)                     | План развития          |
| [CONTRIBUTING.md](./CONTRIBUTING.md)           | Руководство по участию |

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

| Модель               | Назначение           | Размер |
| -------------------- | -------------------- | ------ |
| `llama3.2`           | Общего назначения    | 3B     |
| `qwen2.5-coder:7b`   | Программирование     | 7B     |
| `qwen2.5-coder:14b`  | Программирование     | 14B    |
| `qwen3-coder:30b`    | Программирование     | 30B    |
| `deepseek-r1:8b`     | Рассуждения (thinking) | 8B   |
| `codellama`          | Программирование     | 7B+    |
| `mistral`            | Общего назначения    | 7B     |
| `nomic-embed-text`   | Эмбеддинги           | 274M   |

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
