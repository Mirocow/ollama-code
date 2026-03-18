# Пример 4: Управление сессией

## Описание
Этот пример показывает как использовать storage для управления контекстом сессии и продолжения работы.

## Запуск
```bash
ollama-code --file ./examples/storage/example-4-session.md
```

---

## Задание

### 1. Сохранение прогресса сессии

```json
model_storage operation=set namespace=context key="session_progress" value='{
  "task": "Реализация системы уведомлений",
  "startedAt": "2025-01-15T09:00:00Z",
  "completed": [
    "Создана модель Notification",
    "Реализован NotificationService",
    "Добавлены unit тесты"
  ],
  "inProgress": "Интеграция с WebSocket",
  "nextSteps": [
    "Реализовать push-уведомления",
    "Добавить email-уведомления",
    "Написать integration тесты"
  ],
  "files": [
    "src/models/Notification.ts",
    "src/services/NotificationService.ts",
    "tests/notification.test.ts"
  ],
  "notes": "Использовать Server-Sent Events для real-time обновлений"
}'
```

### 2. Сохранение контекста текущей задачи

```json
model_storage operation=addWithEmbedding namespace=knowledge key="notification_implementation" value='
## Система уведомлений - Архитектура

### Компоненты:
1. **NotificationService** - основной сервис
   - create(userId, type, data)
   - markAsRead(notificationId)
   - getUserNotifications(userId)

2. **WebSocket Integration**
   - Real-time delivery через SSE
   - Fallback к polling при недоступности

3. **Email Integration**
   - Шаблоны через handlebars
   - Очередь через Redis/Bull

### Выборы сделанные:
- SSE вместо WebSocket (проще для односторонней связи)
- Redis для очередей (уже используется в проекте)
- Handlebars для шаблонов (лучше чем EJS)
' tags=["architecture", "notifications", "decisions"]
```

### 3. Сохранение ошибок и решений

```json
model_storage operation=addWithEmbedding namespace=learning key="sse_cors_error" value='
## Ошибка: SSE CORS

### Проблема
Server-Sent Events не работают с CORS:
"EventSource cannot load due to access control checks"

### Решение
На сервере добавить заголовки:
```javascript
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
```

### Важно
SSE требует GET запрос, не POST!
' tags=["error", "sse", "cors", "solution"]
```

### 4. Сохранение соглашений проекта

```json
model_storage operation=addWithEmbedding namespace=knowledge key="project_conventions" value='
## Соглашения проекта

### Именование
- Файлы: kebab-case.ts
- Классы: PascalCase
- Функции: camelCase
- Константы: SCREAMING_SNAKE_CASE

### Структура
- src/models/ - модели данных
- src/services/ - бизнес-логика
- src/routes/ - HTTP endpoints
- tests/ - тесты (зеркальная структура)

### Тестирование
- Framework: Vitest
- Coverage: минимум 80%
- Именование: *.test.ts
' tags=["conventions", "standards", "important"]
```

### 5. Проверка сохранённых данных

```json
model_storage operation=search query="соглашения именование файлы" namespaces=["knowledge"] limit=3
```

### 6. Поиск решений проблем

```json
model_storage operation=search query="CORS ошибка решение" namespaces=["learning"] limit=3
```

---

## Продолжение работы в новой сессии

При запуске `ollama-code` или `ollama-code --resume`, система автоматически:

1. Загружает `context/session_progress`
2. Проверяет активные планы через `plans/current`
3. Проверяет активные задачи через `todos/items`
4. Показывает напоминание о текущей работе

## Как загрузить контекст вручную

```json
model_storage operation=get namespace=context key="session_progress"
model_storage operation=search query="текущая задача" namespaces=["context", "knowledge"] limit=5
```

## Ожидаемый результат

1. ✅ Прогресс сессии сохранён
2. ✅ Архитектура уведомлений доступна для поиска
3. ✅ Решение CORS ошибки сохранено для будущих сессий
4. ✅ Соглашения проекта легко находятся по смыслу
5. ✅ При новом запуске будет напоминание о текущей работе
