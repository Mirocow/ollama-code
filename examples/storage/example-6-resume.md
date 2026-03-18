# Пример 6: Resume - Восстановление контекста сессии

## Описание

Этот пример показывает как работает восстановление контекста при использовании флага `--resume` или команды `/resume`.

## Запуск

```bash
# Если есть предыдущая сессия
ollama-code --resume

# Или внутри активной сессии
/resume
```

---

## Задание

### 1. Перед завершением предыдущей сессии

Модель автоматически сохраняет контекст. Давай сохраним прогресс вручную:

Используй model_storage:

- operation: set
- namespace: context
- key: session_progress
- value: объект с полями:
  - task: "Реализация системы аутентификации"
  - phase: "implementation"
  - progress: 65
  - completed: ["User model", "JWT service", "Auth middleware"]
  - pending: ["Refresh tokens", "Tests", "Documentation"]
  - filesInvolved: ["src/auth/*.ts", "src/models/User.ts"]
  - lastFile: "src/auth/middleware.ts"
  - nextSteps: ["Добавить refresh token логику", "Написать unit тесты"]

### 2. Создай план

Используй exit_plan_mode:

- plan: текст плана с фазами реализации auth системы
- verification: autoVerify=true, requiredFiles, testCommands
- tags: ["auth", "feature"]
- saveToKnowledge: true

### 3. Создай задачи

Используй todo_write:

- todos: массив задач с id, content, status, priority
- одна задача в статусе in_progress (implement-refresh)
- одна задача pending с dependency на implement-refresh

### 4. Сохрани знания

Используй model_storage:

- operation: addWithEmbedding
- namespace: knowledge
- key: auth_jwt_pattern
- value: текст про JWT паттерн с последовательностью действий
- tags: ["auth", "jwt", "security"]

### 5. Проверь что сохранилось

Используй model_storage:

- operation: get, namespace: context, key: session_progress
- operation: get, namespace: plans, key: current
- operation: get, namespace: todos, key: items

### 6. Поиск по знаниям

Используй model_storage:

- operation: search
- query: "как работает JWT аутентификация"
- namespaces: ["knowledge"]
- limit: 3

### 7. Создай backup

Используй model_storage:

- operation: backup

---

## Автоматические напоминания

При высоком использовании контекста система может показать предупреждение о необходимости сохранить данные в storage.

---

## Ожидаемый результат

1. ✅ Контекст сохранён в storage
2. ✅ План связан с задачами через planId
3. ✅ Знания доступны для семантического поиска
4. ✅ При новом запуске с --resume данные загрузятся автоматически

## Советы

- Используйте model_storage регулярно для сохранения прогресса
- Добавляйте важные паттерны с addWithEmbedding для семантического поиска
- Устанавливайте теги для категоризации
- Связывайте todos с планами через exit_plan_mode
