# Sample Command

This is a sample slash command that demonstrates the command system.

## Usage

```
/sample-command [options]
```

## Options

- `--verbose` - Show detailed output
- `--format <json|text>` - Output format (default: text)

## Description

This command demonstrates how to create custom slash commands in Ollama Code extensions.

Commands are defined as Markdown files in the `commands/` directory. The filename becomes the command name.

## Example

```
/sample-command --verbose --format json
```

## Implementation

When this command is invoked, the AI will:

1. Parse the provided options
2. Execute the sample tool with appropriate parameters
3. Return the results in the specified format

## Notes

- Commands can reference tools from the same extension
- Commands can call MCP servers
- Commands can chain multiple operations
