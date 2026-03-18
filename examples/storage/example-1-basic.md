# Пример 1: Базовое использование Storage

## Описание

Этот пример демонстрирует основные операции storage: сохранение, чтение, поиск и удаление данных с использованием семантического поиска.

## Запуск

```bash
ollama-code --file ./examples/storage/example-1-basic.md
```

---

## Задание

Продемонстрируй базовое использование storage:

### 1. Сохранение данных

Используй инструмент model_storage для сохранения информации о проекте:

- operation: set
- namespace: knowledge
- key: project_info
- value: объект с полями name="ollama-code", description="AI-powered code editor with semantic storage", version="2.0.0", features=["semantic search", "verification", "streaming"], technologies=["TypeScript", "Node.js", "Ollama"]
- tags: ["project", "info"]

### 2. Сохранение с эмбеддингами

Используй модель для сохранения паттерна аутентификации с эмбеддингами:

- operation: addWithEmbedding
- namespace: knowledge
- key: auth_jwt_pattern
- value: текст про JWT аутентификацию с последовательностью действий и важными моментами
- tags: ["auth", "jwt", "security", "pattern"]

### 3. Семантический поиск

Выполни поиск по смыслу:

- operation: search
- query: "как безопасно авторизовать пользователя"
- namespaces: ["knowledge"]
- limit: 5

### 4. Чтение данных

Используй:

- operation: get
- namespace: knowledge
- key: project_info

### 5. Статистика

Используй:

- operation: knowledgeStats

---

## Ожидаемый результат

1. ✅ Данные сохранены в knowledge namespace
2. ✅ Паттерн auth_jwt_pattern доступен для семантического поиска
3. ✅ Поиск "как безопасно авторизовать пользователя" находит JWT паттерн
4. ✅ Данные project_info успешно прочитаны
5. ✅ Статистика показывает 2+ записи в knowledge namespace

## Советы

- Используй operation=addWithEmbedding для важных паттернов, чтобы они были доступны для семантического поиска
- Используй теги для категоризации данных
- Проверяй operation=knowledgeStats для мониторинга использования storage
