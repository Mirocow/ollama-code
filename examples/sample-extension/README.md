# Sample Extension

A comprehensive example extension demonstrating all Ollama Code extension features.

## Features

This extension demonstrates:

### 1. Custom Tools

Two example tools that can be invoked by the AI:

- **sample_tool**: Processes messages with optional transformation
- **data_processor**: Analyzes data files and returns statistics

### 2. Aliases

Shortcuts for quick access:

| Alias | Target                            | Description             |
| ----- | --------------------------------- | ----------------------- |
| `st`  | `sample_extension_sample_tool`    | Sample tool shortcut    |
| `dp`  | `sample_extension_data_processor` | Data processor shortcut |
| `sc`  | `sample-command`                  | Sample command shortcut |

### 3. Lifecycle Hooks

Handlers for extension lifecycle events:

- `onActivate`: Called when extension is activated
- `onDeactivate`: Called when extension is deactivated
- `onInstall`: Called after installation
- `onUninstall`: Called before uninstallation

### 4. MCP Servers

Example MCP server configuration for Model Context Protocol integration.

### 5. Commands

Custom slash commands in the `commands/` directory.

### 6. Skills

Reusable skill definitions in the `skills/` directory.

### 7. Agents

Subagent configurations in the `agents/` directory.

### 8. Settings

Configurable settings with validation:

- `api_key`: API key (required, sensitive)
- `max_retries`: Maximum retry attempts (default: 3)
- `debug_mode`: Enable verbose logging (default: false)

## Installation

### From Local Directory

```bash
ollama-code extension install ./examples/sample-extension
```

### From Git Repository

```bash
ollama-code extension install https://github.com/example/sample-extension.git
```

## Usage

### Using Tools

Ask the AI to use the tools:

```
Use the sample tool with message "Hello World" and uppercase=true
```

```
Process data.csv with the data processor using the analyze operation
```

### Using Aliases

Aliases provide shortcuts:

```
Use st with message "test"  # Calls sample_tool
Use dp with filePath "data.json" operation "count"  # Calls data_processor
```

### Using Commands

Slash commands:

```
/sample-command
```

## Configuration

Configure the extension via settings:

```json
{
  "api_key": "your-api-key-here",
  "max_retries": 5,
  "debug_mode": true
}
```

## Development

### Project Structure

```
sample-extension/
├── ollama-extension.json   # Extension manifest
├── CONTEXT.md              # Context file for AI
├── README.md               # This file
├── tools/
│   ├── sample-tool.js      # Sample tool handler
│   └── data-processor.js   # Data processor handler
├── commands/
│   └── sample-command.md   # Sample command
├── skills/
│   └── SAMPLE_SKILL.md     # Sample skill
├── agents/
│   └── SAMPLE_AGENT.md     # Sample agent
└── lifecycle/
    ├── activate.js         # Activation handler
    ├── deactivate.js       # Deactivation handler
    ├── install.js          # Installation handler
    └── uninstall.js        # Uninstallation handler
```

### Creating a New Tool

1. Add tool definition to `ollama-extension.json`:

```json
{
  "name": "my_tool",
  "displayName": "My Tool",
  "description": "Tool description",
  "kind": "other",
  "parameterSchema": { ... },
  "handler": "./tools/my-tool.js"
}
```

2. Create the handler file `tools/my-tool.js`:

```javascript
export async function execute(params, context) {
  const { logger } = context;

  logger.info('Executing my tool');

  return {
    llmContent: 'Result for LLM',
    returnDisplay: 'Result for display',
  };
}

export function validate(params) {
  // Return error message or null
  return null;
}

export function getDescription(params) {
  return 'Description of what the tool does';
}

export default { execute, validate, getDescription };
```

### Creating a Lifecycle Hook

1. Add hook path to `ollama-extension.json`:

```json
{
  "lifecycle": {
    "onActivate": "./lifecycle/activate.js"
  }
}
```

2. Create the handler file `lifecycle/activate.js`:

```javascript
export async function handle(event, context) {
  const { extensionName, logger } = context;

  logger.info(`Activating ${extensionName}`);

  // Your activation logic

  return {
    success: true,
    message: 'Activated successfully',
  };
}

export default { handle };
```

## Testing

Test the extension locally:

```bash
# Install the extension
ollama-code extension install ./examples/sample-extension --link

# Test the tools
ollama-code "Use sample tool with message 'test'"

# Check extension status
ollama-code extension list
```

## Troubleshooting

Enable debug mode for verbose logging:

```json
{
  "debug_mode": true
}
```

Check logs at:

- `~/.ollama-code/logs/extensions/sample-extension.log`

## License

Apache-2.0
