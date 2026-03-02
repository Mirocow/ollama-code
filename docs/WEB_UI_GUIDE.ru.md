# Ollama Code Web UI - Полное руководство по использованию

> Полнофункциональный веб-интерфейс на Next.js 15 для Ollama Code с чатом в реальном времени, управлением файлами и эмуляцией терминала.

## Содержание

1. [Обзор](#обзор)
2. [Установка](#установка)
3. [Быстрый старт](#быстрый-старт)
4. [Архитектура](#архитектура)
5. [Компоненты](#компоненты)
   - [Интерфейс чата](#интерфейс-чата)
   - [Проводник файлов](#проводник-файлов)
   - [Эмулятор терминала](#эмулятор-терминала)
6. [API маршруты](#api-маршруты)
7. [Сервер терминала](#сервер-терминала)
8. [Управление состоянием](#управление-состоянием)
9. [Конфигурация](#конфигурация)
10. [Примеры использования](#примеры-использования)
11. [Безопасность](#безопасность)
12. [Устранение неполадок](#устранение-неполадок)

---

## Обзор

Пакет Web UI (`@ollama-code/web-app`) предоставляет современный, адаптивный веб-интерфейс для взаимодействия с моделями Ollama. Построенный на Next.js 15 и React 19, он предлагает три интегрированных компонента, которые работают совместно для предоставления полноценной среды разработки на базе ИИ.

### Основные возможности

| Возможность | Описание |
|-------------|----------|
| **Чат в реальном времени** | Потоковые ответы с токен-за-токеном выводом от моделей Ollama |
| **Выбор модели** | Динамическое переключение между доступными моделями Ollama |
| **Управление сессиями** | Множественные чат-сессии с сохранением истории |
| **Управление файлами** | Просмотр, редактирование файлов проекта в Monaco Editor |
| **Доступ к терминалу** | Полноценная эмуляция PTY-терминала через WebSocket |
| **Тёмная тема** | Современная тёмная тема для длительных сессий кодинга |
| **Адаптивный дизайн** | Работает на настольных компьютерах и планшетах |

### Технологический стек

- **Фреймворк**: Next.js 15 с App Router
- **UI библиотека**: React 19
- **Управление состоянием**: Zustand с персистентностью
- **Редактор**: Monaco Editor (редактор VS Code)
- **Терминал**: xterm.js с поддержкой PTY
- **Стилизация**: Tailwind CSS v4
- **Язык**: TypeScript

---

## Установка

### Предварительные требования

Перед установкой Web UI убедитесь, что в вашей системе установлены следующие зависимости:

- **Node.js**: Версия 18.17 или выше (рекомендуется LTS)
- **pnpm**: Версия 8.0 или выше (менеджер пакетов)
- **Ollama**: Работающий экземпляр с хотя бы одной загруженной моделью

### Установка Ollama

Если вы ещё не установили Ollama, выполните следующие шаги:

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Загрузите модель
ollama pull llama3.2

# Проверьте, что Ollama работает
ollama list
```

### Установка Web UI

Web UI является частью монорепозитория Ollama Code. Установите его следующим образом:

```bash
# Клонируйте репозиторий
git clone https://github.com/ollama-code/ollama-code.git
cd ollama-code

# Установите зависимости
pnpm install

# Перейдите в пакет web-app
cd packages/web-app
```

### Зависимости для разработки

Web UI требует несколько зависимостей, которые устанавливаются автоматически:

| Пакет | Назначение |
|-------|------------|
| `next` | Фреймворк Next.js |
| `react` / `react-dom` | UI библиотека |
| `xterm` | Эмуляция терминала |
| `@monaco-editor/react` | Редактор кода |
| `zustand` | Управление состоянием |
| `node-pty` | Поддержка PTY для терминала |
| `ws` | WebSocket сервер |

---

## Быстрый старт

### Режим разработки

Запустите сервер разработки с горячей перезагрузкой:

```bash
# Из директории packages/web-app
pnpm dev
```

Это запускает сервер разработки Next.js на [http://localhost:3000](http://localhost:3000).

### С поддержкой терминала

Для полноценной работы терминала используйте кастомный сервер с поддержкой WebSocket:

```bash
# Запуск с WebSocket сервером для терминала
pnpm dev:server
```

Кастомный сервер предоставляет:
- Полный доступ к PTY терминалу через WebSocket
- Двустороннюю связь в реальном времени
- Управление сессиями для множества терминальных экземпляров

### Продакшн сборка

Сборка и запуск для продакшена:

```bash
# Соберите приложение
pnpm build

# Запустите продакшн сервер с поддержкой терминала
pnpm start:server
```

### Проверка установки

После запуска сервера проверьте, что всё работает:

1. Откройте [http://localhost:3000](http://localhost:3000) в браузере
2. Проверьте, что индикатор статуса показывает "Connected" (зелёный)
3. Выберите модель из выпадающего списка в боковой панели
4. Отправьте тестовое сообщение для проверки функциональности чата
5. Переключитесь на вкладку Files для просмотра директории проекта
6. Переключитесь на вкладку Terminal и нажмите "Connect" для запуска сессии оболочки

---

## Архитектура

Web UI следует современной клиент-серверной архитектуре с возможностями реального времени:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Браузер (React)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ ChatInterface│  │ FileExplorer │  │   TerminalEmulator       │  │
│  │              │  │              │  │                          │  │
│  │ - Сообщения  │  │ - Дерево     │  │ - xterm.js Терминал      │  │
│  │ - Выбор мод. │  │ - Monaco Ed. │  │ - WebSocket Клиент       │  │
│  │ - Поток      │  │ - Автосохран.│  │ - PTY Взаимодействие     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                 │
│         ▼                 ▼                        ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  /api/chat   │  │   /api/fs    │  │   WebSocket /terminal    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Сервер                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  API Маршруты│  │  Терминал    │  │    Ollama Прокси         │  │
│  │              │  │  Сервер      │  │                          │  │
│  │ - /api/chat  │  │ (PTY/WS)     │  │ - /api/ollama/[...path]  │  │
│  │ - /api/fs    │  │              │  │                          │  │
│  │ - /api/models│  │              │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                 │
│         ▼                 ▼                        ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Ollama API   │  │ Процесс Shell│  │    Ollama Сервер         │  │
│  │(localhost:   │  │ (bash/zsh)   │  │ (localhost:11434)        │  │
│  │  11434)      │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Потоки данных

1. **Поток чата**:
   - Пользователь вводит сообщение → Обновление состояния React
   - Отправка → POST на `/api/chat`
   - Сервер проксирует в Ollama → Потоковый ответ
   - NDJSON чанки парсятся → Обновление UI в реальном времени

2. **Поток файлов**:
   - Пользователь навигирует → GET `/api/fs?path=...`
   - Сервер читает файловую систему → JSON ответ
   - Пользователь редактирует → Monaco onChange
   - Пользователь сохраняет → PUT `/api/fs?path=...`

3. **Поток терминала**:
   - Пользователь подключается → WebSocket upgrade
   - Сервер запускает PTY → Процесс оболочки
   - Пользователь печатает → WebSocket сообщение → PTY write
   - Вывод оболочки → PTY onData → WebSocket → Terminal write

---

## Компоненты

### Интерфейс чата

Компонент `ChatInterface` — это основной интерфейс для взаимодействия с моделями Ollama. Он обеспечивает полноценный чат-опыт с поддержкой потоковой передачи, управлением сессиями и выбором модели.

#### Возможности

| Возможность | Описание |
|-------------|----------|
| **Потоковые ответы** | Вывод токен-за-токеном в реальном времени от модели |
| **Выбор модели** | Выпадающий список для переключения между моделями Ollama |
| **Управление сессиями** | Создание, переключение и управление несколькими чат-сессиями |
| **Статус соединения** | Визуальный индикатор подключения к Ollama |
| **Остановка генерации** | Кнопка прерывания для остановки потоковых ответов |
| **Мыслящие модели** | Поддержка рассуждающих моделей типа DeepSeek R1 |
| **Сохранение истории** | Чат-сессии сохраняются в localStorage |

#### Горячие клавиши

| Сочетание | Действие |
|-----------|----------|
| `Enter` | Отправить сообщение |
| `Shift + Enter` | Новая строка в сообщении |
| `Escape` | Фокус на поле ввода (в области чата) |

#### Структура компонента

```tsx
// Основная иерархия компонентов
<ChatInterface>
  <aside> {/* Боковая панель */}
    <ModelSelector />
    <SessionList />
    <NewChatButton />
  </aside>

  <main>
    <header> {/* Заголовок со статусом */}
      <ConnectionStatus />
    </header>

    <Messages> {/* Список сообщений */}
      {messages.map(msg => <Message key={msg.id} />)}
      <StreamingMessage />
    </Messages>

    <Input> {/* Поле ввода */}
      <TextArea />
      <SendButton / StopButton />
    </Input>
  </main>
</ChatInterface>
```

#### Состояние сессии

Каждая чат-сессия поддерживает следующее состояние:

```typescript
interface Session {
  id: string;              // Уникальный идентификатор сессии
  title: string;           // Заголовок сессии (из первого сообщения)
  messages: ChatMessage[]; // История сообщений
  model: string;           // Выбранная модель
  createdAt: number;       // Временная метка создания
  updatedAt: number;       // Временная метка последнего обновления
  context?: number[];      // Контекст KV-кэша для оптимизации
}
```

#### Реализация потоковой передачи

Интерфейс чата обрабатывает потоковые ответы с использованием Fetch API и ReadableStream:

```typescript
// Обработка потокового ответа
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: selectedModel,
    messages: [...messages, { role: 'user', content: userMessage }],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n').filter(Boolean);

  for (const line of lines) {
    const parsed = JSON.parse(line);
    if (parsed.message?.content) {
      appendStreamContent(parsed.message.content);
    }
  }
}
```

---

### Проводник файлов

Компонент `FileExplorer` предоставляет браузер файлов с интегрированным Monaco Editor для просмотра и редактирования файлов. Он поддерживает подсветку синтаксиса для 25+ языков программирования и включает функции автосохранения и горячих клавиш.

#### Возможности

| Возможность | Описание |
|-------------|----------|
| **Дерево файлов** | Навигация по структуре директорий проекта |
| **Monaco Editor** | Полнофункциональный редактор кода с IntelliSense |
| **Подсветка синтаксиса** | Поддержка 25+ языков программирования |
| **Автосохранение** | Сохранение по горячим клавишам Cmd/Ctrl+S |
| **Индикатор изменений** | Визуальный индикатор для изменённых файлов |
| **Отображение размера** | Показывает размер файла в заголовке |
| **Навигация по путям** | Навигация вверх и обновление директории |

#### Поддерживаемые языки

| Категория | Языки |
|-----------|-------|
| **Веб-фронтенд** | TypeScript, JavaScript, JSX, TSX, HTML, CSS, SCSS |
| **Бэкенд** | Python, Go, Rust, Java, Kotlin, PHP, Ruby, C#, Swift |
| **Системные** | C, C++, Rust |
| **Данные/Конфиг** | JSON, YAML, TOML, XML, Markdown |
| **Базы данных** | SQL |
| **Оболочки** | Bash, Shell |
| **Контейнеры** | Dockerfile, Makefile |

#### Структура компонента

```tsx
<FileExplorer>
  <aside> {/* Боковая панель с деревом файлов */}
    <Toolbar>
      <NavigateUpButton />
      <CurrentPath />
      <RefreshButton />
    </Toolbar>

    <FileList>
      {items.map(item => (
        <FileItem
          key={item.path}
          icon={item.type === 'directory' ? '📁' : '📄'}
          onClick={() => handleItemClick(item)}
        />
      ))}
    </FileList>
  </aside>

  <main> {/* Область редактора */}
    {selectedFile ? (
      <>
        <EditorHeader>
          <FileName />
          <UnsavedIndicator />
          <FileSize />
          <SaveButton />
        </EditorHeader>
        <MonacoEditor
          language={getLanguageFromExtension(file.extension)}
          value={file.content}
          onChange={handleEditorChange}
          theme="vs-dark"
        />
      </>
    ) : (
      <EmptyState>Выберите файл для просмотра или редактирования</EmptyState>
    )}
  </main>
</FileExplorer>
```

#### Файловые операции

Проводник файлов поддерживает следующие операции через эндпоинт `/api/fs`:

| Операция | Метод | Эндпоинт | Описание |
|----------|-------|----------|----------|
| Список директории | GET | `/api/fs?path=/` | Список содержимого директории |
| Чтение файла | GET | `/api/fs?path=/file.ts` | Чтение содержимого файла |
| Запись файла | PUT | `/api/fs?path=/file.ts` | Обновление содержимого файла |
| Создание файла/директории | POST | `/api/fs?path=/new` | Создание нового файла или директории |
| Удаление | DELETE | `/api/fs?path=/file` | Удаление файла или директории |

#### Конфигурация редактора

Monaco Editor настроен со следующими параметрами:

```typescript
const editorOptions = {
  minimap: { enabled: true },      // Показать миникарту
  fontSize: 14,                    // Размер шрифта
  wordWrap: 'on',                  // Включить перенос слов
  automaticLayout: true,           // Авто-ресайз
  scrollBeyondLastLine: false,     // Не прокручивать дальше конца
  theme: 'vs-dark',                // Тёмная тема
};
```

---

### Эмулятор терминала

Компонент `TerminalEmulator` предоставляет полноценный PTY-терминал через xterm.js и WebSocket. Он поддерживает 256 цветов, Unicode-символы и динамическое изменение размера.

#### Возможности

| Возможность | Описание |
|-------------|----------|
| **Полная поддержка PTY** | Реальные процессы оболочки (bash, zsh, fish) |
| **xterm.js** | Профессиональная эмуляция терминала |
| **256 цветов** | Полная поддержка ANSI-цветов |
| **Динамический ресайз** | Терминал изменяет размер с окном |
| **Статус соединения** | Визуальный индикатор состояния WebSocket |
| **Очистка терминала** | Кнопка очистки буфера терминала |
| **Веб-ссылки** | Кликабельные ссылки в выводе терминала |

#### Конфигурация терминала

```typescript
const terminalOptions = {
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    // ... полная цветовая палитра
  },
  fontFamily: '"Cascadia Code", "Fira Code", monospace',
  fontSize: 14,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: 'block',
  scrollback: 10000,          // Строк истории
  allowTransparency: true,
};
```

#### Протокол WebSocket

Терминал общается с сервером через JSON-сообщения:

**Клиент → Сервер:**

```typescript
// Ввод с клавиатуры
{ type: 'input', data: 'ls -la\n' }

// Изменение размера терминала
{ type: 'resize', cols: 120, rows: 40 }

// Ping для поддержания соединения
{ type: 'ping' }
```

**Сервер → Клиент:**

```typescript
// Вывод оболочки
{ type: 'output', data: 'file1.txt\nfile2.txt\n' }

// Выход процесса
{ type: 'exit', code: 0 }

// Сообщение об ошибке
{ type: 'error', data: 'Maximum sessions reached' }
```

#### Поток соединения

```
1. Пользователь нажимает "Connect"
   └─> WebSocket соединение с ws://localhost:3000/terminal

2. Сервер создаёт PTY сессию
   └─> Запускает процесс оболочки (bash/zsh)

3. Пользователь печатает в терминале
   └─> xterm.js onData → WebSocket send

4. Оболочка производит вывод
   └─> PTY onData → WebSocket send → xterm.js write

5. Пользователь нажимает "Disconnect"
   └─> WebSocket close → PTY kill
```

---

## API Маршруты

### `/api/models`

Список всех доступных моделей Ollama.

**Запрос:**
```http
GET /api/models
```

**Ответ:**
```json
{
  "models": [
    {
      "name": "llama3.2:latest",
      "modified_at": "2025-01-15T12:00:00Z",
      "size": 4869431328,
      "digest": "abc123..."
    },
    {
      "name": "deepseek-r1:latest",
      "modified_at": "2025-01-14T08:30:00Z",
      "size": 7234567890,
      "digest": "def456..."
    }
  ]
}
```

### `/api/chat`

Отправка чат-сообщений и получение потоковых ответов.

**Запрос:**
```http
POST /api/chat
Content-Type: application/json

{
  "model": "llama3.2",
  "messages": [
    { "role": "user", "content": "Привет!" }
  ],
  "stream": true
}
```

**Ответ (потоковый):**
```
Content-Type: application/x-ndjson
Transfer-Encoding: chunked

{"model":"llama3.2","created_at":"2025-01-15T12:00:00Z","message":{"role":"assistant","content":"Привет"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:01Z","message":{"role":"assistant","content":"!"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:02Z","message":{"role":"assistant","content":" Чем"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:03Z","message":{"role":"assistant","content":" могу"},"done":false}
{"model":"llama3.2","created_at":"2025-01-15T12:00:04Z","done":true,"total_duration":4000000000}
```

### `/api/generate`

Генерация текста по промпту.

**Запрос:**
```http
POST /api/generate
Content-Type: application/json

{
  "model": "llama3.2",
  "prompt": "Напиши программу Hello World на Python",
  "stream": true
}
```

### `/api/fs`

Операции с файловой системой для просмотра и редактирования файлов.

**Список директории:**
```http
GET /api/fs?path=/src
```

**Ответ:**
```json
{
  "path": "/src",
  "type": "directory",
  "items": [
    { "name": "components", "type": "directory", "size": 0 },
    { "name": "app.ts", "type": "file", "size": 1234 }
  ]
}
```

**Чтение файла:**
```http
GET /api/fs?path=/src/app.ts
```

**Ответ:**
```json
{
  "path": "/src/app.ts",
  "type": "file",
  "name": "app.ts",
  "content": "console.log('Hello, World!');",
  "size": 27,
  "extension": ".ts"
}
```

**Запись файла:**
```http
PUT /api/fs?path=/src/app.ts
Content-Type: application/json

{
  "content": "console.log('Updated!');"
}
```

**Создание директории:**
```http
POST /api/fs?path=/src/new-folder
Content-Type: application/json

{
  "type": "directory"
}
```

**Удаление:**
```http
DELETE /api/fs?path=/src/old-file.ts
```

### `/api/ollama/[...path]`

Прокси для прямого доступа к API Ollama.

```http
GET /api/ollama/tags      → Ollama /api/tags
POST /api/ollama/show     → Ollama /api/show
POST /api/ollama/embed    → Ollama /api/embed
POST /api/ollama/pull     → Ollama /api/pull
```

---

## Сервер терминала

Сервер терминала предоставляет PTY-доступ через WebSocket для эмуляции терминала.

### Конфигурация сервера

```typescript
interface TerminalServerConfig {
  server: HttpServer;           // HTTP сервер для подключения
  path?: string;                // Путь WebSocket (по умолчанию: '/terminal')
  shell?: string;               // Оболочка (по умолчанию: $SHELL или 'bash')
  cols?: number;                // Начальные колонки (по умолчанию: 80)
  rows?: number;                // Начальные строки (по умолчанию: 24)
  env?: Record<string, string>; // Переменные окружения
  cwd?: string;                 // Рабочая директория
  maxSessionsPerIp?: number;    // Макс. сессий на IP (по умолчанию: 5)
  sessionTimeout?: number;      // Таймаут в мс (по умолчанию: 30 минут)
}
```

### Создание сервера терминала

```typescript
import { createTerminalServer } from './src/server/terminalServer';
import { createServer } from 'http';

const server = createServer();

const terminalServer = createTerminalServer({
  server,
  path: '/terminal',
  shell: process.env.SHELL || 'bash',
  cwd: process.env.PROJECT_DIR || process.cwd(),
  maxSessionsPerIp: 5,
  sessionTimeout: 30 * 60 * 1000, // 30 минут
});

server.listen(3000);
```

### Управление сессиями

Сервер терминала автоматически управляет сессиями:

- **Ограничение по IP**: Максимум 5 одновременных сессий на IP-адрес
- **Таймаут сессии**: Неактивные сессии закрываются через 30 минут
- **Автоматическая очистка**: Мёртвые сессии удаляются каждую минуту

### Получение статистики

```typescript
const stats = terminalServer.getStats();
// {
//   activeSessions: 2,
//   sessions: [
//     { id: '1735123456789-abc123', createdAt: Date, lastActivity: Date },
//     { id: '1735123456790-def456', createdAt: Date, lastActivity: Date }
//   ]
// }
```

### Корректное завершение

```typescript
// Закрыть все сессии и остановить сервер
terminalServer.close();
```

---

## Управление состоянием

Web UI использует Zustand для управления состоянием с персистентностью в localStorage.

### Структура хранилища

```typescript
interface WebSessionState {
  // Сессии
  sessions: Map<string, Session>;
  activeSessionId: string | null;

  // Потоковая передача
  streaming: StreamingState;

  // Состояние UI
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  selectedModel: string;

  // Действия
  createSession: (model: string) => string;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  // ... другие действия
}
```

### Использование хранилища

```typescript
import { useWebSessionStore } from '@/stores/webSessionStore';

function MyComponent() {
  const {
    sessions,
    activeSessionId,
    createSession,
    addMessage,
  } = useWebSessionStore();

  // Создать новую сессию
  const handleNewChat = () => {
    const id = createSession('llama3.2');
    setActiveSession(id);
  };

  // Добавить сообщение
  const handleSendMessage = (content: string) => {
    if (activeSessionId) {
      addMessage(activeSessionId, {
        role: 'user',
        content,
      });
    }
  };

  return (
    // ... JSX компонента
  );
}
```

### Персистентность

Сессии автоматически сохраняются в localStorage:

```typescript
// Данные, сохраняемые в localStorage
{
  sessions: Array.from(sessions.entries()),
  activeSessionId: string | null,
  theme: 'light' | 'dark' | 'system',
  selectedModel: string,
}
```

---

## Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `OLLAMA_URL` | URL сервера Ollama | `http://localhost:11434` |
| `PROJECT_DIR` | Базовая директория для файловых операций | Текущая директория |
| `PORT` | Порт сервера | `3000` |
| `HOST` | Хост сервера | `localhost` |
| `SHELL` | Оболочка для терминала | Системная по умолчанию |
| `NODE_ENV` | Режим окружения | `development` |

### Конфигурационный файл

Создайте файл `.env.local` в директории `packages/web-app`:

```env
# .env.local
OLLAMA_URL=http://localhost:11434
PROJECT_DIR=/home/user/projects/my-project
PORT=3000
HOST=localhost
```

### Конфигурация Next.js

Файл `next.config.mjs` настраивает приложение Next.js:

```javascript
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Включить Turbopack для более быстрой разработки
    turbo: {},
  },
  // Конфигурация прокси при необходимости
  async rewrites() {
    return [];
  },
};

export default nextConfig;
```

---

## Примеры использования

### Базовое взаимодействие с чатом

```typescript
// Отправить сообщение и обработать потоковый ответ
const sendMessage = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      messages: [{ role: 'user', content: message }],
      stream: true,
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      const data = JSON.parse(line);
      if (data.message?.content) {
        console.log('Получено:', data.message.content);
      }
    }
  }
};
```

### Файловые операции

```typescript
// Список директории
const listDir = async (path: string) => {
  const response = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  return data.items;
};

// Чтение файла
const readFile = async (path: string) => {
  const response = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  return data.content;
};

// Запись файла
const writeFile = async (path: string, content: string) => {
  await fetch(`/api/fs?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
};
```

### WebSocket терминала

```typescript
// Подключение к терминалу
const socket = new WebSocket('ws://localhost:3000/terminal');

socket.onopen = () => {
  // Отправить начальный размер
  socket.send(JSON.stringify({
    type: 'resize',
    cols: 120,
    rows: 40,
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'output':
      console.log('Вывод:', message.data);
      break;
    case 'exit':
      console.log('Процесс завершился с кодом:', message.code);
      break;
    case 'error':
      console.error('Ошибка:', message.data);
      break;
  }
};

// Отправить команду
const sendCommand = (cmd: string) => {
  socket.send(JSON.stringify({
    type: 'input',
    data: cmd + '\n',
  }));
};
```

---

## Безопасность

### Безопасность API файловой системы

Эндпоинт `/api/fs` реализует несколько мер безопасности:

1. **Защита от обхода пути**
   ```typescript
   function resolveSecurePath(requestPath: string): string | null {
     const resolved = path.resolve(BASE_DIR, requestPath);
     if (!resolved.startsWith(BASE_DIR)) {
       return null; // Попытка обхода пути заблокирована
     }
     return resolved;
   }
   ```

2. **Запрет абсолютных путей**: Пользователи не могут получить доступ к файлам вне директории проекта.

3. **Не следовать символьным ссылкам**: Ссылки, указывающие вне базовой директории, не разрешаются.

### Безопасность сервера терминала

1. **Ограничение по IP**: Максимум 5 одновременных сессий на IP-адрес.

2. **Таймаут сессии**: Неактивные сессии закрываются через 30 минут.

3. **Нет root-доступа**: Терминал запускается от имени текущего пользователя.

4. **Изоляция окружения**: Можно задать пользовательские переменные окружения для каждой сессии.

### Рекомендации

1. **Запуск за обратным прокси**: Используйте nginx/Caddy для HTTPS и дополнительной безопасности.

2. **Сетевая изоляция**: Не открывайте Web UI напрямую в интернет.

3. **Регулярные обновления**: Обновляйте зависимости для получения патчей безопасности.

4. **Переменные окружения**: Никогда не коммитьте чувствительную конфигурацию в систему контроля версий.

---

## Устранение неполадок

### Терминал не подключается

**Симптомы**: Терминал показывает "Disconnected" и кнопка "Connect" не работает.

**Решения**:
1. Убедитесь, что используете `pnpm dev:server` (не просто `pnpm dev`)
2. Проверьте, что путь WebSocket — `/terminal`
3. Убедитесь, что `node-pty` установлен корректно:
   ```bash
   pnpm add node-pty
   ```
4. Проверьте консоль браузера на ошибки WebSocket
5. Убедитесь, что firewall не блокирует WebSocket соединения

### Проводник файлов не загружается

**Симптомы**: Дерево файлов показывает "Loading..." бесконечно или показывает ошибки.

**Решения**:
1. Проверьте переменную окружения `PROJECT_DIR`
2. Убедитесь в правах доступа к директории:
   ```bash
   ls -la $PROJECT_DIR
   ```
3. Проверьте консоль браузера на ошибки API
4. Убедитесь, что директория существует и доступна для чтения
5. Проверьте символьные ссылки, которые могут указывать на недоступные расположения

### Чат не стримится

**Симптомы**: Сообщения отправляются, но ответ не появляется, или ответ появляется весь сразу.

**Решения**:
1. Убедитесь, что Ollama работает:
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. Проверьте, что модель загружена:
   ```bash
   ollama list
   ```
3. Проверьте переменную окружения `OLLAMA_URL`
4. Проверьте, что API прокси работает:
   ```bash
   curl http://localhost:3000/api/models
   ```
5. Проверьте вкладку Network в браузере на неудачные запросы

### Модели не загружаются

**Симптомы**: Выпадающий список моделей пуст или показывает "Loading models..." бесконечно.

**Решения**:
1. Убедитесь, что Ollama работает и доступен
2. Проверьте эндпоинт `/api/models` напрямую
3. Убедитесь, что хотя бы одна модель загружена:
   ```bash
   ollama pull llama3.2
   ```
4. Проверьте проблемы CORS в консоли браузера

### Ошибки сборки

**Симптомы**: `pnpm build` завершается с ошибками.

**Решения**:
1. Очистите кэш Next.js:
   ```bash
   rm -rf .next
   pnpm build
   ```
2. Переустановите зависимости:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
3. Проверьте ошибки TypeScript:
   ```bash
   pnpm typecheck
   ```
4. Убедитесь, что все зависимости workspace собраны

### Проблемы с памятью

**Симптомы**: Сервер падает или становится неотзывчивым.

**Решения**:
1. Увеличьте лимит памяти Node.js:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm dev:server
   ```
2. Уменьшите историю терминала:
   ```typescript
   scrollback: 1000 // вместо 10000
   ```
3. Реализуйте пагинацию сообщений для длинных чатов

---

## Лицензия

Apache License 2.0
