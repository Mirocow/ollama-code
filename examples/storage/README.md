# Storage Examples

Примеры использования системы storage ollama-code.

## Запуск примеров

Все примеры можно запустить с флагом `--file`:

```bash
# Базовое использование
ollama-code --file ./examples/storage/example-1-basic.md

# Планирование с верификацией
ollama-code --file ./examples/storage/example-2-planning.md

# Работа с большими данными
ollaml-code --file ./examples/storage/example-3-streaming.md

# Управление сессией
ollama-code --file ./examples/storage/example-4-session.md

# Продвинутые возможности
ollama-code --file ./examples/storage/example-5-advanced.md
```

## Оглавление примеров

| # | Файл | Описание |
|---|------|----------|
| 1 | [example-1-basic.md](./example-1-basic.md) | Основные операции: set, get, search, addWithEmbedding |
| 2 | [example-2-planning.md](./example-2-planning.md) | Планы с верификацией, зависимые задачи |
| 3 | [example-3-streaming.md](./example-3-streaming.md) | Streaming для больших файлов |
| 4 | [example-4-session.md](./example-4-session.md) | Управление контекстом сессии |
| 5 | [example-5-advanced.md](./example-5-advanced.md) | Batch, TTL, backup, merge, append |

## Краткая справка операций

### CRUD
```
set        - Сохранить значение
get        - Получить значение
delete     - Удалить значение
list       - Список ключей
exists     - Проверить существование
```

### Модификация
```
merge      - Слить объекты
append     - Добавить в массив
```

### Семантический поиск
```
search            - Поиск по смыслу
findSimilar       - Найти похожие
addWithEmbedding   - Сохранить с эмбеддингом
knowledgeStats    - Статистика БЗ
```

### Продвинутое
```
batch      - Массовые операции
backup     - Создать backup
restore    - Восстановить backup
stats      - Статистика namespace
```

### Streaming (большие файлы)
```
streamLines  - Построчное чтение
startLine    - Начальная строка
maxLines     - Максимум строк
```

## Namespaces

| Namespace | Назначение | Persistence |
|-----------|------------|-------------|
| knowledge | Паттерны, соглашения | Постоянный |
| roadmap   | Планы развития | Постоянный |
| context   | Контекст сессии | Сессионный |
| session   | Временные данные | Сессионный |
| learning  | Решения ошибок | Постоянный |
| plans     | Активные планы | Постоянный (TTL 7d) |
| todos     | Задачи | Постоянный |
| logs      | Логи | Постоянный |
| metrics   | Метрики | Постоянный |

## Типы верификации

| Тип | Описание |
|-----|----------|
| file_exists | Проверка существования файла |
| file_contains | Проверка содержимого файла |
| command_success | Успешное выполнение команды |
| test_pass | Прохождение тестов |
| lint_pass | Прохождение линтера |
| type_check | Проверка TypeScript |
| build_success | Успешная сборка |
| custom | Пользовательская проверка |

## Требования

Для семантического поиска требуется:
- Ollama запущенный на localhost:11434
- Модель `nomic-embed-text` для эмбеддингов

```bash
ollama pull nomic-embed-text
```

При отсутствии Ollama, search автоматически переключается на keyword режим.
