# Примеры использования Model Storage

## Обзор

Это руководство показывает, как AI-модель может эффективно использовать расширенную систему хранения с семантическим поиском, верификацией и потоковым чтением.

---

## 1. Семантический поиск - экономия контекста

### Базовый семантический поиск
```
Пользователь: "Найди паттерны аутентификации в базе знаний"

AI должен вызвать:
model_storage operation=search query="аутентификация авторизация login JWT OAuth" namespaces=["knowledge"] limit=5
```

### Поиск по нескольким namespace
```
Пользователь: "Найди всё связанное с обработкой ошибок"

AI должен вызвать:
model_storage operation=search query="обработка ошибок exceptions try catch" namespaces=["knowledge", "learning", "roadmap"] limit=10 mode="semantic"
```

### Поиск по ключевым словам (fallback)
```
Пользователь: "Найди точный текст 'DatabaseConnection'"

AI должен вызвать:
model_storage operation=search query="DatabaseConnection" mode="keyword" limit=10
```

---

## 2. Сохранение знаний с эмбеддингами

### Сохранение важного паттерна для будущего поиска
```
Пользователь: "Запомни этот паттерн аутентификации"

AI должен вызвать:
model_storage operation=addWithEmbedding namespace=knowledge key="auth_pattern_v1" value='{
  "pattern": "JWT аутентификация",
  "steps": [
    "1. Пользователь отправляет учётные данные",
    "2. Сервер проверяет и выдаёт JWT",
    "3. Клиент хранит токен в защищённом хранилище",
    "4. Токен включается в заголовок Authorization"
  ],
  "security_notes": "Всегда используйте HTTPS, реализуйте refresh токены"
}' tags=["auth", "security", "jwt", "important"]
```

### Сохранение паттерна кода
```
Пользователь: "Сохрани этот паттерн обработки ошибок"

AI должен вызвать:
model_storage operation=addWithEmbedding namespace=knowledge key="error_handling_pattern" value='
## Паттерн обработки ошибок

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error("Операция failed", { error, context });
  return { success: false, error: error.message };
}
```

Используйте этот паттерн для всех async операций, которые могут упасть.
' tags=["pattern", "error-handling", "typescript"]
```

---

## 3. Поиск похожих записей

### Найти похожие реализации
```
Пользователь: "Найди код похожий на auth модуль"

AI должен вызвать:
model_storage operation=findSimilar namespace=knowledge key="auth_module" limit=5 threshold=0.7
```

### Поиск в том же namespace
```
Пользователь: "Найди похожие паттерны в базе знаний"

AI должен вызвать:
model_storage operation=findSimilar namespace=knowledge key="current_pattern" limit=3 sameNamespace=true
```

---

## 4. Система верификации задач

### Создание задачи с шагами верификации
```
Пользователь: "Добавь задачу реализовать регистрацию с проверкой файлов и тестов"

AI должен вызвать:
todo_write todos=[
  {
    "id": "implement-registration",
    "content": "Реализовать endpoint регистрации пользователя",
    "status": "pending",
    "priority": "high",
    "verification": {
      "steps": [
        {
          "id": "check_route_file",
          "description": "Файл маршрута регистрации существует",
          "type": "file_exists",
          "params": { "path": "src/routes/auth.ts" },
          "status": "pending"
        },
        {
          "id": "check_route_content",
          "description": "Маршрут содержит обработчик регистрации",
          "type": "file_contains",
          "params": { "path": "src/routes/auth.ts", "content": "register" },
          "status": "pending"
        },
        {
          "id": "run_tests",
          "description": "Тесты регистрации проходят",
          "type": "test_pass",
          "params": { "testPath": "tests/auth.test.ts" },
          "status": "pending"
        }
      ],
      "status": "pending",
      "required": true
    }
  }
]
```

### Верификация при завершении
```
Пользователь: "Отметь задачу регистрации как выполненную и проверь"

AI должен вызвать:
todo_write todos=[
  {
    "id": "implement-registration",
    "content": "Реализовать endpoint регистрации пользователя",
    "status": "completed"
  }
] verify=true
```

### Задачи с зависимостями
```
Пользователь: "Создай последовательность зависимых задач для фичи"

AI должен вызвать:
todo_write todos=[
  {
    "id": "design-api",
    "content": "Спроектировать API контракт",
    "status": "pending",
    "priority": "high"
  },
  {
    "id": "implement-api",
    "content": "Реализовать API endpoints",
    "status": "pending",
    "priority": "high",
    "dependencies": ["design-api"]
  },
  {
    "id": "write-tests",
    "content": "Написать интеграционные тесты",
    "status": "pending",
    "priority": "medium",
    "dependencies": ["implement-api"],
    "verification": {
      "steps": [
        {
          "id": "test_coverage",
          "description": "Покрытие тестов выше 80%",
          "type": "command_success",
          "params": { "command": "npm run test:coverage" },
          "status": "pending"
        }
      ],
      "status": "pending"
    }
  }
]
```

---

## 5. Планирование с верификацией

### Создание плана с верификацией
```
Пользователь: "Создай план реализации платёжной системы с проверкой"

AI должен вызвать:
exit_plan_mode plan="## Реализация платёжной системы

### Фаза 1: Настройка
- [ ] Создать структуру модуля платежей
- [ ] Настроить интеграцию со Stripe
- [ ] Создать схему базы данных

### Фаза 2: Основные функции
- [ ] Реализовать flow оплаты
- [ ] Добавить обработчики webhook
- [ ] Создать управление подписками

### Фаза 3: Тестирование и безопасность
- [ ] Написать unit тесты
- [ ] Добавить интеграционные тесты
- [ ] Аудит безопасности" verification={
  "autoVerify": true,
  "checkCommands": ["npm run build", "npm run lint"],
  "requiredFiles": ["src/payment/index.ts", "src/payment/stripe.ts"],
  "testCommands": ["npm test -- payment"]
} tags=["payment", "stripe", "critical"] saveToKnowledge=true
```

---

## 6. Потоковое чтение больших файлов

### Чтение большого файла с пагинацией
```
Пользователь: "Прочитай большой лог-файл из хранилища"

AI должен вызвать:
model_storage operation=get namespace=logs key="application.log" streamLines=true startLine=0 maxLines=100
```

### Продолжение чтения большого файла
```
Пользователь: "Покажи ещё строки из лога"

AI должен вызвать:
model_storage operation=get namespace=logs key="application.log" streamLines=true startLine=100 maxLines=100
```

### Авто-усечённый ответ
```
Пользователь: "Получи полную конфигурацию"

AI получает усечённый ответ с подсказкой:
"... [truncated, use streamLines=true with startLine/maxLines to read more]"

AI должен вызвать:
model_storage operation=get namespace=config key="full_config" streamLines=true maxLines=500
```

---

## 7. Примеры рабочего процесса сессии

### Начало сессии - эффективная загрузка контекста
```
Пользователь: "Продолжи работу над проектом"

AI должен:
1. Найти недавний контекст:
   model_storage operation=search query="текущая задача прогресс статус" namespaces=["context"] limit=3

2. Загрузить знания проекта:
   model_storage operation=search query="проект соглашения паттерны важное" namespaces=["knowledge"] limit=5

3. Проверить активные todos:
   model_storage operation=get namespace=todos key="items"

4. Проверить активные планы:
   model_storage operation=get namespace=plans key="current"
```

### Сохранение прогресса работы
```
Пользователь: "Сохрани мой прогресс на потом"

AI должен вызвать:
model_storage operation=set namespace=context key="session_progress" value='{
  "task": "Реализация аутентификации",
  "completed": ["JWT настройка", "Login endpoint"],
  "inProgress": "Password reset flow",
  "nextSteps": ["Email шаблоны", "Rate limiting"],
  "files": ["src/auth/jwt.ts", "src/routes/auth.ts"],
  "timestamp": "2025-01-15T10:30:00Z"
}'

// Также сохранить важные находки:
model_storage operation=addWithEmbedding namespace=knowledge key="auth_session_findings" value='
Узнал: Библиотека JWT поддерживает refresh токены из коробки.
Паттерн: Используйте httpOnly cookies для хранения токенов.
Проблема: CORS требует credentials: true для cookie auth.
' tags=["auth", "session", "findings"]
```

### Конец сессии - сохранение итогов
```
Пользователь: "Я закончил на сегодня, сохрани всё"

AI должен:
1. Сохранить summary сессии:
   model_storage operation=addWithEmbedding namespace=knowledge key="session_2025_01_15" value='
## Summary сессии - 2025-01-15

### Выполнено
- JWT аутентификация реализована
- Login/logout endpoints
- Механизм refresh токенов

### Изученные паттерны
- Хранить refresh токены в httpOnly cookies
- Реализовать rate limiting на auth endpoints
- Использовать bcrypt с cost factor 12

### Возникшие проблемы
- CORS конфигурация требует credentials
- Cookie secure flag обязателен в production
' tags=["session", "summary", "auth"]

2. Обновить roadmap:
   model_storage operation=merge namespace=roadmap key="v1.0_milestones" value='{"auth": "completed"}'

3. Очистить временный контекст:
   model_storage operation=delete namespace=context key="temporary_data"
```

---

## 8. Управление знаниями

### Сохранение соглашений проекта
```
Пользователь: "Запомни эти соглашения проекта"

AI должен вызвать:
model_storage operation=addWithEmbedding namespace=knowledge key="project_conventions" value='{
  "naming": {
    "files": "kebab-case",
    "components": "PascalCase",
    "functions": "camelCase",
    "constants": "SCREAMING_SNAKE_CASE"
  },
  "structure": {
    "components": "src/components/",
    "hooks": "src/hooks/",
    "utils": "src/utils/",
    "types": "src/types/"
  },
  "testing": {
    "framework": "vitest",
    "location": "тот же каталог с .test.ts",
    "coverage": "цель 80%+"
  }
}' tags=["conventions", "standards", "important"]
```

### Сохранение API паттернов
```
Пользователь: "Сохрани этот паттерн ответа API"

AI должен вызвать:
model_storage operation=addWithEmbedding namespace=knowledge key="api_response_pattern" value='
## Стандартный паттерн ответа API

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

Все endpoints должны возвращать эту структуру.
' tags=["api", "pattern", "typescript"]
```

### Получение знаний по контексту
```
Пользователь: "Какие у нас соглашения по аутентификации?"

AI должен вызвать:
model_storage operation=search query="аутентификация соглашения auth паттерны" namespaces=["knowledge"] limit=5
```

---

## 9. Отслеживание ошибок и обучение

### Сохранение ошибки и решения
```
Пользователь: "Запомни эту ошибку и её исправление"

AI должен вызвать:
model_storage operation=addWithEmbedding namespace=learning key="error_cors_credentials" value='
## Ошибка: CORS Credentials

### Проблема
Fetch запросы падают с:
"CredencialFlag is true but Access-Control-Allow-Credentials is not true"

### Решение
Backend CORS конфигурация должна содержать:
```javascript
app.use(cors({
  origin: "https://your-domain.com",
  credentials: true  // Это обязательно!
}));
```

Frontend fetch должен содержать:
```javascript
fetch(url, { credentials: "include" });
```

### Профилактика
Всегда проверяйте CORS конфигурацию перед деплоем auth фич.
' tags=["error", "cors", "auth", "solution"]
```

### Поиск решений
```
Пользователь: "У меня ошибка CORS"

AI должен вызвать:
model_storage operation=search query="CORS ошибка решение исправление" namespaces=["learning"] limit=3
```

---

## 10. Статистика базы знаний

### Проверка использования хранилища
```
Пользователь: "Сколько данных в базе знаний?"

AI должен вызвать:
model_storage operation=knowledgeStats
```

### Статистика namespace
```
Пользователь: "Покажи статистику хранилища для namespace knowledge"

AI должен вызвать:
model_storage operation=stats namespace=knowledge
```

---

## Резюме лучших практик

### 1. Используйте семантический поиск вместо list
```
❌ ПЛОХО: model_storage operation=list namespace=knowledge
   (возвращает ВСЕ записи, тратит много контекста)

✅ ХОРОШО: model_storage operation=search query="релевантная тема" namespaces=["knowledge"] limit=5
   (возвращает только релевантные записи, экономит контекст)
```

### 2. Добавляйте эмбеддинги к важным знаниям
```
❌ ПЛОХО: model_storage operation=set namespace=knowledge key="pattern" value="..."
   (не ищется по смыслу)

✅ ХОРОШО: model_storage operation=addWithEmbedding namespace=knowledge key="pattern" value="..." tags=["important"]
   (ищется по семантическому смыслу)
```

### 3. Используйте верификацию для критических задач
```
❌ ПЛОХО: Просто отмечать задачи выполненными без проверки

✅ ХОРОШО: Добавить шаги верификации и использовать verify=true
```

### 4. Потоковое чтение больших файлов
```
❌ ПЛОХО: model_storage operation=get key="large_file"
   (может усечься или использовать слишком много контекста)

✅ ХОРОШО: model_storage operation=get key="large_file" streamLines=true maxLines=100
   (контролируемое чтение с пагинацией)
```

### 5. Связывайте планы с knowledge
```
✅ ХОРОШО: exit_plan_mode plan="..." saveToKnowledge=true
   (план становится доступным для семантического поиска)
```

---

## Типы верификации

| Тип | Описание | Параметры |
|-----|----------|-----------|
| `file_exists` | Проверка существования файла | `path` |
| `file_contains` | Проверка содержимого файла | `path`, `content` или `regex` |
| `command_success` | Выполнение команды | `command`, `exitCode` (по умолчанию: 0) |
| `test_pass` | Запуск тестов | `testPath`, `framework` |
| `lint_pass` | Запуск линтера | `files` |
| `type_check` | Проверка TypeScript | `project` |
| `build_success` | Сборка проекта | `script` |
| `custom` | Пользовательская проверка | `command` |

---

## Быстрая справка операций

| Операция | Описание |
|----------|----------|
| `set` | Сохранить значение |
| `get` | Получить значение |
| `delete` | Удалить значение |
| `list` | Список ключей |
| `exists` | Проверить существование |
| `merge` | Слить объекты |
| `append` | Добавить в массив |
| `search` | Семантический поиск |
| `findSimilar` | Найти похожие |
| `addWithEmbedding` | Сохранить с эмбеддингом |
| `knowledgeStats` | Статистика БЗ |
| `batch` | Массовые операции |
| `backup` | Создать резервную копию |
| `restore` | Восстановить из копии |
