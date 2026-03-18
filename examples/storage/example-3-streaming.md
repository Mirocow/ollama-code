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

Используй model_storage:

- operation: set
- namespace: logs
- key: application.log
- value: текст лог-файла с ~20 строками логов (INFO, WARN, ERROR уровни)

### 2. Чтение с streaming (первые 10 строк)

Используй model_storage:

- operation: get
- namespace: logs
- key: application.log
- streamLines: true
- startLine: 0
- maxLines: 10

### 3. Продолжение чтения (строки 10-20)

Используй model_storage:

- operation: get
- namespace: logs
- key: application.log
- streamLines: true
- startLine: 10
- maxLines: 10

### 4. Чтение конца файла

Используй model_storage:

- operation: get
- namespace: logs
- key: application.log
- streamLines: true
- startLine: 20
- maxLines: 10

### 5. Поиск в логах

Используй model_storage:

- operation: search
- query: "error failed connection"
- namespaces: ["logs"]
- mode: keyword
- limit: 5

---

## Ожидаемый результат

1. ✅ Лог-файл сохранён в namespace logs
2. ✅ Первое чтение возвращает строки 1-10
3. ✅ Второе чтение возвращает строки 11-20
4. ✅ Третье чтение возвращает остаток файла
5. ✅ Поиск находит строку с ERROR

## Особенности streaming

- `streamLines: true` - включает построчное чтение
- `startLine: 0` - первая строка (0-indexed)
- `maxLines: 10` - максимум 10 строк за раз
- Для файлов > 1MB автоматически применяется truncation с подсказкой

## Авто-truncation

При попытке прочитать большой файл без streaming модель получит:

```
... [truncated, use streamLines=true with startLine/maxLines to read more]
```
