# Пример 2: Планирование с Верификацией

## Описание
Этот пример показывает как создавать планы с автоматической верификацией выполнения задач.

## Запуск
```bash
ollama-code --file ./examples/storage/example-2-planning.md
```

---

## Задание

### 1. Создай план с верификацией

Создай план для реализации API endpoint с проверкой:

```json
exit_plan_mode plan="## Реализация Users API

### Фаза 1: Модель данных
- [ ] Создать User interface
- [ ] Добавить валидацию полей

### Фаза 2: API Endpoints  
- [ ] GET /api/users - список пользователей
- [ ] POST /api/users - создание пользователя
- [ ] GET /api/users/:id - получение по ID

### Фаза 3: Тестирование
- [ ] Unit тесты для сервисов
- [ ] Integration тесты для endpoints" verification={
  "autoVerify": true,
  "requiredFiles": ["src/models/User.ts", "src/routes/users.ts", "tests/users.test.ts"],
  "checkCommands": ["npm run build", "npm run lint"],
  "testCommands": ["npm test -- users"]
} tags=["api", "users", "feature"] saveToKnowledge=true
```

### 2. Создай задачу с верификацией

```json
todo_write todos=[{
  "id": "create-user-model",
  "content": "Создать модель User с валидацией",
  "status": "pending",
  "priority": "high",
  "verification": {
    "steps": [
      {
        "id": "check-file",
        "description": "Файл User.ts существует",
        "type": "file_exists",
        "params": {"path": "src/models/User.ts"},
        "status": "pending"
      },
      {
        "id": "check-interface",
        "description": "Содержит interface User",
        "type": "file_contains",
        "params": {"path": "src/models/User.ts", "content": "interface User"},
        "status": "pending"
      },
      {
        "id": "check-validation",
        "description": "Содержит функцию validate",
        "type": "file_contains",
        "params": {"path": "src/models/User.ts", "content": "validate"},
        "status": "pending"
      }
    ],
    "status": "pending",
    "required": true
  }
}]
```

### 3. Создай зависимые задачи

```json
todo_write todos=[
  {
    "id": "create-user-model",
    "content": "Создать модель User",
    "status": "pending",
    "priority": "high"
  },
  {
    "id": "create-user-service",
    "content": "Создать UserService",
    "status": "pending",
    "priority": "high",
    "dependencies": ["create-user-model"]
  },
  {
    "id": "create-user-routes",
    "content": "Создать API routes",
    "status": "pending",
    "priority": "high",
    "dependencies": ["create-user-service"]
  },
  {
    "id": "write-tests",
    "content": "Написать тесты",
    "status": "pending",
    "priority": "medium",
    "dependencies": ["create-user-routes"],
    "verification": {
      "steps": [{
        "id": "run-tests",
        "description": "Тесты проходят успешно",
        "type": "test_pass",
        "params": {"testPath": "tests/users.test.ts"},
        "status": "pending"
      }],
      "required": true
    }
  }
]
```

### 4. Проверь связь плана и задач

```json
model_storage operation=get namespace=plans key="current"
model_storage operation=get namespace=todos key="items"
```

---

## Ожидаемый результат

1. ✅ План сохранён с `knowledgeId` для семантического поиска
2. ✅ Задача `create-user-model` имеет шаги верификации
3. ✅ Задачи связаны зависимостями
4. ✅ При попытке выполнить `create-user-service` до `create-user-model` - статус будет `blocked`

## Как работает верификация

При отметке задачи как `completed` с `verify=true`:
1. Выполняются все шаги верификации
2. Если шаг провален и `required=true` - задача остаётся `in_progress`
3. Результат верификации сохраняется в `verification.result`

## Пример отметки с верификацией

```json
todo_write todos=[{"id": "create-user-model", "status": "completed"}] verify=true
```
