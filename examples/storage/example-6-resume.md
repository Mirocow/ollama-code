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

## Сценарий

### 1. Перед завершением предыдущей сессии

Модель автоматически сохраняет контекст:

```json
// Автоматически при завершении
model_storage operation=set namespace=context key="session_progress" value='{
  "task": "Реализация системы аутентификации",
  "phase": "implementation",
  "progress": 65,
  "completed": ["User model", "JWT service", "Auth middleware"],
  "pending": ["Refresh tokens", "Tests", "Documentation"],
  "filesInvolved": ["src/auth/*.ts", "src/models/User.ts", "tests/auth/*.test.ts"],
  "lastFile": "src/auth/middleware.ts",
  "nextSteps": ["Добавить refresh token логику", "Написать unit тесты"]
}'
```

### 2. При возобновлении сессии

Модель автоматически загружает контекст:

```
<resume-context>
📂 **Session Resumed - Context Restored from Storage**

Your previous work context has been loaded from persistent storage:

### 📋 Active Plans
🔄 **auth_feature**: 65% complete (4/6 steps)

### 📝 Pending Tasks
🔄 `implement-refresh`: Реализовать refresh token логику
⏳ `write-tests`: Написать unit тесты для auth
⏳ `add-docs`: Добавить документацию API

### 🎯 Current Work
**Task**: Реализация системы аутентификации
**Progress**: 65%
**Next Steps**:
  - Добавить refresh token логику
  - Написать unit тесты

### Recommended Actions
```json
model_storage operation=get namespace=plans key="current"
model_storage operation=get namespace=todos key="items"
model_storage operation=search query="auth implementation" namespaces=["knowledge"] limit=5
```

</resume-context>
```

### 3. Продолжение работы

После загрузки контекста модель продолжит работу:

```json
// Модель проверяет текущее состояние
model_storage operation=get namespace=context key="session_progress"

// Проверяет связанные знания
model_storage operation=search query="JWT refresh token implementation" namespaces=["knowledge"] limit=3

// Продолжает с прерванного места
read_file path="src/auth/middleware.ts"
```

---

## Автоматические напоминания

### При высоком использовании контекста

```
<storage-warning priority="high">
⚠️ Context usage is high (~80k tokens). Consider:
1. Store discovered patterns to knowledge namespace
2. Use semantic search instead of keeping reference material
3. Clear completed items from context
</storage-warning>
```

### Периодические напоминания

```
<storage-hint>
💡 Storage reminder: Save valuable discoveries:
- model_storage operation=addWithEmbedding namespace=knowledge key="discovery" value="..."
- model_storage operation=merge namespace=context key="progress" value="{...}"
</storage-hint>
```

---

## Структура сохранённых данных

### plans namespace
```json
{
  "id": "plan_xyz123",
  "plan": "## Реализация Auth\n...",
  "status": "active",
  "progress": 65,
  "todos": [...],
  "verification": {
    "requiredFiles": ["src/auth/index.ts"],
    "testCommands": ["npm test -- auth"]
  },
  "knowledgeId": "kb_abc456"
}
```

### todos namespace
```json
{
  "items": [
    {
      "id": "implement-refresh",
      "content": "Реализовать refresh token логику",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "id": "write-tests",
      "content": "Написать unit тесты",
      "status": "pending",
      "dependencies": ["implement-refresh"]
    }
  ],
  "planId": "plan_xyz123"
}
```

### context namespace
```json
{
  "task": "Реализация системы аутентификации",
  "phase": "implementation",
  "progress": 65,
  "filesInvolved": ["src/auth/*.ts"],
  "nextSteps": ["Добавить refresh token логику"]
}
```

---

## Ожидаемый результат

1. ✅ Контекст автоматически загружен из storage
2. ✅ Модель видит активные планы и задачи
3. ✅ Продолжает работу с прерванного места
4. ✅ Не требует повторного объяснения задачи

## Советы

- Используйте `model_storage` регулярно для сохранения прогресса
- Добавляйте важные паттерны с `addWithEmbedding` для семантического поиска
- Устанавливайте теги для категоризации
- Связывайте todos с планами через `exit_plan_mode`
