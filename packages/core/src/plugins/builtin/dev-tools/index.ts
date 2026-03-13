/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dev Tools Plugin
 *
 * Built-in plugin providing language-specific development tools.
 */

import type { PluginDefinition } from '../../types.js';
import { PythonTool } from './python/index.js';
import { NodeJsTool } from './nodejs/index.js';
import { GolangTool } from './golang/index.js';
import { RustTool } from './rust/index.js';
import { TypeScriptTool } from './typescript/index.js';
import { JavaTool } from './java/index.js';
import { CppTool } from './cpp/index.js';
import { SwiftTool } from './swift/index.js';
import { PHPTool } from './php/index.js';

/**
 * Tool names exported by this plugin
 */
export const TOOL_NAMES = {
  PYTHON_DEV: 'python_dev',
  NODEJS_DEV: 'nodejs_dev',
  GOLANG_DEV: 'golang_dev',
  RUST_DEV: 'rust_dev',
  TYPESCRIPT_DEV: 'typescript_dev',
  JAVA_DEV: 'java_dev',
  CPP_DEV: 'cpp_dev',
  SWIFT_DEV: 'swift_dev',
  PHP_DEV: 'php_dev',
} as const;

/**
 * Dev Tools Plugin Definition
 */
const devToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'dev-tools',
    name: 'Development Tools',
    version: '1.0.0',
    description:
      'Language-specific development tools: Python, Node.js, Go, Rust, TypeScript, Java, C++, Swift, PHP',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'dev', 'language', 'build'],
    enabledByDefault: true,
  },

  // Unified tools array - tool classes that don't need Config
  tools: [
    PythonTool,
    NodeJsTool,
    GolangTool,
    RustTool,
    TypeScriptTool,
    JavaTool,
    CppTool,
    SwiftTool,
    PHPTool,
  ],

  // Tool aliases - short names that resolve to canonical tool names
  // Includes all language-specific tool variations and common model hallucinations
  aliases: [
    // ═══════════════════════════════════════════════════════════════════
    // python_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'python',
      canonicalName: 'python_dev',
      description: 'Python development tool',
    },
    { alias: 'py', canonicalName: 'python_dev', description: 'Python dev' },
    {
      alias: 'pip',
      canonicalName: 'python_dev',
      description: 'Pip package manager',
    },
    {
      alias: 'pytest',
      canonicalName: 'python_dev',
      description: 'Python test runner',
    },
    {
      alias: 'python_dev',
      canonicalName: 'python_dev',
      description: 'Python development',
    },
    {
      alias: 'python3',
      canonicalName: 'python_dev',
      description: 'Python 3 development',
    },
    { alias: 'py3', canonicalName: 'python_dev', description: 'Python 3 dev' },
    { alias: 'pip3', canonicalName: 'python_dev', description: 'Pip 3' },
    {
      alias: 'python3_dev',
      canonicalName: 'python_dev',
      description: 'Python 3 development',
    },
    {
      alias: 'venv',
      canonicalName: 'python_dev',
      description: 'Virtual environment',
    },
    {
      alias: 'poetry',
      canonicalName: 'python_dev',
      description: 'Poetry package manager',
    },
    {
      alias: 'conda',
      canonicalName: 'python_dev',
      description: 'Conda environment',
    },
    {
      alias: 'black',
      canonicalName: 'python_dev',
      description: 'Black formatter',
    },
    {
      alias: 'flake8',
      canonicalName: 'python_dev',
      description: 'Flake8 linter',
    },
    {
      alias: 'mypy',
      canonicalName: 'python_dev',
      description: 'MyPy type checker',
    },
    {
      alias: 'pylint',
      canonicalName: 'python_dev',
      description: 'Pylint linter',
    },
    // ═══════════════════════════════════════════════════════════════════
    // nodejs_dev / JavaScript aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'node',
      canonicalName: 'nodejs_dev',
      description: 'Node.js development tool',
    },
    {
      alias: 'npm',
      canonicalName: 'nodejs_dev',
      description: 'NPM package manager',
    },
    {
      alias: 'yarn',
      canonicalName: 'nodejs_dev',
      description: 'Yarn package manager',
    },
    {
      alias: 'pnpm',
      canonicalName: 'nodejs_dev',
      description: 'PNPM package manager',
    },
    { alias: 'bun', canonicalName: 'nodejs_dev', description: 'Bun runtime' },
    {
      alias: 'nodejs',
      canonicalName: 'nodejs_dev',
      description: 'Node.js development',
    },
    {
      alias: 'nodejs_dev',
      canonicalName: 'nodejs_dev',
      description: 'Node.js development',
    },
    {
      alias: 'node_dev',
      canonicalName: 'nodejs_dev',
      description: 'Node development',
    },
    {
      alias: 'javascript',
      canonicalName: 'nodejs_dev',
      description: 'JavaScript development',
    },
    {
      alias: 'javascript_dev',
      canonicalName: 'nodejs_dev',
      description: 'JavaScript development',
    },
    { alias: 'js', canonicalName: 'nodejs_dev', description: 'JavaScript dev' },
    {
      alias: 'js_dev',
      canonicalName: 'nodejs_dev',
      description: 'JavaScript dev',
    },
    { alias: 'npx', canonicalName: 'nodejs_dev', description: 'NPX runner' },
    { alias: 'vite', canonicalName: 'nodejs_dev', description: 'Vite bundler' },
    {
      alias: 'webpack',
      canonicalName: 'nodejs_dev',
      description: 'Webpack bundler',
    },
    {
      alias: 'rollup',
      canonicalName: 'nodejs_dev',
      description: 'Rollup bundler',
    },
    {
      alias: 'esbuild',
      canonicalName: 'nodejs_dev',
      description: 'ESBuild bundler',
    },
    {
      alias: 'eslint',
      canonicalName: 'nodejs_dev',
      description: 'ESLint linter',
    },
    {
      alias: 'prettier',
      canonicalName: 'nodejs_dev',
      description: 'Prettier formatter',
    },
    {
      alias: 'jest',
      canonicalName: 'nodejs_dev',
      description: 'Jest test runner',
    },
    {
      alias: 'mocha',
      canonicalName: 'nodejs_dev',
      description: 'Mocha test runner',
    },
    // ═══════════════════════════════════════════════════════════════════
    // golang_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'go',
      canonicalName: 'golang_dev',
      description: 'Go development tool',
    },
    {
      alias: 'golang',
      canonicalName: 'golang_dev',
      description: 'Golang development',
    },
    {
      alias: 'golang_dev',
      canonicalName: 'golang_dev',
      description: 'Golang development',
    },
    {
      alias: 'go_dev',
      canonicalName: 'golang_dev',
      description: 'Go development',
    },
    {
      alias: 'gofmt',
      canonicalName: 'golang_dev',
      description: 'Go formatter',
    },
    {
      alias: 'goimports',
      canonicalName: 'golang_dev',
      description: 'Go imports',
    },
    { alias: 'golint', canonicalName: 'golang_dev', description: 'Go linter' },
    { alias: 'go_vet', canonicalName: 'golang_dev', description: 'Go vet' },
    { alias: 'go-vet', canonicalName: 'golang_dev', description: 'Go vet' },
    // ═══════════════════════════════════════════════════════════════════
    // php_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'php',
      canonicalName: 'php_dev',
      description: 'PHP development tool',
    },
    {
      alias: 'composer',
      canonicalName: 'php_dev',
      description: 'Composer package manager',
    },
    {
      alias: 'phpunit',
      canonicalName: 'php_dev',
      description: 'PHPUnit test runner',
    },
    {
      alias: 'artisan',
      canonicalName: 'php_dev',
      description: 'Laravel Artisan',
    },
    {
      alias: 'php_dev',
      canonicalName: 'php_dev',
      description: 'PHP development',
    },
    {
      alias: 'laravel',
      canonicalName: 'php_dev',
      description: 'Laravel framework',
    },
    {
      alias: 'phpcs',
      canonicalName: 'php_dev',
      description: 'PHP CodeSniffer',
    },
    {
      alias: 'phpstan',
      canonicalName: 'php_dev',
      description: 'PHPStan analyzer',
    },
    { alias: 'psalm', canonicalName: 'php_dev', description: 'Psalm analyzer' },
    // ═══════════════════════════════════════════════════════════════════
    // java_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'java',
      canonicalName: 'java_dev',
      description: 'Java development tool',
    },
    { alias: 'javac', canonicalName: 'java_dev', description: 'Java compiler' },
    {
      alias: 'maven',
      canonicalName: 'java_dev',
      description: 'Maven build tool',
    },
    {
      alias: 'gradle',
      canonicalName: 'java_dev',
      description: 'Gradle build tool',
    },
    {
      alias: 'java_dev',
      canonicalName: 'java_dev',
      description: 'Java development',
    },
    { alias: 'mvn', canonicalName: 'java_dev', description: 'Maven CLI' },
    {
      alias: 'gradlew',
      canonicalName: 'java_dev',
      description: 'Gradle wrapper',
    },
    { alias: 'junit', canonicalName: 'java_dev', description: 'JUnit testing' },
    {
      alias: 'spring',
      canonicalName: 'java_dev',
      description: 'Spring framework',
    },
    // ═══════════════════════════════════════════════════════════════════
    // cpp_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'cpp',
      canonicalName: 'cpp_dev',
      description: 'C++ development tool',
    },
    { alias: 'c++', canonicalName: 'cpp_dev', description: 'C++ development' },
    { alias: 'gcc', canonicalName: 'cpp_dev', description: 'GCC compiler' },
    { alias: 'g++', canonicalName: 'cpp_dev', description: 'G++ compiler' },
    {
      alias: 'cmake',
      canonicalName: 'cpp_dev',
      description: 'CMake build tool',
    },
    { alias: 'make', canonicalName: 'cpp_dev', description: 'Make build tool' },
    {
      alias: 'cpp_dev',
      canonicalName: 'cpp_dev',
      description: 'C++ development',
    },
    { alias: 'c_dev', canonicalName: 'cpp_dev', description: 'C development' },
    { alias: 'clang', canonicalName: 'cpp_dev', description: 'Clang compiler' },
    {
      alias: 'clang++',
      canonicalName: 'cpp_dev',
      description: 'Clang++ compiler',
    },
    { alias: 'cc', canonicalName: 'cpp_dev', description: 'C compiler' },
    { alias: 'c', canonicalName: 'cpp_dev', description: 'C development' },
    {
      alias: 'clang_format',
      canonicalName: 'cpp_dev',
      description: 'Clang format',
    },
    {
      alias: 'cppcheck',
      canonicalName: 'cpp_dev',
      description: 'CppCheck analyzer',
    },
    // ═══════════════════════════════════════════════════════════════════
    // rust_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'rust',
      canonicalName: 'rust_dev',
      description: 'Rust development tool',
    },
    {
      alias: 'cargo',
      canonicalName: 'rust_dev',
      description: 'Cargo package manager',
    },
    { alias: 'rustc', canonicalName: 'rust_dev', description: 'Rust compiler' },
    {
      alias: 'rust_dev',
      canonicalName: 'rust_dev',
      description: 'Rust development',
    },
    {
      alias: 'rustup',
      canonicalName: 'rust_dev',
      description: 'Rust toolchain',
    },
    {
      alias: 'rustfmt',
      canonicalName: 'rust_dev',
      description: 'Rust formatter',
    },
    {
      alias: 'clippy',
      canonicalName: 'rust_dev',
      description: 'Clippy linter',
    },
    // ═══════════════════════════════════════════════════════════════════
    // swift_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'swift',
      canonicalName: 'swift_dev',
      description: 'Swift development tool',
    },
    {
      alias: 'swiftc',
      canonicalName: 'swift_dev',
      description: 'Swift compiler',
    },
    {
      alias: 'spm',
      canonicalName: 'swift_dev',
      description: 'Swift Package Manager',
    },
    {
      alias: 'swift_dev',
      canonicalName: 'swift_dev',
      description: 'Swift development',
    },
    {
      alias: 'swift_package',
      canonicalName: 'swift_dev',
      description: 'Swift package',
    },
    {
      alias: 'xcodebuild',
      canonicalName: 'swift_dev',
      description: 'Xcode build',
    },
    // ═══════════════════════════════════════════════════════════════════
    // typescript_dev aliases
    // ═══════════════════════════════════════════════════════════════════
    {
      alias: 'ts',
      canonicalName: 'typescript_dev',
      description: 'TypeScript development tool',
    },
    {
      alias: 'tsc',
      canonicalName: 'typescript_dev',
      description: 'TypeScript compiler',
    },
    {
      alias: 'typescript',
      canonicalName: 'typescript_dev',
      description: 'TypeScript development',
    },
    {
      alias: 'typescript_dev',
      canonicalName: 'typescript_dev',
      description: 'TypeScript development',
    },
    {
      alias: 'ts_dev',
      canonicalName: 'typescript_dev',
      description: 'TypeScript dev',
    },
    {
      alias: 'tsx',
      canonicalName: 'typescript_dev',
      description: 'TSX development',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'Development tools for language-specific tasks: python_dev, nodejs_dev, golang_dev, rust_dev, typescript_dev, java_dev, cpp_dev, swift_dev, php_dev. Each provides language-aware development assistance.',
    },
    {
      priority: 2,
      content:
        'PYTHON: venv/virtualenv for environments, pip/pipenv/poetry for packages, pytest/unittest for testing, black/flake8/mypy for linting. Use requirements.txt or pyproject.toml for dependencies.',
    },
    {
      priority: 3,
      content:
        'NODE.JS: npm/yarn/pnpm for packages, Jest/Mocha for testing, ESLint/Prettier for linting. Check package.json for scripts and dependencies. Use npx for one-off commands.',
    },
    {
      priority: 4,
      content:
        'RUST: cargo for everything (build, test, run, add dependencies). Cargo.toml for config. Use clippy for linting, rustfmt for formatting. Check for Cargo.lock in projects.',
    },
    {
      priority: 5,
      content:
        'GO: go mod for modules, go build/test/run for compilation. gofmt for formatting. Check go.mod for dependencies. Use go get to add packages.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: true,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('Dev Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('Dev Tools plugin enabled');
    },
  },
};

export default devToolsPlugin;

// Also export tool classes for direct imports
export { PythonTool } from './python/index.js';
export { NodeJsTool } from './nodejs/index.js';
export { GolangTool } from './golang/index.js';
export { RustTool } from './rust/index.js';
export { TypeScriptTool } from './typescript/index.js';
export { JavaTool } from './java/index.js';
export { CppTool } from './cpp/index.js';
export { SwiftTool } from './swift/index.js';
export { PHPTool } from './php/index.js';
