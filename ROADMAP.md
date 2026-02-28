# Ollama Code - Roadmap развития

## Версия 0.10.5 (Текущая)

### ✅ Выполнено

| Задача | Статус |
|--------|--------|
| Tool Alias System | ✅ |
| Session ID Display | ✅ |
| UTF-8 Locale Check | ✅ |
| Bilingual Documentation (EN/RU) | ✅ |

---

## Сравнение с оригинальным репозиторием tcsenpai/ollama-code

### ✅ Реализованные инструменты (оригинал)

| Инструмент | Оригинал | Локальный | Статус |
|------------|----------|-----------|--------|
| `edit.ts` | ✅ | ✅ | ✅ Совпадает |
| `glob.ts` | ✅ | ✅ | ✅ Совпадает |
| `grep.ts` | ✅ | ✅ | ✅ Совпадает |
| `ls.ts` | ✅ | ✅ | ✅ Совпадает |
| `mcp-client.ts` | ✅ | ✅ | ✅ Совпадает |
| `mcp-tool.ts` | ✅ | ✅ | ✅ Совпадает |
| `memoryTool.ts` | ✅ | ✅ | ✅ Совпадает |
| `modifiable-tool.ts` | ✅ | ✅ | ✅ Совпадает |
| `read-file.ts` | ✅ | ✅ | ✅ Совпадает |
| `shell.ts` | ✅ | ✅ | ✅ Совпадает |
| `tool-registry.ts` | ✅ | ✅ | ✅ Совпадает |
| `tools.ts` | ✅ | ✅ | ✅ Совпадает |
| `web-fetch.ts` | ✅ | ✅ | ✅ Совпадает |
| `write-file.ts` | ✅ | ✅ | ✅ Совпадает |
| `web-search.ts` | ✅ Gemini API | ✅ Tavily/Google | ⚡ Улучшен |
| `read-many-files.ts` | ✅ Tool | ❌ Utils only | 🔴 Нужно добавить |

### 🆕 Дополнительные инструменты (расширения)

| Инструмент | Файл | Описание |
|------------|------|----------|
| Code Analyzer | `code-analyzer.ts` | Анализ качества кода (A-F) |
| Database | `database.ts` | SQLite/PostgreSQL/MySQL |
| Diagram Generator | `diagram-generator.ts` | Mermaid/PlantUML |
| Docker | `docker.ts` | Управление контейнерами |
| Exit Plan Mode | `exitPlanMode.ts` | Выход из режима планирования |
| Git Advanced | `git-advanced.ts` | Stash, cherry-pick, rebase, bisect |
| LSP | `lsp.ts` | Language Server Protocol |
| Redis | `redis.ts` | Кэширование и очереди |
| RipGrep | `ripGrep.ts` | Быстрый поиск |
| Skill | `skill.ts` | Система навыков |
| Task | `task.ts` | Подагенты |
| TodoWrite | `todoWrite.ts` | Управление задачами |
| API Tester | `api-tester.ts` | Тестирование REST API |

---

## План улучшений

### Приоритет 1: Критические улучшления

#### 1.1 ReadManyFiles Tool
**Проблема:** В оригинале `read-many-files` это инструмент, у нас - только утилита.

**Решение:**
```typescript
// packages/core/src/tools/read-many-files.ts
export class ReadManyFilesTool extends BaseDeclarativeTool<
  ReadManyFilesParams,
  ReadManyFilesResult
> {
  static readonly Name = 'read_many_files';
  // ... реализация
}
```

**Статус:** 🔴 Не начато

#### 1.2 Timeout Configuration
**Проблема:** Timeout hardcoded (5 минут), нужен в настройках.

**Решение:**
```typescript
// settings.json
{
  "api": {
    "timeout": 300000,  // 5 минут по умолчанию
    "retryAttempts": 3,
    "retryDelay": 1000
  }
}
```

**Статус:** 🔴 Не начато

#### 1.3 Error Messages Improvement
**Проблема:** Сообщения об ошибках недостаточно информативны.

**Решение:** Добавить error codes и подробные сообщения:
```typescript
export enum ToolErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TIMEOUT = 'TIMEOUT',
  // ...
}
```

**Статус:** 🔄 В процессе

---

### Приоритет 2: Архитектурные улучшения

#### 2.1 Tool Interface Unification
**Проблема:** Разные стили инструментов (BaseTool vs BaseDeclarativeTool).

**Решение:**
- Мигрировать все инструменты на `BaseDeclarativeTool`
- Унифицировать интерфейс `ToolInvocation`

**Статус:** 🔄 Частично

#### 2.2 Tool Registry Enhancement
**Проблема:** Нет динамической регистрации инструментов.

**Решение:**
```typescript
class ToolRegistry {
  registerToolFromPath(path: string): void;
  unregisterTool(name: string): void;
  getToolMetadata(name: string): ToolMetadata;
}
```

**Статус:** 🔴 Не начато

#### 2.3 Plugin System
**Проблема:** Нет системы плагинов для сторонних инструментов.

**Решение:**
```typescript
interface ToolPlugin {
  name: string;
  version: string;
  tools: AnyDeclarativeTool[];
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;
}
```

**Статус:** 🔴 Не начато

---

### Приоритет 3: Новые возможности

#### 3.1 Streaming Improvements
**Задачи:**
- [ ] Chunk validation для streaming
- [ ] Backpressure handling
- [ ] Cancellation tokens

#### 3.2 Caching System
**Задачи:**
- [ ] Response caching с LRU eviction
- [ ] Embedding caching
- [ ] Tool result caching

#### 3.3 Observability
**Задачи:**
- [ ] OpenTelemetry integration
- [ ] Metrics export (Prometheus)
- [ ] Distributed tracing

---

## Версия 0.11.0 (Планируется)

### Новые инструменты

| Инструмент | Описание | Приоритет |
|------------|----------|-----------|
| Kubernetes | Управление k8s кластерами | Medium |
| GraphQL | Запросы к GraphQL API | Low |
| WebSocket | Real-time коммуникации | Low |

### MCP Extensions

| Возможность | Описание | Приоритет |
|-------------|----------|-----------|
| Resources | MCP resources support | High |
| Prompts | Prompts registry | Medium |
| Server UI | Управление серверами | Medium |

---

## Архитектура

### Система алиасов инструментов

```
Alias → Canonical Name
─────────────────────────
run    → run_shell_command
read   → read_file
write  → write_file
grep   → grep_search
ls     → list_directory
...
```

**Файл:** `packages/core/src/tools/tool-names.ts`

### Инструменты

| Инструмент | Файл | Категория |
|------------|------|-----------|
| Code Analyzer | `code-analyzer.ts` | Analysis |
| Database | `database.ts` | Data |
| Diagram Generator | `diagram-generator.ts` | Visual |
| Docker | `docker.ts` | DevOps |
| Git Advanced | `git-advanced.ts` | VCS |
| Redis | `redis.ts` | Data |
| Task | `task.ts` | Agents |

---

## Документация

| Документ | Язык | Путь |
|----------|------|------|
| README.md | English | `/` |
| README.ru.md | Русский | `/` |
| CHANGELOG.md | Bilingual | `/` |
| USAGE_GUIDE.md | English | `/docs` |
| OLLAMA_API.md | English | `/docs` |

---

## Метрики проекта

| Показатель | Значение |
|------------|----------|
| Инструментов | 25+ |
| Тестов | 2700+ |
| Покрытие кода | 80%+ |
| Языков документации | 2 (EN, RU) |

---

## Удалено

- ❌ Телеметрия (полностью удалена)
- ❌ Упоминания qwen (заменены на ollama)
- ❌ Gemini API зависимости (заменены на Ollama Native API)
