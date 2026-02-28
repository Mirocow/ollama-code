# Model Handlers

Модуль для обработки различных моделей Ollama с поддержкой парсинга tool calls.

## Структура

```
model-handlers/
├── index.ts                 # Публичный экспорт
├── types.ts                 # TypeScript интерфейсы
├── baseModelHandler.ts      # Базовые классы и утилиты
├── modelHandlerFactory.ts   # Фабрика handlers
├── default/                 # Default handler и parsers
│   ├── index.ts
│   └── parsers.ts
├── qwen/                    # Alibaba Qwen models
│   ├── index.ts
│   └── parsers.ts
├── llama/                   # Meta Llama models
│   ├── index.ts
│   └── parsers.ts
├── deepseek/                # DeepSeek models
│   ├── index.ts
│   └── parsers.ts
├── mistral/                 # Mistral AI models
│   ├── index.ts
│   └── parsers.ts
├── gemma/                   # Google Gemma models
│   ├── index.ts
│   └── parsers.ts
├── phi/                     # Microsoft Phi models
│   ├── index.ts
│   └── parsers.ts
├── command/                 # Cohere Command models
│   ├── index.ts
│   └── parsers.ts
└── utils/                   # Общие утилиты
    └── parserUtils.ts
```

## Поддерживаемые модели

| Handler      | Models                                   | Tool Support                                |
| ------------ | ---------------------------------------- | ------------------------------------------- |
| **Qwen**     | qwen2.5-coder, qwen3-coder, qwq          | ✅ All Qwen-Coder, Qwen3, QwQ               |
| **Llama**    | llama3.1, llama3.2, codellama            | ✅ llama3.1+, codellama                     |
| **DeepSeek** | deepseek-coder, deepseek-r1, deepseek-v3 | ✅ All                                      |
| **Mistral**  | mistral, mixtral, codestral              | ✅ Instruct variants, all Mixtral/Codestral |
| **Gemma**    | gemma-2, gemma-3, codegemma              | ⚠️ Gemma 3, CodeGemma only                  |
| **Phi**      | phi-3, phi-3.5, phi-4                    | ✅ Phi-3+                                   |
| **Command**  | command-r, command-r-plus                | ✅ All (optimized for tools)                |

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
    // Кастомная логика проверки
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
2. Создайте `index.ts` с классом handler
3. Создайте `parsers.ts` с кастомными парсерами (если нужны)
4. Зарегистрируйте handler в `modelHandlerFactory.ts`
5. Добавьте тесты в `index.test.ts`
