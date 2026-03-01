# State Management with Zustand

> Atomic state updates for optimal React performance

## Overview

Ollama Code uses Zustand for state management, replacing the Context API to eliminate unnecessary re-renders. This document covers the three main stores and how to use them.

## Installation

```bash
npm install zustand
```

## Stores Overview

| Store | Purpose | Location |
|-------|---------|----------|
| `sessionStore` | Session state and metrics | `packages/cli/src/ui/stores/sessionStore.ts` |
| `streamingStore` | Streaming state and AbortController | `packages/cli/src/ui/stores/streamingStore.ts` |
| `uiStore` | UI preferences with persistence | `packages/cli/src/ui/stores/uiStore.ts` |

## sessionStore

Manages session-related state including model information and token metrics.

### State

```typescript
interface SessionState {
  // Model information
  model: string;
  modelInfo: ModelInfo | null;
  
  // Token metrics
  lastPromptTokenCount: number;
  lastCandidatesTokenCount: number;
  totalTokenCount: number;
  
  // Session metadata
  sessionId: string;
  sessionStart: Date;
  
  // Message tracking
  messageCount: number;
  
  // Context caching
  hasCachedContext: boolean;
  cachedContextSize: number;
}
```

### Actions

```typescript
interface SessionActions {
  // Model management
  setModel: (model: string) => void;
  setModelInfo: (info: ModelInfo) => void;
  
  // Token tracking
  setLastPromptTokenCount: (count: number) => void;
  setLastCandidatesTokenCount: (count: number) => void;
  incrementTotalTokenCount: (count: number) => void;
  
  // Session management
  setSessionId: (id: string) => void;
  resetSession: () => void;
  
  // Context caching
  setCachedContext: (hasContext: boolean, size: number) => void;
}
```

### Usage Examples

```typescript
import { useSessionStore } from './stores/sessionStore';

// Component with atomic subscription
function TokenDisplay() {
  // Only re-renders when totalTokenCount changes
  const totalTokens = useSessionStore(state => state.totalTokenCount);
  
  return <span>Tokens: {totalTokens}</span>;
}

// Component with multiple subscriptions
function ModelInfo() {
  const model = useSessionStore(state => state.model);
  const modelInfo = useSessionStore(state => state.modelInfo);
  
  return (
    <div>
      <span>Model: {model}</span>
      <span>Context: {modelInfo?.contextLength || 'Unknown'}</span>
    </div>
  );
}

// Updating state
function ModelSelector() {
  const setModel = useSessionStore(state => state.setModel);
  
  return (
    <select onChange={(e) => setModel(e.target.value)}>
      <option value="llama3.2">Llama 3.2</option>
      <option value="deepseek-r1">DeepSeek R1</option>
    </select>
  );
}

// Reset session
function NewChatButton() {
  const resetSession = useSessionStore(state => state.resetSession);
  
  return <button onClick={resetSession}>New Chat</button>;
}
```

## streamingStore

Manages streaming state and provides AbortController for canceling requests.

### State

```typescript
interface StreamingState {
  // Streaming status
  isStreaming: boolean;
  streamingPhase: 'idle' | 'connecting' | 'streaming' | 'interrupted' | 'complete';
  
  // AbortController
  abortController: AbortController | null;
  
  // Timing
  streamStartTime: number | null;
  streamEndTime: number | null;
  
  // Content
  currentContent: string;
  accumulatedContent: string;
  
  // Progress
  tokensReceived: number;
  chunksReceived: number;
}
```

### Actions

```typescript
interface StreamingActions {
  // Streaming control
  startStreaming: () => AbortController;
  stopStreaming: () => void;
  interruptStreaming: () => void;
  
  // Content management
  appendContent: (content: string) => void;
  setCurrentContent: (content: string) => void;
  resetContent: () => void;
  
  // Progress tracking
  incrementTokens: (count: number) => void;
  incrementChunks: () => void;
  
  // Cleanup
  cleanup: () => void;
}
```

### Usage Examples

```typescript
import { useStreamingStore } from './stores/streamingStore';

// Streaming indicator
function StreamingIndicator() {
  const isStreaming = useStreamingStore(state => state.isStreaming);
  const phase = useStreamingStore(state => state.streamingPhase);
  
  if (!isStreaming) return null;
  
  return <span className="streaming">{phase}...</span>;
}

// Cancel button
function CancelButton() {
  const isStreaming = useStreamingStore(state => state.isStreaming);
  const interruptStreaming = useStreamingStore(state => state.interruptStreaming);
  
  if (!isStreaming) return null;
  
  return (
    <button onClick={interruptStreaming}>
      Cancel
    </button>
  );
}

// Streaming with cleanup
function ChatComponent() {
  const startStreaming = useStreamingStore(state => state.startStreaming);
  const appendContent = useStreamingStore(state => state.appendContent);
  const cleanup = useStreamingStore(state => state.cleanup);
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cleanup();
    };
  }, []);
  
  const sendMessage = async (message: string) => {
    const controller = startStreaming();
    
    try {
      for await (const chunk of stream) {
        appendContent(chunk.text);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream was cancelled');
      }
    }
  };
}
```

## uiStore

Manages UI preferences with localStorage persistence.

### State

```typescript
interface UIState {
  // Theme
  theme: 'dark' | 'light' | 'system';
  customTheme: ThemeConfig | null;
  
  // Display preferences
  fontSize: number;
  showLineNumbers: boolean;
  showTokenCount: boolean;
  
  // Editor settings
  editorMode: 'vim' | 'emacs' | 'default';
  tabSize: number;
  
  // Notifications
  showNotifications: boolean;
  notificationSound: boolean;
  
  // Layout
  compactMode: boolean;
  sidebarCollapsed: boolean;
}
```

### Actions

```typescript
interface UIActions {
  // Theme management
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setCustomTheme: (config: ThemeConfig) => void;
  
  // Display preferences
  setFontSize: (size: number) => void;
  toggleLineNumbers: () => void;
  toggleTokenCount: () => void;
  
  // Editor settings
  setEditorMode: (mode: 'vim' | 'emacs' | 'default') => void;
  setTabSize: (size: number) => void;
  
  // Notifications
  toggleNotifications: () => void;
  toggleNotificationSound: () => void;
  
  // Layout
  toggleCompactMode: () => void;
  toggleSidebar: () => void;
  
  // Reset
  resetToDefaults: () => void;
}
```

### Usage Examples

```typescript
import { useUIStore } from './stores/uiStore';

// Theme selector
function ThemeSelector() {
  const theme = useUIStore(state => state.theme);
  const setTheme = useUIStore(state => state.setTheme);
  
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
      <option value="system">System</option>
    </select>
  );
}

// Settings panel
function SettingsPanel() {
  const fontSize = useUIStore(state => state.fontSize);
  const setFontSize = useUIStore(state => state.setFontSize);
  const showLineNumbers = useUIStore(state => state.showLineNumbers);
  const toggleLineNumbers = useUIStore(state => state.toggleLineNumbers);
  
  return (
    <div>
      <label>
        Font Size: {fontSize}
        <input
          type="range"
          min={10}
          max={20}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
        />
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={showLineNumbers}
          onChange={toggleLineNumbers}
        />
        Show Line Numbers
      </label>
    </div>
  );
}
```

## Persistence

UI state is automatically persisted to localStorage:

```typescript
// Automatically persisted
const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      // ... state and actions
    }),
    {
      name: 'ollama-code-ui',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        editorMode: state.editorMode,
        // ... other persisted fields
      }),
    }
  )
);
```

## Event Bus Integration

Stores can subscribe to events from the event bus:

```typescript
import { eventBus } from './stores/eventBus';
import { useStreamingStore } from './stores/streamingStore';

// Subscribe to events
eventBus.subscribe('stream:started', () => {
  useStreamingStore.getState().startStreaming();
});

eventBus.subscribe('stream:chunk', (data) => {
  useStreamingStore.getState().appendContent(data.content);
});

eventBus.subscribe('stream:finished', (data) => {
  const store = useStreamingStore.getState();
  store.stopStreaming();
  useSessionStore.getState().incrementTotalTokenCount(data.tokenCount);
});
```

## Migration from Context API

### Before (Context API)

```typescript
// ❌ Re-renders all consumers on any state change
const UIStateContext = createContext<UIState>({} as UIState);

function Parent() {
  const [state, setState] = useState(initialState);
  
  return (
    <UIStateContext.Provider value={state}>
      <Child1 />
      <Child2 />
      <Child3 />
    </UIStateContext.Provider>
  );
}

function Child1() {
  const { theme } = useContext(UIStateContext); // Re-renders on fontSize change
  return <div>{theme}</div>;
}
```

### After (Zustand)

```typescript
// ✅ Only re-renders when subscribed state changes
function Child1() {
  const theme = useUIStore(state => state.theme); // Only re-renders on theme change
  return <div>{theme}</div>;
}
```

## Best Practices

### 1. Use Atomic Subscriptions

```typescript
// ❌ Bad: Subscribes to entire state
const state = useSessionStore();

// ✅ Good: Subscribes to specific field
const model = useSessionStore(state => state.model);
```

### 2. Use Selectors for Derived State

```typescript
// Create a selector
const selectTokenPercentage = (state: SessionState) => {
  const max = state.modelInfo?.contextLength || 128000;
  return (state.totalTokenCount / max) * 100;
};

// Use in component
function ProgressBar() {
  const percentage = useSessionStore(selectTokenPercentage);
  return <progress value={percentage} max={100} />;
}
```

### 3. Batch Updates

```typescript
// ❌ Bad: Multiple re-renders
useSessionStore.getState().setModel(model);
useSessionStore.getState().setModelInfo(info);
useSessionStore.getState().setSessionId(id);

// ✅ Good: Single update
useSessionStore.setState({
  model,
  modelInfo: info,
  sessionId: id,
});
```

### 4. Use Actions for Complex Logic

```typescript
// Store definition
const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  // State
  model: 'llama3.2',
  sessionId: '',
  
  // Action with logic
  switchModel: (newModel: string) => {
    const currentModel = get().model;
    if (currentModel !== newModel) {
      // Clear context cache when switching models
      contextCacheManager.clear();
      set({ model: newModel, hasCachedContext: false });
    }
  },
}));
```

## Related Documentation

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Event Bus](./EVENT_BUS.md)
- [Context Caching](./CONTEXT_CACHING.md)

## Test Coverage

Each store has comprehensive test coverage:

### sessionStore Tests

```typescript
// Tests cover:
// - Initial state verification
// - setModel / setModelInfo
// - Token counting operations
// - Session reset functionality
// - Context caching state
```

### streamingStore Tests

```typescript
// Tests cover:
// - startStreaming / stopStreaming lifecycle
// - AbortController creation and cleanup
// - Content accumulation
// - Progress tracking
// - Interrupt handling
// - Memory leak prevention (cleanup on unmount)
```

### uiStore Tests

```typescript
// Tests cover:
// - Theme persistence
// - Preference toggles
// - localStorage integration
// - Reset to defaults
// - Partial state persistence
```

### Running Store Tests

```bash
# Run store tests
cd packages/cli
bun run test --run src/ui/stores/sessionStore.test.ts
bun run test --run src/ui/stores/streamingStore.test.ts
bun run test --run src/ui/stores/uiStore.test.ts
```

## Specialized React Contexts

In addition to Zustand stores, we've created specialized React contexts to further optimize re-renders. These contexts split the monolithic `UIStateContext` (70+ fields) into smaller, focused contexts:

### Available Contexts

| Context | Purpose | Location |
|---------|---------|----------|
| `DialogStateContext` | Dialog visibility states | `contexts/DialogStateContext.tsx` |
| `TerminalContext` | Terminal dimensions and layout | `contexts/TerminalContext.tsx` |
| `InputStateContext` | Input buffer and key press states | `contexts/InputStateContext.tsx` |
| `HistoryContext` | History items and pending messages | `contexts/HistoryContext.tsx` |
| `LoadingContext` | Streaming and loading states | `contexts/LoadingContext.tsx` |
| `ConfirmationContext` | Confirmation requests | `contexts/ConfirmationContext.tsx` |

### Usage Examples

```typescript
// Subscribe to dialog state
const isThemeDialogOpen = useDialogState(state => state.isThemeDialogOpen);

// Subscribe to terminal dimensions
const terminalWidth = useTerminalState(state => state.terminalWidth);

// Subscribe to loading state
const isStreaming = useLoadingState(state => state.streamingState !== StreamingState.Idle);

// Subscribe to pending confirmations
const hasPendingConfirmations = useConfirmationState(state => 
  state.confirmationRequest !== null || 
  state.confirmUpdateExtensionRequests.length > 0
);
```

### Memoized Components

The following components are memoized to prevent unnecessary re-renders:

| Component | Optimization | Location |
|-----------|-------------|----------|
| `Footer` | `React.memo` + `useMemo` | `components/Footer.tsx` |
| `AppHeader` | `React.memo` + memoized selectors | `components/AppHeader.tsx` |
| `MainContent` | `React.memo` | `components/MainContent.tsx` |
| `HistoryItemDisplay` | `React.memo` + memoized dimensions | `components/HistoryItemDisplay.tsx` |

### When to Use Contexts vs Stores

- **Use Zustand Stores** for global application state that multiple components need to access
- **Use Specialized Contexts** for UI state that only specific components need
- **Use React.memo** for components that receive many props but rarely change
