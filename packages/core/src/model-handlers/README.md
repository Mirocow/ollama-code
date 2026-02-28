# Model Handlers

This directory contains model-specific handlers for parsing tool calls and processing requests/responses from different AI models.

## Architecture

```
model-handlers/
├── types.ts              # Interfaces and types
├── baseModelHandler.ts   # Base classes with utilities
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

## How It Works

1. **Factory Pattern**: `ModelHandlerFactory` manages all handlers
2. **Chain of Responsibility**: Each handler checks if it can handle a model
3. **First Match Wins**: The first handler that returns `canHandle() === true` is used
4. **Default Fallback**: If no handler matches, the default handler is used

## Usage

### Basic Usage

```typescript
import { getModelHandlerFactory } from './model-handlers';

const factory = getModelHandlerFactory();

// Get handler for a model
const handler = await factory.getHandler('qwen3-coder:30b');

// Parse tool calls from text
const result = handler.parseToolCalls(content);
console.log(result.toolCalls); // [{ name: 'tool_name', args: {...} }]
console.log(result.cleanedContent); // Content with tool calls removed
```

### Direct Handler Usage

```typescript
import { QwenModelHandler } from './model-handlers';

const handler = new QwenModelHandler();

if (handler.canHandle('qwen3-coder:30b')) {
  const result = handler.parseToolCalls(content);
}
```

### Register Custom Handler

```typescript
import { getModelHandlerFactory } from './model-handlers';

const factory = getModelHandlerFactory();
factory.register(new MyCustomHandler());
```

---

## Adding a New Model

To add support for a new model family, follow these steps:

### Step 1: Create Directory Structure

```bash
mkdir -p model-handlers/my-model
```

### Step 2: Create Parsers (if needed)

Create `model-handlers/my-model/parsers.ts`:

```typescript
import type { IToolCallTextParser, ToolCallParseResult, ParsedToolCall } from '../types.js';

/**
 * Parser for MyModel's specific tool call format.
 */
export class MyModelToolCallParser implements IToolCallTextParser {
  readonly name = 'my-model-tool-call';
  readonly priority = 5; // Lower = tried first

  canParse(content: string): boolean {
    // Return true if this parser might find tool calls
    return content.includes('<my_tool_call>');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;

    // Your parsing logic here
    // Extract tool calls and clean content

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

export const myModelParsers: IToolCallTextParser[] = [
  new MyModelToolCallParser(),
];
```

### Step 3: Create Handler

Create `model-handlers/my-model/index.ts`:

```typescript
import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { myModelParsers } from './parsers.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * MyModel handler.
 *
 * Describe your model here:
 * - Model names it handles
 * - Tool call formats it uses
 * - Any special behavior
 */
export class MyModelHandler implements IModelHandler {
  readonly name = 'my-model';
  readonly config: ModelHandlerConfig = {
    // Regex pattern to match model names
    modelPattern: /my-model|mymodel/i,
    displayName: 'My Model',
    description: 'Description of your model',
    supportsStructuredToolCalls: true, // Does it support Ollama tool_calls?
    supportsTextToolCalls: true,       // Can it return tool calls in text?
    maxContextLength: 32000,           // If known
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    // Your parsers first, then default parsers as fallback
    this.parsers = [...myModelParsers, ...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    return this.config.modelPattern.test(modelName);
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

    return {
      toolCalls: allToolCalls,
      cleanedContent: currentContent.trim(),
    };
  }
}
```

### Step 4: Register in Factory

Edit `model-handlers/modelHandlerFactory.ts`:

```typescript
// Add import
const { MyModelHandler } = await import('./my-model/index.js');

// Register in initializeHandlers() method
this.register(new MyModelHandler());
```

### Step 5: Export from Index

Edit `model-handlers/index.ts`:

```typescript
export { MyModelHandler } from './my-model/index.js';
export { myModelParsers } from './my-model/parsers.js';
```

### Step 6: Add Tests

Create `model-handlers/my-model/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MyModelHandler } from './index.js';

describe('MyModelHandler', () => {
  const handler = new MyModelHandler();

  it('should handle my-model names', () => {
    expect(handler.canHandle('my-model-v1')).toBe(true);
    expect(handler.canHandle('other-model')).toBe(false);
  });

  it('should parse tool calls', () => {
    const content = '<my_tool_call>{"name": "test", "arguments": {}}</my_tool_call>';
    const result = handler.parseToolCalls(content);
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('test');
  });
});
```

---

## Tool Call Formats

Different models use different formats for tool calls:

### Qwen Format
```
<tool_call={"name": "list_directory", "arguments": {"path": "/home"}}>
```

### Qwen3 Think Format
```
<think {"name": "tool", "arguments": {...}} </think<tool_call_parser>
```

### OpenAI/Function Format
```json
{"type": "function", "function": {"name": "tool_name", "arguments": "{\"arg\": \"value\"}"}}
```

### Standalone JSON
```json
{"name": "tool_name", "arguments": {"arg": "value"}}
```

---

## Parser Priority

Parsers are tried in order of priority (lower number = higher priority):

| Priority | Use Case |
|----------|----------|
| 1-10     | Model-specific formats (most specific) |
| 10-20    | Common formats with tags |
| 20-30    | Generic formats (JSON) |
| 100+     | Fallback parsers |

---

## Testing Your Handler

```typescript
import { getModelHandlerFactory, resetModelHandlerFactory } from './model-handlers';

describe('MyModelHandler Integration', () => {
  beforeEach(() => {
    resetModelHandlerFactory();
  });

  it('should be selected for my-model', async () => {
    const factory = getModelHandlerFactory();
    const handler = await factory.getHandler('my-model-v1');
    expect(handler.name).toBe('my-model');
  });
});
```

---

## Troubleshooting

### Handler Not Being Selected

1. Check `canHandle()` returns `true` for your model name
2. Check `modelPattern` regex is correct
3. Handlers are checked in registration order - more specific handlers should be registered first

### Tool Calls Not Being Parsed

1. Add debug logging to your parser
2. Check `canParse()` returns `true` for your content
3. Verify the JSON format matches what your parser expects

### Multiple Tool Calls

Your parser should handle multiple tool calls in one content:

```typescript
parse(content: string): ToolCallParseResult {
  const toolCalls: ParsedToolCall[] = [];

  // Use a loop with global regex
  const pattern = /<tool_call[^>]*>/gi;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    // Extract and add each tool call
  }

  return { toolCalls, cleanedContent };
}
```

---

## Best Practices

1. **Be Specific**: Model-specific parsers should have lower priority numbers
2. **Fallback**: Always include default parsers for common formats
3. **Deduplication**: Check for duplicate tool calls before adding
4. **Content Cleaning**: Remove parsed tool calls from content to avoid double-parsing
5. **Error Handling**: Wrap JSON parsing in try-catch
6. **Testing**: Test with real model outputs

---

## Example: Complete Handler

See `qwen/` directory for a complete example of a model handler with:
- Custom parsers for Qwen-specific formats
- Integration with default parsers
- Configuration and documentation
