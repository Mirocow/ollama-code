# Пример 5: Продвинутые возможности

## Описание

Комплексный пример использования всех возможностей storage: batch операции, TTL, backup/restore.

## Запуск

```bash
ollama-code --file ./examples/storage/example-5-advanced.md
```

---

## Задание

### 1. Batch операции

Используй model_storage для выполнения нескольких операций за раз:

- operation: batch
- namespace: knowledge
- actions: массив из 4 операций set:
  - key: api_version, value: "2.0.0"
  - key: api_base_url, value: "https://api.example.com"
  - key: api_timeout, value: 30000
  - key: api_retries, value: 3

### 2. TTL (время жизни)

Сохрани временные данные с автоматическим удалением через 5 минут:

- operation: set
- namespace: session
- key: temp_auth_code
- value: объект с code="123456" и purpose="email_verification"
- ttl: 300 (секунд)
- tags: ["temporary", "auth"]

Проверь TTL в метаданных:

- operation: get
- namespace: session
- key: temp_auth_code
- includeMetadata: true

### 3. Merge (слияние объектов)

Сначала сохрани базовый конфиг:

- operation: set
- namespace: knowledge
- key: api_config
- value: {"version": "1.0", "timeout": 5000}

Затем объедини с новыми значениями:

- operation: merge
- namespace: knowledge
- key: api_config
- value: {"version": "2.0", "retries": 3}

### 4. Append (добавление в массив)

Создай массив endpoints:

- operation: set
- namespace: knowledge
- key: api_endpoints
- value: ["/users", "/posts"]

Добавь новые endpoints:

- operation: append
- namespace: knowledge
- key: api_endpoints
- value: "/comments"

- operation: append
- namespace: knowledge
- key: api_endpoints
- value: "/likes"

### 5. Создание backup

Используй model_storage:

- operation: backup

### 6. Список backup'ов

Используй model_storage:

- operation: restore (без параметра timestamp покажет список доступных backup'ов)

### 7. Статистика

Используй model_storage:

- operation: stats
- namespace: knowledge

### 8. Поиск похожих записей

Используй model_storage:

- operation: findSimilar
- namespace: knowledge
- key: api_config
- limit: 3

### 9. Глобальный vs Project scope

Глобальные данные (доступны во всех проектах):

- operation: set
- scope: global
- namespace: knowledge
- key: preferred_editor
- value: {"editor": "cursor", "theme": "dark"}

Данные проекта (только для текущего проекта):

- operation: set
- scope: project
- namespace: roadmap
- key: v1_release
- value: {"date": "2025-02-01", "features": ["auth", "api"]}

### 10. Exists проверка

Используй model_storage:

- operation: exists
- namespace: knowledge
- key: api_config

- operation: exists
- namespace: knowledge
- key: nonexistent_key

---

## Полный сценарий: Начало рабочего дня

1. Проверить контекст:

   - operation: search, query: "текущая задача прогресс", namespaces: ["context"], limit: 3

2. Загрузить активные задачи:

   - operation: get, namespace: todos, key: items

3. Проверить активный план:

   - operation: get, namespace: plans, key: current

4. Поиск нужных паттернов:

   - operation: search, query: "как реализовать аутентификацию", namespaces: ["knowledge"], limit: 5

5. Статистика knowledge base:
   - operation: knowledgeStats

## Полный сценарий: Конец рабочего дня

1. Сохранить прогресс:

   - operation: set, namespace: context, key: session_progress, value: объект с task, completed, nextSteps, notes

2. Сохранить найденные паттерны:

   - operation: addWithEmbedding, namespace: knowledge, key: learned_pattern_1, value: текст паттерна, tags: ["pattern"]

3. Обновить roadmap:

   - operation: merge, namespace: roadmap, key: v1_progress, value: {"completed": ["feature1"]}

4. Создать backup:
   - operation: backup

---

## Ожидаемый результат

1. ✅ Batch операции выполнены успешно
2. ✅ TTL запись имеет `expiresAt` в метаданных
3. ✅ Merge объединил объекты корректно
4. ✅ Append добавил элементы в массив
5. ✅ Backup создан с timestamp
6. ✅ Статистика показывает корректные данные
7. ✅ Scope работает как ожидается (global/project)

## Советы

- Используй `batch` для множества изменений
- Используй `ttl` для временных данных (коды подтверждения, временные токены)
- Создавай `backup` перед важными изменениями
- Проверяй `stats` для мониторинга storage
