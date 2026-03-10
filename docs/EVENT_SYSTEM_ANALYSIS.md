# Event System Analysis

## Problem Statement
`handleFinishedEvent` is never called, indicating that the `Finished` event is not being emitted or received.

## Root Cause Analysis

### Problem Found in `turn.ts`
The `Finished` event was only yielded in the success path of `Turn.run()`. When errors occurred or the user cancelled, the event was never sent.

### Problem Found in `ollamaClient.ts`
Several early return paths did not yield the `Finished` event:
1. `MaxSessionTurns` - returned without Finished
2. `LoopDetected` - returned without Finished
3. `Error` event - returned without Finished

## Fixes Applied

### 1. turn.ts - Error and Abort Cases
**Before:**
```typescript
} catch (e) {
  if (signal.aborted) {
    yield { type: OllamaEventType.UserCancelled };
    return;  // ❌ No Finished event
  }
  // ...
  yield { type: OllamaEventType.Error, value: { error: structuredError } };
  return;  // ❌ No Finished event
}
```

**After:**
```typescript
} catch (e) {
  if (signal.aborted) {
    debugLogger.info('Signal aborted, yielding UserCancelled + Finished events');
    yield { type: OllamaEventType.UserCancelled };
    // ✅ Yield Finished event even on user cancel for proper cleanup
    yield {
      type: OllamaEventType.Finished,
      value: { reason: undefined, usageMetadata: undefined },
    };
    return;
  }
  // ...
  yield { type: OllamaEventType.Error, value: { error: structuredError } };
  // ✅ Yield Finished event even on error for proper cleanup and session recording
  debugLogger.info('Yielding Finished event after error');
  yield {
    type: OllamaEventType.Finished,
    value: { reason: undefined, usageMetadata: undefined },
  };
  return;
}
```

### 2. ollamaClient.ts - All Early Return Paths
Added `Finished` event before all early returns:

```typescript
// MaxSessionTurns case
yield { type: OllamaEventType.MaxSessionTurns };
yield { type: OllamaEventType.Finished, value: { reason: undefined, usageMetadata: undefined } };
return new Turn(...);

// LoopDetected cases
yield { type: OllamaEventType.LoopDetected };
yield { type: OllamaEventType.Finished, value: { reason: undefined, usageMetadata: undefined } };
return turn;
```

## Event Flow Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EVENT FLOW CHAIN                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. OllamaNativeClient.chat() [ollamaNativeClient.ts:1529-1565]
   │
   ├── streamingRequest() [ollamaNativeClient.ts:810-1182]
   │   │
   │   ├── HTTP POST to /api/chat with stream: true
   │   │
   │   ├── stream.on('data') → callback(chunk) for each chunk
   │   │
   │   └── stream.on('end') → resolves promise
   │
   └── Returns finalResponse when chunk.done === true

2. OllamaNativeContentGenerator.generateContentStream() [ollamaNativeContentGenerator.ts:142-294]
   │
   ├── Creates AsyncGenerator with queue
   │
   ├── client.chat(request, callback, options)
   │   │
   │   └── callback pushes chunks to queue
   │
   ├── Yields chunks from queue
   │
   └── When done=true, sets done flag and ends generator

3. OllamaChat.sendMessageStream() [ollamaChat.ts:209-246]
   │
   ├── contentGenerator.generateContentStream()
   │
   └── Yields { type: 'chunk', value: response }

4. Turn.run() [turn.ts:237-372]
   │
   ├── for await (const streamEvent of responseStream)
   │   │
   │   ├── Yields OllamaEventType.Content
   │   ├── Yields OllamaEventType.Thought
   │   └── Yields OllamaEventType.ToolCallRequest
   │
   └── AFTER loop ends (or on error/cancel):
       ✅ ALWAYS yields { type: OllamaEventType.Finished, value: {...} }

5. OllamaClient.sendMessageStream() [ollamaClient.ts:413-556]
   │
   ├── Creates Turn
   │
   ├── for await (const event of resultStream)
   │   │
   │   ├── LoopDetector check
   │   │
   │   └── yield event  ← Passes through all events including Finished
   │
   └── return turn

6. useOllamaStream.processOllamaStreamEvents() [useOllamaStream.ts:1220-1337]
   │
   └── for await (const event of stream)
       │
       └── switch (event.type)
           │
           └── case ServerOllamaEventType.Finished:
               handleFinishedEvent(...)  ← Should now always be called

## Debug Logging Added

Key logging points for tracking event flow:

### turn.ts
- `'Turn.run started'` - When the turn begins
- `'Stream loop ended normally, yielding Finished event'` - After successful stream
- `'Finished event yielded successfully'` - After yielding Finished
- `'Error in Turn.run'` - On any error
- `'Signal aborted, yielding UserCancelled + Finished events'` - On user cancel
- `'Yielding Finished event after error'` - After error, before Finished

## Event Types Summary

| Event Type | Source | Handler | Always Gets Finished? |
|------------|--------|---------|----------------------|
| Content | turn.ts:298 | handleContentEvent | ✅ |
| Thought | turn.ts:288-294 | handleThoughtEvent | ✅ |
| ToolCallRequest | turn.ts:302-307 | scheduleToolCalls | ✅ |
| UserCancelled | turn.ts:351 | handleUserCancelledEvent | ✅ (now fixed) |
| Error | turn.ts:384 | handleErrorEvent | ✅ (now fixed) |
| ChatCompressed | ollamaClient.ts:449 | handleChatCompressionEvent | ✅ |
| MaxSessionTurns | ollamaClient.ts:437 | handleMaxSessionTurnsEvent | ✅ (now fixed) |
| LoopDetected | ollamaClient.ts:486, 526 | handleLoopDetectedEvent | ✅ (now fixed) |
| Finished | turn.ts:337-345, 353-356, 387-390 | handleFinishedEvent | N/A |
| Citation | turn.ts:319-324 | handleCitationEvent | ✅ |
| Retry | turn.ts:267-272 | startRetryCountdown | ✅ |

## Key Principle

**The `Finished` event must ALWAYS be the last event in any stream**, regardless of:
- Normal completion
- User cancellation (Ctrl+C)
- API errors
- Loop detection
- Max turns exceeded
- Any other exceptional condition

This ensures that:
1. Session recording is properly finalized
2. Telemetry state is saved
3. UI state is cleaned up
4. Token counts are recorded
