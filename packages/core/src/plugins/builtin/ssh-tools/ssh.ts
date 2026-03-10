/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../../../config/config.js';
import { Storage } from '../../../config/storage.js';
import { ToolErrorType } from '../../../tools/tool-error.js';
import type {
  ToolInvocation,
  ToolResult,
  ToolResultDisplay,
  ToolCallConfirmationDetails,
  ToolExecuteConfirmationDetails,
  ToolConfirmationPayload,
} from '../../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  ToolConfirmationOutcome,
  Kind,
} from '../../../tools/tools.js';
import { getErrorMessage } from '../../../utils/errors.js';
import { abortSignalAny } from '../../../utils/nodePolyfills.js';
import { ShellExecutionService } from '../../../services/shellExecutionService.js';
import type { ShellExecutionConfig } from '../../../services/shellExecutionService.js';
import type { AnsiOutput } from '../../../utils/terminalSerializer.js';
import { createDebugLogger } from '../../../utils/debugLogger.js';
import * as os from 'node:os';

const debugLogger = createDebugLogger('SSH');

// ============================================================================
// Keyboard Layout Detection
// ============================================================================

/**
 * Common Russian letters typed on English keyboard layout
 * Maps "кракозябры" back to Russian
 */
const RU_TO_EN_MAP: Record<string, string> = {
  'jn': 'от', 'vjtuj': 'моего', 'gjkmpjdfntkz': 'пользователя',
  'rf': 'ка', 'ds': 'вы', 'pltcm': 'здесь', 'ghbdtn': 'привет',
  'rfr': 'как', 'ltkj': 'дело', 'gj': 'по', 'vj': 'ми',
  'yt': 'не', 'yj': 'но', 'jq': 'ий', 'a': 'а', 'b': 'и',
  'd': 'в', 'k': 'л', 'r': 'к', 't': 'е', 'n': 'т',
  'y': 'н', 'j': 'о', 'g': 'п', 'h': 'р', 'c': 'с',
  'm': 'ь', 'q': 'й', 'w': 'ц', 'e': 'у', 'z': 'я',
  'x': 'ч', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з',
  's': 'ы', '[': 'х', ']': 'ъ',
};

/**
 * Detects if text appears to be Russian typed on English keyboard
 * Returns decoded Russian text if detected, null otherwise
 */
function detectWrongKeyboardLayout(text: string): { isWrongLayout: boolean; decoded: string; original: string } {
  if (!text || text.length === 0) {
    return { isWrongLayout: false, decoded: text, original: text };
  }

  // Check if text contains only Latin letters (typical of wrong layout)
  const onlyLatin = /^[a-zA-Z\s\d\.,!?@#$%^&*()\-_=+\[\]{};:'"<>\/\\]+$/.test(text);
  
  if (!onlyLatin) {
    return { isWrongLayout: false, decoded: text, original: text };
  }

  // Try to decode using the map
  let decoded = text.toLowerCase();
  let hasMatches = false;
  
  // Sort by length descending to match longer patterns first
  const sortedKeys = Object.keys(RU_TO_EN_MAP).sort((a, b) => b.length - a.length);
  
  for (const en of sortedKeys) {
    if (decoded.includes(en)) {
      decoded = decoded.replace(new RegExp(en, 'g'), RU_TO_EN_MAP[en]!);
      hasMatches = true;
    }
  }

  // Check for patterns typical of Russian typed on English keyboard
  const suspiciousPatterns = /[jksdfghmnbvcxz]{3,}/i;
  const isSuspicious = suspiciousPatterns.test(text) || hasMatches;

  return {
    isWrongLayout: isSuspicious,
    decoded: isSuspicious ? decoded : text,
    original: text,
  };
}

/**
 * Get current system username
 */
function getCurrentUsername(): string {
  return os.userInfo().username;
}

/**
 * Get current system hostname
 */
function getCurrentHostname(): string {
  return os.hostname();
}

export interface SSHToolParams {
  /** Name of saved SSH profile (optional - use instead of host/user) */
  profile?: string;
  /** Hostname or IP address (required if no profile) */
  host?: string;
  /** Username for SSH (required if no profile) */
  user?: string;
  /** Command to execute on remote server */
  command?: string;
  /** SSH port number */
  port?: number;
  /** Path to SSH private key file */
  identity_file?: string;
  /** Password for authentication (not recommended) */
  password?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Description of the operation */
  description?: string;
}

/** Resolved SSH parameters after profile lookup */
interface ResolvedSSHParams {
  host: string;
  user: string;
  command?: string;
  port?: number;
  identity_file?: string;
  password?: string;
  timeout?: number;
  description?: string;
}

/**
 * Resolves SSH parameters from profile or direct parameters
 */
function resolveSSHParams(params: SSHToolParams): ResolvedSSHParams {
  // If profile is specified, load from storage
  if (params.profile) {
    const hostConfig = Storage.getSSHHost(params.profile);
    if (!hostConfig) {
      throw new Error(`SSH profile '${params.profile}' not found. Use ssh_add_host to create it.`);
    }

    // Merge profile with overrides
    return {
      host: hostConfig.host,
      user: hostConfig.user,
      port: params.port ?? hostConfig.port,
      identity_file: params.identity_file ?? hostConfig.identity_file,
      password: params.password ?? hostConfig.password,
      command: params.command,
      timeout: params.timeout,
      description: params.description,
    };
  }

  // Direct parameters - validate required fields
  if (!params.host) {
    throw new Error('Host is required (or specify a profile name).');
  }
  if (!params.user) {
    throw new Error('User is required (or specify a profile name).');
  }

  return {
    host: params.host,
    user: params.user,
    command: params.command,
    port: params.port,
    identity_file: params.identity_file,
    password: params.password,
    timeout: params.timeout,
    description: params.description,
  };
}

/**
 * Escapes a command for safe passing to SSH.
 * Wraps in single quotes and escapes any existing single quotes.
 * This prevents local shell expansion of ~, $, etc.
 */
function escapeSSHCommand(command: string): string {
  // Escape single quotes by ending the quote, adding escaped quote, and starting new quote
  // 'command'with'quotes' becomes: 'command'\''with'\''quotes'
  const escaped = command.replace(/'/g, "'\\''");
  return `'${escaped}'`;
}

/**
 * Builds an SSH command string from the parameters.
 */
function buildSSHCommand(params: ResolvedSSHParams): string {
  const parts = ['ssh'];

  // Add port if specified
  if (params.port) {
    parts.push('-p', String(params.port));
  }

  // Add identity file if specified
  if (params.identity_file) {
    parts.push('-i', params.identity_file);
  }

  // Add common SSH options
  parts.push('-o', 'StrictHostKeyChecking=accept-new');
  parts.push('-o', 'ConnectTimeout=30');

  // Allocate PTY for better output formatting (colors, columns, etc.)
  parts.push('-t');

  // Add timeout for command execution
  if (params.timeout) {
    parts.push('-o', `ServerAliveInterval=${Math.floor(params.timeout / 1000)}`);
  }

  // Add user@host
  parts.push(`${params.user}@${params.host}`);

  // Add command if specified - wrap in single quotes to prevent local shell expansion
  // This ensures ~ and $ are interpreted on the REMOTE server, not locally
  if (params.command) {
    // Set COLUMNS environment variable for better output formatting
    // This ensures commands like 'ls' display in columns instead of one per line
    const commandWithColumns = `COLUMNS=120 ${params.command}`;
    parts.push(escapeSSHCommand(commandWithColumns));
  }

  return parts.join(' ');
}

export class SSHToolInvocation extends BaseToolInvocation<
  SSHToolParams,
  ToolResult
> {
  private resolvedParams: ResolvedSSHParams;

  constructor(
    private readonly config: Config,
    params: SSHToolParams,
    private readonly allowlist: Set<string>,
  ) {
    super(params);
    // Resolve params at construction time (throws if profile not found)
    this.resolvedParams = resolveSSHParams(params);
  }

  getDescription(): string {
    const host = `${this.resolvedParams.user}@${this.resolvedParams.host}`;
    const port = this.resolvedParams.port ? `:${this.resolvedParams.port}` : '';
    let description = `ssh ${host}${port}`;

    if (this.resolvedParams.command) {
      description += ` "${this.resolvedParams.command}"`;
    }

    if (this.params.profile) {
      description += ` [profile: ${this.params.profile}]`;
    }

    if (this.resolvedParams.description) {
      description += ` (${this.resolvedParams.description.replace(/\n/g, ' ')})`;
    }

    return description;
  }

  override async shouldConfirmExecute(
    _abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false> {
    // Check if SSH was already approved with "ProceedAlways"
    if (this.allowlist.has('ssh')) {
      return false; // No confirmation needed - already approved
    }

    // Require confirmation for SSH connections for security
    const confirmationDetails: ToolExecuteConfirmationDetails = {
      type: 'exec',
      title: 'Confirm SSH Connection',
      command: buildSSHCommand(this.resolvedParams),
      rootCommand: 'ssh',
      onConfirm: async (
        outcome: ToolConfirmationOutcome,
        _payload?: ToolConfirmationPayload,
      ) => {
        if (outcome === ToolConfirmationOutcome.ProceedAlways) {
          this.allowlist.add('ssh');
        }
      },
    };
    return confirmationDetails;
  }

  async execute(
    signal: AbortSignal,
    updateOutput?: (output: ToolResultDisplay) => void,
    shellExecutionConfig?: ShellExecutionConfig,
  ): Promise<ToolResult> {
    if (signal.aborted) {
      return {
        llmContent: 'SSH connection was cancelled by user before it could start.',
        returnDisplay: 'Connection cancelled by user.',
      };
    }

    const sshCommand = buildSSHCommand(this.resolvedParams);
    const effectiveTimeout = this.resolvedParams.timeout ?? 60000; // Default 1 minute for SSH

    try {
      let cumulativeOutput: string | AnsiOutput = '';
      let lastUpdateTime = Date.now();
      const OUTPUT_UPDATE_INTERVAL_MS = 1000;

      // Create timeout signal
      const timeoutSignal = AbortSignal.timeout(effectiveTimeout);
      const combinedSignal = abortSignalAny([signal, timeoutSignal]);

      const { result: resultPromise } = await ShellExecutionService.execute(
        sshCommand,
        this.config.getTargetDir(),
        (event) => {
          if (event.type === 'data') {
            cumulativeOutput = event.chunk;
            if (updateOutput && Date.now() - lastUpdateTime > OUTPUT_UPDATE_INTERVAL_MS) {
              const outputDisplay = typeof cumulativeOutput === 'string'
                ? cumulativeOutput
                : { ansiOutput: cumulativeOutput };
              updateOutput(outputDisplay);
              lastUpdateTime = Date.now();
            }
          }
        },
        combinedSignal,
        this.config.getShouldUseNodePtyShell(),
        shellExecutionConfig ?? {},
      );

      const result = await resultPromise;

      let llmContent = '';
      if (result.aborted) {
        const wasTimeout = timeoutSignal.aborted && !signal.aborted;
        if (wasTimeout) {
          llmContent = `SSH connection timed out after ${effectiveTimeout}ms.`;
        } else {
          llmContent = 'SSH connection was cancelled by user.';
        }
        if (result.output.trim()) {
          llmContent += `\nOutput before ${wasTimeout ? 'timeout' : 'cancellation'}:\n${result.output}`;
        }
      } else {
        llmContent = [
          `SSH Connection: ${this.resolvedParams.user}@${this.resolvedParams.host}${this.resolvedParams.port ? `:${this.resolvedParams.port}` : ''}`,
          `Command: ${this.resolvedParams.command || '(interactive shell)'}`,
          `Output: ${result.output || '(empty)'}`,
          `Exit Code: ${result.exitCode ?? '(none)'}`,
          result.error ? `Error: ${result.error.message}` : '',
        ].filter(Boolean).join('\n');
      }

      const executionError = result.error
        ? {
            error: {
              message: result.error.message,
              type: ToolErrorType.SHELL_EXECUTE_ERROR,
            },
          }
        : {};

      return {
        llmContent,
        returnDisplay: result.output || `SSH ${result.aborted ? 'cancelled' : 'completed'}`,
        ...executionError,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLogger.error('SSH execution error:', errorMessage);

      return {
        llmContent: `SSH connection failed: ${errorMessage}`,
        returnDisplay: `Connection failed: ${getErrorMessage(error as Error)}`,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }
}

function getSSHToolDescription(): string {
  const currentUser = getCurrentUsername();
  const currentHost = getCurrentHostname();
  
  return `Connects to a remote machine via SSH and executes commands.

This tool provides secure SSH connectivity to remote servers for remote command execution, system administration, and file operations.

**Current System Info:**
- Your local username: "${currentUser}"
- Your local hostname: "${currentHost}"

**Usage Modes:**

1. **Using saved profile (recommended):**
   \`{ "profile": "myserver", "command": "docker ps" }\`

2. **Direct connection:**
   \`{ "host": "192.168.1.100", "user": "admin", "command": "ls -la" }\`

3. **Connect as current user:**
   \`{ "host": "192.168.1.100", "user": "${currentUser}", "command": "whoami" }\`

**Parameters:**
- \`profile\` - Name of a saved SSH profile (use ssh_add_host to create profiles)
- \`host\` - Hostname or IP address (required if no profile)
- \`user\` - Username for SSH (required if no profile). Default suggestion: "${currentUser}"
- \`command\` - Command to execute on the remote server
- \`port\` - SSH port number (default: 22)
- \`identity_file\` - Path to SSH private key file (recommended)
- \`password\` - Password (not recommended, use identity_file instead)
- \`timeout\` - Timeout in milliseconds (max 600000, default 60000)

**Security notes:**
- SSH connections always require user confirmation
- Use \`ssh_add_host\` to save SSH profiles with credentials
- Use \`ssh_list_hosts\` to see available profiles
- Use \`ssh_remove_host\` to delete saved profiles

**Examples:**
1. Using a saved profile:
   \`{ "profile": "production", "command": "systemctl status nginx" }\`

2. Direct connection with key:
   \`{ "host": "server.com", "user": "deploy", "port": 2222, "identity_file": "~/.ssh/deploy_key", "command": "docker ps" }\`

3. Interactive shell (no command):
   \`{ "profile": "dev-server" }\`

4. Quick connect to known server as current user:
   \`{ "host": "192.168.1.131", "user": "${currentUser}", "command": "ls /" }\`
`;
}

export class SSHTool extends BaseDeclarativeTool<
  SSHToolParams,
  ToolResult
> {
  static Name: string = 'ssh_connect';
  // Static allowlist to persist across all instances
  private static allowlist: Set<string> = new Set();

  constructor(private readonly config: Config) {
    super(
      SSHTool.Name,
      'SSH',
      getSSHToolDescription(),
      Kind.Execute,
      {
        type: 'object',
        properties: {
          profile: {
            type: 'string',
            description: 'Name of saved SSH profile (use ssh_add_host to create). Alternative to host/user.',
          },
          host: {
            type: 'string',
            description: 'The hostname or IP address of the remote server (or use profile).',
          },
          user: {
            type: 'string',
            description: 'The username for SSH authentication (or use profile).',
          },
          command: {
            type: 'string',
            description: 'The command to execute on the remote server. Leave empty for interactive shell.',
          },
          port: {
            type: 'number',
            description: 'SSH port number (default: 22).',
          },
          identity_file: {
            type: 'string',
            description: 'Path to SSH private key file for key-based authentication.',
          },
          password: {
            type: 'string',
            description: 'Password for password authentication (discouraged, use identity_file instead).',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (max 600000, default 60000).',
          },
          description: {
            type: 'string',
            description: 'Brief description of what this SSH connection does.',
          },
        },
        required: [], // profile OR host+user required (validated in validateToolParamValues)
      },
      false, // output is not markdown
      true, // output can be updated
    );
  }

  protected override validateToolParamValues(params: SSHToolParams): string | null {
    const warnings: string[] = [];
    const currentUser = getCurrentUsername();
    
    // Check for wrong keyboard layout in user and password
    if (params.user) {
      const userCheck = detectWrongKeyboardLayout(params.user);
      if (userCheck.isWrongLayout) {
        warnings.push(`⚠️ Username "${params.user}" appears to be typed with wrong keyboard layout. Did you mean "${userCheck.decoded}"?`);
      }
    }
    
    if (params.password) {
      const passCheck = detectWrongKeyboardLayout(params.password);
      if (passCheck.isWrongLayout) {
        warnings.push(`⚠️ Password appears to be typed with wrong keyboard layout. Decoded: "${passCheck.decoded}". Consider re-typing with correct layout.`);
      }
      
      // Warn about suspiciously short passwords
      if (params.password.length < 4) {
        warnings.push(`⚠️ Password is very short (${params.password.length} chars). Are you sure this is correct?`);
      }
    }
    
    // Check host parameter
    if (params.host) {
      const hostCheck = detectWrongKeyboardLayout(params.host);
      if (hostCheck.isWrongLayout) {
        warnings.push(`⚠️ Host "${params.host}" appears to be typed with wrong keyboard layout. Did you mean "${hostCheck.decoded}"?`);
      }
    }
    
    // Either profile OR (host + user) must be specified
    if (params.profile) {
      // Profile specified - validate it exists
      const hostConfig = Storage.getSSHHost(params.profile);
      if (!hostConfig) {
        return `SSH profile '${params.profile}' not found. Use ssh_add_host to create it, or use ssh_list_hosts to see available profiles.`;
      }
    } else {
      // No profile - host and user are required
      if (!params.host?.trim()) {
        return 'Host is required when not using a profile. Alternatively, specify a profile name.';
      }
      if (!params.user?.trim()) {
        // Suggest current username
        return `User is required when not using a profile. Tip: Your current username is "${currentUser}". Use it or specify another user.`;
      }
    }

    if (params.port !== undefined) {
      if (typeof params.port !== 'number' || !Number.isInteger(params.port)) {
        return 'Port must be an integer.';
      }
      if (params.port < 1 || params.port > 65535) {
        return 'Port must be between 1 and 65535.';
      }
    }
    if (params.timeout !== undefined) {
      if (typeof params.timeout !== 'number' || !Number.isInteger(params.timeout)) {
        return 'Timeout must be an integer number of milliseconds.';
      }
      if (params.timeout <= 0) {
        return 'Timeout must be a positive number.';
      }
      if (params.timeout > 600000) {
        return 'Timeout cannot exceed 600000ms (10 minutes).';
      }
    }
    
    // Return warnings if any (they don't block execution but inform the model)
    if (warnings.length > 0) {
      // Log warnings for debugging
      debugLogger.warn('SSH parameter warnings:', warnings.join('; '));
    }
    
    return null;
  }

  protected createInvocation(
    params: SSHToolParams,
  ): ToolInvocation<SSHToolParams, ToolResult> {
    return new SSHToolInvocation(this.config, params, SSHTool.allowlist);
  }
}
