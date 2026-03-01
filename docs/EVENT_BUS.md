# Event Bus Architecture

> Typed publish/subscribe system for loose coupling

## Overview

The Event Bus provides a type-safe publish/subscribe system for decoupling components. This allows different parts of the application to communicate without direct dependencies.

## Installation

```typescript
import { eventBus, EventBus } from './stores/eventBus';
```

## Event Types

```typescript
type EventMap = {
  // Streaming events
  'stream:started': { promptId: string; model: string };
  'stream:chunk': { promptId: string; content: string };
  'stream:finished': { promptId: string; tokenCount: number };
  'stream:error': { promptId: string; error: Error };
  'stream:interrupted': { promptId: string; reason: string };
  
  // Tool events
  'tool:execute': { toolName: string; params: unknown };
  'tool:success': { toolName: string; result: unknown };
  'tool:error': { toolName: string; error: Error };
  
  // Session events
  'session:start': { sessionId: string };
  'session:end': { sessionId: string; reason: string };
  'session:reset': { sessionId: string };
  
  // Model events
  'model:switch': { from: string; to: string };
  'model:load': { model: string };
  'model:error': { model: string; error: Error };
  
  // UI events
  'ui:notification': { message: string; type: 'info' | 'warning' | 'error' };
  'ui:theme:change': { theme: string };
  
  // Context events
  'context:cached': { sessionId: string; tokenCount: number };
  'context:invalidated': { sessionId: string };
  'context:overflow': { sessionId: string; percentage: number };
};
```

## Basic Usage

### Subscribe to Events

```typescript
// Subscribe to a single event
const unsubscribe = eventBus.subscribe('stream:finished', (data) => {
  console.log(`Stream finished with ${data.tokenCount} tokens`);
});

// Unsubscribe when done
unsubscribe();
```

### Emit Events

```typescript
// Emit an event
eventBus.emit('stream:finished', {
  promptId: 'prompt-123',
  tokenCount: 1500,
});
```

### One-time Subscription

```typescript
// Subscribe only once
eventBus.once('model:load', (data) => {
  console.log(`Model loaded: ${data.model}`);
});
```

## API Reference

### EventBus Class

```typescript
class EventBus<T extends Record<string, unknown>> {
  /**
   * Subscribe to an event
   * @param event Event name
   * @param handler Callback function
   * @returns Unsubscribe function
   */
  subscribe<K extends keyof T>(
    event: K,
    handler: (data: T[K]) => void
  ): () => void;

  /**
   * Subscribe to an event only once
   * @param event Event name
   * @param handler Callback function
   */
  once<K extends keyof T>(
    event: K,
    handler: (data: T[K]) => void
  ): void;

  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  emit<K extends keyof T>(event: K, data: T[K]): void;

  /**
   * Remove all subscriptions for an event
   * @param event Event name
   */
  clear<K extends keyof T>(event: K): void;

  /**
   * Remove all subscriptions
   */
  clearAll(): void;

  /**
   * Get subscription count for an event
   * @param event Event name
   */
  listenerCount<K extends keyof T>(event: K): number;
}
```

## Integration Examples

### With Streaming

```typescript
// In streaming component
async function* streamChat(message: string) {
  eventBus.emit('stream:started', {
    promptId: generateId(),
    model: currentModel,
  });

  try {
    for await (const chunk of ollamaStream) {
      eventBus.emit('stream:chunk', {
        promptId,
        content: chunk.content,
      });
      yield chunk;
    }

    eventBus.emit('stream:finished', {
      promptId,
      tokenCount: totalTokens,
    });
  } catch (error) {
    eventBus.emit('stream:error', {
      promptId,
      error,
    });
    throw error;
  }
}
```

### With UI Components

```typescript
// In UI component
function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = eventBus.subscribe('ui:notification', (data) => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, ...data }]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="notifications">
      {notifications.map(n => (
        <div key={n.id} className={`notification ${n.type}`}>
          {n.message}
        </div>
      ))}
    </div>
  );
}
```

### With Token Tracking

```typescript
// Token tracker service
class TokenTracker {
  private total = 0;

  constructor() {
    eventBus.subscribe('stream:finished', (data) => {
      this.total += data.tokenCount;
      this.checkOverflow();
    });
  }

  private checkOverflow() {
    const percentage = (this.total / MAX_TOKENS) * 100;
    if (percentage > 80) {
      eventBus.emit('context:overflow', {
        sessionId: currentSession,
        percentage,
      });
    }
  }
}
```

### With Tools

```typescript
// Tool executor
async function executeTool(name: string, params: unknown) {
  eventBus.emit('tool:execute', { toolName: name, params });

  try {
    const result = await tools[name].execute(params);
    eventBus.emit('tool:success', { toolName: name, result });
    return result;
  } catch (error) {
    eventBus.emit('tool:error', { toolName: name, error });
    throw error;
  }
}
```

## React Integration

### useEvent Hook

```typescript
import { useEffect } from 'react';
import { eventBus } from './stores/eventBus';

function useEvent<K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void,
  deps: any[] = []
) {
  useEffect(() => {
    return eventBus.subscribe(event, handler);
  }, [event, ...deps]);
}

// Usage
function StreamIndicator() {
  const [isStreaming, setIsStreaming] = useState(false);

  useEvent('stream:started', () => setIsStreaming(true));
  useEvent('stream:finished', () => setIsStreaming(false));
  useEvent('stream:error', () => setIsStreaming(false));

  return isStreaming ? <Spinner /> : null;
}
```

### useEventSelector Hook

```typescript
import { useState, useEffect } from 'react';

function useEventSelector<K extends keyof EventMap>(
  event: K,
  selector: (data: EventMap[K]) => any
) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    return eventBus.subscribe(event, (data) => {
      setSelected(selector(data));
    });
  }, [event, selector]);

  return selected;
}

// Usage
function TokenCount() {
  const count = useEventSelector('stream:finished', data => data.tokenCount);
  return count !== null ? <span>Tokens: {count}</span> : null;
}
```

## Testing

### Creating a Test Bus

```typescript
import { EventBus } from './stores/eventBus';

describe('MyComponent', () => {
  let testBus: EventBus<EventMap>;

  beforeEach(() => {
    testBus = new EventBus<EventMap>();
  });

  it('should emit stream:finished on completion', async () => {
    const handler = vi.fn();
    testBus.subscribe('stream:finished', handler);

    await streamMessage('Hello');

    expect(handler).toHaveBeenCalledWith({
      promptId: expect.any(String),
      tokenCount: expect.any(Number),
    });
  });
});
```

### Emitting Test Events

```typescript
it('should show notification on event', () => {
  render(<NotificationManager />);

  testBus.emit('ui:notification', {
    message: 'Test notification',
    type: 'info',
  });

  expect(screen.getByText('Test notification')).toBeInTheDocument();
});
```

## Best Practices

### 1. Use Typed Events

```typescript
// ❌ Bad: Untyped event
eventBus.emit('custom-event', { data: 'anything' });

// ✅ Good: Typed event
eventBus.emit('stream:finished', { promptId: '123', tokenCount: 100 });
```

### 2. Unsubscribe on Cleanup

```typescript
// Component with cleanup
useEffect(() => {
  const unsubscribe = eventBus.subscribe('stream:chunk', handler);
  return unsubscribe;
}, []);
```

### 3. Avoid Circular Dependencies

```typescript
// ❌ Bad: Circular event chain
eventBus.subscribe('stream:finished', () => {
  eventBus.emit('session:end', { ... }); // May trigger 'stream:finished' again
});

// ✅ Good: One-way event flow
eventBus.subscribe('stream:finished', handleStreamEnd);
```

### 4. Use Namespaced Events

```typescript
// ✅ Good: Clear namespacing
'stream:started'
'stream:chunk'
'stream:finished'
'tool:execute'
'tool:success'
'session:start'
```

## Related Documentation

- [State Management](./STATE_MANAGEMENT.md)
- [Context Caching](./CONTEXT_CACHING.md)
