# Sample Extension Context

This is the context file for the Sample Extension. It provides information about the extension's capabilities and usage.

## Overview

The Sample Extension demonstrates all features of the Ollama Code extension system:

- **Tools**: Custom tools that can be invoked by the AI
- **Aliases**: Shortcuts for tools and commands
- **Lifecycle Hooks**: Code that runs during extension lifecycle events
- **MCP Servers**: Model Context Protocol servers
- **Commands**: Custom slash commands
- **Skills**: Reusable skill definitions
- **Agents**: Subagent configurations

## Tools

### sample_tool

A demonstration tool that processes messages.

**Parameters:**

- `message` (string, required): The message to process
- `uppercase` (boolean, optional): Convert to uppercase
- `repeat` (integer, optional): Number of times to repeat (1-10)

**Example:**

```
Use sample_tool with message "Hello World" and uppercase=true
```

### data_processor

Processes data files and returns statistics.

**Parameters:**

- `filePath` (string, required): Path to the data file
- `operation` (string, required): One of: count, sum, average, analyze

## Aliases

| Alias | Target                          | Description             |
| ----- | ------------------------------- | ----------------------- |
| `st`  | sample_extension_sample_tool    | Sample tool shortcut    |
| `dp`  | sample_extension_data_processor | Data processor shortcut |
| `sc`  | sample-command                  | Sample command shortcut |

## Commands

### /sample-command

A sample slash command that demonstrates the command system.

Usage: `/sample-command [options]`

## Skills

### SAMPLE_SKILL

A demonstration skill that shows how to use the extension's tools effectively.

## Agents

### SAMPLE_AGENT

A subagent configured to help with specific tasks using this extension.

## Configuration

The extension requires the following settings:

1. **api_key**: Your API key for the sample service (required, sensitive)
2. **max_retries**: Maximum retry attempts (default: 3)
3. **debug_mode**: Enable verbose logging (default: false)

## Lifecycle Events

The extension handles the following lifecycle events:

- **onActivate**: Called when the extension is activated
- **onDeactivate**: Called when the extension is deactivated
- **onInstall**: Called after installation
- **onUninstall**: Called before uninstallation

## Best Practices

When using this extension:

1. Always provide the API key in settings
2. Use aliases for quicker access to tools
3. Check debug_mode for troubleshooting
4. Use the data_processor for analyzing data files
