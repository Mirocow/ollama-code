# Prompt System v2

> Шаблонные промпты, оптимизированные для разных размеров моделей

## Обзор

Система промптов v2 использует шаблоны, оптимизированные для разных размеров моделей. Это позволяет:
- Экономить токены для маленьких моделей
- Предоставлять больше деталей для больших моделей
- Поддерживать консистентность правил

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prompt System v2                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │ getCoreSystemPrompt │──▶│ getCoreSystemPromptV2         │   │
│  │ (legacy API)        │   │ (template-based)              │   │
│  └─────────────────┘     └────────────┬────────────────────┘   │
│                                       │                         │
│                          ┌────────────▼────────────────────┐   │
│                          │    getSystemPromptTemplate      │   │
│                          │    (выбор по размеру модели)    │   │
│                          └────────────┬────────────────────┘   │
│                                       │                         │
│  ┌─────────────────────────────────────┼─────────────────────┐ │
│  │                                     │                     │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │  8b.md  │ │ 14b.md  │ │ 32b.md  │ │ 70b.md  │         │ │
│  │  │ small   │ │ medium  │ │ large   │ │ xlarge  │         │ │
│  │  │ <=10B   │ │ <=30B   │ │ <=60B   │ │ >60B    │         │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  │                                                          │ │
│  │  templates/                                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Шаблоны по размеру модели

### Small (8b) — <= 10B параметров

**Модели:**
- llama3.2:1b, llama3.2:3b
- phi3:mini
- gemma:2b
- qwen2.5-coder:7b

**Характеристики:**
- Компактные правила
- Минимум примеров (1-2)
- Только [CRITICAL] правила
- Краткие описания инструментов

**Размер:** ~500 токенов

### Medium (14b) — <= 30B параметров

**Модели:**
- llama3.1:8b
- mistral:7b
- qwen2.5-coder:14b
- deepseek-r1:8b, deepseek-r1:14b

**Характеристики:**
- Стандартные правила ([CRITICAL], [RECOMMENDED])
- Больше примеров (2-3)
- Таблицы инструментов с алиасами
- Git workflow

**Размер:** ~800 токенов

### Large (32b) — <= 60B параметров

**Модели:**
- qwen2.5-coder:32b
- qwen3-coder:30b
- deepseek-r1:32b
- mixtral:8x7b

**Характеристики:**
- Все уровни приоритетов
- Детальные примеры (3-4)
- Расширенный Workflow
- Security секция
- New Applications процесс

**Размер:** ~1200 токенов

### XLarge (70b) — > 60B параметров

**Модели:**
- llama3.1:70b
- qwen2.5:72b
- deepseek-r1:70b
- mistral-large

**Характеристики:**
- Полная документация
- Все примеры
- Детальный Git workflow
- Полный стек технологий
- Placeholder секции

**Размер:** ~1500 токенов

## Структура шаблона

```markdown
# Role
Ты — Ollama Code, CLI-агент для разработки.

# Rules
## [CRITICAL]
- ✅ Обязательные правила

## [RECOMMENDED]
- ⚡ Рекомендуемые правила

## [OPTIONAL]
- 💾 Опциональные правила

# Tools
| Инструмент | Назначение | Алиасы |

# Workflow
1. План → 2. Реализация → 3. Проверка → 4. Отчёт

# Output Format
Форматирование ответов

# Security
Правила безопасности

# Environment
{{ENVIRONMENT_INFO}}

# Sandbox
{{SANDBOX_INFO}}

# Git Repository
{{GIT_INFO}}

# Examples
Примеры использования

{{TOOL_LEARNING}}

# Final Reminder
Напоминание о ключевых принципах
```

## Плейсхолдеры

| Плейсхолдер | Описание | Динамический |
|------------|----------|--------------|
| `{{ENVIRONMENT_INFO}}` | Информация об окружении (Node.js, platform, cwd) | ✅ |
| `{{TOOL_LEARNING}}` | Контекст обучения на ошибках | ✅ |
| `{{TOOL_CALL_FORMAT}}` | Инструкции для моделей без native tools | ✅ |
| `{{SANDBOX_INFO}}` | Информация о sandbox | ✅ |
| `{{GIT_INFO}}` | Git правила если в репозитории | ✅ |

## API

### getCoreSystemPrompt

```typescript
import { getCoreSystemPrompt } from '@ollama-code/ollama-code-core';

// Автоматический выбор шаблона по модели
const prompt = getCoreSystemPrompt(userMemory, 'qwen2.5-coder:14b');
```

### Прямое использование шаблонов

```typescript
import {
  getSystemPromptTemplate,
  fillTemplatePlaceholders,
  getSizeTier,
} from '@ollama-code/ollama-code-core';

// Получить размерный tier
const tier = getSizeTier('llama3.1:70b'); // 'xlarge'

// Загрузить шаблон
const template = getSystemPromptTemplate('llama3.1:70b');

// Заполнить плейсхолдеры
const prompt = fillTemplatePlaceholders(template, {
  ENVIRONMENT_INFO: '...',
  TOOL_LEARNING: '...',
});
```

### Определение размера модели

```typescript
import { extractModelSize, getSizeTier } from '@ollama-code/ollama-code-core';

// Извлечь размер из имени
const size = extractModelSize('qwen2.5-coder:14b'); // 14
const size = extractModelSize('llama3.1:70b'); // 70

// Получить tier
const tier = getSizeTier('mistral:7b'); // 'medium'
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `OLLAMA_CODE_USE_TEMPLATES` | Использовать шаблоны v2 | `true` |
| `OLLAMA_CODE_SYSTEM_MD` | Путь к кастомному промпту | - |

### Отключение шаблонов v2

```bash
# Использовать legacy промпт
OLLAMA_CODE_USE_TEMPLATES=false ollama-code

# Использовать кастомный промпт
OLLAMA_CODE_SYSTEM_MD=~/.ollama-code/custom-system.md ollama-code
```

## Создание кастомного шаблона

### Файл шаблона

```markdown
# Role
Ты — Custom Ollama Code агент.

# Rules
## [CRITICAL]
- Мои критические правила
- Особенности проекта

# Tools
Доступные инструменты

# Workflow
Процесс работы

{{ENVIRONMENT_INFO}}
{{TOOL_LEARNING}}
```

### Использование

```bash
OLLAMA_CODE_SYSTEM_MD=/path/to/my-template.md ollama-code
```

## Примеры

### Маленькая модель (7b)

```typescript
// Шаблон 8b - компактный
const prompt = getCoreSystemPrompt(undefined, 'qwen2.5-coder:7b');

// ~500 токенов
// Содержит только критические правила
```

### Средняя модель (14b)

```typescript
// Шаблон 14b - стандартный
const prompt = getCoreSystemPrompt(undefined, 'qwen2.5-coder:14b');

// ~800 токенов
// Включает таблицы инструментов и workflow
```

### Большая модель (32b)

```typescript
// Шаблон 32b - расширенный
const prompt = getCoreSystemPrompt(undefined, 'qwen3-coder:30b');

// ~1200 токенов
// Полный workflow, security, примеры
```

### Очень большая модель (70b)

```typescript
// Шаблон 70b - полный
const prompt = getCoreSystemPrompt(undefined, 'llama3.1:70b');

// ~1500 токенов
// Вся документация, все примеры
```

## Миграция с v1

### Автоматическая миграция

По умолчанию v2 включена. Никаких изменений в коде не требуется:

```typescript
// Старый код продолжает работать
const prompt = getCoreSystemPrompt(userMemory, model);
// Теперь использует шаблоны v2
```

### Откат на v1

```bash
# Временно отключить v2
OLLAMA_CODE_USE_TEMPLATES=false ollama-code

# Или в коде
process.env.OLLAMA_CODE_USE_TEMPLATES = 'false';
```

## Сравнение v1 vs v2

| Характеристика | v1 (Legacy) | v2 (Templates) |
|----------------|-------------|----------------|
| Размер промпта | ~2000 токенов | 500-1500 (по модели) |
| Приоритеты правил | Нет | [CRITICAL], [RECOMMENDED], [OPTIONAL] |
| Адаптация к модели | Нет | Автоматическая |
| Примеры | 5+ развёрнутых | 1-3 компактных |
| Формат | Свободный | Иерархический |
| Кэширование | Нет | Есть |

## Рекомендации

### Выбор шаблона

1. **<= 10B**: Используйте `small` (8b)
2. **<= 30B**: Используйте `medium` (14b)
3. **<= 60B**: Используйте `large` (32b)
4. **> 60B**: Используйте `xlarge` (70b)

### Кастомизация

1. Скопируйте подходящий шаблон
2. Добавьте проект-специфичные правила
3. Настройте через `OLLAMA_CODE_SYSTEM_MD`

### Тестирование

```typescript
// Проверить размер промпта
const prompt = getCoreSystemPrompt(undefined, model);
console.log(`Prompt size: ${prompt.length} chars`);
```

## Структура файлов

```
packages/core/src/
├── core/
│   ├── prompts.ts          # Основной API (v1 + v2)
│   └── promptsV2.ts        # Реализация v2
└── prompts/
    ├── index.ts            # Экспорт
    └── templates/
        ├── index.ts        # Загрузка шаблонов
        ├── system-8b.md    # Small models
        ├── system-14b.md   # Medium models
        ├── system-32b.md   # Large models
        └── system-70b.md   # XLarge models
```

## Связанная документация

- [Система промптов v1](./PROMPT_SYSTEM.md)
- [Инструменты](./TOOLS.md)
- [Plugin System](./PLUGIN_SYSTEM.md)
