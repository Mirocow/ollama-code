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

## Основные команды

| Команда | Описание |
|---------|----------|
| `npm run build` | Собрать все пакеты |
| `npm run start` | Запустить CLI |
| `npm run dev` | Запуск в режиме разработки |
| `npm run debug` | Запуск с отладчиком |
| `npm run test` | Запустить тесты |
| `npm run lint` | Проверить код линтером |
| `npm run typecheck` | Проверка типов TypeScript |

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

| Переменная | Описание |
|------------|----------|
| `OLLAMA_BASE_URL` | URL Ollama сервера |
| `OLLAMA_API_KEY` | API ключ (опционально) |
| `DEBUG` | Включить режим отладки (1 или true) |
| `OLLAMA_CODE_DEBUG_LOG_FILE` | Логирование в файл |

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

- `GET /api/tags` — список локальных моделей
- `POST /api/show` — информация о модели
- `POST /api/generate` — генерация текста
- `POST /api/chat` — чат с моделью
- `POST /api/embed` — эмбеддинги

Документация API: https://github.com/ollama/ollama/blob/main/docs/api.md

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
2. Реализуйте интерфейс `Tool`
3. Зарегистрируйте в `tool-registry.ts`

## Лицензия

Apache License 2.0

## Содействие

См. [CONTRIBUTING.md](./CONTRIBUTING.md) для руководства по участию в разработке.
