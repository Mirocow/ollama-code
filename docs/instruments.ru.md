# Ollama Code - Поддерживаемые инструменты

> **Язык**: [English](./instruments.md) | [Русский](./instruments.ru.md)

Полный список всех поддерживаемых инструментов разработки.

---

## Инструменты разработки

### Разработка на Python (`python_dev`)

**Каноническое имя**: `python_dev`  
**Алиасы**: `py`, `python`, `pip`, `pytest`

| Действие | Описание |
|----------|----------|
| `run` | Запустить Python скрипт |
| `test` | Запустить pytest тесты |
| `lint` | Запустить pylint анализ |
| `format` | Запустить black форматирование |
| `venv_create` | Создать виртуальное окружение |
| `venv_activate` | Получить команду активации |
| `pip_install` | Установить пакеты |
| `pip_list` | Список установленных пакетов |
| `pip_freeze` | Сгенерировать requirements.txt |
| `mypy` | Запустить mypy проверку типов |
| `custom` | Пользовательская Python команда |

**Пример**:
```json
{
  "action": "run",
  "script": "main.py",
  "args": ["--verbose"]
}
```

---

### Разработка на Node.js (`nodejs_dev`)

**Каноническое имя**: `nodejs_dev`  
**Алиасы**: `node`, `npm`, `yarn`, `pnpm`, `bun`

| Действие | Описание |
|----------|----------|
| `run` | Запустить Node.js скрипт |
| `install` | Установить зависимости |
| `add` | Добавить пакеты |
| `remove` | Удалить пакеты |
| `update` | Обновить пакеты |
| `run_script` | Запустить скрипт из package.json |
| `test` | Запустить тесты |
| `build` | Запустить сборку |
| `dev` | Запустить dev сервер |
| `lint` | Запустить линтер |
| `exec` | Запустить npx/yarn dlx |
| `clean` | Удалить node_modules |
| `custom` | Пользовательская npm/yarn команда |

**Пример**:
```json
{
  "action": "add",
  "packages": ["express", "lodash"],
  "package_manager": "yarn"
}
```

---

### Разработка на Golang (`golang_dev`)

**Каноническое имя**: `golang_dev`  
**Алиасы**: `go`, `golang`

| Действие | Описание |
|----------|----------|
| `run` | Запустить Go файл |
| `build` | Скомпилировать программу |
| `test` | Запустить тесты |
| `test_cover` | Тесты с покрытием |
| `test_bench` | Запустить бенчмарки |
| `fmt` | Форматировать код |
| `vet` | Статический анализ |
| `lint` | Запустить golangci-lint |
| `mod_init` | Инициализировать модуль |
| `mod_tidy` | Упорядочить зависимости |
| `mod_download` | Скачать модули |
| `get` | Добавить зависимость |
| `install` | Установить инструмент |
| `custom` | Пользовательская go команда |

**Пример**:
```json
{
  "action": "test",
  "race": true,
  "test_pattern": "TestUser"
}
```

---

### Разработка на PHP (`php_dev`)

**Каноническое имя**: `php_dev`  
**Алиасы**: `php`, `composer`, `phpunit`, `artisan`

| Действие | Описание |
|----------|----------|
| `run` | Запустить PHP скрипт |
| `test` | Запустить PHPUnit |
| `lint` | Запустить phpcs |
| `format` | Запустить PHP-CS-Fixer |
| `composer_install` | Установить зависимости |
| `composer_update` | Обновить зависимости |
| `composer_require` | Добавить пакет |
| `composer_remove` | Удалить пакет |
| `composer_dump_autoload` | Регенерировать autoload |
| `phpunit` | Запустить PHPUnit напрямую |
| `psalm` | Psalm анализ |
| `phpstan` | PHPStan анализ |
| `artisan` | Laravel Artisan |
| `custom` | Пользовательская PHP команда |

**Пример**:
```json
{
  "action": "composer_require",
  "packages": ["laravel/framework"]
}
```

---

### Разработка на Java (`java_dev`)

**Каноническое имя**: `java_dev`  
**Алиасы**: `java`, `javac`, `maven`, `gradle`

| Действие | Описание |
|----------|----------|
| `run` | Запустить Java класс |
| `compile` | Скомпилировать Java файлы |
| `test` | Запустить тесты (JUnit) |
| `build` | Собрать проект |
| `clean` | Очистить артефакты |
| `maven_*` | Maven команды |
| `gradle_*` | Gradle команды |
| `jar` | Создать JAR файл |
| `custom` | Пользовательская Java команда |

**Пример**:
```json
{
  "action": "build",
  "build_tool": "maven"
}
```

---

### Разработка на C/C++ (`cpp_dev`)

**Каноническое имя**: `cpp_dev`  
**Алиасы**: `cpp`, `c++`, `gcc`, `g++`, `cmake`, `make`

| Действие | Описание |
|----------|----------|
| `compile` | Скомпилировать файлы |
| `run` | Запустить программу |
| `build` | Собрать проект |
| `test` | Запустить тесты |
| `cmake_*` | CMake команды |
| `make` | Запустить make |
| `custom` | Пользовательская команда |

**Пример**:
```json
{
  "action": "cmake_build",
  "build_type": "Release"
}
```

---

### Разработка на Rust (`rust_dev`)

**Каноническое имя**: `rust_dev`  
**Алиасы**: `rust`, `cargo`, `rustc`

| Действие | Описание |
|----------|----------|
| `run` | Запустить программу |
| `build` | Собрать проект |
| `test` | Запустить тесты |
| `doc` | Сгенерировать документацию |
| `check` | Проверить код |
| `clippy` | Запустить Clippy |
| `fmt` | Форматировать код |
| `clean` | Очистить артефакты |
| `cargo_*` | Cargo команды |
| `custom` | Пользовательская команда |

**Пример**:
```json
{
  "action": "build",
  "release": true
}
```

---

### Разработка на Swift (`swift_dev`)

**Каноническое имя**: `swift_dev`  
**Алиасы**: `swift`, `swiftc`, `spm`

| Действие | Описание |
|----------|----------|
| `run` | Запустить программу |
| `build` | Собрать проект |
| `test` | Запустить тесты |
| `package_*` | SPM команды |
| `custom` | Пользовательская команда |

**Пример**:
```json
{
  "action": "build",
  "configuration": "release"
}
```

---

### Разработка на TypeScript (`typescript_dev`)

**Каноническое имя**: `typescript_dev`  
**Алиасы**: `ts`, `tsc`, `typescript`

| Действие | Описание |
|----------|----------|
| `compile` | Скомпилировать TypeScript |
| `watch` | Режим наблюдения |
| `build` | Собрать проект |
| `check` | Проверить типы |
| `run` | Запустить через ts-node |
| `custom` | Пользовательская команда |

**Пример**:
```json
{
  "action": "compile",
  "project": "tsconfig.json"
}
```

---

## Shell и команды

### Команда Shell (`run_shell_command`)

**Каноническое имя**: `run_shell_command`  
**Алиасы**: `run`, `shell`, `exec`, `cmd`

| Параметр | Описание |
|----------|----------|
| `command` | Команда для выполнения |
| `description` | Краткое описание |
| `directory` | Рабочая директория |
| `timeout` | Таймаут в мс |
| `is_background` | Запустить в фоне |

**Пример**:
```json
{
  "command": "git status && git diff",
  "description": "Проверить статус git"
}
```

---

## Файловые операции

### Чтение файла (`read_file`)

**Каноническое имя**: `read_file`  
**Алиасы**: `read`

| Параметр | Описание |
|----------|----------|
| `absolute_path` | Путь к файлу (обязательно) |
| `offset` | Смещение строк |
| `limit` | Макс. строк |

### Запись файла (`write_file`)

**Каноническое имя**: `write_file`  
**Алиасы**: `write`, `create`

| Параметр | Описание |
|----------|----------|
| `file_path` | Путь к файлу (обязательно) |
| `content` | Содержимое для записи |

### Редактирование файла (`edit`)

**Каноническое имя**: `edit`  
**Алиасы**: `edit`, `replace`

| Параметр | Описание |
|----------|----------|
| `file_path` | Путь к файлу (обязательно) |
| `old_string` | Текст для замены |
| `new_string` | Текст замены |
| `replace_all` | Заменить все вхождения |

---

## Поиск и навигация

### Glob (`glob`)

**Каноническое имя**: `glob`  
**Алиасы**: `glob`, `files`

### Grep (`grep_search`)

**Каноническое имя**: `grep_search`  
**Алиасы**: `grep`, `search`, `find`

### Список директорий (`list_directory`)

**Каноническое имя**: `list_directory`  
**Алиасы**: `ls`, `list`, `dir`

---

## Веб и сеть

### Веб-поиск (`web_search`)

**Каноническое имя**: `web_search`  
**Алиасы**: `websearch`, `web`

### Веб-запрос (`web_fetch`)

**Каноническое имя**: `web_fetch`  
**Алиасы**: `webfetch`, `fetch`, `url`

---

## Управление задачами

### Todo (`todo_write`)

**Каноническое имя**: `todo_write`  
**Алиасы**: `todo`, `todos`

### Делегирование (`task`)

**Каноническое имя**: `task`  
**Алиасы**: `agent`, `subagent`

---

## Память и знания

### Сохранение в память (`save_memory`)

**Каноническое имя**: `save_memory`  
**Алиасы**: `memory`, `save`

### Навык (`skill`)

**Каноническое имя**: `skill`  
**Алиасы**: `skills`

---

## Полная таблица алиасов

| Алиас | Канонический инструмент |
|-------|------------------------|
| `run`, `shell`, `exec`, `cmd` | `run_shell_command` |
| `read` | `read_file` |
| `write`, `create` | `write_file` |
| `edit`, `replace` | `edit` |
| `readmany`, `read_all`, `cat` | `read_many_files` |
| `grep`, `search`, `find` | `grep_search` |
| `glob`, `files` | `glob` |
| `ls`, `list`, `dir` | `list_directory` |
| `todo`, `todos` | `todo_write` |
| `memory`, `save` | `save_memory` |
| `websearch`, `web` | `web_search` |
| `webfetch`, `fetch`, `url` | `web_fetch` |
| `agent`, `subagent` | `task` |
| `py`, `python`, `pip`, `pytest` | `python_dev` |
| `node`, `npm`, `yarn`, `pnpm`, `bun` | `nodejs_dev` |
| `go`, `golang` | `golang_dev` |
| `php`, `composer`, `phpunit`, `artisan` | `php_dev` |
| `java`, `javac`, `maven`, `gradle` | `java_dev` |
| `cpp`, `c++`, `gcc`, `g++`, `cmake`, `make` | `cpp_dev` |
| `rust`, `cargo`, `rustc` | `rust_dev` |
| `swift`, `swiftc`, `spm` | `swift_dev` |
| `ts`, `tsc`, `typescript` | `typescript_dev` |

---

## Связанная документация

- [FEATURES.ru.md](./FEATURES.ru.md) - Полный справочник функций
- [TOOLS.ru.md](./TOOLS.ru.md) - Документация инструментов
