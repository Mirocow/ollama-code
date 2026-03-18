# Тестирование Storage - Инструкция

## Подготовка

### 1. Убедитесь, что Ollama запущена
```bash
# Проверка статуса Ollama
curl http://localhost:11434/api/tags

# Если не запущена, установите модель для эмбеддингов
ollama pull nomic-embed-text
```

### 2. Сборка проекта
```bash
cd /home/z/my-project/ollama-code
npx pnpm install
cd packages/core && npx tsc --build
```

---

## Тест 1: Базовые CRUD операции

### Создание записи
```json
model_storage operation=set namespace=knowledge key="test_key" value='{"name":"test","value":123}'
```
**Ожидаемый результат:** `Stored test_key in knowledge (persistent/global)`

### Чтение записи
```json
model_storage operation=get namespace=knowledge key="test_key"
```
**Ожидаемый результат:** JSON с сохранёнными данными

### Проверка существования
```json
model_storage operation=exists namespace=knowledge key="test_key"
```
**Ожидаемый результат:** `Exists: test_key`

### Список ключей
```json
model_storage operation=list namespace=knowledge
```
**Ожидаемый результат:** Список всех ключей в namespace

### Удаление записи
```json
model_storage operation=delete namespace=knowledge key="test_key"
```
**Ожидаемый результат:** `Deleted: test_key`

---

## Тест 2: Семантический поиск

### 2.1 Добавление данных с эмбеддингами
```json
model_storage operation=addWithEmbedding namespace=knowledge key="auth_jwt" value='
## JWT Аутентификация

Пользователь отправляет логин/пароль на /api/auth/login
Сервер проверяет учетные данные
При успехе генерируется JWT токен с payload {userId, role, exp}
Токен возвращается клиенту в httpOnly cookie
Каждый запрос содержит токен в заголовке Authorization: Bearer <token>
' tags=["auth", "jwt", "security"]
```

### 2.2 Добавление ещё одной записи
```json
model_storage operation=addWithEmbedding namespace=knowledge key="auth_oauth" value='
## OAuth2 Авторизация

Пользователь перенаправляется на OAuth провайдер
Провайдер аутентифицирует пользователя
Возврат с authorization code на callback URL
Обмен code на access_token и refresh_token
Сохранение токенов в сессии
' tags=["auth", "oauth", "social"]
```

### 2.3 Поиск по смыслу
```json
model_storage operation=search query="как авторизовать пользователя через социальные сети" namespaces=["knowledge"] limit=5
```
**Ожидаемый результат:** Запись auth_oauth должна быть выше по релевантности

### 2.4 Поиск похожих записей
```json
model_storage operation=findSimilar namespace=knowledge key="auth_jwt" limit=3
```
**Ожидаемый результат:** auth_oauth должна появиться как похожая запись

### 2.5 Статистика knowledge base
```json
model_storage operation=knowledgeStats
```
**Ожидаемый результат:** Количество записей, размер, список namespace

---

## Тест 3: Streaming для больших файлов

### 3.1 Создание большой записи
```json
model_storage operation=set namespace=logs key="app_log" value='[2025-01-15 10:00:01] INFO: Starting application
[2025-01-15 10:00:02] INFO: Database connected
[2025-01-15 10:00:03] INFO: Cache initialized
[2025-01-15 10:00:04] INFO: API server listening on port 3000
[2025-01-15 10:00:05] INFO: Application ready
[2025-01-15 10:01:00] WARN: High memory usage detected
[2025-01-15 10:01:01] INFO: Running garbage collection
[2025-01-15 10:02:00] ERROR: Connection timeout to external API
[2025-01-15 10:02:01] INFO: Retrying connection...
[2025-01-15 10:02:05] INFO: Connection restored
[2025-01-15 10:03:00] INFO: Processing batch job
[2025-01-15 10:03:30] INFO: Batch job completed
[2025-01-15 10:04:00] INFO: User login: user@example.com
[2025-01-15 10:04:01] INFO: Session created
[2025-01-15 10:05:00] INFO: User logout: user@example.com
[2025-01-15 10:05:01] INFO: Session destroyed'
```

### 3.2 Чтение с streaming (первые 5 строк)
```json
model_storage operation=get namespace=logs key="app_log" streamLines=true startLine=0 maxLines=5
```
**Ожидаемый результат:** Первые 5 строк лога

### 3.3 Продолжение чтения (следующие 5 строк)
```json
model_storage operation=get namespace=logs key="app_log" streamLines=true startLine=5 maxLines=5
```
**Ожидаемый результат:** Строки 6-10

---

## Тест 4: TTL (время жизни)

### 4.1 Создание записи с TTL
```json
model_storage operation=set namespace=session key="temp_token" value='{"token":"abc123"}' ttl=60
```
**Ожидаемый результат:** `Stored temp_token in session (TTL: 60s)`

### 4.2 Проверка TTL в метаданных
```json
model_storage operation=get namespace=session key="temp_token" includeMetadata=true
```
**Ожидаемый результат:** JSON с полем `expiresAt`

---

## Тест 5: Теги и фильтрация

### 5.1 Создание записей с тегами
```json
model_storage operation=set namespace=knowledge key="pattern_api" value='{"pattern":"API response"}' tags=["api", "pattern"]
model_storage operation=set namespace=knowledge key="pattern_db" value='{"pattern":"Database query"}' tags=["database", "pattern"]
```

### 5.2 Получение с метаданными
```json
model_storage operation=list namespace=knowledge includeMetadata=true
```
**Ожидаемый результат:** Список с тегами для каждой записи

---

## Тест 6: Batch операции

```json
model_storage operation=batch namespace=knowledge actions=[
  {"operation": "set", "key": "batch_1", "value": "data1"},
  {"operation": "set", "key": "batch_2", "value": "data2"},
  {"operation": "set", "key": "batch_3", "value": "data3"},
  {"operation": "delete", "key": "batch_1"}
]
```
**Ожидаемый результат:** `Batch: 3/4 succeeded` (3 set + 1 delete)

---

## Тест 7: Merge и Append

### 7.1 Merge (слияние объектов)
```json
model_storage operation=set namespace=knowledge key="config" value='{"theme":"dark","lang":"en"}'
model_storage operation=merge namespace=knowledge key="config" value='{"lang":"ru","notifications":true}'
```
**Ожидаемый результат:** `{"theme":"dark","lang":"ru","notifications":true}`

### 7.2 Append (добавление в массив)
```json
model_storage operation=set namespace=knowledge key="history" value='["item1"]'
model_storage operation=append namespace=knowledge key="history" value='item2'
```
**Ожидаемый результат:** `["item1", "item2"]`

---

## Тест 8: Backup и Restore

### 8.1 Создание backup
```json
model_storage operation=backup
```
**Ожидаемый результат:** Путь к файлу backup

### 8.2 Список backup'ов
```json
model_storage operation=restore
```
**Ожидаемый результат:** Список доступных backup файлов

### 8.3 Восстановление из backup
```json
model_storage operation=restore key="backup-2025-01-15T10-30-00.json"
```

---

## Тест 9: Верификация задач (Todo)

### 9.1 Создание задачи с верификацией
```json
todo_write todos=[{
  "id": "create-auth-file",
  "content": "Создать файл аутентификации",
  "status": "pending",
  "priority": "high",
  "verification": {
    "steps": [
      {
        "id": "check-file",
        "description": "Файл auth.ts существует",
        "type": "file_exists",
        "params": {"path": "src/auth.ts"},
        "status": "pending"
      },
      {
        "id": "check-content",
        "description": "Файл содержит функцию login",
        "type": "file_contains",
        "params": {"path": "src/auth.ts", "content": "function login"},
        "status": "pending"
      }
    ],
    "status": "pending",
    "required": true
  }
}]
```

### 9.2 Отметка выполненной с верификацией
```json
todo_write todos=[{"id": "create-auth-file", "content": "...", "status": "completed"}] verify=true
```
**Ожидаемый результат:** Если файл не существует, статус останется `in_progress` с примечанием об ошибке

---

## Тест 10: Зависимости между задачами

```json
todo_write todos=[
  {"id": "task1", "content": "Создать структуру", "status": "pending"},
  {"id": "task2", "content": "Реализовать логику", "status": "pending", "dependencies": ["task1"]},
  {"id": "task3", "content": "Написать тесты", "status": "pending", "dependencies": ["task2"]}
]
```

При попытке сделать task2 `in_progress` до завершения task1:
**Ожидаемый результат:** Статус `blocked`, примечание `Blocked by: task1`

---

## Тест 11: Планирование с Knowledge

```json
exit_plan_mode plan="## Реализация системы уведомлений

### Фаза 1: Основа
- Модель данных для уведомлений
- API endpoints (CRUD)
- WebSocket для real-time

### Фаза 2: Интеграция
- Email уведомления
- Push уведомления
- Шаблоны сообщений

### Фаза 3: Тестирование
- Unit тесты
- Integration тесты
- Нагрузочное тестирование" verification={
  "autoVerify": true,
  "requiredFiles": ["src/notifications/index.ts"],
  "testCommands": ["npm test -- notifications"]
} tags=["feature", "notifications", "v2"] saveToKnowledge=true
```
**Ожидаемый результат:** План сохранён с `knowledgeId` для семантического поиска

---

## Тест 12: Scope (global vs project)

### 12.1 Глобальные данные
```json
model_storage operation=set scope=global namespace=knowledge key="user_prefs" value='{"theme":"dark"}'
```

### 12.2 Данные проекта
```json
model_storage operation=set scope=project namespace=roadmap key="release_v1" value='{"date":"2025-02-01"}'
```

---

## Автоматические тесты

```bash
# Запуск unit тестов
cd /home/z/my-project/ollama-code/packages/core
npx vitest run src/knowledge/

# Запуск с покрытием
npx vitest run --coverage src/knowledge/
```

---

## Проверка файловой структуры

```bash
# Просмотр storage директории
ls -la ~/.ollama-code/storage/

# Просмотр knowledge директории
ls -la ~/.ollama-code/knowledge/

# Просмотр backup'ов
ls -la ~/.ollama-code/storage/backups/
```

---

## Отладка

При проблемах проверьте логи:
```bash
# Установка уровня логирования
export DEBUG=STORAGE_TOOL:debug,KNOWLEDGE_BASE:debug

# Просмотр логов в консоли при запуске
```
