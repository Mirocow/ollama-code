/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Комплексный тест системы накопления и сохранения контента
 *
 * Запуск: npx ts-node packages/cli/src/ui/hooks/__tests__/contentAccumulator.test.ts
 * Или: node --import tsx packages/cli/src/ui/hooks/__tests__/contentAccumulator.test.ts
 */

// Импортируем тестируемый модуль (прямо из исходников для изоляции)
// В реальном проекте импорт был бы: from '../useContentAccumulator.js'

// ============================================================================
// ContentAccumulator Implementation (inline for isolated testing)
// ============================================================================

function hasSignificantContent(content: string | null | undefined): boolean {
  if (!content) {
    return false;
  }
  const trimmed = content.trim();
  return trimmed.length > 0;
}

interface ContentValidationResult {
  isValid: boolean;
  originalLength: number;
  trimmedLength: number;
  reason?: string;
}

function validateContent(
  content: string | null | undefined,
): ContentValidationResult {
  if (!content) {
    return {
      isValid: false,
      originalLength: 0,
      trimmedLength: 0,
      reason: 'Content is null or undefined',
    };
  }

  const trimmed = content.trim();
  const trimmedLength = trimmed.length;

  if (trimmedLength === 0) {
    return {
      isValid: false,
      originalLength: content.length,
      trimmedLength: 0,
      reason: 'Content contains only whitespace',
    };
  }

  return {
    isValid: true,
    originalLength: content.length,
    trimmedLength,
  };
}

interface AccumulatedContent {
  text: string;
  thought: string;
  uuid: string;
  hasToolCalls: boolean;
  startedAt: number;
}

class ContentAccumulator {
  private content: AccumulatedContent | null = null;

  startTurn(uuid?: string): void {
    this.content = {
      text: '',
      thought: '',
      uuid: uuid || '',
      hasToolCalls: false,
      startedAt: Date.now(),
    };
  }

  /**
   * Append text content to the accumulator.
   * Handles various input types by converting them to strings.
   */
  appendText(chunk: unknown): void {
    if (!this.content) {
      this.startTurn();
    }
    // Convert chunk to string, handling various input types
    let textChunk: string;
    if (chunk === null || chunk === undefined) {
      textChunk = '';
    } else if (typeof chunk === 'string') {
      textChunk = chunk;
    } else if (Array.isArray(chunk)) {
      // Handle arrays by converting each element
      textChunk = chunk
        .map((item) =>
          typeof item === 'string'
            ? item
            : item && typeof item === 'object' && 'text' in item
              ? String((item as { text: string }).text)
              : String(item),
        )
        .join('');
    } else if (typeof chunk === 'object' && chunk !== null) {
      // Handle object with text property
      const obj = chunk as Record<string, unknown>;
      if ('text' in obj && typeof obj['text'] === 'string') {
        textChunk = obj['text'] as string;
      } else {
        textChunk = JSON.stringify(chunk);
      }
    } else {
      // Fallback: convert to string
      textChunk = String(chunk);
    }
    this.content!.text += textChunk;
  }

  /**
   * Append thought content to the accumulator.
   * Handles various input types by converting them to strings.
   */
  appendThought(chunk: unknown): void {
    if (!this.content) {
      this.startTurn();
    }
    // Convert chunk to string, handling various input types
    let textChunk: string;
    if (chunk === null || chunk === undefined) {
      textChunk = '';
    } else if (typeof chunk === 'string') {
      textChunk = chunk;
    } else if (Array.isArray(chunk)) {
      // Handle arrays by converting each element
      textChunk = chunk
        .map((item) =>
          typeof item === 'string'
            ? item
            : item && typeof item === 'object' && 'text' in item
              ? String((item as { text: string }).text)
              : String(item),
        )
        .join('');
    } else if (typeof chunk === 'object' && chunk !== null) {
      // Handle object with text property
      const obj = chunk as Record<string, unknown>;
      if ('text' in obj && typeof obj['text'] === 'string') {
        textChunk = obj['text'] as string;
      } else {
        textChunk = JSON.stringify(chunk);
      }
    } else {
      // Fallback: convert to string
      textChunk = String(chunk);
    }
    this.content!.thought += textChunk;
  }

  setUuid(uuid: string): void {
    if (!this.content) return;
    this.content.uuid = uuid;
  }

  getText(): string {
    return this.content?.text ?? '';
  }

  getThought(): string {
    return this.content?.thought ?? '';
  }

  getUuid(): string {
    return this.content?.uuid ?? '';
  }

  hasSignificantContent(): boolean {
    if (!this.content) {
      return false;
    }
    return (
      hasSignificantContent(this.content.text) ||
      hasSignificantContent(this.content.thought)
    );
  }

  validate(): {
    text: ContentValidationResult;
    thought: ContentValidationResult;
    hasAnyValidContent: boolean;
  } {
    const textValidation = validateContent(this.content?.text);
    const thoughtValidation = validateContent(this.content?.thought);

    return {
      text: textValidation,
      thought: thoughtValidation,
      hasAnyValidContent: textValidation.isValid || thoughtValidation.isValid,
    };
  }

  reset(): void {
    this.content = null;
  }

  isActive(): boolean {
    return this.content !== null;
  }

  getDebugSnapshot(): {
    isActive: boolean;
    textLength: number;
    thoughtLength: number;
    uuid: string;
    hasToolCalls: boolean;
  } {
    return {
      isActive: this.content !== null,
      textLength: this.content?.text.length ?? 0,
      thoughtLength: this.content?.thought.length ?? 0,
      uuid: this.content?.uuid ?? '',
      hasToolCalls: this.content?.hasToolCalls ?? false,
    };
  }
}

function createContentAccumulator(): ContentAccumulator {
  return new ContentAccumulator();
}

// ============================================================================
// Test Framework (minimal)
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];
let currentSuite = '';

function describe(suite: string, fn: () => void): void {
  currentSuite = suite;
  console.log(`\n📦 ${suite}`);
  console.log('─'.repeat(60));
  fn();
}

function test(name: string, fn: () => void): void {
  const fullName = `${currentSuite} > ${name}`;
  const startTime = Date.now();

  try {
    fn();
    const duration = Date.now() - startTime;
    results.push({ name: fullName, passed: true, message: '✓ PASS', duration });
    console.log(`  ✓ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name: fullName, passed: false, message, duration });
    console.log(`  ✗ ${name}`);
    console.log(`    ERROR: ${message}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(
          `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeTrue() {
      if (actual !== true) {
        throw new Error(`Expected true, got ${actual}`);
      }
    },
    toBeFalse() {
      if (actual !== false) {
        throw new Error(`Expected false, got ${actual}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toContain(expected: string) {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
  };
}

// ============================================================================
// Test Data
// ============================================================================

const testCases = {
  normal: [
    { name: 'Simple text', content: 'Hello world', expectedValid: true },
    {
      name: 'Multi-line text',
      content: 'Line 1\nLine 2\nLine 3',
      expectedValid: true,
    },
    {
      name: 'Code block',
      content: '```javascript\nconst x = 1;\n```',
      expectedValid: true,
    },
    { name: 'JSON', content: '{"key": "value"}', expectedValid: true },
    {
      name: 'Markdown',
      content: '# Header\n\n**Bold** text',
      expectedValid: true,
    },
    { name: 'Emoji', content: 'Hello 👋 World 🌍', expectedValid: true },
    {
      name: 'Unicode',
      content: 'Привет мир 你好世界 مرحبا',
      expectedValid: true,
    },
    {
      name: 'Special chars',
      content: '!@#$%^&*()_+-=[]{}|;\':",./<>?',
      expectedValid: true,
    },
    { name: 'Tabs', content: 'Column1\tColumn2\tColumn3', expectedValid: true },
    {
      name: 'Mixed whitespace',
      content: 'Hello\n\tWorld\r\n\r\nNew paragraph',
      expectedValid: true,
    },
  ],

  empty: [
    { name: 'Empty string', content: '', expectedValid: false },
    { name: 'Single space', content: ' ', expectedValid: false },
    { name: 'Multiple spaces', content: '     ', expectedValid: false },
    { name: 'Tab only', content: '\t', expectedValid: false },
    { name: 'Newline only', content: '\n', expectedValid: false },
    { name: 'Carriage return', content: '\r', expectedValid: false },
    { name: 'Mixed whitespace', content: ' \t\n\r ', expectedValid: false },
    { name: 'Multiple newlines', content: '\n\n\n\n', expectedValid: false },
    {
      name: 'Unicode spaces',
      content: '\u00A0\u2000\u2001',
      expectedValid: false,
    },
  ],

  edge: [
    { name: 'Space + text + space', content: ' Hello ', expectedValid: true },
    { name: 'Newline + text', content: '\nHello', expectedValid: true },
    { name: 'Text + newline', content: 'Hello\n', expectedValid: true },
    {
      name: 'Zero-width chars',
      content: 'Hello\u200BWorld',
      expectedValid: true,
    },
    { name: 'Single char', content: 'A', expectedValid: true },
    { name: 'Single digit', content: '1', expectedValid: true },
    { name: 'Single punctuation', content: '.', expectedValid: true },
    { name: 'Very long word', content: 'a'.repeat(10000), expectedValid: true },
  ],

  streaming: [
    {
      name: 'Small chunks',
      chunks: ['H', 'e', 'l', 'l', 'o'],
      expected: 'Hello',
    },
    {
      name: 'Medium chunks',
      chunks: ['Hello ', 'World', '!'],
      expected: 'Hello World!',
    },
    {
      name: 'Large chunks',
      chunks: ['# Title\n\n', 'Paragraph\n\n', 'Code: ```\n'],
      expected: '# Title\n\nParagraph\n\nCode: ```\n',
    },
    {
      name: 'Empty chunks mixed',
      chunks: ['', 'Hello', '', ' ', '', 'World', ''],
      expected: 'Hello World',
    },
    { name: 'Whitespace chunks', chunks: [' ', ' ', ' '], expected: '   ' },
  ],
};

// ============================================================================
// Tests
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log('🧪 CONTENT ACCUMULATOR TEST SUITE');
console.log('═'.repeat(60));

describe('hasSignificantContent()', () => {
  testCases.normal.forEach(({ name, content, expectedValid }) => {
    test(`${name}`, () => {
      expect(hasSignificantContent(content)).toBe(expectedValid);
    });
  });

  testCases.empty.forEach(({ name, content }) => {
    test(`Empty: ${name}`, () => {
      expect(hasSignificantContent(content)).toBeFalse();
    });
  });

  testCases.edge.forEach(({ name, content, expectedValid }) => {
    test(`Edge: ${name}`, () => {
      expect(hasSignificantContent(content)).toBe(expectedValid);
    });
  });

  test('null is invalid', () => {
    expect(hasSignificantContent(null)).toBeFalse();
  });

  test('undefined is invalid', () => {
    expect(hasSignificantContent(undefined)).toBeFalse();
  });
});

describe('validateContent()', () => {
  test('Valid content returns correct result', () => {
    const result = validateContent('Hello World');
    expect(result.isValid).toBeTrue();
    expect(result.originalLength).toBe(11);
    expect(result.trimmedLength).toBe(11);
    expect(result.reason).toBe(undefined);
  });

  test('Whitespace content returns invalid', () => {
    const result = validateContent('   ');
    expect(result.isValid).toBeFalse();
    expect(result.originalLength).toBe(3);
    expect(result.trimmedLength).toBe(0);
    expect(result.reason).toBe('Content contains only whitespace');
  });

  test('Null returns correct result', () => {
    const result = validateContent(null);
    expect(result.isValid).toBeFalse();
    expect(result.originalLength).toBe(0);
    expect(result.reason).toBe('Content is null or undefined');
  });

  test('Content with spaces trimmed correctly', () => {
    const result = validateContent('  Hello  ');
    expect(result.isValid).toBeTrue();
    expect(result.originalLength).toBe(9);
    expect(result.trimmedLength).toBe(5);
  });
});

describe('ContentAccumulator Lifecycle', () => {
  test('New accumulator is not active', () => {
    const acc = createContentAccumulator();
    expect(acc.isActive()).toBeFalse();
  });

  test('startTurn() activates accumulator', () => {
    const acc = createContentAccumulator();
    acc.startTurn('test-uuid');
    expect(acc.isActive()).toBeTrue();
  });

  test('reset() deactivates accumulator', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('test');
    acc.reset();
    expect(acc.isActive()).toBeFalse();
  });

  test('UUID is preserved', () => {
    const acc = createContentAccumulator();
    acc.startTurn('my-uuid-123');
    expect(acc.getUuid()).toBe('my-uuid-123');
  });

  test('setUuid() updates UUID', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.setUuid('new-uuid');
    expect(acc.getUuid()).toBe('new-uuid');
  });
});

describe('ContentAccumulator Text Accumulation', () => {
  testCases.streaming.forEach(({ name, chunks, expected }) => {
    test(`Streaming: ${name}`, () => {
      const acc = createContentAccumulator();
      acc.startTurn();
      chunks.forEach((chunk) => acc.appendText(chunk));
      expect(acc.getText()).toBe(expected);
    });
  });

  test('Multiple appendText() calls accumulate', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('Hello');
    acc.appendText(' ');
    acc.appendText('World');
    expect(acc.getText()).toBe('Hello World');
  });

  test('Auto-initialization on appendText()', () => {
    const acc = createContentAccumulator();
    acc.appendText('test');
    expect(acc.isActive()).toBeTrue();
    expect(acc.getText()).toBe('test');
  });
});

describe('ContentAccumulator Thought Accumulation', () => {
  test('Thought content is separate from text', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('Text content');
    acc.appendThought('Thought content');
    expect(acc.getText()).toBe('Text content');
    expect(acc.getThought()).toBe('Thought content');
  });

  test('Multiple appendThought() calls accumulate', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendThought('Step 1');
    acc.appendThought('. ');
    acc.appendThought('Step 2');
    expect(acc.getThought()).toBe('Step 1. Step 2');
  });
});

describe('ContentAccumulator hasSignificantContent()', () => {
  test('Returns false when empty', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    expect(acc.hasSignificantContent()).toBeFalse();
  });

  test('Returns true with text content', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('Hello');
    expect(acc.hasSignificantContent()).toBeTrue();
  });

  test('Returns true with thought content only', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendThought('Thinking...');
    expect(acc.hasSignificantContent()).toBeTrue();
  });

  test('Returns false with whitespace only', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('   ');
    acc.appendThought('\n\n');
    expect(acc.hasSignificantContent()).toBeFalse();
  });
});

describe('ContentAccumulator validate()', () => {
  test('Validates both text and thought', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('Hello');
    acc.appendThought('Thinking');

    const validation = acc.validate();
    expect(validation.text.isValid).toBeTrue();
    expect(validation.thought.isValid).toBeTrue();
    expect(validation.hasAnyValidContent).toBeTrue();
  });

  test('Returns correct lengths', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('  Hello  ');
    acc.appendThought('  Thought  ');

    const validation = acc.validate();
    expect(validation.text.originalLength).toBe(9);
    expect(validation.text.trimmedLength).toBe(5);
    expect(validation.thought.originalLength).toBe(11);
    expect(validation.thought.trimmedLength).toBe(7);
  });
});

describe('Integration Scenarios', () => {
  test('Full turn lifecycle', () => {
    const acc = createContentAccumulator();

    // Start turn
    acc.startTurn('turn-123');

    // Accumulate content
    const chunks = ['Hello', ' ', 'World', '!'];
    chunks.forEach((c) => acc.appendText(c));

    // Verify content
    expect(acc.getText()).toBe('Hello World!');
    expect(acc.hasSignificantContent()).toBeTrue();
    expect(acc.getUuid()).toBe('turn-123');

    // Reset after recording
    acc.reset();

    // Verify reset
    expect(acc.isActive()).toBeFalse();
    expect(acc.getText()).toBe('');
  });

  test('Thought then content transition', () => {
    const acc = createContentAccumulator();
    acc.startTurn();

    // First thought
    acc.appendThought('Let me think about this...');

    // Then content
    acc.appendText('Here is the answer.');

    // Both should be preserved
    expect(acc.getThought()).toBe('Let me think about this...');
    expect(acc.getText()).toBe('Here is the answer.');
    expect(acc.hasSignificantContent()).toBeTrue();
  });

  test('Empty response should not be recorded', () => {
    const acc = createContentAccumulator();
    acc.startTurn();

    // Only whitespace
    acc.appendText('   \n\t   ');

    // Should not be significant
    expect(acc.hasSignificantContent()).toBeFalse();

    const validation = acc.validate();
    expect(validation.hasAnyValidContent).toBeFalse();
  });

  test('Real model response simulation', () => {
    const acc = createContentAccumulator();
    acc.startTurn();

    // Simulate streaming response
    const response = [
      'I',
      ' will',
      ' help',
      ' you',
      ' list',
      ' the',
      ' directory',
      '.',
    ];

    response.forEach((chunk) => acc.appendText(chunk));

    expect(acc.getText()).toBe('I will help you list the directory.');
    expect(acc.hasSignificantContent()).toBeTrue();
  });

  test('Tool call scenario - content then tools', () => {
    const acc = createContentAccumulator();
    acc.startTurn();

    // Model says something then makes tool call
    acc.appendText('I will read the file.');

    // Content is preserved
    expect(acc.getText()).toBe('I will read the file.');

    // After tools, more content might come
    acc.appendText(' Here is what I found:');

    expect(acc.getText()).toBe('I will read the file. Here is what I found:');
  });

  test('Multi-turn conversation simulation', () => {
    // Turn 1
    const acc = createContentAccumulator();
    acc.startTurn('turn-1');
    acc.appendText('First response');
    expect(acc.getText()).toBe('First response');
    acc.reset();

    // Turn 2
    acc.startTurn('turn-2');
    acc.appendText('Second response');
    expect(acc.getText()).toBe('Second response');
    expect(acc.getUuid()).toBe('turn-2');
    acc.reset();

    // Verify clean state after reset
    expect(acc.isActive()).toBeFalse();
    expect(acc.getText()).toBe('');
  });
});

describe('Object and Array Handling', () => {
  test('Object with text property is extracted', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText({ text: 'Hello from object' });
    expect(acc.getText()).toBe('Hello from object');
  });

  test('Object without text property is JSON stringified', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText({ message: 'Hello' });
    expect(acc.getText()).toBe('{"message":"Hello"}');
  });

  test('Array of strings is joined', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText(['Hello', ' ', 'World']);
    expect(acc.getText()).toBe('Hello World');
  });

  test('Array of objects with text property', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText([{ text: 'Hello' }, { text: ' ' }, { text: 'World' }]);
    expect(acc.getText()).toBe('Hello World');
  });

  test('Mixed array is converted correctly', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText(['Hello', { text: ' World' }, 123]);
    expect(acc.getText()).toBe('Hello World 123');
  });

  test('Null is converted to empty string', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText(null);
    expect(acc.getText()).toBe('');
  });

  test('Undefined is converted to empty string', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText(undefined);
    expect(acc.getText()).toBe('');
  });

  test('Number is converted to string', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText(42);
    expect(acc.getText()).toBe('42');
  });

  test('Boolean is converted to string', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText(true);
    expect(acc.getText()).toBe('true');
  });

  test('Nested object is JSON stringified', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText({ nested: { key: 'value' } });
    expect(acc.getText()).toBe('{"nested":{"key":"value"}}');
  });

  test('Mixed content types accumulate correctly', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText('String: ');
    acc.appendText({ text: 'from object' });
    acc.appendText(' and array: ');
    acc.appendText(['a', 'b', 'c']);
    expect(acc.getText()).toBe('String: from object and array: abc');
  });

  test('Empty array produces empty string', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText([]);
    expect(acc.getText()).toBe('');
  });

  test('Empty object is JSON stringified', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendText({});
    expect(acc.getText()).toBe('{}');
  });

  test('appendThought handles objects the same way', () => {
    const acc = createContentAccumulator();
    acc.startTurn();
    acc.appendThought({ text: 'Thinking...' });
    expect(acc.getThought()).toBe('Thinking...');
  });
});

// ============================================================================
// Print Summary
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log('📊 TEST RESULTS');
console.log('═'.repeat(60));

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;
const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

console.log(`\nTotal Tests: ${total}`);
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
console.log(`Total Duration: ${totalDuration}ms`);

if (failed > 0) {
  console.log('\n❌ Failed Tests:');
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  ✗ ${r.name}`);
      console.log(`    ${r.message}`);
    });
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
