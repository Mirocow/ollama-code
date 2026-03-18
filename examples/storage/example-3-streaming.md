# Пример 3: Работа с большими данными

## Описание
Этот пример показывает как работать с большими файлами в storage, используя streaming.

## Запуск
```bash
ollama-code --file ./examples/storage/example-3-streaming.md
```

---

## Задание

### 1. Создай большой лог-файл

```json
model_storage operation=set namespace=logs key="application.log" value='[2025-01-15 10:00:01] INFO: Application starting
[2025-01-15 10:00:02] INFO: Loading configuration
[2025-01-15 10:00:03] INFO: Connecting to database
[2025-01-15 10:00:04] INFO: Database connected successfully
[2025-01-15 10:00:05] INFO: Initializing cache
[2025-01-15 10:00:06] INFO: Cache initialized with 100 entries
[2025-01-15 10:00:07] INFO: Starting HTTP server
[2025-01-15 10:00:08] INFO: Server listening on port 3000
[2025-01-15 10:01:00] WARN: High memory usage detected: 85%
[2025-01-15 10:01:01] INFO: Running garbage collection
[2025-01-15 10:01:30] INFO: Memory usage normalized: 65%
[2025-01-15 10:02:00] ERROR: Failed to connect to external API
[2025-01-15 10:02:01] INFO: Retrying connection (attempt 1/3)
[2025-01-15 10:02:05] INFO: External API connected
[2025-01-15 10:03:00] INFO: Processing batch job #1234
[2025-01-15 10:03:30] INFO: Batch job #1234 completed
[2025-01-15 10:04:00] INFO: User login: user@example.com
[2025-01-15 10:04:01] INFO: Session created: sess_abc123
[2025-01-15 10:05:00] INFO: User action: view_dashboard
[2025-01-15 10:05:30] INFO: User action: edit_profile
[2025-01-15 10:06:00] INFO: User logout: user@example.com
[2025-01-15 10:06:01] INFO: Session destroyed: sess_abc123
[2025-01-15 10:07:00] INFO: Scheduled task: cleanup_temp_files
[2025-01-15 10:07:30] INFO: Cleaned 45 temp files
[2025-01-15 10:08:00] INFO: Health check passed
[2025-01-15 10:09:00] INFO: Metrics collected: 152 requests/min
[2025-01-15 10:10:00] INFO: Application heartbeat'
```

### 2. Чтение с streaming (первые 10 строк)

```json
model_storage operation=get namespace=logs key="application.log" streamLines=true startLine=0 maxLines=10
```

### 3. Продолжение чтения (строки 10-20)

```json
model_storage operation=get namespace=logs key="application.log" streamLines=true startLine=10 maxLines=10
```

### 4. Чтение конца файла

```json
model_storage operation=get namespace=logs key="application.log" streamLines=true startLine=20 maxLines=10
```

### 5. Поиск в логах

```json
model_storage operation=search query="error failed connection" namespaces=["logs"] mode="keyword" limit=5
```

---

## Ожидаемый результат

1. ✅ Лог-файл сохранён в namespace logs
2. ✅ Первое чтение возвращает строки 1-10
3. ✅ Второе чтение возвращает строки 11-20
4. ✅ Третье чтение возвращает остаток файла
5. ✅ Поиск находит строку с ERROR

## Особенности streaming

- `streamLines=true` - включает построчное чтение
- `startLine=0` - первая строка (0-indexed)
- `maxLines=10` - максимум 10 строк за раз
- Для файлов > 1MB автоматически применяется truncation с подсказкой

## Авто-truncation

При попытке прочитать большой файл без streaming:
```json
model_storage operation=get namespace=logs key="application.log"
```

Результат будет содержать:
```
... [truncated, use streamLines=true with startLine/maxLines to read more]
```
