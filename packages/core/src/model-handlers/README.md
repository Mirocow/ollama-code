# Model Handlers | Обработчики моделей

[English](#english) | [Русский](#русский)

---

<a name="english"></a>
## English

### Overview

This module provides a pluggable architecture for handling different AI models. Each model family (Qwen, Llama, DeepSeek, etc.) has its own handler that knows how to parse tool calls and process responses.

### Architecture

```
model-handlers/
├── types.ts              # Interfaces and types
├── baseModelHandler.ts   # Base class with utilities
├── modelHandlerFactory.ts # Factory for managing handlers
├── index.ts              # Exports
├── README.md             # This file
├── default/              # Default handler (fallback)
│   ├── index.ts
│   └── parsers.ts
├── qwen/                 # Qwen models handler
│   ├── index.ts
│   └── parsers.ts
├── llama/                # Llama models handler
│   ├── index.ts
│   └── parsers.ts
└── deepseek/             # DeepSeek models handler
    ├── index.ts
    └── parsers.ts
```

### Model Mapping

| Model Pattern | Handler | Tool Call Format |
|---------------|---------|------------------|
| `qwen`, `qwq` | QwenModelHandler | `<tool_call=...>`, `<think...>` |
| `llama`, `codellama` | LlamaModelHandler | `{"type": "function", ...}` |
| `deepseek` | DeepSeekModelHandler | `<think...>` tags |
| * (any other) | DefaultModelHandler | All common formats |

### Usage

```typescript
import { getModelHandlerFactory } from './model-handlers';

const factory = getModelHandlerFactory();

// Get handler for a model
const handler = factory.getHandler('qwen2.5-coder:14b');

// Parse tool calls from text
const result = handler.parseToolCalls(content);
console.log(result.toolCalls); // [{ name: 'tool_name', args: {...} }]
```

### Adding a New Model

1. **Create directory**: `model-handlers/my-model/`

2. **Create parsers** (`model-handlers/my-model/parsers.ts`):
```typescript
import type { IToolCallTextParser, ToolCallParseResult, ParsedToolCall } from '../types.js';

export class MyModelToolCallParser implements IToolCallTextParser {
  readonly name = 'my-model-tool-call';
  readonly priority = 5;

  canParse(content: string): boolean {
    return content.includes('<my_tool>');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    // Your parsing logic
    return { toolCalls, cleanedContent: content.trim() };
  }
}

export const myModelParsers: IToolCallTextParser[] = [
  new MyModelToolCallParser(),
];
```

3. **Create handler** (`model-handlers/my-model/index.ts`):
```typescript
import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { myModelParsers } from './parsers.js';
import { defaultParsers } from '../default/parsers.js';

export class MyModelHandler implements IModelHandler {
  readonly name = 'my-model';
  readonly config: ModelHandlerConfig = {
    modelPattern: /my-model/i,
    displayName: 'My Model',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...myModelParsers, ...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    const pattern = this.config.modelPattern;
    if (typeof pattern === 'string') {
      return modelName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(modelName);
  }

  parseToolCalls(content: string): ToolCallParseResult {
    const allToolCalls: ParsedToolCall[] = [];
    let currentContent = content;

    for (const parser of this.parsers) {
      if (parser.canParse(currentContent)) {
        const result = parser.parse(currentContent);
        if (result.toolCalls.length > 0) {
          allToolCalls.push(...result.toolCalls);
          currentContent = result.cleanedContent;
        }
      }
    }

    return { toolCalls: allToolCalls, cleanedContent: currentContent.trim() };
  }
}
```

4. **Register in Factory** (`model-handlers/modelHandlerFactory.ts`):
```typescript
import { MyModelHandler } from './my-model/index.js';

// In initializeHandlers():
this.register(new MyModelHandler());
```

5. **Export** (`model-handlers/index.ts`):
```typescript
export { MyModelHandler } from './my-model/index.js';
export { myModelParsers } from './my-model/parsers.js';
```

### Debugging

Enable logging:
```bash
DEBUG=OLLAMA_* npm start
```

Or with `--debug` flag:
```bash
npm run start -- --debug
```

Logs are saved to a file and contain full request/response information.

### Testing Tool Calling

To test tool calling with a specific model:

```bash
# In the project directory
npx tsx scripts/test-tool-calling.ts qwen2.5-coder:14b
npx tsx scripts/test-tool-calling.ts llama3.2
npx tsx scripts/test-tool-calling.ts deepseek-r1:70b
```

### Common Issues

1. **Model doesn't call tools**
   - Check tool support: `client.supportsTools('model-name')`
   - Model may return tool calls in text - check the logs
   - Make sure tools are properly passed in the request

2. **Tool calls not parsed from text**
   - Check the response format in logs
   - Add a new parser if the format differs
   - Make sure the handler is correctly determined for the model

3. **Wrong handler for model**
   - Check mapping: `factory.getHandler('model-name')`
   - Check the pattern in `config.modelPattern`
   - Handler is determined by first match

---

<a name="русский"></a>
## Русский

### Обзор

Этот модуль предоставляет расширяемую архитектуру для работы с различными AI моделями. Каждое семейство моделей (Qwen, Llama, DeepSeek и т.д.) имеет свой обработчик, который знает, как парсить tool calls и обрабатывать ответы.

### Архитектура

```
model-handlers/
├── types.ts              # Интерфейсы и типы
├── baseModelHandler.ts   # Базовый класс с утилитами
├── modelHandlerFactory.ts # Фабрика для управления обработчиками
├── index.ts              # Экспорты
├── README.md             # Этот файл
├── default/              # Стандартный обработчик (fallback)
│   ├── index.ts
│   └── parsers.ts
├── qwen/                 # Обработчик моделей Qwen
│   ├── index.ts
│   └── parsers.ts
├── llama/                # Обработчик моделей Llama
│   ├── index.ts
│   └── parsers.ts
└── deepseek/             # Обработчик моделей DeepSeek
    ├── index.ts
    └── parsers.ts
```

### Маппинг моделей

| Паттерн модели | Обработчик | Формат tool calls |
|----------------|------------|-------------------|
| `qwen`, `qwq` | QwenModelHandler | `<tool_call=...>`, `<think...>` |
| `llama`, `codellama` | LlamaModelHandler | `{"type": "function", ...}` |
| `deepseek` | DeepSeekModelHandler | `<think...>` теги |
| * (любая другая) | DefaultModelHandler | Все распространённые форматы |

### Использование

```typescript
import { getModelHandlerFactory } from './model-handlers';

const factory = getModelHandlerFactory();

// Получить обработчик для модели
const handler = factory.getHandler('qwen2.5-coder:14b');

// Парсить tool calls из текста
const result = handler.parseToolCalls(content);
console.log(result.toolCalls); // [{ name: 'tool_name', args: {...} }]
```

### Добавление новой модели

1. **Создать директорию**: `model-handlers/my-model/`

2. **Создать парсеры** (`model-handlers/my-model/parsers.ts`):
```typescript
import type { IToolCallTextParser, ToolCallParseResult, ParsedToolCall } from '../types.js';

export class MyModelToolCallParser implements IToolCallTextParser {
  readonly name = 'my-model-tool-call';
  readonly priority = 5;

  canParse(content: string): boolean {
    return content.includes('<my_tool>');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    // Ваша логика парсинга
    return { toolCalls, cleanedContent: content.trim() };
  }
}

export const myModelParsers: IToolCallTextParser[] = [
  new MyModelToolCallParser(),
];
```

3. **Создать обработчик** (`model-handlers/my-model/index.ts`):
```typescript
import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { myModelParsers } from './parsers.js';
import { defaultParsers } from '../default/parsers.js';

export class MyModelHandler implements IModelHandler {
  readonly name = 'my-model';
  readonly config: ModelHandlerConfig = {
    modelPattern: /my-model/i,
    displayName: 'My Model',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...myModelParsers, ...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    const pattern = this.config.modelPattern;
    if (typeof pattern === 'string') {
      return modelName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(modelName);
  }

  parseToolCalls(content: string): ToolCallParseResult {
    const allToolCalls: ParsedToolCall[] = [];
    let currentContent = content;

    for (const parser of this.parsers) {
      if (parser.canParse(currentContent)) {
        const result = parser.parse(currentContent);
        if (result.toolCalls.length > 0) {
          allToolCalls.push(...result.toolCalls);
          currentContent = result.cleanedContent;
        }
      }
    }

    return { toolCalls: allToolCalls, cleanedContent: currentContent.trim() };
  }
}
```

4. **Зарегистрировать в фабрике** (`model-handlers/modelHandlerFactory.ts`):
```typescript
import { MyModelHandler } from './my-model/index.js';

// В методе initializeHandlers():
this.register(new MyModelHandler());
```

5. **Экспортировать** (`model-handlers/index.ts`):
```typescript
export { MyModelHandler } from './my-model/index.js';
export { myModelParsers } from './my-model/parsers.js';
```

### Поддерживаемые форматы tool calls

| Формат | Пример | Используется |
|--------|--------|--------------|
| Tool call tag | `<tool_call={"name": "...", "arguments": {...}}>` | Qwen |
| Tool call start/end | `<tool_call_start>...<tool_call_end>` | Универсальный |
| Think tags | `<think {"name": "..."} </think Tags | Qwen3, DeepSeek R1 |
| Function call | `{"type": "function", "function": {...}}` | Llama, OpenAI |
| Standalone JSON | `{"name": "...", "arguments": {...}}` | Универсальный |

### Отладка

Включить логирование:
```bash
DEBUG=OLLAMA_* npm start
```

Или с флагом `--debug`:
```bash
npm run start -- --debug
```

Логи сохраняются в файл и содержат полную информацию о запросах и ответах.

### Тестирование tool calling

Для тестирования tool calling с конкретной моделью:

```bash
# В директории проекта
npx tsx scripts/test-tool-calling.ts qwen2.5-coder:14b
npx tsx scripts/test-tool-calling.ts llama3.2
npx tsx scripts/test-tool-calling.ts deepseek-r1:70b
```

### Частые проблемы

1. **Модель не вызывает tool calls**
   - Проверьте поддержку tools: `client.supportsTools('model-name')`
   - Модель может возвращать tool calls в тексте - проверьте логи
   - Убедитесь, что tools правильно передаются в запросе

2. **Tool calls не парсятся из текста**
   - Проверьте формат ответа в логах
   - Добавьте новый парсер, если формат отличается
   - Убедитесь, что handler правильно определяется для модели

3. **Неправильный handler для модели**
   - Проверьте маппинг: `factory.getHandler('model-name')`
   - Проверьте паттерн в `config.modelPattern`
   - Handler определяется по первому совпадению
