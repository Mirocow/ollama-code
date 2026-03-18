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

Сохрани следующую информацию о проекте:

```json
model_storage operation=set namespace=knowledge key="project_info" value='{
  "name": "ollama-code",
  "description": "AI-powered code editor with semantic storage",
  "version": "2.0.0",
  "features": ["semantic search", "verification", "streaming"],
  "technologies": ["TypeScript", "Node.js", "Ollama"]
}' tags=["project", "info"]
```

### 2. Сохранение с эмбеддингами

Сохрани паттерн аутентификации для семантического поиска:

```json
model_storage operation=addWithEmbedding namespace=knowledge key="auth_jwt_pattern" value='
## JWT Аутентификация

### Последовательность действий:
1. Пользователь отправляет credentials на /api/auth/login
2. Сервер валидирует и генерирует JWT токен
3. Токен возвращается в httpOnly cookie
4. Последующие запросы содержат токен в Authorization header

### Важные моменты:
- Всегда использовать HTTPS
- Устанавливать secure flag в production
- Реализовать refresh token механизм
- Хранить refresh token в httpOnly cookie
' tags=["auth", "jwt", "security", "pattern"]
```

### 3. Семантический поиск

Выполни поиск по смыслу (не по ключевым словам):

```json
model_storage operation=search query="как безопасно авторизовать пользователя" namespaces=["knowledge"] limit=5
```

### 4. Чтение данных

```json
model_storage operation=get namespace=knowledge key="project_info"
```

### 5. Статистика

```json
model_storage operation=knowledgeStats
```

---

## Ожидаемый результат

1. ✅ Данные сохранены в knowledge namespace
2. ✅ Паттерн auth_jwt_pattern доступен для семантического поиска
3. ✅ Поиск "как безопасно авторизовать пользователя" находит JWT паттерн
4. ✅ Данные project_info успешно прочитаны
5. ✅ Статистика показывает 2+ записи в knowledge namespace

## Советы

- Используй `addWithEmbedding` для важных паттернов, чтобы они были доступны для семантического поиска
- Используй теги для категоризации данных
- Проверяй `knowledgeStats` для мониторинга использования storage
