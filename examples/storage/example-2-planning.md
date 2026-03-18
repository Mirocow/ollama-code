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

Используй инструмент exit_plan_mode для создания плана реализации Users API:

**План должен включать:**

- Фаза 1: Модель данных (User interface, валидация полей)
- Фаза 2: API Endpoints (GET /api/users, POST /api/users, GET /api/users/:id)
- Фаза 3: Тестирование (Unit тесты, Integration тесты)

**Параметры верификации:**

- autoVerify: true
- requiredFiles: ["src/models/User.ts", "src/routes/users.ts", "tests/users.test.ts"]
- checkCommands: ["npm run build", "npm run lint"]
- testCommands: ["npm test -- users"]

**Дополнительные параметры:**

- tags: ["api", "users", "feature"]
- saveToKnowledge: true

### 2. Создай задачи с верификацией

Используй инструмент todo_write для создания задачи:

- id: create-user-model
- content: "Создать модель User с валидацией"
- status: pending
- priority: high

**Шаги верификации для задачи:**

1. Проверить что файл src/models/User.ts существует (тип: file_exists)
2. Проверить что файл содержит "interface User" (тип: file_contains)
3. Проверить что файл содержит функцию "validate" (тип: file_contains)

### 3. Создай зависимые задачи

Используй todo_write для создания цепочки зависимых задач:

1. create-user-model (priority: high, нет зависимостей)
2. create-user-service (priority: high, зависит от create-user-model)
3. create-user-routes (priority: high, зависит от create-user-service)
4. write-tests (priority: medium, зависит от create-user-routes, с верификацией через test_pass)

### 4. Проверь связь плана и задач

Используй model_storage:

- operation: get, namespace: plans, key: current
- operation: get, namespace: todos, key: items

---

## Ожидаемый результат

1. ✅ План сохранён с `knowledgeId` для семантического поиска
2. ✅ Задача `create-user-model` имеет шаги верификации
3. ✅ Задачи связаны зависимостями
4. ✅ При попытке выполнить `create-user-service` до `create-user-model` - статус будет `blocked`

## Как работает верификация

При отметке задачи как `completed` с параметром `verify=true`:

1. Выполняются все шаги верификации
2. Если шаг провален и `required=true` - задача остаётся `in_progress`
3. Результат верификации сохраняется в `verification.result`
