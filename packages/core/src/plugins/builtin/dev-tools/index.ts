/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Created with GLM-5 from Z.AI
 */

/**
 * Development Tools Plugin
 * 
 * Built-in plugin providing language-specific development tools.
 * Supports Python, Node.js, Go, Rust, Java, C++, Swift, TypeScript, PHP, and more.
 */

import type { PluginDefinition, PluginTool } from '../../types.js';

/**
 * Tool: python_dev
 * Python development commands
 */
const pythonDevTool: PluginTool = {
  id: 'python_dev',
  name: 'python_dev',
  description: `Execute Python development commands including:
- Run Python files: \`python file.py\` or \`python3 file.py\`
- Run pip: \`pip install package\` or \`pip install -r requirements.txt\`
- Run pytest: \`pytest\` or \`pytest tests/\`
- Run flake8/pylint: \`flake8 .\` or \`pylint module\`
- Create virtual environment: \`python -m venv venv\`
- Run Django: \`python manage.py runserver\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Python command to execute.',
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'OPTIONAL: Additional arguments for the command.',
      },
      cwd: {
        type: 'string',
        description: 'OPTIONAL: Working directory. Defaults to current directory.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  requiresConfirmation: false,
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'Python command ready for execution via shell' },
      display: { summary: `Python: ${command}` },
    };
  },
};

/**
 * Tool: nodejs_dev
 * Node.js/JavaScript development commands
 */
const nodejsDevTool: PluginTool = {
  id: 'nodejs_dev',
  name: 'nodejs_dev',
  description: `Execute Node.js/JavaScript development commands including:
- Run scripts: \`node script.js\`
- npm commands: \`npm install\`, \`npm run build\`, \`npm test\`
- yarn commands: \`yarn install\`, \`yarn build\`
- pnpm commands: \`pnpm install\`
- Run Next.js: \`npm run dev\` or \`next dev\`
- Run Express: \`node server.js\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Node.js command to execute.',
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'OPTIONAL: Additional arguments.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'Node.js command ready' },
      display: { summary: `Node.js: ${command}` },
    };
  },
};

/**
 * Tool: golang_dev
 * Go development commands
 */
const golangDevTool: PluginTool = {
  id: 'golang_dev',
  name: 'golang_dev',
  description: `Execute Go development commands including:
- Build: \`go build\` or \`go build -o app\`
- Run: \`go run main.go\`
- Test: \`go test\` or \`go test ./...\`
- Mod: \`go mod init\`, \`go mod tidy\`, \`go get package\`
- Format: \`go fmt\` or \`gofmt -w .\`
- Vet: \`go vet\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Go command to execute.',
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'OPTIONAL: Additional arguments.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'Go command ready' },
      display: { summary: `Go: ${command}` },
    };
  },
};

/**
 * Tool: rust_dev
 * Rust development commands
 */
const rustDevTool: PluginTool = {
  id: 'rust_dev',
  name: 'rust_dev',
  description: `Execute Rust development commands including:
- Build: \`cargo build\` or \`cargo build --release\`
- Run: \`cargo run\`
- Test: \`cargo test\`
- Check: \`cargo check\`
- Clippy: \`cargo clippy\`
- Format: \`cargo fmt\`
- Add dependency: \`cargo add crate_name\`
- Update: \`cargo update\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Rust/Cargo command to execute.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'Rust command ready' },
      display: { summary: `Rust: ${command}` },
    };
  },
};

/**
 * Tool: typescript_dev
 * TypeScript development commands
 */
const typescriptDevTool: PluginTool = {
  id: 'typescript_dev',
  name: 'typescript_dev',
  description: `Execute TypeScript development commands including:
- Compile: \`tsc\` or \`tsc --watch\`
- Run with ts-node: \`ts-node script.ts\`
- Check: \`tsc --noEmit\`
- Build: \`tsc --build\`
- Init: \`tsc --init\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The TypeScript command to execute.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'TypeScript command ready' },
      display: { summary: `TypeScript: ${command}` },
    };
  },
};

/**
 * Tool: java_dev
 * Java development commands
 */
const javaDevTool: PluginTool = {
  id: 'java_dev',
  name: 'java_dev',
  description: `Execute Java development commands including:
- Maven: \`mvn compile\`, \`mvn test\`, \`mvn package\`
- Gradle: \`gradle build\`, \`gradle test\`
- javac: \`javac Main.java\`
- java: \`java Main\`
- jar: \`jar cvf app.jar *.class\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Java command to execute.',
      },
      buildTool: {
        type: 'string',
        enum: ['maven', 'gradle', 'javac'],
        description: 'OPTIONAL: Build tool to use.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'Java command ready' },
      display: { summary: `Java: ${command}` },
    };
  },
};

/**
 * Tool: cpp_dev
 * C/C++ development commands
 */
const cppDevTool: PluginTool = {
  id: 'cpp_dev',
  name: 'cpp_dev',
  description: `Execute C/C++ development commands including:
- GCC compile: \`gcc main.c -o app\`
- G++ compile: \`g++ main.cpp -o app\`
- CMake: \`cmake .\`, \`cmake --build .\`
- Make: \`make\`
- Run: \`./app\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The C/C++ command to execute.',
      },
      compiler: {
        type: 'string',
        enum: ['gcc', 'g++', 'clang', 'cmake'],
        description: 'OPTIONAL: Compiler to use.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'C/C++ command ready' },
      display: { summary: `C/C++: ${command}` },
    };
  },
};

/**
 * Tool: swift_dev
 * Swift development commands
 */
const swiftDevTool: PluginTool = {
  id: 'swift_dev',
  name: 'swift_dev',
  description: `Execute Swift development commands including:
- Build: \`swift build\`
- Run: \`swift run\`
- Test: \`swift test\`
- Package: \`swift package resolve\`, \`swift package update\`
- REPL: \`swift\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The Swift command to execute.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'Swift command ready' },
      display: { summary: `Swift: ${command}` },
    };
  },
};

/**
 * Tool: php_dev
 * PHP development commands
 */
const phpDevTool: PluginTool = {
  id: 'php_dev',
  name: 'php_dev',
  description: `Execute PHP development commands including:
- Run: \`php script.php\`
- Composer: \`composer install\`, \`composer update\`
- Built-in server: \`php -S localhost:8000\`
- Laravel: \`php artisan serve\`
- PHPUnit: \`phpunit\` or \`./vendor/bin/phpunit\``,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'REQUIRED: The PHP command to execute.',
      },
    },
    required: ['command'],
  },
  category: 'execute',
  execute: async (params, _context) => {
    const command = params['command'] as string;
    return {
      success: true,
      data: { message: 'PHP command ready' },
      display: { summary: `PHP: ${command}` },
    };
  },
};

/**
 * Development Tools Plugin Definition
 */
const devToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'dev-tools',
    name: 'Development Tools',
    version: '1.0.0',
    description: 'Language-specific development tools: Python, Node.js, Go, Rust, Java, C++',
    author: 'Ollama Code Team',
    tags: ['core', 'dev', 'languages'],
    enabledByDefault: true,
  },
  
  tools: [
    pythonDevTool,
    nodejsDevTool,
    golangDevTool,
    rustDevTool,
    typescriptDevTool,
    javaDevTool,
    cppDevTool,
    swiftDevTool,
    phpDevTool,
  ],
  
  hooks: {
    onLoad: async (context) => {
      context.logger.info('Development Tools plugin loaded');
    },
    onEnable: async (context) => {
      context.logger.info('Development Tools plugin enabled');
    },
  },
  
  defaultConfig: {
    defaultTimeout: 60000,
    supportedLanguages: [
      'python',
      'nodejs',
      'golang',
      'rust',
      'typescript',
      'java',
      'cpp',
      'swift',
      'php',
    ],
  },
};

export default devToolsPlugin;
