/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plugin System
 *
 * This module provides a plugin architecture for extending
 * Ollama Code with custom tools, commands, and functionality.
 *
 * @example
 * // Define a plugin
 * const myPlugin: PluginDefinition = {
 *   metadata: {
 *     id: 'my-plugin',
 *     name: 'My Plugin',
 *     version: '1.0.0',
 *     description: 'A sample plugin',
 *   },
 *   tools: [{
 *     id: 'hello',
 *     name: 'hello_world',
 *     description: 'Say hello to the world',
 *     parameters: {
 *       type: 'object',
 *       properties: {
 *         name: { type: 'string', description: 'Name to greet' }
 *       }
 *     },
 *     execute: async (params) => ({
 *       success: true,
 *       data: `Hello, ${params.name || 'World'}!`
 *     })
 *   }],
 *   hooks: {
 *     onLoad: async (context) => {
 *       context.logger.info('Plugin loaded!');
 *     }
 *   }
 * };
 *
 * // Register and enable
 * await pluginManager.registerPlugin(myPlugin);
 * await pluginManager.enablePlugin('my-plugin');
 */

export * from './types.js';
export { PluginManager, pluginManager } from './pluginManager.js';
export { PluginLoader, createPluginLoader } from './pluginLoader.js';
export type { DiscoveredPlugin } from './pluginLoader.js';
export {
  PluginToolAdapter,
  registerPluginTools,
  unregisterPluginTools,
  pluginToolToDeclarative,
} from './pluginToolAdapter.js';
export {
  PluginRegistry,
  getPluginRegistry,
  initializePluginRegistry,
} from './pluginRegistry.js';

// Security Sandbox
export {
  PluginSandbox,
  createPluginSandbox,
  createBuiltinSandbox,
  createTrustedSandbox,
  createUntrustedSandbox,
  SandboxViolationError,
  DEFAULT_RESOURCE_LIMITS,
  UNTRUSTED_PLUGIN_CONFIG,
  TRUSTED_PLUGIN_CONFIG,
  BUILTIN_PLUGIN_CONFIG,
} from './pluginSandbox.js';
export type {
  FilesystemAccessLevel,
  NetworkAccessLevel,
  CommandExecutionLevel,
  FilesystemPermission,
  NetworkPermission,
  CommandPermission,
  ResourceLimits,
  PluginSandboxConfig,
  ViolationType,
  SandboxViolation,
  SandboxContext,
} from './pluginSandbox.js';

// Plugin Marketplace
export {
  PluginMarketplace,
  createPluginMarketplace,
} from './pluginMarketplace.js';
export type {
  MarketplacePlugin,
  MarketplaceSearchOptions,
  PluginInstallOptions,
  PluginUpdateOptions,
} from './pluginMarketplace.js';
