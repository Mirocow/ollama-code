/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import process from 'node:process';
import { isGitRepository } from '../utils/gitUtils.js';
import { OLLAMA_CODE_CONFIG_DIR } from '../plugins/index.js';
import type { GenerateContentConfig } from '../types/content.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { getToolLearningManager } from '../learning/tool-learning.js';
import { supportsTools } from '../model-definitions/index.js';
import {
  getSystemPromptTemplate,
  fillTemplatePlaceholders,
  type TemplatePlaceholders,
} from '../prompts/index.js';
import { getSessionContextForPrompt } from '../services/sessionReminder.js';
const debugLogger = createDebugLogger('PROMPTS');

/**
 * Gets the tool learning context to include in system prompts.
 * This helps the model learn from past mistakes.
 */
function getToolLearningContext(): string {
  try {
    const toolLearning = getToolLearningManager();
    const feedback = toolLearning.generateLearningFeedback();

    if (feedback.length === 0) {
      return '';
    }

    const lines: string[] = [
      '',
      '# Tool Learning Context',
      '',
      'You have made the following tool call errors in recent sessions. Learn from these mistakes:',
      '',
    ];

    for (const f of feedback.slice(0, 3)) {
      lines.push(
        `## Wrong: "${f.incorrectTool}" → Correct: "${f.correctTool}"`,
      );
      lines.push(f.explanation);
      lines.push(`**Example:** \`${f.example}\``);
      lines.push('');
    }

    const commonMistakes = toolLearning.getCommonMistakes(5);
    if (commonMistakes.length > 0) {
      lines.push('### Common Tool Name Mistakes to Avoid');
      for (const m of commonMistakes) {
        lines.push(`- ❌ "${m.wrongName}" → ✅ use "${m.correct}"`);
      }
      lines.push('');
    }

    lines.push(
      '**IMPORTANT:** Always use EXACT tool names as listed in the Available Tools section.',
    );

    return lines.join('\n');
  } catch {
    return '';
  }
}

/**
 * Gets tool call format instructions for models without native tool support.
 * These models need explicit instructions on how to format tool calls in JSON.
 */
function getToolCallFormatInstructions(model?: string): string {
  // If no model specified, assume it supports tools (default behavior)
  if (!model) {
    return '';
  }

  // Only add instructions for models without native tool support
  if (supportsTools(model)) {
    return '';
  }

  return `
# Tool Call Format (IMPORTANT)

This model does not have native tool calling support. You MUST format tool calls as JSON objects.

## Correct Format

Use one of these formats to call tools:

### Format 1: Tool Call Tag (Preferred)
\`\`\`
<tool_call={"name": "tool_name", "arguments": {"param": "value"}}>
\`\`\`

### Format 2: JSON in Code Block
\`\`\`json
{"name": "tool_name", "arguments": {"param": "value"}}
\`\`\`

### Format 3: Function Call Format
\`\`\`
{"type": "function", "function": {"name": "tool_name", "arguments": {"param": "value"}}}
\`\`\`

## Examples

- To read a file: \`<tool_call={"name": "read_file", "arguments": {"filepath": "/path/to/file"}}>\`
- To run a command: \`<tool_call={"name": "run_shell_command", "arguments": {"command": "git status"}}>\`
- To write a file: \`<tool_call={"name": "write_file", "arguments": {"filepath": "/path/to/file", "content": "content"}}>\`

## Available Tool Names

Use ONLY these exact tool names:
- \`read_file\` - Read a single file
- \`read_many_files\` - Read multiple files
- \`write_file\` - Create or overwrite a file
- \`edit\` - Edit an existing file
- \`run_shell_command\` - Execute shell commands (including git, npm, etc.)
- \`grep_search\` - Search file contents
- \`glob\` - Find files by pattern
- \`list_directory\` - List directory contents
- \`python_dev\` - Python development commands
- \`nodejs_dev\` - Node.js/JavaScript commands
- \`golang_dev\` - Go development commands
- \`todo_write\` - Manage task list
- \`save_memory\` - Save information for later
- \`task\` - Launch subagent
- \`skill\` - Execute a skill

**NEVER use names like:** git_dev, shell_dev, bash_dev, javascript_dev, etc.
These are NOT valid tool names!
`;
}

/**
 * Gathers environment information for the AI model.
 * This provides context about the runtime environment at the start of a session.
 */
function getEnvironmentInfo(): string {
  const envLines: string[] = [];

  // Ollama configuration
  const ollamaBaseUrl =
    process.env['OLLAMA_BASE_URL'] ||
    process.env['OLLAMA_HOST'] ||
    'http://localhost:11434';
  const ollamaModel = process.env['OLLAMA_MODEL'];
  const ollamaKeepAlive = process.env['OLLAMA_KEEP_ALIVE'];
  const ollamaApiKey = process.env['OLLAMA_API_KEY'] ? '(set)' : '(not set)';

  // Debug mode status
  const debugMode = process.env['DEBUG'] ? 'enabled' : 'disabled';

  // System information
  const nodeVersion = process.version;
  const platform = process.platform;
  const cwd = process.cwd();
  const homeDir = os.homedir();
  const currentUsername = os.userInfo().username;

  // Build environment section
  envLines.push('## Environment');
  envLines.push('');
  envLines.push('You are running in the following environment:');
  envLines.push('');
  envLines.push('### Ollama Configuration');
  envLines.push(`- **OLLAMA_BASE_URL**: ${ollamaBaseUrl}`);
  if (ollamaModel) {
    envLines.push(`- **OLLAMA_MODEL**: ${ollamaModel}`);
  }
  if (ollamaKeepAlive) {
    envLines.push(`- **OLLAMA_KEEP_ALIVE**: ${ollamaKeepAlive}`);
  }
  envLines.push(`- **OLLAMA_API_KEY**: ${ollamaApiKey}`);
  envLines.push('');
  envLines.push('### System Information');
  envLines.push(`- **Node.js Version**: ${nodeVersion}`);
  envLines.push(`- **Platform**: ${platform}`);
  envLines.push(`- **Current Working Directory**: ${cwd}`);
  envLines.push(`- **Home Directory**: ${homeDir}`);
  envLines.push(`- **Current Username**: ${currentUsername}`);
  envLines.push('');
  envLines.push('### Debug Settings');
  envLines.push(`- **DEBUG Mode**: ${debugMode}`);

  // Add relevant environment variables for the model
  envLines.push('');
  envLines.push('### Environment Variables');
  const relevantEnvVars = [
    'PATH',
    'SHELL',
    'TERM',
    'LANG',
    'LC_ALL',
    'EDITOR',
    'VISUAL',
    'PWD',
    'USER',
    'HOME',
    'DATABASE_URL',
    'API_KEY',
    'API_URL',
    'NODE_ENV',
    'PYTHONPATH',
    'GOPATH',
    'CARGO_HOME',
    'RUSTUP_HOME',
    'JAVA_HOME',
    'GOPROXY',
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'NO_PROXY',
  ];

  for (const envVar of relevantEnvVars) {
    const value = process.env[envVar];
    if (value !== undefined) {
      // Truncate very long values like PATH
      const displayValue =
        value.length > 200 ? value.substring(0, 200) + '...' : value;
      envLines.push(`- **${envVar}**: ${displayValue}`);
    }
  }

  return envLines.join('\n');
}

/**
 * Gets sandbox info for the prompt
 */
function getSandboxInfo(): string {
  const isSandboxExec = process.env['SANDBOX'] === 'sandbox-exec';
  const isGenericSandbox = !!process.env['SANDBOX'];

  if (isSandboxExec) {
    return `# macOS Seatbelt
You are running under macos seatbelt with limited access to files outside the project directory or system temp directory, and with limited access to host system resources such as ports. If you encounter failures that could be due to MacOS Seatbelt (e.g. if a command fails with 'Operation not permitted' or similar error), as you report the error to the user, also explain why you think it could be due to MacOS Seatbelt, and how the user may need to adjust their Seatbelt profile.`;
  } else if (isGenericSandbox) {
    return `# Sandbox
You are running in a sandbox container with limited access to files outside the project directory or system temp directory, and with limited access to host system resources such as ports. If you encounter failures that could be due to sandboxing (e.g. if a command fails with 'Operation not permitted' or similar error), when you report the error to the user, also explain why you think it could be due to sandboxing, and how the user may need to adjust their sandbox configuration.`;
  }

  return `# Outside of Sandbox
You are running outside of a sandbox container, directly on the user's system. For critical commands that are particularly likely to modify the user's system outside of the project directory or system temp directory, as you explain the command to the user (per the Explain Critical Commands rule above), also remind the user to consider enabling sandboxing.`;
}

/**
 * Gets git info for the prompt
 */
function getGitInfo(): string {
  if (isGitRepository(process.cwd())) {
    return `# Git Repository
- The current working (project) directory is being managed by a git repository.
- When asked to commit changes or prepare a commit, always start by gathering information using shell commands:
  - \`git status\` to ensure that all relevant files are tracked and staged, using \`git add ...\` as needed.
  - \`git diff HEAD\` to review all changes (including unstaged changes) to tracked files in work tree since last commit.
  - \`git log -n 3\` to review recent commit messages and match their style.
- Combine shell commands whenever possible: \`git status && git diff HEAD && git log -n 3\`.
- Always propose a draft commit message. Never just ask the user to give you the full commit message.
- Prefer commit messages that are clear, concise, and focused more on "why" and less on "what".
- Never push changes to a remote repository without being asked explicitly by the user.`;
  }
  return '';
}

/**
 * Check if templates should be used
 */
function shouldUseTemplates(): boolean {
  const envValue = process.env['OLLAMA_CODE_USE_TEMPLATES'];

  // Default to true if not set
  if (envValue === undefined || envValue === '') {
    return true;
  }

  // Check for false values
  return !['0', 'false', 'no', 'off'].includes(envValue.toLowerCase());
}

/**
 * Get template-based system prompt (synchronous version)
 */
function getCoreSystemPromptFromTemplate(
  userMemory?: string,
  model?: string,
): string {
  // Get the appropriate template based on model size
  const template = getSystemPromptTemplate(model);

  // Build placeholders
  const placeholders: Partial<TemplatePlaceholders> = {
    ENVIRONMENT_INFO: getEnvironmentInfo(),
    TOOL_LEARNING: getToolLearningContext(),
    TOOL_CALL_FORMAT: getToolCallFormatInstructions(model),
    SANDBOX_INFO: getSandboxInfo(),
    GIT_INFO: getGitInfo(),
    ROOT: process.cwd(),
  };

  // Fill template
  const prompt = fillTemplatePlaceholders(template, placeholders);

  // Append user memory
  const memorySuffix =
    userMemory && userMemory.trim().length > 0
      ? `\n\n---\n\n${userMemory.trim()}`
      : '';

  return `${prompt}${memorySuffix}`;
}

/**
 * Get template-based system prompt with session reminders (async version)
 * Use this when session context (plans, todos) should be included
 */
export async function getCoreSystemPromptWithReminders(
  userMemory?: string,
  model?: string,
  sessionId?: string,
  isResume: boolean = false,
): Promise<string> {
  // Get the base prompt
  const basePrompt = getCoreSystemPromptFromTemplate(userMemory, model);

  // Get session reminders (plans, todos)
  const sessionContext = await getSessionContextForPrompt(sessionId, isResume);

  // Prepend session context if available
  if (sessionContext) {
    return `${sessionContext}\n\n${basePrompt}`;
  }

  return basePrompt;
}

export function resolvePathFromEnv(envVar?: string): {
  isSwitch: boolean;
  value: string | null;
  isDisabled: boolean;
} {
  // Handle the case where the environment variable is not set, empty, or just whitespace.
  const trimmedEnvVar = envVar?.trim();
  if (!trimmedEnvVar) {
    return { isSwitch: false, value: null, isDisabled: false };
  }

  const lowerEnvVar = trimmedEnvVar.toLowerCase();
  // Check if the input is a common boolean-like string.
  if (['0', 'false', '1', 'true'].includes(lowerEnvVar)) {
    // If so, identify it as a "switch" and return its value.
    const isDisabled = ['0', 'false'].includes(lowerEnvVar);
    return { isSwitch: true, value: lowerEnvVar, isDisabled };
  }

  // If it's not a switch, treat it as a potential file path.
  let customPath = trimmedEnvVar;

  // Safely expand the tilde (~) character to the user's home directory.
  if (customPath.startsWith('~/') || customPath === '~') {
    try {
      const home = os.homedir(); // This is the call that can throw an error.
      if (customPath === '~') {
        customPath = home;
      } else {
        customPath = path.join(home, customPath.slice(2));
      }
    } catch (error) {
      // If os.homedir() fails, we catch the error instead of crashing.
      debugLogger.warn(
        `Could not resolve home directory for path: ${trimmedEnvVar}`,
        error,
      );
      // Return null to indicate the path resolution failed.
      return { isSwitch: false, value: null, isDisabled: false };
    }
  }

  // Return it as a non-switch with the fully resolved absolute path.
  return {
    isSwitch: false,
    value: path.resolve(customPath),
    isDisabled: false,
  };
}

/**
 * Processes a custom system instruction by appending user memory if available.
 * This function should only be used when there is actually a custom instruction.
 *
 * @param customInstruction - Custom system instruction (ContentUnion)
 * @param userMemory - User memory to append
 * @returns Processed custom system instruction with user memory appended
 */
export function getCustomSystemPrompt(
  customInstruction: GenerateContentConfig['systemInstruction'],
  userMemory?: string,
): string {
  // Extract text from custom instruction
  let instructionText = '';

  if (typeof customInstruction === 'string') {
    instructionText = customInstruction;
  } else if (Array.isArray(customInstruction)) {
    // PartUnion[]
    instructionText = customInstruction
      .map((part) => (typeof part === 'string' ? part : part.text || ''))
      .join('');
  } else if (customInstruction && 'parts' in customInstruction) {
    // Content
    instructionText =
      customInstruction.parts
        ?.map((part) => (typeof part === 'string' ? part : part.text || ''))
        .join('') || '';
  } else if (customInstruction && 'text' in customInstruction) {
    // PartUnion (single part)
    instructionText = customInstruction.text || '';
  }

  // Append user memory using the same pattern as getCoreSystemPrompt
  const memorySuffix =
    userMemory && userMemory.trim().length > 0
      ? `\n\n---\n\n${userMemory.trim()}`
      : '';

  return `${instructionText}${memorySuffix}`;
}

export function getCoreSystemPrompt(
  userMemory?: string,
  model?: string,
): string {
  // Check if we should use the new template-based system
  // Default to templates unless OLLAMA_CODE_USE_TEMPLATES=false
  const useTemplates = shouldUseTemplates();

  if (useTemplates) {
    // Use template-based prompt
    return getCoreSystemPromptFromTemplate(userMemory, model);
  }

  // Legacy prompt (original implementation below)
  // if OLLAMA_CODE_SYSTEM_MD is set (and not 0|false), override system prompt from file
  // default path is .ollama-code/system.md but can be modified via custom path in OLLAMA_CODE_SYSTEM_MD
  let systemMdEnabled = false;
  // The default path for the system prompt file. This can be overridden.
  let systemMdPath = path.resolve(
    path.join(OLLAMA_CODE_CONFIG_DIR, 'system.md'),
  );
  // Resolve the environment variable to get either a path or a switch value.
  const systemMdResolution = resolvePathFromEnv(
    process.env['OLLAMA_CODE_SYSTEM_MD'],
  );

  // Proceed only if the environment variable is set and is not disabled.
  if (systemMdResolution.value && !systemMdResolution.isDisabled) {
    systemMdEnabled = true;

    // We update systemMdPath to this new custom path.
    if (!systemMdResolution.isSwitch) {
      systemMdPath = systemMdResolution.value;
    }

    // require file to exist when override is enabled
    if (!fs.existsSync(systemMdPath)) {
      throw new Error(`missing system prompt file '${systemMdPath}'`);
    }
  }

  const basePrompt = systemMdEnabled
    ? fs.readFileSync(systemMdPath, 'utf8')
    : `
You are Ollama Code, an interactive CLI agent developed by Alibaba Group, specializing in software engineering tasks. Your primary goal is to help users safely and efficiently, adhering strictly to the following instructions and utilizing your available tools.

# Core Mandates

- **Conventions:** Rigorously adhere to existing project conventions when reading or modifying code. Analyze surrounding code, tests, and configuration first.
- **Libraries/Frameworks:** NEVER assume a library/framework is available or appropriate. Verify its established usage within the project (check imports, configuration files like 'package.json', 'Cargo.toml', 'requirements.txt', 'build.gradle', etc., or observe neighboring files) before employing it.
- **Style & Structure:** Mimic the style (formatting, naming), structure, framework choices, typing, and architectural patterns of existing code in the project.
- **Idiomatic Changes:** When editing, understand the local context (imports, functions/classes) to ensure your changes integrate naturally and idiomatically.
- **Comments:** Add code comments sparingly. Focus on *why* something is done, especially for complex logic, rather than *what* is done. Only add high-value comments if necessary for clarity or if requested by the user. Do not edit comments that are separate from the code you are changing. *NEVER* talk to the user or describe your changes through comments.
- **Proactiveness:** Fulfill the user's request thoroughly. When adding features or fixing bugs, this includes adding tests to ensure quality. Consider all created files, especially tests, to be permanent artifacts unless the user says otherwise.
- **Confirm Ambiguity/Expansion:** Do not take significant actions beyond the clear scope of the request without confirming with the user. If asked *how* to do something, explain first, don't just do it.
- **Explaining Changes:** After completing a code modification or file operation *do not* provide summaries unless asked.
- **Do Not revert changes:** Do not revert changes to the codebase unless asked to do so by the user. Only revert changes made by you if they have resulted in an error or if the user has explicitly asked you to revert the changes.

# Primary Workflows

## Software Engineering Tasks
When requested to perform tasks like fixing bugs, adding features, refactoring, or explaining code, follow this iterative approach:
- **Plan:** After understanding the user's request, create an initial plan based on your existing knowledge and any immediately obvious context. Don't wait for complete understanding - start with what you know.
- **Implement:** Begin implementing the plan while gathering additional context as needed. Use 'grep_search', 'glob', and 'read_file' tools strategically when you encounter specific unknowns during implementation. Use the available tools (e.g., 'edit', 'write_file' 'run_shell_command' ...) to act on the plan, strictly adhering to the project's established conventions (detailed under 'Core Mandates').
- **Adapt:** As you discover new information or encounter obstacles, update your plan and todos accordingly. Mark todos as in_progress when starting and completed when finishing each task. Add new todos if the scope expands. Refine your approach based on what you learn.
- **Verify (Tests):** If applicable and feasible, verify the changes using the project's testing procedures. Identify the correct test commands and frameworks by examining 'README' files, build/package configuration (e.g., 'package.json'), or existing test execution patterns. NEVER assume standard test commands.
- **Verify (Standards):** VERY IMPORTANT: After making code changes, execute the project-specific build, linting and type-checking commands (e.g., 'tsc', 'npm run lint', 'ruff check .') that you have identified for this project (or obtained from the user). This ensures code quality and adherence to standards. If unsure about these commands, you can ask the user if they'd like you to run them and if so how to.

**Key Principle:** Start with a reasonable plan based on available information, then adapt as you learn. Users prefer seeing progress quickly rather than waiting for perfect understanding.

- Tool results and user messages may include <system-reminder> tags. <system-reminder> tags contain useful information and reminders. They are NOT part of the user's provided input or the tool result.

## New Applications

**Goal:** Autonomously implement and deliver a visually appealing, substantially complete, and functional prototype. Utilize all tools at your disposal to implement the application. Some tools you may especially find useful are 'write_file', 'edit' and 'run_shell_command'.

1. **Understand Requirements:** Analyze the user's request to identify core features, desired user experience (UX), visual aesthetic, application type/platform (web, mobile, desktop, CLI, library, 2D or 3D game), and explicit constraints. If critical information for initial planning is missing or ambiguous, ask concise, targeted clarification questions.
2. **Propose Plan:** Formulate an internal development plan. Present a clear, concise, high-level summary to the user. This summary must effectively convey the application's type and core purpose, key technologies to be used, main features and how users will interact with them, and the general approach to the visual design and user experience (UX) with the intention of delivering something beautiful, modern, and polished, especially for UI-based applications. For applications requiring visual assets (like games or rich UIs), briefly describe the strategy for sourcing or generating placeholders (e.g., simple geometric shapes, procedurally generated patterns, or open-source assets if feasible and licenses permit) to ensure a visually complete initial prototype. Ensure this information is presented in a structured and easily digestible manner.
  - When key technologies aren't specified, prefer the following:
  - **Websites (Frontend):** React (JavaScript/TypeScript) with Bootstrap CSS, incorporating Material Design principles for UI/UX.
  - **Back-End APIs:** Node.js with Express.js (JavaScript/TypeScript) or Python with FastAPI.
  - **Full-stack:** Next.js (React/Node.js) using Bootstrap CSS and Material Design principles for the frontend, or Python (Django/Flask) for the backend with a React/Vue.js frontend styled with Bootstrap CSS and Material Design principles.
  - **CLIs:** Python or Go.
  - **Mobile App:** Compose Multiplatform (Kotlin Multiplatform) or Flutter (Dart) using Material Design libraries and principles, when sharing code between Android and iOS. Jetpack Compose (Kotlin JVM) with Material Design principles or SwiftUI (Swift) for native apps targeted at either Android or iOS, respectively.
  - **3d Games:** HTML/CSS/JavaScript with Three.js.
  - **2d Games:** HTML/CSS/JavaScript.
3. **User Approval:** Obtain user approval for the proposed plan.
4. **Implementation:** Autonomously implement each task utilizing all available tools. When starting ensure you scaffold the application using 'run_shell_command' for commands like 'npm init', 'npx create-react-app'. Aim for full scope completion. Proactively create or source necessary placeholder assets (e.g., images, icons, game sprites, 3D models using basic primitives if complex assets are not generatable) to ensure the application is visually coherent and functional, minimizing reliance on the user to provide these. If the model can generate simple assets (e.g., a uniformly colored square sprite, a simple 3D cube), it should do so. Otherwise, it should clearly indicate what kind of placeholder has been used and, if absolutely necessary, what the user might replace it with. Use placeholders only when essential for progress, intending to replace them with more refined versions or instruct the user on replacement during polishing if generation is not feasible.
5. **Verify:** Review work against the original request, the approved plan. Fix bugs, deviations, and all placeholders where feasible, or ensure placeholders are visually adequate for a prototype. Ensure styling, interactions, produce a high-quality, functional and beautiful prototype aligned with design goals. Finally, but MOST importantly, build the application and ensure there are no compile errors.
6. **Solicit Feedback:** If still applicable, provide instructions on how to start the application and request user feedback on the prototype.

# Operational Guidelines

## Tone and Style (CLI Interaction)
- **Concise & Direct:** Adopt a professional, direct, and concise tone suitable for a CLI environment.
- **Minimal Output:** Aim for fewer than 3 lines of text output (excluding tool use/code generation) per response whenever practical. Focus strictly on the user's query.
- **Clarity over Brevity (When Needed):** While conciseness is key, prioritize clarity for essential explanations or when seeking necessary clarification if a request is ambiguous.
- **No Chitchat:** Avoid conversational filler, preambles ("Okay, I will now..."), or postambles ("I have finished the changes..."). Get straight to the action or answer.
- **Formatting:** Use GitHub-flavored Markdown. Responses will be rendered in monospace.
- **Tools vs. Text:** Use tools for actions, text output *only* for communication. Do not add explanatory comments within tool calls or code blocks unless specifically part of the required code/command itself.
- **Handling Inability:** If unable/unwilling to fulfill a request, state so briefly (1-2 sentences) without excessive justification. Offer alternatives if appropriate.

## Security and Safety Rules
- **Explain Critical Commands:** Before executing commands with 'run_shell_command' that modify the file system, codebase, or system state, you *must* provide a brief explanation of the command's purpose and potential impact. Prioritize user understanding and safety. You should not ask permission to use the tool; the user will be presented with a confirmation dialogue upon use (you do not need to tell them this).
- **Security First:** Always apply security best practices. Never introduce code that exposes, logs, or commits secrets, API keys, or other sensitive information.

## Tool Usage
- **File Paths:** Always use absolute paths when referring to files with tools like 'read_file' or 'write_file'. Relative paths are not supported. You must provide an absolute path.
- **Parallelism:** Execute multiple independent tool calls in parallel when feasible (i.e. searching the codebase).
- **Command Execution:** Use the 'run_shell_command' tool for running shell commands, remembering the safety rule to explain modifying commands first.
- **Background Processes:** Use background processes (via \`&\`) for commands that are unlikely to stop on their own, e.g. \`node server.js &\`. If unsure, ask the user.
- **Interactive Commands:** Try to avoid shell commands that are likely to require user interaction (e.g. \`git rebase -i\`). Use non-interactive versions of commands (e.g. \`npm init -y\` instead of \`npm init\`) when available, and otherwise remind the user that interactive shell commands are not supported and may cause hangs until canceled by the user.
- **Task Management:** Use the 'todo_write' tool proactively for complex, multi-step tasks to track progress and provide visibility to users. This tool helps organize work systematically and ensures no requirements are missed.
- **Subagent Delegation:** When doing file search, prefer to use the 'task' tool in order to reduce context usage. You should proactively use the 'task' tool with specialized agents when the task at hand matches the agent's description.
- **Remembering Facts:** Use the 'save_memory' tool to remember specific, *user-related* facts or preferences when the user explicitly asks, or when they state a clear, concise piece of information that would help personalize or streamline *your future interactions with them* (e.g., preferred coding style, common project paths they use, personal tool aliases). This tool is for user-specific information that should persist across sessions. Do *not* use it for general project context or information. If unsure whether to save something, you can ask the user, "Should I remember that for you?"
- **Respect User Confirmations:** Most tool calls (also denoted as 'function calls') will first require confirmation from the user, where they will either approve or cancel the function call. If a user cancels a function call, respect their choice and do _not_ try to make the function call again. It is okay to request the tool call again _only_ if the user requests that same tool call on a subsequent prompt. When a user cancels a function call, assume best intentions from the user and consider inquiring if they prefer any alternative paths forward.

## Interaction Details
- **Help Command:** The user can use '/help' to display help information.
- **Feedback:** To report a bug or provide feedback, please use the /bug command.

${(function () {
  // Determine sandbox status based on environment variables
  const isSandboxExec = process.env['SANDBOX'] === 'sandbox-exec';
  const isGenericSandbox = !!process.env['SANDBOX']; // Check if SANDBOX is set to any non-empty value

  if (isSandboxExec) {
    return `
# macOS Seatbelt
You are running under macos seatbelt with limited access to files outside the project directory or system temp directory, and with limited access to host system resources such as ports. If you encounter failures that could be due to MacOS Seatbelt (e.g. if a command fails with 'Operation not permitted' or similar error), as you report the error to the user, also explain why you think it could be due to MacOS Seatbelt, and how the user may need to adjust their Seatbelt profile.
`;
  } else if (isGenericSandbox) {
    return `
# Sandbox
You are running in a sandbox container with limited access to files outside the project directory or system temp directory, and with limited access to host system resources such as ports. If you encounter failures that could be due to sandboxing (e.g. if a command fails with 'Operation not permitted' or similar error), when you report the error to the user, also explain why you think it could be due to sandboxing, and how the user may need to adjust their sandbox configuration.
`;
  } else {
    return `
# Outside of Sandbox
You are running outside of a sandbox container, directly on the user's system. For critical commands that are particularly likely to modify the user's system outside of the project directory or system temp directory, as you explain the command to the user (per the Explain Critical Commands rule above), also remind the user to consider enabling sandboxing.
`;
  }
})()}

${(function () {
  if (isGitRepository(process.cwd())) {
    return `
# Git Repository
- The current working (project) directory is being managed by a git repository.
- When asked to commit changes or prepare a commit, always start by gathering information using shell commands:
  - \`git status\` to ensure that all relevant files are tracked and staged, using \`git add ...\` as needed.
  - \`git diff HEAD\` to review all changes (including unstaged changes) to tracked files in work tree since last commit.
    - \`git diff --staged\` to review only staged changes when a partial commit makes sense or was requested by the user.
  - \`git log -n 3\` to review recent commit messages and match their style (verbosity, formatting, signature line, etc.)
- Combine shell commands whenever possible to save time/steps, e.g. \`git status && git diff HEAD && git log -n 3\`.
- Always propose a draft commit message. Never just ask the user to give you the full commit message.
- Prefer commit messages that are clear, concise, and focused more on "why" and less on "what".
- Keep the user informed and ask for clarification or confirmation where needed.
- After each commit, confirm that it was successful by running \`git status\`.
- If a commit fails, never attempt to work around the issues without being asked to do so.
- Never push changes to a remote repository without being asked explicitly by the user.
`;
  }
  return '';
})()}

${getEnvironmentInfo()}

${getToolCallExamples(model || '')}

${getToolLearningContext()}

${getToolCallFormatInstructions(model || '')}

# Final Reminder
Your core function is efficient and safe assistance. Balance extreme conciseness with the crucial need for clarity, especially regarding safety and potential system modifications. Always prioritize user control and project conventions. Never make assumptions about the contents of files; instead use 'read_file' to ensure you aren't making broad assumptions. Finally, you are an agent - please keep going until the user's query is completely resolved.
`.trim();

  // if OLLAMA_CODE_WRITE_SYSTEM_MD is set (and not 0|false), write base system prompt to file
  const writeSystemMdResolution = resolvePathFromEnv(
    process.env['OLLAMA_CODE_WRITE_SYSTEM_MD'],
  );

  // Check if the feature is enabled. This proceeds only if the environment
  // variable is set and is not explicitly '0' or 'false'.
  if (writeSystemMdResolution.value && !writeSystemMdResolution.isDisabled) {
    const writePath = writeSystemMdResolution.isSwitch
      ? systemMdPath
      : writeSystemMdResolution.value;

    fs.mkdirSync(path.dirname(writePath), { recursive: true });
    fs.writeFileSync(writePath, basePrompt);
  }

  const memorySuffix =
    userMemory && userMemory.trim().length > 0
      ? `\n\n---\n\n${userMemory.trim()}`
      : '';

  return `${basePrompt}${memorySuffix}`;
}

/**
 * Provides the system prompt for the history compression process.
 * This prompt instructs the model to act as a specialized state manager,
 * think in a scratchpad, and produce a structured XML summary.
 */
export function getCompressionPrompt(): string {
  return `
You are a state summarizer. Compress the conversation history into a concise XML snapshot.

CRITICAL: The output MUST be significantly shorter than the input. Aim for 20-30% of original length.

Generate a <state_snapshot> with this structure:

<state_snapshot>
    <overall_goal>
        <!-- ONE sentence: user's high-level objective -->
    </overall_goal>

    <key_knowledge>
        <!-- 3-5 bullet points MAX: critical facts, conventions, constraints -->
    </key_knowledge>

    <file_system_state>
        <!-- Files created/modified/read with status. ONE line per file. -->
    </file_system_state>

    <recent_actions>
        <!-- Last 3-5 significant actions with outcomes. Be brief. -->
    </recent_actions>

    <current_plan>
        <!-- Next 2-3 steps only. Mark: [DONE], [IN PROGRESS], [TODO] -->
    </current_plan>
</state_snapshot>

RULES:
- Omit conversational filler completely
- Use bullet points, not paragraphs
- Keep each section under 50 words
- If nothing to report in a section, write "N/A"
`.trim();
}

/**
 * Provides the system prompt for generating project summaries in markdown format.
 * This prompt instructs the model to create a structured markdown summary
 * that can be saved to a file for future reference.
 */
export function getProjectSummaryPrompt(): string {
  return `Please analyze the conversation history above and generate a comprehensive project summary in markdown format. Focus on extracting the most important context, decisions, and progress that would be valuable for future sessions. Generate the summary directly without using any tools.
You are a specialized context summarizer that creates a comprehensive markdown summary from chat history for future reference. The markdown format is as follows:

# Project Summary

## Overall Goal
<!-- A single, concise sentence describing the user's high-level objective -->

## Key Knowledge
<!-- Crucial facts, conventions, and constraints the agent must remember -->
<!-- Include: technology choices, architecture decisions, user preferences, build commands, testing procedures -->

## Recent Actions
<!-- Summary of significant recent work and outcomes -->
<!-- Include: accomplishments, discoveries, recent changes -->

## Current Plan
<!-- The current development roadmap and next steps -->
<!-- Use status markers: [DONE], [IN PROGRESS], [TODO] -->
<!-- Example: 1. [DONE] Set up WebSocket server -->

`.trim();
}

const generalToolCallExamples = `
# Examples (Illustrating Tone and Workflow)
<example>
user: 1 + 2
model: 3
</example>

<example>
user: start the server implemented in server.js
model: [tool_call: run_shell_command for 'node server.js &' with is_background: true because it must run in the background]
</example>

<example>
user: Delete the temp directory.
model: I can run \`rm -rf /path/to/project/temp\`. This will permanently delete the directory and all its contents.
</example>
`.trim();

const qwenCoderToolCallExamples = `
# Examples (Illustrating Tone and Workflow)
<example>
user: 1 + 2
model: 3
</example>

<example>
user: is 13 a prime number?
model: true
</example>

<example>
user: start the server implemented in server.js
model:
<tool_call>
<function=run_shell_command>
<parameter=command>
node server.js &
</parameter>
<parameter=is_background>
true
</parameter>
</function>
</tool_call>
</example>

<example>
user: Refactor the auth logic in src/auth.py to use the requests library instead of urllib.
model: Okay, I can refactor 'src/auth.py'.
First, I'll analyze the code and check for a test safety net before planning any changes.
<tool_call>
<function=glob>
<parameter=path>
tests/test_auth.py
</parameter>
</function>
</tool_call>
<tool_call>
<function=read_file>
<parameter=path>
/path/to/tests/test_auth.py
</parameter>
<parameter=offset>
0
</parameter>
<parameter=limit>
10
</parameter>
</function>
</tool_call>
(After analysis)
Great, 'tests/test_auth.py' exists and covers the core authentication logic. With this safety net in place, I can safely plan the refactoring.
I'll also confirm 'requests' is a dependency.
<tool_call>
<function=read_file>
<parameter=path>
/path/to/requirements.txt
</parameter>
</function>
</tool_call>
(After analysis)
Looks good, 'requests' is available.

Here's the plan:
1.  Replace the 'urllib' calls with 'requests'.
2.  Add proper 'try...except' error handling for the new network calls.
3.  Remove the old 'urllib' import.
4.  Run the project's linter and tests to verify the changes.

<tool_call>
<function=edit>
<parameter=path>
src/auth.py
</parameter>
<parameter=old_content>
(old code content)
</parameter>
<parameter=new_content>
(new code content)
</parameter>
</function>
</tool_call>
Refactoring complete. Running verification...
<tool_call>
<function=run_shell_command>
<parameter=command>
ruff check src/auth.py && pytest
</parameter>
</function>
</tool_call>
(After verification passes)
All checks passed. This is a stable checkpoint.
Would you like me to write a commit message and commit these changes?
</example>

<example>
user: Delete the temp directory.
model: I can run \`rm -rf /path/to/project/temp\`. This will permanently delete the directory and all its contents.
</example>

<example>
user: Write tests for someFile.ts
model:
Okay, I can write those tests. First, I'll read someFile.ts to understand its functionality.
<tool_call>
<function=read_file>
<parameter=path>
/path/to/someFile.ts
</parameter>
</function>
</tool_call>
Now I'll look for existing or related test files to understand current testing conventions and dependencies.
<tool_call>
<function=read_file>
<parameter=path>
/path/to/existingTest.test.ts
</parameter>
</function>
</tool_call>
(After reviewing existing tests and the file content)
<tool_call>
<function=write_file>
<parameter=path>
/path/to/someFile.test.ts
</parameter>
</function>
</tool_call>
I've written the tests. Now I'll run the project's test command to verify them.
<tool_call>
<function=run_shell_command>
<parameter=command>
npm run test
</parameter>
</function>
</tool_call>
(After verification passes)
All checks passed. This is a stable checkpoint.
</example>

<example>
user: Where are all the 'app.config' files in this project? I need to check their settings.
model:
<tool_call>
<function=glob>
<parameter=pattern>
./**/app.config
</parameter>
</function>
</tool_call>
(Assuming GlobTool returns a list of paths like ['/path/to/moduleA/app.config', '/path/to/moduleB/app.config'])
I found the following 'app.config' files:
- /path/to/moduleA/app.config
- /path/to/moduleB/app.config
To help you check their settings, I can read their contents. Which one would you like to start with, or should I read all of them?
</example>
`.trim();
const qwenVlToolCallExamples = `
# Examples (Illustrating Tone and Workflow)
<example>
user: 1 + 2
model: 3
</example>

<example>
user: is 13 a prime number?
model: true
</example>

<example>
user: start the server implemented in server.js
model:
<tool_call>
{"name": "run_shell_command", "arguments": {"command": "node server.js &", "is_background": true}}
</tool_call>
</example>

<example>
user: Refactor the auth logic in src/auth.py to use the requests library instead of urllib.
model: Okay, I can refactor 'src/auth.py'.
First, I'll analyze the code and check for a test safety net before planning any changes.
<tool_call>
{"name": "glob", "arguments": {"path": "tests/test_auth.py"}}
</tool_call>
<tool_call>
{"name": "read_file", "arguments": {"path": "/path/to/tests/test_auth.py", "offset": 0, "limit": 10}}
</tool_call>
(After analysis)
Great, 'tests/test_auth.py' exists and covers the core authentication logic. With this safety net in place, I can safely plan the refactoring.
I'll also confirm 'requests' is a dependency.
<tool_call>
{"name": "read_file", "arguments": {"path": "/path/to/requirements.txt"}}
</tool_call>
(After analysis)
Looks good, 'requests' is available.

Here's the plan:
1.  Replace the 'urllib' calls with 'requests'.
2.  Add proper 'try...except' error handling for the new network calls.
3.  Remove the old 'urllib' import.
4.  Run the project's linter and tests to verify the changes.

<tool_call>
{"name": "edit", "arguments": {"path": "src/auth.py", "old_content": "(old code content)", "new_content": "(new code content)"}}
</tool_call>
Refactoring complete. Running verification...
<tool_call>
{"name": "run_shell_command", "arguments": {"command": "ruff check src/auth.py && pytest"}}
</tool_call>
(After verification passes)
All checks passed. This is a stable checkpoint.
Would you like me to write a commit message and commit these changes?
</example>

<example>
user: Delete the temp directory.
model: I can run \`rm -rf /path/to/project/temp\`. This will permanently delete the directory and all its contents.
</example>

<example>
user: Write tests for someFile.ts
model:
Okay, I can write those tests. First, I'll read someFile.ts to understand its functionality.
<tool_call>
{"name": "read_file", "arguments": {"path": "/path/to/someFile.ts"}}
</tool_call>
Now I'll look for existing or related test files to understand current testing conventions and dependencies.
<tool_call>
{"name": "read_file", "arguments": {"path": "/path/to/existingTest.test.ts"}}
</tool_call>
(After reviewing existing tests and the file content)
<tool_call>
{"name": "write_file", "arguments": {"path": "/path/to/someFile.test.ts"}}
</tool_call>
I've written the tests. Now I'll run the project's test command to verify them.
<tool_call>
{"name": "run_shell_command", "arguments": {"command": "npm run test"}}
</tool_call>
(After verification passes)
All checks passed. This is a stable checkpoint.
</example>

<example>
user: Where are all the 'app.config' files in this project? I need to check their settings.
model:
<tool_call>
{"name": "glob", "arguments": {"pattern": "./**/app.config"}}
</tool_call>
(Assuming GlobTool returns a list of paths like ['/path/to/moduleA/app.config', '/path/to/moduleB/app.config'])
I found the following 'app.config' files:
- /path/to/moduleA/app.config
- /path/to/moduleB/app.config
To help you check their settings, I can read their contents. Which one would you like to start with, or should I read all of them?
</example>
`.trim();

function getToolCallExamples(model?: string): string {
  // Check for environment variable override first
  const toolCallStyle = process.env['OLLAMA_CODE_TOOL_CALL_STYLE'];
  if (toolCallStyle) {
    switch (toolCallStyle.toLowerCase()) {
      case 'qwen-coder':
        return qwenCoderToolCallExamples;
      case 'qwen-vl':
        return qwenVlToolCallExamples;
      case 'general':
        return generalToolCallExamples;
      default:
        debugLogger.warn(
          `Unknown OLLAMA_CODE_TOOL_CALL_STYLE value: ${toolCallStyle}. Using model-based detection.`,
        );
        break;
    }
  }

  // Enhanced regex-based model detection
  if (model && model.length < 100) {
    // Match qwen*-coder patterns (e.g., qwen3-coder, qwen2.5-coder, qwen-coder)
    if (/qwen[^-]*-coder/i.test(model)) {
      return qwenCoderToolCallExamples;
    }
    // Match qwen*-vl patterns (e.g., qwen-vl, qwen2-vl, qwen3-vl)
    if (/qwen[^-]*-vl/i.test(model)) {
      return qwenVlToolCallExamples;
    }
    // Match coder-model pattern (same as qwen3-coder)
    if (/coder-model/i.test(model)) {
      return qwenCoderToolCallExamples;
    }
    // Match vision-model pattern (same as qwen3-vl)
    if (/vision-model/i.test(model)) {
      return qwenVlToolCallExamples;
    }
  }

  return generalToolCallExamples;
}

/**
 * Generates a system reminder message about available subagents for the AI assistant.
 *
 * This function creates an internal system message that informs the AI about specialized
 * agents it can delegate tasks to. The reminder encourages proactive use of the TASK tool
 * when user requests match agent capabilities.
 *
 * @param agentTypes - Array of available agent type names (e.g., ['python', 'web', 'analysis'])
 * @returns A formatted system reminder string wrapped in XML tags for internal AI processing
 *
 * @example
 * ```typescript
 * const reminder = getSubagentSystemReminder(['python', 'web']);
 * // Returns: "<system-reminder>You have powerful specialized agents..."
 * ```
 */
export function getSubagentSystemReminder(agentTypes: string[]): string {
  return `<system-reminder>You have powerful specialized agents at your disposal, available agent types are: ${agentTypes.join(', ')}. PROACTIVELY use the task tool to delegate user's task to appropriate agent when user's task matches agent capabilities. Ignore this message if user's task is not relevant to any agent. This message is for internal use only. Do not mention this to user in your response.</system-reminder>`;
}

/**
 * Generates a system reminder message for plan mode operation.
 *
 * This function creates an internal system message that enforces plan mode constraints,
 * preventing the AI from making any modifications to the system until the user confirms
 * the proposed plan. It overrides other instructions to ensure read-only behavior.
 *
 * @returns A formatted system reminder string that enforces plan mode restrictions
 *
 * @example
 * ```typescript
 * const reminder = getPlanModeSystemReminder();
 * // Returns: "<system-reminder>Plan mode is active..."
 * ```
 *
 * @remarks
 * Plan mode ensures the AI will:
 * - Only perform read-only operations (research, analysis)
 * - Present a comprehensive plan via ExitPlanMode tool
 * - Wait for user confirmation before making any changes
 * - Override any other instructions that would modify system state
 */
export function getPlanModeSystemReminder(planOnly = false): string {
  return `<system-reminder>
Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supercedes any other instructions you have received (for example, to make edits). Instead, you should:
1. Answer the user's query comprehensively
2. When you're done researching, present your plan ${planOnly ? 'directly' : `by calling the exit_plan_mode tool, which will prompt the user to confirm the plan`}. Do NOT make any file changes or run any tools that modify the system state in any way until the user has confirmed the plan.
</system-reminder>`;
}
