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

Выполни несколько операций за раз:

```json
model_storage operation=batch namespace=knowledge actions=[
  {"operation": "set", "key": "api_version", "value": "2.0.0"},
  {"operation": "set", "key": "api_base_url", "value": "https://api.example.com"},
  {"operation": "set", "key": "api_timeout", "value": 30000},
  {"operation": "set", "key": "api_retries", "value": 3}
]
```

### 2. TTL (время жизни)

Сохрани временные данные с автоматическим удалением:

```json
model_storage operation=set namespace=session key="temp_auth_code" value='{"code": "123456", "purpose": "email_verification"}' ttl=300 tags=["temporary", "auth"]
```

Проверь TTL в метаданных:
```json
model_storage operation=get namespace=session key="temp_auth_code" includeMetadata=true
```

### 3. Merge (слияние объектов)

```json
model_storage operation=set namespace=knowledge key="api_config" value='{"version": "1.0", "timeout": 5000}'

model_storage operation=merge namespace=knowledge key="api_config" value='{"version": "2.0", "retries": 3}'
```

### 4. Append (добавление в массив)

```json
model_storage operation=set namespace=knowledge key="api_endpoints" value='["/users", "/posts"]'

model_storage operation=append namespace=knowledge key="api_endpoints" value='/comments'

model_storage operation=append namespace=knowledge key="api_endpoints" value='/likes'
```

### 5. Создание backup

```json
model_storage operation=backup
```

### 6. Список backup'ов

```json
model_storage operation=restore
```

### 7. Статистика

```json
model_storage operation=stats namespace=knowledge
model_storage operation=knowledgeStats
```

### 8. Поиск похожих записей

```json
model_storage operation=findSimilar namespace=knowledge key="api_config" limit=3
```

### 9. Глобальный vs Project scope

Глобальные данные (доступны во всех проектах):
```json
model_storage operation=set scope=global namespace=knowledge key="preferred_editor" value='{"editor": "cursor", "theme": "dark"}'
```

Данные проекта (только для текущего проекта):
```json
model_storage operation=set scope=project namespace=roadmap key="v1_release" value='{"date": "2025-02-01", "features": ["auth", "api"]}'
```

### 10. Exists проверка

```json
model_storage operation=exists namespace=knowledge key="api_config"
model_storage operation=exists namespace=knowledge key="nonexistent_key"
```

---

## Полный сценарий: Начало рабочего дня

```json
// 1. Проверить контекст
model_storage operation=search query="текущая задача прогресс" namespaces=["context"] limit=3

// 2. Загрузить активные задачи
model_storage operation=get namespace=todos key="items"

// 3. Проверить активный план
model_storage operation=get namespace=plans key="current"

// 4. Поиск нужных паттернов
model_storage operation=search query="как реализовать аутентификацию" namespaces=["knowledge"] limit=5

// 5. Статистика knowledge base
model_storage operation=knowledgeStats
```

## Полный сценарий: Конец рабочего дня

```json
// 1. Сохранить прогресс
model_storage operation=set namespace=context key="session_progress" value='{
  "task": "Текущая задача",
  "completed": ["step1", "step2"],
  "nextSteps": ["step3"],
  "notes": "Важные заметки"
}'

// 2. Сохранить найденные паттерны
model_storage operation=addWithEmbedding namespace=knowledge key="learned_pattern_1" value='...' tags=["pattern"]

// 3. Обновить roadmap
model_storage operation=merge namespace=roadmap key="v1_progress" value='{"completed": ["feature1"]}'

// 4. Создать backup
model_storage operation=backup
```

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
