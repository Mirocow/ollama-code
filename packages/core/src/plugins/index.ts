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
