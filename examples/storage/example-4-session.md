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

Используй model_storage:

- operation: set
- namespace: context
- key: session_progress
- value: объект с полями:
  - task: "Реализация системы уведомлений"
  - startedAt: текущая дата в ISO формате
  - completed: ["Создана модель Notification", "Реализован NotificationService"]
  - inProgress: "Интеграция с WebSocket"
  - nextSteps: ["Реализовать push-уведомления", "Добавить email-уведомления"]
  - files: ["src/models/Notification.ts", "src/services/NotificationService.ts"]
  - notes: "Использовать Server-Sent Events для real-time обновлений"

### 2. Сохранение контекста текущей задачи

Используй model_storage:

- operation: addWithEmbedding
- namespace: knowledge
- key: notification_implementation
- value: текст с архитектурой системы уведомлений (компоненты, выборы технологий)
- tags: ["architecture", "notifications", "decisions"]

### 3. Сохранение ошибок и решений

Используй model_storage:

- operation: addWithEmbedding
- namespace: learning
- key: sse_cors_error
- value: текст с описанием CORS ошибки в SSE и её решением
- tags: ["error", "sse", "cors", "solution"]

### 4. Сохранение соглашений проекта

Используй model_storage:

- operation: addWithEmbedding
- namespace: knowledge
- key: project_conventions
- value: текст с соглашениями по именованию, структуре проекта, тестированию
- tags: ["conventions", "standards", "important"]

### 5. Проверка сохранённых данных

Используй model_storage:

- operation: search
- query: "соглашения именование файлы"
- namespaces: ["knowledge"]
- limit: 3

### 6. Поиск решений проблем

Используй model_storage:

- operation: search
- query: "CORS ошибка решение"
- namespaces: ["learning"]
- limit: 3

---

## Продолжение работы в новой сессии

При запуске `ollama-code --resume`, система автоматически:

1. Загружает context/session_progress
2. Проверяет активные планы через plans/current
3. Проверяет активные задачи через todos/items
4. Показывает напоминание о текущей работе

## Как загрузить контекст вручную

Используй model_storage:

- operation: get, namespace: context, key: session_progress
- operation: search, query: "текущая задача", namespaces: ["context", "knowledge"], limit: 5

## Ожидаемый результат

1. ✅ Прогресс сессии сохранён
2. ✅ Архитектура уведомлений доступна для поиска
3. ✅ Решение CORS ошибки сохранено для будущих сессий
4. ✅ Соглашения проекта легко находятся по смыслу
5. ✅ При новом запуске будет напоминание о текущей работе
