# @ollama-code/ollama-code

CLI-интерфейс Ollama Code — терминальный интерфейс для работы с AI-ассистентом по программированию.

## Установка

```bash
# Глобальная установка
npm install -g @ollama-code/ollama-code

# Или использование через npx
npx @ollama-code/ollama-code
```

## Использование

### Интерактивный режим

```bash
ollama-code
```

Запускает интерактивную сессию с AI-ассистентом.

### Одноразовый запрос

```bash
ollama-code "Объясни принцип работы React hooks"
```

### С указанием модели

```bash
ollama-code --model llama3.2 "Напиши функцию сортировки"
```

### Режимы подтверждения

```bash
# Автоматическое подтверждение всех действий
ollama-code --yolo

# Режим планирования (только планирование, без выполнения)
ollama-code --approval-mode plan

# Авто-подтверждение редактирований
ollama-code --approval-mode auto-edit
```

## Параметры командной строки

### Основные параметры

| Параметр | Описание |
|----------|----------|
| `-m, --model <name>` | Указать модель Ollama |
| `-d, --debug` | Включить режим отладки |
| `-y, --yolo` | Авто-подтверждение всех действий |
| `-s, --sandbox` | Запуск в песочнице Docker/Podman |

### Режимы работы

| Параметр | Описание |
|----------|----------|
| `--approval-mode <mode>` | Режим подтверждения: `plan`, `default`, `auto-edit`, `yolo` |
| `--checkpointing` | Включить контрольные точки редактирования |
| `--experimental-lsp` | Включить экспериментальную поддержку LSP |

### Ollama настройки

| Параметр | Описание |
|----------|----------|
| `--ollama-base-url <url>` | URL Ollama сервера |
| `--ollama-api-key <key>` | API ключ для удалённых инстансов |

### Веб-поиск

| Параметр | Описание |
|----------|----------|
| `--tavily-api-key <key>` | API ключ Tavily |
| `--google-api-key <key>` | API ключ Google Custom Search |
| `--google-search-engine-id <id>` | ID поискового движка Google |
| `--web-search-default <provider>` | Провайдер поиска: `tavily` или `google` |

### Расширенные параметры

| Параметр | Описание |
|----------|----------|
| `-e, --extensions <names>` | Список расширений для использования |
| `-l, --list-extensions` | Показать доступные расширения |
| `--allowed-tools <tools>` | Разрешённые инструменты |
| `--allowed-mcp-server-names <names>` | Разрешённые MCP серверы |
| `--include-directories <dirs>` | Дополнительные директории в workspace |

### Формат ввода/вывода

| Параметр | Описание |
|----------|----------|
| `--input-format <format>` | Формат ввода: `text`, `stream-json` |
| `-o, --output-format <format>` | Формат вывода: `text`, `json`, `stream-json` |

## Команды

### qwen (по умолчанию)

Основная команда для запуска AI-ассистента.

```bash
ollama-code qwen "Ваш запрос"
ollama-code "Ваш запрос"  # сокращённая форма
```

### mcp

Управление MCP серверами.

```bash
# Показать MCP серверы
ollama-code mcp list

# Добавить сервер
ollama-code mcp add <name> <command>

# Удалить сервер
ollama-code mcp remove <name>
```

### extensions

Управление расширениями.

```bash
# Показать расширения
ollama-code extensions list

# Установить расширение
ollama-code extensions install <name>
```

## Горячие клавиши

В интерактивном режиме:

| Клавиша | Действие |
|---------|----------|
| `Enter` | Отправить сообщение |
| `Shift + Enter` | Новая строка |
| `Ctrl + C` | Отмена текущей операции |
| `Ctrl + D` | Выход |
| `Tab` | Автодополнение |
| `↑` / `↓` | История команд |

## Конфигурация

### Файл настроек

Настройки хранятся в `~/.ollama-code/settings.json`:

```json
{
  "model": "llama3.2",
  "approvalMode": "default",
  "tools": {
    "sandbox": false
  },
  "general": {
    "checkpointing": {
      "enabled": false
    }
  }
}
```

### Файл .ollamaignore

Исключения для инструментов работы с файлами:

```
node_modules/
.git/
dist/
*.log
.env
```

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `OLLAMA_BASE_URL` | URL Ollama сервера |
| `OLLAMA_API_KEY` | API ключ |
| `DEBUG` | Режим отладки (1 или true) |
| `OLLAMA_WORKING_DIR` | Рабочая директория |

## Примеры использования

### Алиасы инструментов

Модели могут использовать короткие имена инструментов:

| Алиас | Полное имя |
|-------|------------|
| `run`, `shell`, `exec`, `cmd` | `run_shell_command` |
| `read` | `read_file` |
| `write`, `create` | `write_file` |
| `grep`, `search`, `find` | `grep_search` |
| `glob`, `files` | `glob` |
| `ls`, `list`, `dir` | `list_directory` |
| `todo`, `todos` | `todo_write` |
| `memory`, `save` | `save_memory` |
| `websearch`, `web` | `web_search` |
| `webfetch`, `fetch`, `url` | `web_fetch` |
| `agent`, `subagent` | `task` |

### Анализ кода

```bash
ollama-code "Проанализируй структуру проекта и предложи улучшения"
```

### Написание кода

```bash
ollama-code "Напиши REST API на Express для управления пользователями"
```

### Отладка

```bash
ollama-code "Объясни почему этот код не работает: $(cat broken.js)"
```

### Рефакторинг

```bash
ollama-code --approval-mode auto-edit "Отрефактори этот файл, добавь типы TypeScript"
```

### Работа с тестами

```bash
ollama-code "Напиши unit-тесты для функции calculateTotal в utils.js"
```

## Программное использование

```typescript
import { startCli } from '@ollama-code/ollama-code';

await startCli({
  model: 'llama3.2',
  prompt: 'Напиши функцию сортировки',
  yolo: true,
});
```

## Отладка

### VSCode

Используйте конфигурацию "Debug Ollama Code CLI" из `.vscode/launch.json`.

### Ручной запуск с отладкой

```bash
# Включить отладку
DEBUG=1 ollama-code

# С инспектором Node.js
node --inspect-brk dist/index.js
```

### Логи

Логи отладки сохраняются в:
- `~/.ollama-code/debug/<session-id>.log`

## Устранение неполадок

### Ollama не отвечает

```bash
# Проверить, запущен ли Ollama
ollama list

# Запустить Ollama
ollama serve
```

### Модель не найдена

```bash
# Скачать модель
ollama pull llama3.2
```

### Ошибки подключения

Проверьте:
1. Ollama запущен (`ollama serve`)
2. URL правильный (`http://localhost:11434`)
3. Порт 11434 доступен

## Лицензия

Apache License 2.0
