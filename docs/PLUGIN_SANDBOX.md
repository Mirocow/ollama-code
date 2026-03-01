# Plugin Security Sandbox

This document describes the security sandbox system for plugins in Ollama Code.

## Overview

The Plugin Security Sandbox provides isolation and access control for plugin execution. It limits plugin access to filesystem, network, commands, and environment variables based on trust levels.

## Trust Levels

### Untrusted

For third-party plugins from unverified sources.

| Permission      | Access                                           |
| --------------- | ------------------------------------------------ |
| **Filesystem**  | Read project files, write to temp directory only |
| **Network**     | GitHub and npm APIs only                         |
| **Commands**    | None                                             |
| **Environment** | PATH, HOME, USER, LANG only                      |
| **Timeout**     | 15 seconds                                       |
| **Memory**      | 50 MB                                            |

### Trusted

For verified plugins from known sources.

| Permission      | Access                                |
| --------------- | ------------------------------------- |
| **Filesystem**  | Full project access, config directory |
| **Network**     | All domains                           |
| **Commands**    | npm, node, git                        |
| **Environment** | All variables                         |
| **Timeout**     | 30 seconds                            |
| **Memory**      | 100 MB                                |

### Builtin

For plugins bundled with Ollama Code.

| Permission      | Access                 |
| --------------- | ---------------------- |
| **Filesystem**  | Full filesystem access |
| **Network**     | Full network access    |
| **Commands**    | All commands           |
| **Environment** | All variables          |
| **Timeout**     | 60 seconds             |
| **Memory**      | Unlimited              |

## Usage

### Creating a Sandbox

```typescript
import {
  createUntrustedSandbox,
  createTrustedSandbox,
  createBuiltinSandbox,
} from '@ollama-code/ollama-code-core';

// For untrusted plugins
const sandbox = createUntrustedSandbox(
  'my-plugin',
  '1.0.0',
  workingDir,
  tempDir,
);

// For trusted plugins
const sandbox = createTrustedSandbox('my-plugin', '1.0.0', workingDir);

// For builtin plugins
const sandbox = createBuiltinSandbox('my-plugin', '1.0.0');
```

### Checking Permissions

```typescript
// Filesystem permissions
sandbox.canReadFile('/project/file.txt'); // true/false
sandbox.canWriteFile('/project/file.txt'); // true/false
sandbox.canDeleteFile('/project/file.txt'); // true/false

// Network permissions
sandbox.canMakeRequest('https://api.github.com', 'GET'); // true/false
sandbox.canMakeRequest('https://malicious.com', 'POST'); // false for untrusted

// Command permissions
sandbox.canExecuteCommand('npm', ['install']); // true/false
sandbox.canExecuteCommand('rm', ['-rf', '/']); // false

// Environment variables
sandbox.canAccessEnvVar('PATH'); // true
sandbox.canAccessEnvVar('SECRET_KEY'); // false for untrusted
```

### Violation Tracking

```typescript
// Register violation callback
sandbox.onViolation((violation) => {
  console.warn(`Sandbox violation: ${violation.type}`);
  console.warn(`Plugin: ${violation.pluginId}`);
  console.warn(`Resource: ${violation.resource}`);
});

// Get all violations
const violations = sandbox.getViolations();

// Clear violation history
sandbox.clearViolations();
```

### Resource Limits

```typescript
// Get current limits
const limits = sandbox.getLimits();
console.log(`Timeout: ${limits.timeout}ms`);
console.log(`Max memory: ${limits.maxMemory} bytes`);

// Check file size limit
sandbox.isFileSizeAllowed(1024 * 1024); // Check if 1MB file is allowed
```

## Configuration

### Custom Sandbox Configuration

```typescript
import { createPluginSandbox } from '@ollama-code/ollama-code-core';

const sandbox = createPluginSandbox('my-plugin', '1.0.0', {
  trustLevel: 'untrusted',
  workingDir: '/project',
  tempDir: '/tmp/ollama-code',
  customConfig: {
    filesystem: [
      { pattern: '${workingDir}/data/**', access: 'write' },
      { pattern: '${workingDir}/**', access: 'read' },
    ],
    network: [{ domain: 'api.example.com', methods: ['GET', 'POST'] }],
    commands: [{ command: 'custom-cli', allowArgs: true }],
    limits: {
      timeout: 60000,
      maxMemory: 200 * 1024 * 1024, // 200 MB
      maxFileSize: 50 * 1024 * 1024, // 50 MB
      maxConcurrentOps: 20,
    },
    allowedEnvVars: ['PATH', 'HOME', 'CUSTOM_*'],
  },
});
```

### Filesystem Patterns

Patterns support glob-style matching:

- `*` - matches any file in directory
- `**` - matches any file recursively
- `${workingDir}` - expands to project directory
- `${tempDir}` - expands to temp directory
- `${home}` - expands to user home directory
- `${pluginId}` - expands to plugin ID

### Network Patterns

Domain patterns support wildcards:

- `*` - matches any domain
- `*.example.com` - matches any subdomain
- `api.example.com` - exact match

## Integration

### With PluginLoader

```typescript
import {
  PluginLoader,
  createPluginSandbox,
} from '@ollama-code/ollama-code-core';

const loader = new PluginLoader(pluginManager, workingDir);

for await (const plugin of loader.discoverPlugins()) {
  const sandbox = createPluginSandbox(
    plugin.manifest.metadata.id,
    plugin.manifest.metadata.version,
    { trustLevel: plugin.type === 'npm' ? 'untrusted' : 'trusted' },
  );

  // Apply sandbox to plugin execution
  pluginManager.setSandbox(plugin.manifest.metadata.id, sandbox);
}
```

### With PluginToolAdapter

```typescript
import { PluginToolAdapter } from '@ollama-code/ollama-code-core';

class SandboxedToolAdapter extends PluginToolAdapter {
  constructor(tool, sandbox) {
    super(tool);
    this.sandbox = sandbox;
  }

  async execute(params, context) {
    // Check permissions before execution
    if (!this.sandbox.canExecuteCommand(this.tool.name, Object.keys(params))) {
      throw new SandboxViolationError({
        type: 'command_execute',
        pluginId: this.sandbox.pluginId,
        resource: this.tool.name,
      });
    }

    return super.execute(params, context);
  }
}
```

## Error Handling

### SandboxViolationError

```typescript
import { SandboxViolationError } from '@ollama-code/ollama-code-core';

try {
  await plugin.execute(params);
} catch (error) {
  if (error instanceof SandboxViolationError) {
    console.error(`Security violation by plugin ${error.violation.pluginId}`);
    console.error(`Type: ${error.violation.type}`);
    console.error(`Resource: ${error.violation.resource}`);
    console.error(`Time: ${error.violation.timestamp}`);
  }
}
```

## Best Practices

1. **Always use the lowest trust level possible** - Start with `untrusted` and only upgrade if necessary.

2. **Test plugins with sandbox enabled** - Verify that plugins work correctly with restrictions.

3. **Monitor violations** - Use violation callbacks to log and audit security events.

4. **Review custom configurations** - Carefully review any custom sandbox configurations before applying.

5. **Update trust levels based on reputation** - Plugins from verified publishers may warrant higher trust levels.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Execution Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Plugin Code                                                 │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                         │
│  │ Sandbox Check   │                                         │
│  │                 │                                         │
│  │ canReadFile?    │─── NO ──► Violation Recorded            │
│  │ canWriteFile?   │                                         │
│  │ canExecute?     │                                         │
│  │ canRequest?     │                                         │
│  └────────┬────────┘                                         │
│           │ YES                                              │
│           ▼                                                  │
│  ┌─────────────────┐                                         │
│  │ Execute Action  │                                         │
│  │                 │                                         │
│  │ With timeout    │─── Timeout ──► Resource Limit Violation │
│  │ With memory lim │                                         │
│  └─────────────────┘                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## See Also

- [Plugin System Documentation](./PLUGIN_SYSTEM.md)
- [Plugin Development Guide](./developers/tools/introduction.md)
- [Security Best Practices](./developers/architecture.md#security)
