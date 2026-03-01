# Changelog

## 0.11.2

### React Performance Optimization

Major React performance improvements through context splitting and memoization:

#### New Specialized Contexts

Split the monolithic `UIStateContext` (70+ fields) into smaller, focused contexts:

| Context | Purpose |
|---------|---------|
| `DialogStateContext` | Dialog visibility states |
| `TerminalContext` | Terminal dimensions and layout |
| `InputStateContext` | Input buffer and key press states |
| `HistoryContext` | History items and pending messages |
| `LoadingContext` | Streaming and loading states |
| `ConfirmationContext` | Confirmation requests |

#### Memoized Components

Added `React.memo` and `useMemo` to frequently re-rendering components:

- `Footer` — Status bar (already memoized, enhanced)
- `AppHeader` — Application header with memoized selectors
- `MainContent` — Main content area with optimized history rendering

#### Performance Benefits

- **Reduced re-renders**: Components only re-render when their specific context changes
- **Memoized history items**: History rendering is cached and only updates when history changes
- **Selective subscriptions**: Components can subscribe to specific state slices

### Documentation Updates

- Updated `ROADMAP.md` with React optimization progress
- Added details about context splitting strategy

### Files Added

| File | Description |
|------|-------------|
| `packages/cli/src/ui/contexts/DialogStateContext.tsx` | Dialog state management |
| `packages/cli/src/ui/contexts/TerminalContext.tsx` | Terminal dimensions |
| `packages/cli/src/ui/contexts/InputStateContext.tsx` | Input state management |
| `packages/cli/src/ui/contexts/HistoryContext.tsx` | History state management |
| `packages/cli/src/ui/contexts/LoadingContext.tsx` | Loading state management |
| `packages/cli/src/ui/contexts/ConfirmationContext.tsx` | Confirmation requests |

---

## 0.11.1

### Documentation Updates

- Added Qwen2.5-Coder and Qwen3-Coder to recommended models
  - `qwen2.5-coder:7b` — excellent for programming tasks (7B parameters)
  - `qwen2.5-coder:14b` — balanced performance and quality (14B parameters)
  - `qwen3-coder:30b` — top-tier coding model (30B parameters)

### Roadmap Updates

- Added detailed migration plan for fetch → axios transition
- Documented files, stages, and testing requirements

---

## 0.11.0

### New Features

#### Architecture Improvements

Major architectural enhancements for better performance and extensibility:

| Feature | Description |
|---------|-------------|
| **Zustand Migration** | Replaced Context API with Zustand for atomic state updates |
| **Event Bus** | Typed pub/sub system for loose component coupling |
| **Command Pattern** | Full Undo/Redo support for reversible operations |
| **Plugin System v1** | Dynamic tool loading with lifecycle hooks |
| **Context Caching** | KV-cache reuse for 80-90% faster conversations |
| **Prompt Documentation** | Comprehensive prompt system documentation |

#### Zustand Stores

Five new stores replacing Context API:

| Store | Purpose |
|-------|---------|
| `sessionStore` | Session state and metrics |
| `streamingStore` | Streaming state + AbortController |
| `uiStore` | UI settings with persistence |
| `commandStore` | Command pattern for undo/redo |
| `eventBus` | Event pub/sub system |

#### Event Bus

Typed events for cross-component communication:

```typescript
// Subscribe to events
eventBus.subscribe('stream:finished', (data) => {
  console.log('Tokens used:', data.tokenCount);
});

// Emit events
eventBus.emit('command:executed', { commandId: '123', commandType: 'edit' });
```

**Supported Events:**
- `stream:started/chunk/finished/error/cancelled`
- `tool:started/progress/completed/error`
- `session:started/ended/cleared`
- `command:executed/undone/redone`
- `plugin:loaded/unloaded/error`

#### Command Pattern (Undo/Redo)

Full implementation of the Command pattern:

```typescript
// Execute with undo support
await commandStore.execute({
  description: 'Change theme',
  type: 'theme',
  execute: async () => { /* action */ },
  undo: async () => { /* reverse action */ },
  canUndo: true,
});

// Undo last command
await commandStore.undo();

// Redo undone command
await commandStore.redo();
```

#### Plugin System v1

Dynamic plugin architecture with lifecycle hooks:

```typescript
const plugin: PluginDefinition = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'My custom tools',
  },
  tools: [{
    id: 'hello',
    name: 'hello',
    description: 'Say hello',
    parameters: { type: 'object', properties: { message: { type: 'string' } } },
    execute: async (params, context) => ({
      success: true,
      data: `Hello, ${params['message']}!`,
    }),
  }],
  hooks: {
    onLoad: async (context) => context.logger.info('Plugin loaded'),
    onEnable: async (context) => context.logger.info('Plugin enabled'),
    onBeforeToolExecute: async (toolId, params) => true,
    onAfterToolExecute: async (toolId, params, result) => {},
  },
};
```

**Builtin Plugins:**

| Plugin | Tools |
|--------|-------|
| `core-tools` | echo, timestamp, get_env |
| `dev-tools` | python_dev, nodejs_dev, golang_dev, rust_dev, typescript_dev, java_dev, cpp_dev, swift_dev, php_dev |
| `file-tools` | read_file, write_file, edit_file |
| `search-tools` | grep, glob, web_fetch |
| `shell-tools` | run_shell_command |

#### Prompt System Documentation

New comprehensive documentation in `docs/PROMPT_SYSTEM.md`:

| Function | Purpose |
|----------|---------|
| `getCoreSystemPrompt()` | Main system prompt construction |
| `getCompressionPrompt()` | History compression to XML format |
| `getProjectSummaryPrompt()` | Markdown project summaries |
| `getToolCallFormatInstructions()` | For models without native tools |
| `getToolLearningContext()` | Learning from past mistakes |
| `getEnvironmentInfo()` | Runtime environment context |
| `getCustomSystemPrompt()` | Custom instruction processing |

### Technical Improvements

#### TypeScript Strict Mode

- Fixed all TypeScript strict mode errors
- Proper bracket notation for index signatures
- Correct type casting for context clients
- Removed unused variables and parameters

### Files Added/Modified

| File | Description |
|------|-------------|
| `packages/cli/src/ui/stores/commandStore.ts` | Command pattern implementation |
| `packages/cli/src/ui/stores/eventBus.ts` | Event bus implementation |
| `packages/core/src/plugins/types.ts` | Plugin system types |
| `packages/core/src/plugins/pluginManager.ts` | Plugin lifecycle management |
| `packages/core/src/plugins/pluginLoader.ts` | Plugin discovery |
| `packages/core/src/plugins/pluginRegistry.ts` | Plugin registration |
| `packages/core/src/plugins/builtin/*/index.ts` | Builtin plugins |
| `docs/PROMPT_SYSTEM.md` | Prompt system documentation |

### Documentation Updates

| Document | Changes |
|----------|---------|
| `README.md` | Updated for v0.11.0 |
| `README.ru.md` | Russian version updated |
| `ROADMAP.md` | Updated with completed tasks |
| `CHANGELOG.md` | This changelog |

### Breaking Changes

- Context API replaced with Zustand (internal API change)
- Event system now uses `eventBus.subscribe()` instead of direct callbacks

### Migration Guide

If you were using Context API directly (internal):

```typescript
// Before (Context API)
const state = useContext(UIStateContext);

// After (Zustand)
const value = useUIStore(state => state.value);
```

---

## 0.10.9

### New Features

#### Context Caching with KV-cache Reuse

- **Ollama Context Token Caching**: Significant performance improvement for multi-turn conversations
  - Automatic caching of context tokens between messages
  - Reuses Ollama's KV-cache for faster subsequent responses
  - ~80-90% token reduction on follow-up messages
  - Automatic endpoint selection: `/api/generate` for simple chat, `/api/chat` for tools

```typescript
// Enable context caching in config
const config: ContentGeneratorConfig = {
  model: 'llama3.2',
  enableContextCaching: true,  // Enables KV-cache reuse
};

// First message: full processing
// Second message: only new tokens processed (cached context reused)
```

#### Hybrid Content Generator

- **Intelligent Endpoint Selection**: Automatically chooses optimal Ollama API endpoint
  - `/api/generate` with context caching for simple conversations
  - `/api/chat` for requests with tools and function calls
  - Seamless switching based on request requirements

#### Zustand State Management

- **Migrated from Context API to Zustand**: Improved React performance
  - Atomic state updates prevent unnecessary re-renders
  - Three new stores: `sessionStore`, `streamingStore`, `uiStore`
  - Built-in persistence support

#### Event Bus Architecture

- **Loose Coupling Between Components**: Typed publish/subscribe system
  - `eventBus.subscribe('stream:finished', callback)`
  - `eventBus.emit('stream:finished', data)`
  - Type-safe event handling

#### Command Pattern (Undo/Redo)

- **Reversible Operations**: Command pattern implementation
  - `commandStore.execute(command)` with undo support
  - `commandStore.undo()` / `commandStore.redo()`
  - History tracking for reversible operations

#### Plugin System

- **Dynamic Tool Loading**: Extensible plugin architecture
  - `pluginManager.registerPlugin(plugin)`
  - Runtime tool registration
  - Plugin lifecycle management (enable/disable)

### Architecture Improvements

#### Memory Leak Fixes

- **AbortController Cleanup**: Proper cleanup in streaming operations
  - Clear readers and timeouts on abort
  - Prevent memory accumulation in long sessions

#### Token Counting Fallback

- **Robust Token Metrics**: Fallback when Ollama doesn't return `prompt_eval_count`
  - `recordTokenUsageWithFallback()` method
  - Accurate progress bar updates

### Files Added

| File | Description |
|------|-------------|
| `packages/core/src/cache/contextCacheManager.ts` | Context token caching |
| `packages/core/src/core/ollamaContextClient.ts` | /api/generate client |
| `packages/core/src/core/hybridContentGenerator.ts` | Endpoint selection |
| `packages/cli/src/ui/stores/sessionStore.ts` | Session state (Zustand) |
| `packages/cli/src/ui/stores/streamingStore.ts` | Streaming state |
| `packages/cli/src/ui/stores/uiStore.ts` | UI preferences |
| `packages/cli/src/ui/stores/eventBus.ts` | Event bus |
| `packages/cli/src/ui/stores/commandStore.ts` | Undo/Redo |
| `packages/core/src/plugins/index.ts` | Plugin system |

### Configuration Options

New options in `ContentGeneratorConfig`:

```typescript
interface ContentGeneratorConfig {
  // ... existing options
  
  /** Enable context caching for faster multi-turn conversations */
  enableContextCaching?: boolean;
  
  /** Session ID for context tracking */
  sessionId?: string;
}
```

### Test Coverage

- **ContextCacheManager**: 50 tests (TTL, eviction, concurrent access, edge cases)
- **OllamaContextClient**: 32 tests (streaming, error handling, session management)
- **HybridContentGenerator**: 36 tests (endpoint selection, token counting, embeddings)
- **Total Context Caching Tests**: 118 tests ✅

### Documentation

| Document | Description |
|----------|-------------|
| `docs/CONTEXT_CACHING.md` | Context caching API reference |
| `docs/STATE_MANAGEMENT.md` | Zustand stores documentation |
| `docs/EVENT_BUS.md` | Event bus architecture |
| `docs/PLUGIN_SYSTEM.md` | Plugin system reference |

### Performance Metrics

| Metric | Without Caching | With Caching |
|--------|-----------------|--------------|
| 1st message | 100% | 100% |
| 2nd message | 100% | ~15% |
| 10th message | 100% | ~7% |

---

## 0.10.8

### New Features

#### Context Progress Bar in Header

- **Visual Token Usage Display**: The header now shows a progress bar indicating context token usage relative to the model's context window
- **Model Size Indicator**: Displays the model's context window size (e.g., "128K", "32K") extracted from model metadata
- **Full-Width Progress Bar**: Progress bar now spans the full width of the info panel for better visibility
- **Cumulative Token Tracking**: Progress bar accurately shows cumulative context tokens throughout the session

#### Model Capabilities Display

- **Capability Icons**: Visual indicators for model capabilities (vision, tools, streaming support)
- **Context Information**: Shows model context window and current usage percentage
- **Enhanced Model Metadata**: Better extraction of model context sizes for various formats (128K, 32K, 8K, etc.)

#### System Prompt & Tool Optimization

- **Streamlined System Prompts**: Optimized system prompts for better model performance
- **Tool Call Format Instructions**: Added automatic tool call format instructions for models without native tool support
- **Priority 3 Features**: Implemented streaming, caching, and observability improvements

### Improvements

#### Command Cleanup

Removed unused commands to streamline the CLI:

| Removed Command | Alternative |
| --------------- | ----------- |
| `/bug` | Use direct message |
| `/docs` | See `docs/` folder |
| `/help` | See documentation |
| `/setup-github` | Configure manually |

Merged commands for better organization:

| Merged Commands | New Command |
| --------------- | ----------- |
| `/stats` + `/about` | `/info` |

#### Technical Improvements

- Fixed progress bar not updating: token usage now properly recorded in telemetry service
- Fixed AppHeader component placement for dynamic updates
- Replaced `require()` with ES module imports in development tools
- Removed debug logging for cleaner output

### Bug Fixes

- Progress bar now correctly shows cumulative context tokens
- Model size extraction works with more model name formats
- Header component updates dynamically during streaming

## 0.10.7

### New Features

#### Self-Learning System for Tool Calling

- **Automatic Tool Name Learning**: The system now learns from tool call errors and automatically creates dynamic aliases for frequently mistaken tool names
- **Fuzzy Matching**: Uses Levenshtein distance algorithm to suggest similar tool names when a model makes an error
- **Learning Data Persistence**: Learning data is saved to `~/.ollama-code/learning/` directory for persistence across sessions
- **Dynamic Aliases**: Runtime alias creation without code modifications - when a model repeatedly uses an incorrect tool name, an alias is automatically created
- **Error Tracking**: Tracks tool call errors and patterns to improve suggestions over time

#### How It Works

1. When a model calls a non-existent tool, the system records the error
2. The system uses fuzzy matching to find the most similar valid tool name
3. After reaching the threshold (default: 1 error), a dynamic alias is automatically created
4. Future calls with the incorrect name are resolved to the correct tool
5. Learning data persists across sessions for continuous improvement

#### Technical Details

- `ToolLearningManager` class manages the learning process
- `DynamicAliases` export in `tool-names.ts` for runtime alias storage
- Integrated with `CoreToolScheduler` for error detection
- Learning context added to system prompts for model guidance

### Improvements

- Enhanced error messages with learning-enhanced suggestions
- Better model compatibility through dynamic alias resolution
- Improved user experience with automatic error correction

## 0.10.6

### New Features

#### Development Tools

- **Python Development Tool** (`python_dev`): Comprehensive Python development support including:
  - Run Python scripts with arguments
  - Execute pytest with test patterns
  - Run pylint, mypy, and black for code quality
  - Manage virtual environments (create, activate)
  - pip operations (install, list, freeze)
  - Support for custom Python interpreter paths

- **Node.js Development Tool** (`nodejs_dev`): Full Node.js/JavaScript development support including:
  - Auto-detection of package manager (npm, yarn, pnpm, bun)
  - Run Node.js scripts
  - Package management (install, add, remove, update)
  - Run package.json scripts (test, build, dev, lint)
  - Execute npx/yarn dlx/bunx commands
  - Background execution for dev servers
  - Clean operation for node_modules and lock files

- **Golang Development Tool** (`golang_dev`): Complete Go development support including:
  - Run and build Go programs
  - Run tests with coverage and benchmarks
  - Code quality tools (fmt, vet, golangci-lint)
  - Module management (init, tidy, download, verify, graph)
  - Package management (get, install)
  - Race detector support

#### Documentation

- **Tools Reference Documentation**: Complete bilingual documentation for all tools
  - English version: `docs/TOOLS.md`
  - Russian version: `docs/TOOLS.ru.md`
  - Covers all 20+ tools with parameters, examples, and best practices

### Tool Aliases Updates

Added development tool aliases:

| Alias                                | Canonical Tool |
| ------------------------------------ | -------------- |
| `py`, `python`, `pip`, `pytest`      | `python_dev`   |
| `node`, `npm`, `yarn`, `pnpm`, `bun` | `nodejs_dev`   |
| `go`, `golang`                       | `golang_dev`   |

### Improvements

- Enhanced tool registry with development tools integration
- Improved shell execution for development commands
- Better timeout handling for long-running operations

## 0.10.5

### New Features

- **Tool Alias System**: Added short aliases for tool names (e.g., `run` → `run_shell_command`, `read` → `read_file`, `write` → `write_file`)
- **Session ID Display**: Session ID now shown in the header for better debugging and logging
- **UTF-8 Locale Check**: Added startup warning for non-UTF-8 terminal encoding

### Tool Aliases

| Alias                         | Canonical Name      |
| ----------------------------- | ------------------- |
| `run`, `shell`, `exec`, `cmd` | `run_shell_command` |
| `read`                        | `read_file`         |
| `write`, `create`             | `write_file`        |
| `grep`, `search`, `find`      | `grep_search`       |
| `glob`, `files`               | `glob`              |
| `ls`, `list`, `dir`           | `list_directory`    |
| `todo`, `todos`               | `todo_write`        |
| `memory`, `save`              | `save_memory`       |
| `websearch`, `web`            | `web_search`        |
| `webfetch`, `fetch`, `url`    | `web_fetch`         |
| `agent`, `subagent`           | `task`              |

### Improvements

- Improved error messages for tool not found scenarios
- Enhanced documentation structure
- Added bilingual documentation support (English/Russian)

### Bug Fixes

- Fixed tool name resolution for better model compatibility

## 0.0.14

- Added plan mode support for task planning
- Fixed unreliable editCorrector that injects extra escape characters
- Fixed task tool dynamic updates
- Added Qwen3-VL-Plus token limits (256K input, 32K output) and highres support
- Enhanced dashScope cache control

## 0.0.13

- Added YOLO mode support for automatic vision model switching with CLI arguments and environment variables.
- Fixed ripgrep lazy loading to resolve VS Code IDE companion startup issues.
- Fixed authentication hang when selecting Qwen OAuth.
- Added OpenAI and Qwen OAuth authentication support to Zed ACP integration.
- Fixed output token limit for Qwen models.
- Fixed Markdown list display issues on Windows.
- Enhanced vision model instructions and documentation.
- Improved authentication method compatibility across different IDE integrations.

## 0.0.12

- Added vision model support for Qwen-OAuth authentication.
- Synced upstream `gemini-cli` to v0.3.4 with numerous improvements and bug fixes.
- Enhanced subagent functionality with system reminders and improved user experience.
- Added tool call type coercion for better compatibility.
- Fixed arrow key navigation issues on Windows.
- Fixed missing tool call chunks for OpenAI logging.
- Fixed system prompt issues to avoid malformed tool calls.
- Fixed terminal flicker when subagent is executing.
- Fixed duplicate subagents configuration when running in home directory.
- Fixed Esc key unable to cancel subagent dialog.
- Added confirmation prompt for `/init` command when context file exists.
- Added `skipLoopDetection` configuration option.
- Fixed `is_background` parameter reset issues.
- Enhanced Windows compatibility with multi-line paste handling.
- Improved subagent documentation and branding consistency.
- Fixed various linting errors and improved code quality.
- Miscellaneous improvements and bug fixes.

## 0.0.11

- Added subagents feature with file-based configuration system for specialized AI assistants.
- Added Welcome Back Dialog with project summary and enhanced quit options.
- Fixed performance issues with SharedTokenManager causing 20-minute delays.
- Fixed tool calls UI issues and improved user experience.
- Fixed credential clearing when switching authentication types.
- Enhanced subagent capabilities to use tools requiring user confirmation.
- Improved ReadManyFiles tool with shared line limits across files.
- Re-implemented tokenLimits class for better compatibility with Qwen and other model types.
- Fixed chunk validation to avoid unnecessary retries.
- Resolved EditTool naming inconsistency causing agent confusion loops.
- Fixed unexpected re-authentication when auth-token is expired.
- Added Terminal Bench integration tests.
- Updated multilingual documentation links in README.
- Fixed various Windows compatibility issues.
- Miscellaneous improvements and bug fixes.

## 0.0.10

- Synced upstream `gemini-cli` to v0.2.1.
- Add todo write tool for task management and progress tracking.

## 0.0.9

- Synced upstream `gemini-cli` to v0.1.21.
- Fixed token synchronization among multiple Qwen sessions.
- Improved tool execution with early stop on invalid tool calls.
- Added explicit `is_background` parameter for shell tool.
- Enhanced memory management with sub-commands to switch between project and global memory operations.
- Renamed `GEMINI_DIR` to `OLLAMA_DIR` for better branding consistency.
- Added support for Qwen Markdown selection.
- Fixed parallel tool usage and improved tool reliability.
- Upgraded integration tests to use Vitest framework.
- Enhanced VS Code IDE integration with launch configurations.
- Added terminal setup command for Shift+Enter and Ctrl+Enter support.
- Fixed GitHub Workflows configuration issues.
- Improved settings directory and command descriptions.
- Fixed locale handling in yargs configuration.
- Added support for `trustedFolders.json` configuration file.
- Enhanced cross-platform compatibility for sandbox build scripts.
- Improved error handling and fixed ambiguous literals.
- Updated documentation links and added IDE integration documentation.
- Miscellaneous improvements and bug fixes.

## 0.0.8

- Synced upstream `gemini-cli` to v0.1.19.
- Updated documentation branding from **Gemini CLI** to **Qwen Code**.
- Added multilingual docs links in `README.md`.
- Added deterministic cache control for the DashScope provider.
- Added option to choose a project-level or global save location.
- Limited `grep` results to 25 items by default.
- `grep` now respects `.ollama-codeignore`.
- Miscellaneous improvements and bug fixes.

## 0.0.7

- Synced upstream `gemini-cli` to v0.1.18.
- Fixed MCP tools.
- Fixed Web Fetch tool.
- Fixed Web Search tool by switching from Google/Gemini to the Tavily API.
- Made tool calls tolerant of invalid-JSON parameters occasionally returned by the LLM.
- Prevented concurrent query submissions in rare cases.
- Corrected Qwen logger exit-handler setup.
- Separated static QR code and dynamic spinner components.

## 0.0.6

- Added usage statistics logging for Qwen integration.
- Made `/init` respect the configured context filename and aligned docs with `OLLAMA_CODE.md`.
- Fixed `EPERM` error when running `qwen --sandbox` on macOS.
- Fixed terminal flicker while waiting for login.
- Fixed `glm-4.5` model request error.

## 0.0.5

- Added Qwen OAuth login and up to 1,000 free requests per day.
- Synced upstream `gemini-cli` to v0.1.17.
- Added the `systemPromptMappings` configuration option.
