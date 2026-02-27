# Ollama Code - Roadmap развития

## Версия 0.11.0 (Текущая)

### ✅ Выполнено

| Задача | Статус |
|--------|--------|
| Create Model API (/api/create) | ✅ |
| Thinking Models Support (think parameter) | ✅ |
| Structured Outputs (JSON Schema) | ✅ |
| Code Analyzer Tool | ✅ |
| Diagram Generator Tool | ✅ |
| Git Advanced Tool | ✅ |
| API Tester Tool | ✅ |
| Tokyo Night, Nord, Catppuccin темы | ✅ |
| Документация (EXAMPLES.md, TUTORIAL.md) | ✅ |
| Удалена телеметрия | ✅ |

---

## Версия 0.12.0 (Планируется)

### UI/UX Улучшения

- [ ] Прогресс-бары для загрузки моделей
- [ ] Thinking indicator для thinking моделей
- [ ] Token usage display в реальном времени
- [ ] GPU/Memory usage indicator
- [ ] Typewriter effect для ответов

### Новые инструменты

- [ ] Database Tool - работа с базами данных
- [ ] Docker Tool - управление контейнерами
- [ ] Kubernetes Tool - работа с k8s
- [ ] Redis Tool - кэширование и очереди

### Performance

- [ ] Response caching
- [ ] Embedding caching
- [] Streaming optimizations

---

## Версия 0.13.0

### MCP Extensions

- [ ] Resource support
- [ ] Prompts registry
- [ ] Server management UI

### Integrations

- [ ] JetBrains IDE plugin
- [ ] Vim/Neovim plugin
- [ ] Emacs integration

---

## Архитектура

### OllamaNativeClient

Расположение: `packages/core/src/core/ollamaNativeClient.ts`

Поддерживаемые методы:
- `chat()` - чат с моделью
- `generate()` - генерация текста
- `embed()` - эмбеддинги
- `createModel()` - создание моделей
- `pullModel()` - загрузка моделей
- `listModels()` - список моделей
- и другие...

### Инструменты

| Инструмент | Файл | Описание |
|------------|------|----------|
| Code Analyzer | `code-analyzer.ts` | Анализ качества кода |
| Diagram Generator | `diagram-generator.ts` | Mermaid/PlantUML диаграммы |
| Git Advanced | `git-advanced.ts` | Продвинутые git операции |
| API Tester | `api-tester.ts` | Тестирование REST API |

### Темы

| Тема | Файл | Тип |
|------|------|-----|
| Ollama Dark | `ollama-dark.ts` | Dark |
| Ollama Light | `ollama-light.ts` | Light |
| Tokyo Night | `tokyo-night.ts` | Dark |
| Nord | `nord.ts` | Dark |
| Catppuccin | `catppuccin.ts` | Dark |
| Dracula | `dracula.ts` | Dark |
| GitHub Dark | `github-dark.ts` | Dark |
| GitHub Light | `github-light.ts` | Light |

---

## Документация

| Документ | Путь | Описание |
|----------|------|----------|
| README.md | `/` | Основная документация |
| OLLAMA_API.md | `/docs` | API документация |
| EXAMPLES.md | `/docs` | Примеры использования |
| TUTORIAL.md | `/docs` | Туториал |
| PROJECT_STRUCTURE.md | `/` | Структура проекта |

---

## Удалено

- ❌ Телеметрия (полностью удалена)
- ❌ Упоминания qwen (заменены на llama/ollama)
