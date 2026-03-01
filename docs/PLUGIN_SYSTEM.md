# Plugin System

> Dynamic tool loading and runtime registration

## Overview

The Plugin System allows extending Ollama Code with custom tools loaded at runtime. Plugins can define new tools, hooks, and configurations without modifying the core codebase.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Plugin Manager  │───▶│        Plugin Registry          │ │
│  └────────┬────────┘    │  - pluginA: { tools: [...] }    │ │
│           │             │  - pluginB: { tools: [...] }    │ │
│           ▼             └─────────────────────────────────┘ │
│  ┌─────────────────┐                                       │
│  │ Tool Registry   │◀── Tools merged from plugins          │
│  └─────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Plugin Definition

### Interface

```typescript
interface PluginMetadata {
  /** Unique plugin identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Plugin version */
  version: string;
  
  /** Plugin description */
  description?: string;
  
  /** Author information */
  author?: string;
  
  /** Required Ollama Code version */
  minimumVersion?: string;
  
  /** Dependencies on other plugins */
  dependencies?: string[];
}

interface PluginDefinition {
  /** Plugin metadata */
  metadata: PluginMetadata;
  
  /** Tools provided by this plugin */
  tools?: PluginTool[];
  
  /** Lifecycle hooks */
  hooks?: PluginHooks;
  
  /** Configuration schema */
  configSchema?: Record<string, ConfigSchema>;
  
  /** Default configuration */
  defaultConfig?: Record<string, unknown>;
}

interface PluginTool {
  /** Unique tool identifier */
  id: string;
  
  /** Tool name (what the model calls) */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Parameter schema */
  parameters: JSONSchema;
  
  /** Handler function */
  execute: (params: unknown, context: ToolContext) => Promise<ToolResult>;
  
  /** Confirmation required? */
  requiresConfirmation?: boolean;
}

interface PluginHooks {
  /** Called before plugin is loaded */
  beforeLoad?: () => Promise<void>;
  
  /** Called after plugin is loaded */
  afterLoad?: () => Promise<void>;
  
  /** Called before plugin is unloaded */
  beforeUnload?: () => Promise<void>;
  
  /** Called before tool execution */
  beforeToolExecute?: (toolName: string, params: unknown) => Promise<void>;
  
  /** Called after tool execution */
  afterToolExecute?: (toolName: string, result: ToolResult) => Promise<void>;
}
```

## Creating a Plugin

### Basic Plugin

```typescript
// plugins/hello-world/index.ts
import { PluginDefinition, ToolResult } from 'ollama-code';

const helloWorldTool = {
  id: 'hello-world',
  name: 'hello_world',
  description: 'Say hello to someone',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name to greet',
      },
    },
    required: ['name'],
  },
  execute: async (params: { name: string }): Promise<ToolResult> => {
    return {
      success: true,
      data: `Hello, ${params.name}!`,
    };
  },
};

export const helloWorldPlugin: PluginDefinition = {
  metadata: {
    id: 'hello-world',
    name: 'Hello World Plugin',
    version: '1.0.0',
    description: 'A simple example plugin',
    author: 'Your Name',
  },
  tools: [helloWorldTool],
};
```

### Plugin with Hooks

```typescript
// plugins/database/index.ts
import { PluginDefinition, ToolResult, ToolContext } from 'ollama-code';

let dbConnection: DatabaseConnection | null = null;

const queryTool = {
  id: 'db-query',
  name: 'db_query',
  description: 'Execute a database query',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'SQL query' },
      params: { type: 'array', items: { type: 'string' } },
    },
    required: ['query'],
  },
  requiresConfirmation: true,
  execute: async (
    params: { query: string; params?: string[] },
    context: ToolContext
  ): Promise<ToolResult> => {
    if (!dbConnection) {
      return { success: false, error: 'Database not connected' };
    }
    
    try {
      const result = await dbConnection.query(params.query, params.params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export const databasePlugin: PluginDefinition = {
  metadata: {
    id: 'database-plugin',
    name: 'Database Plugin',
    version: '1.0.0',
  },
  tools: [queryTool],
  hooks: {
    beforeLoad: async () => {
      console.log('Loading database plugin...');
    },
    afterLoad: async () => {
      // Initialize connection
      dbConnection = await createConnection(config);
      console.log('Database connected');
    },
    beforeUnload: async () => {
      // Cleanup
      if (dbConnection) {
        await dbConnection.close();
        dbConnection = null;
      }
    },
  },
  configSchema: {
    connectionString: {
      type: 'string',
      description: 'Database connection string',
      secret: true,
    },
    poolSize: {
      type: 'number',
      description: 'Connection pool size',
      default: 10,
    },
  },
  defaultConfig: {
    poolSize: 10,
  },
};
```

## Plugin Manager API

### Register Plugin

```typescript
import { pluginManager } from './plugins';

// Register a plugin
await pluginManager.registerPlugin(helloWorldPlugin);

// Register with configuration
await pluginManager.registerPlugin(databasePlugin, {
  connectionString: 'postgres://localhost/mydb',
  poolSize: 20,
});
```

### Enable/Disable Plugin

```typescript
// Enable plugin
await pluginManager.enablePlugin('hello-world');

// Disable plugin
await pluginManager.disablePlugin('hello-world');
```

### Check Plugin Status

```typescript
// Check if plugin is loaded
const isLoaded = pluginManager.isPluginLoaded('hello-world');

// Check if plugin is enabled
const isEnabled = pluginManager.isPluginEnabled('hello-world');

// Get plugin info
const info = pluginManager.getPluginInfo('hello-world');
console.log(info.version); // '1.0.0'
```

### List Plugins

```typescript
// List all registered plugins
const plugins = pluginManager.listPlugins();

plugins.forEach(plugin => {
  console.log(`${plugin.name} v${plugin.version} (${plugin.enabled ? 'enabled' : 'disabled'})`);
});
```

### Unregister Plugin

```typescript
// Unregister plugin completely
await pluginManager.unregisterPlugin('hello-world');
```

## Plugin Discovery

### Directory Structure

```
plugins/
├── hello-world/
│   ├── index.ts          # Plugin entry point
│   ├── package.json      # Plugin metadata
│   └── README.md         # Documentation
├── database/
│   ├── index.ts
│   └── package.json
└── git-tools/
    ├── index.ts
    └── package.json
```

### Auto-discovery

```typescript
// Discover plugins from directory
await pluginManager.discoverPlugins('./plugins');

// Or from multiple directories
await pluginManager.discoverPlugins([
  './plugins',
  './node_modules/@my-org/ollama-code-plugins',
]);
```

### NPM Package Plugin

```json
// package.json
{
  "name": "@my-org/ollama-code-plugin-git",
  "version": "1.0.0",
  "main": "dist/index.js",
  "ollamaCodePlugin": {
    "id": "git-plugin",
    "name": "Git Plugin",
    "tools": ["git_status", "git_commit", "git_push"]
  }
}
```

## Configuration

### Plugin Configuration File

```json
// ~/.ollama-code/plugins.json
{
  "plugins": {
    "hello-world": {
      "enabled": true
    },
    "database": {
      "enabled": true,
      "config": {
        "connectionString": "${DATABASE_URL}",
        "poolSize": 10
      }
    }
  }
}
```

### Environment Variables

```typescript
// In plugin definition
configSchema: {
  apiKey: {
    type: 'string',
    description: 'API Key',
    secret: true,
    env: 'MY_PLUGIN_API_KEY',  // Read from environment
  },
}
```

### Runtime Configuration

```typescript
// Update plugin config at runtime
await pluginManager.updateConfig('database', {
  poolSize: 20,
});
```

## Tool Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Tool Execution Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Model calls tool                                        │
│     ↓                                                        │
│  2. CoreToolScheduler receives call                         │
│     ↓                                                        │
│  3. PluginManager.resolveTool(name)                         │
│     ↓                                                        │
│  4. Check if tool requires confirmation                     │
│     ↓                                                        │
│  5. Execute plugin.beforeToolExecute hook                   │
│     ↓                                                        │
│  6. tool.execute(params, context)                           │
│     ↓                                                        │
│  7. Execute plugin.afterToolExecute hook                    │
│     ↓                                                        │
│  8. Return result to model                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security

### Plugin Sandboxing

```typescript
// Plugins can be sandboxed
const pluginManager = new PluginManager({
  sandbox: {
    enabled: true,
    permissions: {
      fs: ['read', 'write'],
      network: false,
      exec: false,
    },
  },
});
```

### Trusted Plugins

```typescript
// Mark plugin as trusted
pluginManager.setTrusted('hello-world', true);

// Only load trusted plugins
pluginManager.loadTrustedOnly(true);
```

### Permission Model

```typescript
interface PluginPermissions {
  /** File system access */
  fs?: ('read' | 'write' | 'delete')[];
  
  /** Network access */
  network?: boolean;
  
  /** Execute shell commands */
  exec?: boolean;
  
  /** Access to secrets */
  secrets?: boolean;
  
  /** Modify other plugins */
  pluginManagement?: boolean;
}

// Define in plugin
const myPlugin: PluginDefinition = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
  },
  permissions: {
    fs: ['read', 'write'],
    network: true,
  },
  tools: [...],
};
```

## Testing Plugins

### Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { helloWorldPlugin } from './index';

describe('Hello World Plugin', () => {
  it('should export correct metadata', () => {
    expect(helloWorldPlugin.metadata.id).toBe('hello-world');
    expect(helloWorldPlugin.metadata.version).toBe('1.0.0');
  });

  it('should have valid tools', () => {
    expect(helloWorldPlugin.tools).toHaveLength(1);
    expect(helloWorldPlugin.tools[0].name).toBe('hello_world');
  });

  it('should execute tool correctly', async () => {
    const tool = helloWorldPlugin.tools[0];
    const result = await tool.execute({ name: 'World' }, {});
    
    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello, World!');
  });
});
```

### Integration Test

```typescript
import { PluginManager } from '../plugins';

describe('Plugin Manager Integration', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  afterEach(async () => {
    await manager.clear();
  });

  it('should register and enable plugin', async () => {
    await manager.registerPlugin(helloWorldPlugin);
    await manager.enablePlugin('hello-world');
    
    expect(manager.isPluginEnabled('hello-world')).toBe(true);
  });

  it('should resolve tool from plugin', async () => {
    await manager.registerPlugin(helloWorldPlugin);
    await manager.enablePlugin('hello-world');
    
    const tool = manager.resolveTool('hello_world');
    expect(tool).toBeDefined();
    expect(tool.name).toBe('hello_world');
  });
});
```

## Example Plugins

### Git Plugin

```typescript
const gitStatusTool = {
  id: 'git-status',
  name: 'git_status',
  description: 'Get repository status',
  parameters: { type: 'object', properties: {} },
  execute: async (_, context) => {
    const result = await execGit('status --porcelain');
    return { success: true, data: result };
  },
};

const gitCommitTool = {
  id: 'git-commit',
  name: 'git_commit',
  description: 'Create a git commit',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Commit message' },
    },
    required: ['message'],
  },
  requiresConfirmation: true,
  execute: async (params, context) => {
    await execGit(`commit -m "${params.message}"`);
    return { success: true, data: 'Committed successfully' };
  },
};

export const gitPlugin: PluginDefinition = {
  metadata: {
    id: 'git-plugin',
    name: 'Git Tools',
    version: '1.0.0',
  },
  tools: [gitStatusTool, gitCommitTool],
};
```

## Related Documentation

- [Tools Reference](./TOOLS.md)
- [Event Bus](./EVENT_BUS.md)
- [Contributing](../CONTRIBUTING.md)

## Plugin Loader

### Dynamic Plugin Loading

The `PluginLoader` handles discovery and loading of plugins from multiple sources:

```typescript
import { PluginLoader, createPluginLoader, pluginManager } from './plugins';

// Create loader
const loader = createPluginLoader(pluginManager, process.cwd());

// Discover all plugins
const discovered = await loader.discoverPlugins();

// Load all valid plugins
const { loaded, failed } = await loader.loadAllPlugins(discovered);

console.log(`Loaded: ${loaded.join(', ')}`);
console.log(`Failed: ${failed.join(', ')}`);

// Enable all loaded plugins
await loader.enableAllPlugins();
```

### Plugin Discovery Sources

The loader discovers plugins from:

1. **Built-in plugins**: `packages/core/src/plugins/builtin/*`
2. **User plugins**: `~/.ollama-code/plugins/`
3. **Project plugins**: `.ollama-code/plugins/`
4. **npm packages**: `ollama-code-plugin-*` or `@scope/ollama-code-plugin-*`

### Plugin Manifest (plugin.json)

```json
{
  "entry": "index.js",
  "metadata": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "Plugin description",
    "author": "Author Name",
    "tags": ["category", "tags"],
    "enabledByDefault": true,
    "dependencies": [
      { "pluginId": "other-plugin", "optional": false }
    ]
  }
}
```

### Dependency Resolution

The loader automatically resolves plugin dependencies using topological sorting:

```typescript
// Plugins with dependencies are loaded first
const sorted = loader.sortByDependencies(discovered);

// Circular dependencies are detected and warned
if (hasCircularDependency) {
  console.warn('Circular dependency detected');
}
```

## Plugin Tool Adapter

The `PluginToolAdapter` bridges plugins with the tool registry:

```typescript
import { 
  PluginToolAdapter, 
  registerPluginTools, 
  unregisterPluginTools 
} from './plugins';

// Register plugin tools with registry
registerPluginTools(plugin.tools, plugin.metadata.id, (tool) => {
  toolRegistry.registerTool(tool);
});

// Unregister when plugin is disabled
unregisterPluginTools(toolIds, (toolId) => {
  toolRegistry.unregisterTool(toolId);
});
```

### Tool Category Mapping

Plugin tool categories map to internal `Kind`:

| Plugin Category | Internal Kind |
|----------------|---------------|
| `read` | `Kind.Read` |
| `edit` | `Kind.Edit` |
| `delete` | `Kind.Delete` |
| `move` | `Kind.Move` |
| `search` | `Kind.Search` |
| `execute` | `Kind.Execute` |
| `fetch` | `Kind.Fetch` |
| `other` | `Kind.Other` |

## Built-in Plugins

Ollama Code includes several built-in plugins that provide core functionality:

### Core Tools Plugin

Located at `packages/core/src/plugins/builtin/core-tools/`:

- **echo**: Echo back messages (testing)
- **timestamp**: Get current timestamp in various formats
- **get_env**: Get environment variable values (with security masking)

```typescript
import coreToolsPlugin from './plugins/builtin/core-tools';

// Register built-in plugin
await pluginManager.registerPlugin(coreToolsPlugin);
await pluginManager.enablePlugin('core-tools');
```

### File Tools Plugin

Located at `packages/core/src/plugins/builtin/file-tools/`:

| Tool | Category | Description |
|------|----------|-------------|
| `read_file` | read | Read file contents with pagination support |
| `write_file` | edit | Create or overwrite files |
| `edit` | edit | Replace content in existing files |
| `glob` | search | Find files by pattern |
| `list_directory` | read | List directory contents |

### Shell Tools Plugin

Located at `packages/core/src/plugins/builtin/shell-tools/`:

| Tool | Category | Description |
|------|----------|-------------|
| `run_shell_command` | execute | Execute shell commands with timeout |
| `bash` | execute | Simplified bash command execution |

Features:
- Timeout support (default 2 minutes, max 10 minutes)
- Background process support
- Dangerous command detection
- Abort signal integration

### Search Tools Plugin

Located at `packages/core/src/plugins/builtin/search-tools/`:

| Tool | Category | Description |
|------|----------|-------------|
| `grep_search` | search | Search file contents using regex |
| `glob` | search | Find files by glob pattern |
| `web_fetch` | fetch | Fetch content from URLs |
| `web_search` | fetch | Search the web |

### Development Tools Plugin

Located at `packages/core/src/plugins/builtin/dev-tools/`:

| Tool | Languages | Description |
|------|-----------|-------------|
| `python_dev` | Python | pip, pytest, flake8, Django |
| `nodejs_dev` | Node.js | npm, yarn, pnpm, Next.js |
| `golang_dev` | Go | go build, test, mod, fmt |
| `rust_dev` | Rust | cargo build, test, clippy |
| `typescript_dev` | TypeScript | tsc, ts-node |
| `java_dev` | Java | Maven, Gradle, javac |
| `cpp_dev` | C/C++ | gcc, g++, cmake, make |
| `swift_dev` | Swift | swift build, test, package |
| `php_dev` | PHP | php, composer, artisan |

## Creating Custom Plugins

### Directory Structure

```
my-plugin/
├── plugin.json       # Plugin manifest
├── index.ts          # Entry point (exports PluginDefinition)
├── tools/            # Tool implementations
│   ├── tool1.ts
│   └── tool2.ts
└── README.md         # Documentation
```

### Example: Custom Tool Plugin

```typescript
// my-plugin/index.ts
import type { PluginDefinition, PluginTool } from 'ollama-code';

const myCustomTool: PluginTool = {
  id: 'my-tool',
  name: 'my_custom_tool',
  description: 'Does something custom',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input value' },
    },
    required: ['input'],
  },
  category: 'other',
  requiresConfirmation: false,
  timeout: 30000, // 30 second timeout
  execute: async (params, context) => {
    context.logger.info('Executing my custom tool');
    
    // Your tool logic here
    const result = processInput(params.input);
    
    return {
      success: true,
      data: result,
      display: {
        title: 'Custom Tool Result',
        summary: `Processed: ${result}`,
      },
    };
  },
};

export default {
  metadata: {
    id: 'my-plugin',
    name: 'My Custom Plugin',
    version: '1.0.0',
    description: 'A custom plugin with custom tools',
    author: 'Your Name',
  },
  tools: [myCustomTool],
  hooks: {
    onLoad: async (context) => {
      context.logger.info('My plugin loaded!');
    },
  },
} satisfies PluginDefinition;
```

## Integration with Tool Registry

The plugin system integrates with `ToolRegistry` to provide seamless tool discovery:

```typescript
import { ToolRegistry } from './tools';
import { pluginManager, PluginLoader, registerPluginTools } from './plugins';

// Initialize
const toolRegistry = new ToolRegistry(config);
const pluginLoader = new PluginLoader(pluginManager, projectRoot);

// Discover and load plugins
const discovered = await pluginLoader.discoverPlugins();
const { loaded } = await pluginLoader.loadAllPlugins(discovered);

// Register plugin tools with tool registry
for (const pluginId of loaded) {
  const plugin = pluginManager.getPlugin(pluginId);
  if (plugin?.definition.tools) {
    registerPluginTools(
      plugin.definition.tools, 
      pluginId, 
      (tool) => toolRegistry.registerTool(tool)
    );
  }
}

// Tools are now available through tool registry
const allTools = toolRegistry.getAllTools();
```

## Plugin Development CLI

Ollama Code provides a CLI tool for plugin development:

### Commands

```bash
# Create a new plugin from template
plugin-cli create my-plugin

# Validate a plugin manifest
plugin-cli validate ./my-plugin

# List all installed plugins
plugin-cli list

# Show plugin information
plugin-cli info my-plugin
```

### Creating a New Plugin

```bash
# Create plugin
$ plugin-cli create my-awesome-plugin
✅ Created plugin 'my-awesome-plugin' at ~/.ollama-code/plugins/my-awesome-plugin

Files created:
  - plugin.json  (manifest)
  - index.ts     (plugin code)
  - README.md    (documentation)

Next steps:
  1. Edit index.ts to add your tools
  2. Compile: tsc index.ts --esModuleInterop --moduleResolution node --outDir .
  3. Restart Ollama Code to load the plugin
```

### Plugin Template

The generated plugin includes:

```typescript
// index.ts
import type { PluginDefinition, PluginTool } from 'ollama-code';

const exampleTool: PluginTool = {
  id: 'example',
  name: 'my_plugin_example',
  description: 'An example tool',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input parameter' },
    },
    required: ['input'],
  },
  category: 'other',
  execute: async (params, context) => {
    return {
      success: true,
      data: `Processed: ${params.input}`,
    };
  },
};

export default {
  metadata: {
    id: 'my-awesome-plugin',
    name: 'My Awesome Plugin',
    version: '1.0.0',
  },
  tools: [exampleTool],
};
```

## Plugin Registry Integration

The `PluginRegistry` provides integration with `ToolRegistry`:

```typescript
import { 
  initializePluginRegistry, 
  getPluginRegistry 
} from './plugins';

// Initialize during application startup
const pluginRegistry = await initializePluginRegistry(
  toolRegistry,
  process.cwd()
);

// Discover external plugins
const { loaded, failed } = await pluginRegistry.discoverExternalPlugins();

// Get loaded plugins
const plugins = pluginRegistry.getLoadedPlugins();

// Enable/disable plugins
await pluginRegistry.enablePlugin('my-plugin');
await pluginRegistry.disablePlugin('my-plugin');
```

## Plugin Marketplace

Ollama Code включает Plugin Marketplace для поиска, установки и управления плагинами из npm-реестра.

### Быстрый старт

```bash
# Поиск плагинов
plugin search git

# Установка плагина
plugin install ollama-code-plugin-git-tools

# Обновление всех плагинов
plugin update --all

# Список установленных плагинов
plugin list
```

### Programmatic API

```typescript
import { createPluginMarketplace } from '@ollama-code/ollama-code-core';

const marketplace = createPluginMarketplace(process.cwd());

// Поиск плагинов
const plugins = await marketplace.search({ query: 'git' });

// Установка плагина
const result = await marketplace.install('my-plugin', {
  global: true,
  version: '1.0.0',
});

// Обновление всех плагинов
const updates = await marketplace.updateAll({ checkOnly: true });
```

### Уровни доверия

| Уровень | Описание |
|---------|----------|
| `verified` | Официально верифицированные плагины |
| `community` | Плагины от сообщества с хорошей репутацией |
| `unverified` | Непроверенные плагины (требуют `--skip-verification`) |

### Создание плагина для Marketplace

```json
// package.json
{
  "name": "ollama-code-plugin-my-plugin",
  "version": "1.0.0",
  "keywords": ["ollama-code-plugin"],
  "main": "index.js"
}
```

**Полная документация**: См. [Plugin Marketplace](./PLUGIN_MARKETPLACE.md) для детального описания CLI команд, API и создания плагинов.
