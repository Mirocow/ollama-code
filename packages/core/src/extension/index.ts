/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extension System
 *
 * Extensions are user-facing packages that extend Ollama Code functionality.
 * They can provide:
 * - MCP servers
 * - Context providers
 * - Skills
 * - Agents
 * - Custom commands
 * - Tools (via Plugin system)
 * - Aliases
 * - Lifecycle hooks
 */

// Core Types (new)
export * from './extension-types.js';

// Core Manager
export * from './extensionManager.js';

// Variables & Schema
export * from './variables.js';
export * from './variableSchema.js';

// Settings
export * from './extensionSettings.js';
export * from './settings.js';

// Storage
export * from './storage.js';

// Override System
export * from './override.js';

// GitHub & Marketplace
export * from './github.js';
export * from './marketplace.js';

// Converters
export * from './claude-converter.js';
export * from './gemini-converter.js';

// Tool Registry (new)
export * from './extensionToolRegistry.js';

// Alias Registry (new)
export * from './extensionAliasRegistry.js';

// Logger (new)
export * from './extensionLogger.js';

// Lifecycle Manager (new)
export * from './extensionLifecycle.js';
