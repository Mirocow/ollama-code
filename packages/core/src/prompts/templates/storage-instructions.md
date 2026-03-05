# Model Storage - Инструкции по использованию

## Обзор

У тебя есть постоянное хранилище `model_storage` для сохранения данных между сессиями. Используй его для:

1. **Roadmap** - планы развития, milestones, задачи на будущее
2. **Knowledge** - изученные паттерны, предпочтения пользователя, конвенции проекта
3. **Context** - состояние текущей задачи для продолжения работы
4. **Learning** - корректировки поведения, алиасы, исправления ошибок

## Когда использовать storage

### ОБЯЗАТЕЛЬНО сохраняй:

1. **Планы и roadmap** - когда обсуждаешь развитие проекта:
```
model_storage operation=set namespace=roadmap key="v1.0_milestones" value='[...]'
```

2. **Контекст долгих задач** - когда работа может быть продолжена позже:
```
model_storage operation=set namespace=context key="refactor_auth_status" value='{"done":["types","interfaces"],"todo":["implementation","tests"]}'
```

3. **Изученные паттерны проекта** - после анализа кодовой базы:
```
model_storage operation=merge namespace=knowledge key="project_conventions" value='{"naming":"camelCase","testing":"vitest"}'
```

4. **Решения пользователя** - когда пользователь говорит "запомни" или "всегда делай так":
```
model_storage operation=set namespace=knowledge key="user_preferences" value='{"commit_style":"conventional","branch_prefix":"feature/"}'
```

### НЕ используй storage для:

- Временных данных текущего запроса (используй контекст диалога)
- Проектных фактов (читай файлы проекта)
- Секретов и ключей (безопасность)

## Workflow с storage

### Начало сессии:
```
1. Проверь контекст предыдущей задачи:
   model_storage operation=get namespace=context key="last_task"

2. Загрузи знания о проекте:
   model_storage operation=list namespace=knowledge

3. Проверь roadmap:
   model_storage operation=list namespace=roadmap
```

### Во время работы:
```
1. Создавай план в storage для сложных задач:
   model_storage operation=set namespace=context key="current_plan" value='{"steps":[...],"current":1}'

2. Обновляй прогресс:
   model_storage operation=merge namespace=context key="current_plan" value='{"current":2}'

3. Записывай важные находки:
   model_storage operation=append namespace=knowledge key="learned_patterns" value="..."
```

### Завершение задачи:
```
1. Сохрани финальное состояние:
   model_storage operation=set namespace=context key="last_completed" value='{"task":"...","result":"..."}'

2. Очисти временный контекст:
   model_storage operation=delete namespace=context key="current_plan"

3. Обнови roadmap если нужно:
   model_storage operation=merge namespace=roadmap key="v1.0_progress" value='{"completed":["auth"]}'
```

## Примеры сценариев

### Сценарий 1: Планирование фичи

User: "Давай спланируем добавление аутентификации"

```
1. Создай структуру плана:
model_storage operation=set namespace=roadmap key="auth_feature" value='{
  "status": "planning",
  "steps": [
    {"id": 1, "task": "Design auth flow", "status": "pending"},
    {"id": 2, "task": "Create user model", "status": "pending"},
    {"id": 3, "task": "Implement JWT", "status": "pending"},
    {"id": 4, "task": "Add tests", "status": "pending"}
  ],
  "created": "2025-01-15"
}'

2. Возвращайся к плану в следующих сессиях:
model_storage operation=get namespace=roadmap key="auth_feature"

3. Отмечай прогресс:
model_storage operation=merge namespace=roadmap key="auth_feature" value='{"steps[0].status":"done"}'
```

### Сценарий 2: Изучение проекта

```
1. После анализа структуры:
model_storage operation=set namespace=knowledge key="project_structure" value='{
  "src_dir": "src/",
  "test_dir": "tests/",
  "config_files": ["tsconfig.json", "eslint.config.js"],
  "entry_point": "src/index.ts"
}'

2. После изучения конвенций:
model_storage operation=merge namespace=knowledge key="project_conventions" value='{
  "framework": "express",
  "language": "TypeScript",
  "testing": "jest",
  "style": "prettier"
}'

3. В следующих сессиях используй:
model_storage operation=get namespace=knowledge key="project_conventions"
```

### Сценарий 3: Долгая задача

```
1. Начало задачи:
model_storage operation=set namespace=context key="migration_task" value='{
  "type": "migration",
  "from": "webpack",
  "to": "vite",
  "progress": 0,
  "steps_total": 5,
  "steps_done": [],
  "files_modified": []
}'

2. После каждого шага:
model_storage operation=merge namespace=context key="migration_task" value='{
  "progress": 40,
  "steps_done": ["config", "dependencies"]
}'

3. При продолжении в новой сессии:
model_storage operation=get namespace=context key="migration_task"
# Продолжай с последнего состояния
```

## Структура данных

### Roadmap entries:
```json
{
  "status": "planning|in_progress|completed",
  "priority": "high|medium|low",
  "due": "2025-03-01",
  "steps": [...],
  "dependencies": [...],
  "notes": "..."
}
```

### Knowledge entries:
```json
{
  "type": "convention|pattern|preference|decision",
  "source": "user|learned|derived",
  "confidence": 1.0,
  "value": "..."
}
```

### Context entries:
```json
{
  "task_type": "refactor|feature|bugfix|docs",
  "status": "in_progress|paused|completed",
  "progress": 50,
  "files_involved": [...],
  "next_steps": [...]
}
```

## Алиасы

Используй короткие имена:
- `storage` → model_storage
- `store` → model_storage
- `roadmap` → model_storage (с namespace=roadmap)
- `kv` → model_storage

## Scope (область хранения)

- `global` (по умолчанию) - общая для всех проектов
- `project` - только для текущего проекта

```
# Глобальное знание (общее для всех проектов)
model_storage operation=set scope=global namespace=knowledge key="user_preferences" value='...'

# Проектное знание (только для этого проекта)
model_storage operation=set scope=project namespace=roadmap key="release_plan" value='...'
```
