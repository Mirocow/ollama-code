# Ollama Code - Сборка завершена

## ✅ Статус сборки

Проект успешно клонирован и собран:
- **Версия**: 0.10.5
- **CLI**: `/home/z/my-project/ollama-code/dist/cli.js` (18 MB)

## Поддерживаемые Ollama API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/generate` | POST | Генерация текста |
| `/api/chat` | POST | Чат с моделью |
| `/api/tags` | GET | Список моделей |
| `/api/show` | POST | Информация о модели |
| `/api/ps` | GET | Запущенные модели |
| `/api/embed` | POST | Эмбеддинги |
| `/api/pull` | POST | Загрузка модели |
| `/api/version` | GET | Версия Ollama |

## Запуск CLI

```bash
cd /home/z/my-project/ollama-code

# Показать справку
node dist/cli.js --help

# Показать версию
node dist/cli.js --version

# Запустить интерактивную сессию
node dist/cli.js
```

## Тестирование Ollama API

### 1. Убедитесь, что Ollama запущен

```bash
# Запуск Ollama сервера
ollama serve

# В другом терминале - проверка
curl http://localhost:11434/api/version
```

### 2. Загрузите модель qwen3-coder:30b

```bash
ollama pull qwen3-coder:30b
```

### 3. Запустите тесты

**Bash тест (curl):**
```bash
cd /home/z/my-project/ollama-code
bash test-ollama-curl.sh
```

**Node.js тест:**
```bash
cd /home/z/my-project/ollama-code
node test-api.mjs
```

**TypeScript тест:**
```bash
cd /home/z/my-project/ollama-code
npx tsx test-ollama-api.ts
```

## Примеры использования API

### curl примеры

```bash
# Список моделей
curl http://localhost:11434/api/tags

# Информация о модели
curl http://localhost:11434/api/show -d '{"model": "qwen3-coder:30b"}'

# Генерация (non-streaming)
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3-coder:30b",
  "prompt": "Why is the sky blue?",
  "stream": false
}'

# Чат
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3-coder:30b",
  "messages": [{"role": "user", "content": "Hello!"}]
}'
```

### Программное использование (TypeScript)

```typescript
import { createOllamaNativeClient } from '@ollama-code/ollama-code-core';

const client = createOllamaNativeClient();

// Список моделей
const { models } = await client.listModels();

// Генерация
const response = await client.generate({
  model: 'qwen3-coder:30b',
  prompt: 'Write a hello world in Python',
  stream: false,
});

// Чат
const chat = await client.chat({
  model: 'qwen3-coder:30b',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: false,
});
```

## Структура проекта

```
/home/z/my-project/ollama-code/
├── dist/                    # Собранный CLI
│   └── cli.js              # Entry point (18 MB)
├── packages/
│   ├── core/               # Core библиотека
│   │   └── src/core/
│   │       └── ollamaNativeClient.ts  # Native Ollama API
│   ├── cli/                # CLI приложение
│   ├── webui/              # Web UI компоненты
│   └── sdk-typescript/     # SDK для интеграции
├── test-api.mjs            # Node.js тест
├── test-ollama-api.ts      # TypeScript тест
└── test-ollama-curl.sh     # Bash тест
```

## Известные ограничения

- `vscode-ide-companion` не собран из-за несовместимости версий Zod (опциональный пакет для VS Code интеграции)
- Основной CLI и Core библиотека работают корректно

## Переменные окружения

```bash
OLLAMA_HOST=http://localhost:11434    # Хост Ollama сервера
OLLAMA_MODEL=qwen3-coder:30b          # Модель по умолчанию
```
