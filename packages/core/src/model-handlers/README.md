# Model Handlers / Обработчики моделей

[English](#english) | [Русский](#русский)

---

<a name="english"></a>
## English

Module for handling various Ollama models with tool call parsing support.

## Structure

```
model-handlers/
├── index.ts                 # Public exports
├── types.ts                 # TypeScript interfaces
├── baseModelHandler.ts      # Base classes and utilities
├── modelHandlerFactory.ts   # Handler factory
├── default/                 # Default handler and parsers
├── qwen/                    # Alibaba Qwen models
├── llama/                   # Meta Llama models
├── deepseek/                # DeepSeek models
├── mistral/                 # Mistral AI models
├── gemma/                   # Google Gemma models
├── phi/                     # Microsoft Phi models
├── command/                 # Cohere Command models
├── yi/                      # 01.ai Yi models
├── llava/                   # LLaVA vision models
├── solar/                   # Upstage Solar models
├── starcoder/               # StarCoder code models
├── dbrx/                    # Databricks DBRX models
├── granite/                 # IBM Granite models
├── olmo/                    # AllenAI OLMo models
├── neural-chat/             # Intel Neural Chat models
└── utils/                   # Shared utilities
```

## Supported Models

| Handler | Models | Tool Support |
|---------|--------|--------------|
| **Qwen** | qwen2.5-coder, qwen3-coder, qwq | ✅ Qwen-Coder, Qwen3, QwQ, Qwen2.5-instruct |
| **Llama** | llama3.1, llama3.2, llama3.3, codellama | ✅ llama3.1+, codellama |
| **DeepSeek** | deepseek-coder, deepseek-r1, deepseek-v3 | ✅ All DeepSeek models |
| **Mistral** | mistral, mixtral, codestral | ✅ Instruct variants, all Mixtral/Codestral |
| **Gemma** | gemma-2, gemma-3, codegemma | ⚠️ Gemma 3, CodeGemma, Gemma 2 instruct only |
| **Phi** | phi-3, phi-3.5, phi-4 | ✅ Phi 3+ (phi-2 no tools) |
| **Command** | command-r, command-r-plus | ✅ All (optimized for tools) |
| **Yi** | yi, yi-coder, yi-large, yi-chat | ✅ Yi-Coder, Yi-Large, Yi-Chat |
| **LLaVA** | llava, bakllava, moondream, minicpm-v | ❌ Vision models (no tools) |
| **Solar** | solar-10.7b, solar-pro | ✅ Solar Pro, instruct variants |
| **StarCoder** | starcoder, starcoder2, stable-code | ❌ Code models (no tools) |
| **DBRX** | dbrx, dbrx-instruct | ✅ dbrx-instruct only |
| **Granite** | granite-3b, granite-7b, granite-code | ✅ Granite 3+, Granite-code, Granite-instruct |
| **OLMo** | olmo, olmo-2, olmo-instruct | ✅ OLMo 2, OLMo-instruct |
| **Neural Chat** | neural-chat, neural-chat-v3 | ✅ Neural Chat v3+ |

**Total: 15 model handlers**

## Usage

### Getting a handler for a model

```typescript
import { getModelHandlerFactory } from './model-handlers';

const factory = getModelHandlerFactory();

// Get handler
const handler = factory.getHandler('qwen3-coder:30b');

// Check tool support
const supportsTools = factory.supportsTools('qwen3-coder:30b');

// Parse tool calls from text
const result = handler.parseToolCalls(content);
```

### Creating a custom handler

```typescript
import {
  IModelHandler,
  ModelHandlerConfig,
  ToolCallParseResult,
} from './model-handlers';

class MyModelHandler implements IModelHandler {
  readonly name = 'my-model';
  readonly config: ModelHandlerConfig = {
    modelPattern: /my-model/i,
    displayName: 'My Model',
    supportsTools: true,
  };

  canHandle(modelName: string): boolean {
    return this.config.modelPattern.test(modelName);
  }

  supportsTools(modelName: string): boolean {
    // Custom logic
    return true;
  }

  parseToolCalls(content: string): ToolCallParseResult {
    // Custom parsing
    return { toolCalls: [], cleanedContent: content };
  }
}

// Register
factory.register(new MyModelHandler());
```

## Tool Call Formats

Different models return tool calls in different formats:

### Qwen
```
<tool_call={"name": "function_name", "arguments": {...}}>
```

### Mistral
```
[TOOL_CALLS]
[{"name": "function_name", "arguments": {...}}]
```

### DeepSeek R1
```
<think...>
...reasoning...
</think...>
<tool_call={"name": "function_name", "arguments": {...}}>
```

### Phi
```
<function_call>
{"name": "function_name", "arguments": {...}}
</function_call>
```

## Testing

```bash
# Run tests
pnpm test packages/core/src/model-handlers/

# Test specific model
OLLAMA_URL=http://localhost:11434 npx tsx scripts/test-tool-calling.ts qwen3-coder:30b
```

## Adding a new handler

1. Create directory `packages/core/src/model-handlers/my-model/`
2. Create `index.ts` with handler class:

```typescript
import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

export class MyModelHandler implements IModelHandler {
  readonly name = 'my-model';
  readonly config: ModelHandlerConfig = {
    modelPattern: /my-model/i,
    displayName: 'My Model',
    description: 'My Model description',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: true,
    maxContextLength: 32768,
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    return this.config.modelPattern.test(modelName);
  }

  supportsTools(modelName: string): boolean {
    const name = modelName.toLowerCase();
    return /instruct/i.test(name);
  }

  parseToolCalls(content: string): ToolCallParseResult {
    const allToolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
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

    return {
      toolCalls: allToolCalls,
      cleanedContent: currentContent.trim(),
    };
  }
}
```

3. Create `parsers.ts` with custom parsers (if needed)
4. Register handler in `modelHandlerFactory.ts`
5. Add export to `index.ts`
6. Add tests to `index.test.ts`

---

<a name="русский"></a>
## Русский

Модуль для обработки различных моделей Ollama с поддержкой парсинга tool calls.

## Структура

```
model-handlers/
├── index.ts                 # Публичный экспорт
├── types.ts                 # TypeScript интерфейсы
├── baseModelHandler.ts      # Базовые классы и утилиты
├── modelHandlerFactory.ts   # Фабрика handlers
├── default/                 # Default handler и parsers
├── qwen/                    # Alibaba Qwen models
├── llama/                   # Meta Llama models
├── deepseek/                # DeepSeek models
├── mistral/                 # Mistral AI models
├── gemma/                   # Google Gemma models
├── phi/                     # Microsoft Phi models
├── command/                 # Cohere Command models
├── yi/                      # 01.ai Yi models
├── llava/                   # LLaVA vision models
├── solar/                   # Upstage Solar models
├── starcoder/               # StarCoder code models
├── dbrx/                    # Databricks DBRX models
├── granite/                 # IBM Granite models
├── olmo/                    # AllenAI OLMo models
├── neural-chat/             # Intel Neural Chat models
└── utils/                   # Общие утилиты
```

## Поддерживаемые модели

| Handler | Модели | Поддержка tools |
|---------|--------|-----------------|
| **Qwen** | qwen2.5-coder, qwen3-coder, qwq | ✅ Qwen-Coder, Qwen3, QwQ, Qwen2.5-instruct |
| **Llama** | llama3.1, llama3.2, llama3.3, codellama | ✅ llama3.1+, codellama |
| **DeepSeek** | deepseek-coder, deepseek-r1, deepseek-v3 | ✅ Все модели DeepSeek |
| **Mistral** | mistral, mixtral, codestral | ✅ Instruct варианты, все Mixtral/Codestral |
| **Gemma** | gemma-2, gemma-3, codegemma | ⚠️ Gemma 3, CodeGemma, только Gemma 2 instruct |
| **Phi** | phi-3, phi-3.5, phi-4 | ✅ Phi 3+ (phi-2 без tools) |
| **Command** | command-r, command-r-plus | ✅ Все (оптимизированы для tools) |
| **Yi** | yi, yi-coder, yi-large, yi-chat | ✅ Yi-Coder, Yi-Large, Yi-Chat |
| **LLaVA** | llava, bakllava, moondream, minicpm-v | ❌ Vision модели (без tools) |
| **Solar** | solar-10.7b, solar-pro | ✅ Solar Pro, instruct варианты |
| **StarCoder** | starcoder, starcoder2, stable-code | ❌ Code модели (без tools) |
| **DBRX** | dbrx, dbrx-instruct | ✅ Только dbrx-instruct |
| **Granite** | granite-3b, granite-7b, granite-code | ✅ Granite 3+, Granite-code, Granite-instruct |
| **OLMo** | olmo, olmo-2, olmo-instruct | ✅ OLMo 2, OLMo-instruct |
| **Neural Chat** | neural-chat, neural-chat-v3 | ✅ Neural Chat v3+ |

**Всего: 15 обработчиков моделей**

## Использование

### Получение handler для модели

```typescript
import { getModelHandlerFactory } from './model-handlers';

const factory = getModelHandlerFactory();

// Получить handler
const handler = factory.getHandler('qwen3-coder:30b');

// Проверить поддержку tools
const supportsTools = factory.supportsTools('qwen3-coder:30b');

// Парсить tool calls из текста
const result = handler.parseToolCalls(content);
```

### Создание кастомного handler

```typescript
import {
  IModelHandler,
  ModelHandlerConfig,
  ToolCallParseResult,
} from './model-handlers';

class MyModelHandler implements IModelHandler {
  readonly name = 'my-model';
  readonly config: ModelHandlerConfig = {
    modelPattern: /my-model/i,
    displayName: 'My Model',
    supportsTools: true,
  };

  canHandle(modelName: string): boolean {
    return this.config.modelPattern.test(modelName);
  }

  supportsTools(modelName: string): boolean {
    // Кастомная логика
    return true;
  }

  parseToolCalls(content: string): ToolCallParseResult {
    // Кастомный парсинг
    return { toolCalls: [], cleanedContent: content };
  }
}

// Регистрация
factory.register(new MyModelHandler());
```

## Форматы Tool Calls

Разные модели возвращают tool calls в разных форматах:

### Qwen
```
<tool_call={"name": "function_name", "arguments": {...}}>
```

### Mistral
```
[TOOL_CALLS]
[{"name": "function_name", "arguments": {...}}]
```

### DeepSeek R1
```
<think...>
...reasoning...
</think...>
<tool_call={"name": "function_name", "arguments": {...}}>
```

### Phi
```
<function_call>
{"name": "function_name", "arguments": {...}}
</function_call>
```

## Тестирование

```bash
# Запуск тестов
pnpm test packages/core/src/model-handlers/

# Тестирование конкретной модели
OLLAMA_URL=http://localhost:11434 npx tsx scripts/test-tool-calling.ts qwen3-coder:30b
```

## Добавление нового handler

1. Создайте директорию `packages/core/src/model-handlers/my-model/`
2. Создайте `index.ts` с классом handler (см. пример выше)
3. Создайте `parsers.ts` с кастомными парсерами (если нужны)
4. Зарегистрируйте handler в `modelHandlerFactory.ts`
5. Добавьте экспорт в `index.ts`
6. Добавьте тесты в `index.test.ts`
