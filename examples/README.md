# Ollama Code Examples

This folder contains example plugins and extensions for Ollama Code.

## Contents

| Example | Description |
|---------|-------------|
| [sample-extension](./sample-extension/) | Full-featured extension demonstrating all capabilities |
| [weather-plugin](./weather-plugin/) | Simple weather plugin for marketplace |

## Quick Start

### 1. Local Development (Link)

Test a plugin locally without publishing to npm:

```bash
# From the plugin directory
cd examples/weather-plugin

# Link to global npm
npm link

# Or link directly to Ollama Code plugins folder
ln -s $(pwd) ~/.ollama-code/plugins/weather-plugin
```

Then in Ollama Code:
```
/plugins reload
/plugins enable weather
```

### 2. Install from Local Path

```bash
# In Ollama Code chat
/plugins install ./examples/weather-plugin
```

### 3. Install from Git URL

```bash
# In Ollama Code chat
/plugins install https://github.com/your-repo/ollama-code-plugin-weather
```

## Creating Your Own Plugin

### Step 1: Choose a Name

Plugin packages must follow naming convention:
- `ollama-code-plugin-<name>` (recommended)
- `@ollama-code/<name>` (scoped)

Examples:
- `ollama-code-plugin-weather`
- `ollama-code-plugin-jira`
- `@ollama-code/calendar`

### Step 2: Create Package Structure

```
my-plugin/
├── package.json      # NPM package metadata
├── plugin.json       # Plugin manifest
├── index.js          # Main plugin code
└── README.md         # Documentation
```

### Step 3: package.json

```json
{
  "name": "ollama-code-plugin-my-plugin",
  "version": "1.0.0",
  "description": "What my plugin does",
  "main": "index.js",
  "keywords": [
    "ollama-code-plugin"
  ],
  "author": "Your Name",
  "license": "Apache-2.0",
  "engines": {
    "ollamaCode": ">=0.17.0"
  }
}
```

**Important:** Add `"ollama-code-plugin"` to keywords for marketplace discovery.

### Step 4: plugin.json

```json
{
  "metadata": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "What my plugin does",
    "author": "Your Name",
    "tags": ["utility", "tools"]
  },
  "tools": [
    {
      "name": "my_tool",
      "displayName": "My Tool",
      "description": "What this tool does",
      "category": "other",
      "parameters": {
        "type": "object",
        "properties": {
          "input": {
            "type": "string",
            "description": "Input parameter"
          }
        },
        "required": ["input"]
      },
      "handler": "myHandler"
    }
  ],
  "capabilities": {
    "canAccessNetwork": true
  }
}
```

### Step 5: index.js

```javascript
/**
 * My Plugin for Ollama Code
 */

/**
 * Tool handler - must match handler name in plugin.json
 */
async function myHandler(params) {
  const { input } = params;
  
  // Your logic here
  const result = `Processed: ${input}`;
  
  return {
    success: true,
    data: result,
    display: {
      summary: `Processed input successfully`
    }
  };
}

// Export handlers
module.exports = {
  handlers: {
    myHandler: myHandler
  },
  
  // Optional lifecycle hooks
  onActivate: () => console.log('Plugin activated'),
  onDeactivate: () => console.log('Plugin deactivated')
};
```

### Step 6: Test Locally

```bash
# Link plugin
cd my-plugin
npm link

# In Ollama Code
/plugins reload
/plugins list
/plugins info my-plugin

# Test tool
Use my_tool with input "hello"
```

### Step 7: Publish to npm

```bash
# Login to npm
npm login

# Publish
npm publish

# Now anyone can install
/plugins install my-plugin
```

## Plugin Capabilities

| Capability | Description |
|------------|-------------|
| `canReadFiles` | Read files from filesystem |
| `canWriteFiles` | Write/modify files |
| `canExecuteCommands` | Run shell commands |
| `canAccessNetwork` | Make HTTP requests |
| `canUseStorage` | Store plugin data |
| `canSpawnAgents` | Create sub-agents |

## Tool Categories

| Category | Use Case |
|----------|----------|
| `read` | Reading data/files |
| `edit` | Modifying files |
| `delete` | Deleting files/data |
| `move` | Moving files |
| `search` | Searching content |
| `execute` | Running commands |
| `fetch` | Network requests |
| `other` | Everything else |

## Best Practices

1. **Clear Names**: Use descriptive tool and parameter names
2. **Good Descriptions**: Help the AI understand when to use your tool
3. **Validate Input**: Check required parameters in your handler
4. **Error Handling**: Return meaningful error messages
5. **Documentation**: Include a README with examples
6. **Versioning**: Use semantic versioning (1.0.0)

## Getting Help

- [Plugin System Documentation](../docs/PLUGIN_SYSTEM.md)
- [Plugin Marketplace Guide](../docs/PLUGIN_MARKETPLACE.md)
- [Sample Extension](./sample-extension/) - Full example with all features
