// MCP Tools Plugin - Index
// Re-export all public API from mcp-client
export { McpClient } from './mcp-client/index.js';

/**
 * Tool names exported by this plugin
 * Note: MCP tools are discovered dynamically, but we define client tool name
 */
export const TOOL_NAMES = {
  MCP_CLIENT: 'mcp_client',
} as const;
export type {
  SendSdkMcpMessage,
  DiscoveredMCPPrompt,
} from './mcp-client/index.js';
export {
  MCPServerStatus,
  MCPDiscoveryState,
  getMCPServerStatus,
  getMCPDiscoveryState,
  getAllMCPServerStatuses,
  updateMCPServerStatus,
  addMCPStatusChangeListener,
  removeMCPStatusChangeListener,
  discoverMcpTools,
  connectAndDiscover,
  discoverTools,
  discoverPrompts,
  connectToMcpServer,
  createTransport,
  hasNetworkTransport,
  isEnabled,
  mcpServerRequiresOAuth,
} from './mcp-client/index.js';
export { DiscoveredMCPTool } from './mcp-tool/index.js';
export { McpClientManager } from './mcp-client-manager/index.js';
export { SdkControlClientTransport } from './sdk-control-client-transport/index.js';

// Plugin definition
import type { PluginDefinition } from '../../types.js';

const mcpToolsPlugin: PluginDefinition = {
  metadata: {
    id: 'mcp-tools',
    name: 'MCP Tools',
    version: '1.0.0',
    description: 'Model Context Protocol tools for external tool integration',
    author: 'Ollama Code Team',
    tags: ['core', 'builtin', 'mcp', 'protocol'],
    enabledByDefault: true,
  },

  // Unified tools array - MCP tools are discovered dynamically, so empty array
  tools: [],

  // Tool aliases - short names that resolve to canonical tool names
  aliases: [
    {
      alias: 'mcp',
      canonicalName: 'mcp_client',
      description: 'Model Context Protocol',
    },
    {
      alias: 'model_context',
      canonicalName: 'mcp_client',
      description: 'Model Context Protocol client',
    },
  ],

  // Context-aware prompts for model guidance
  prompts: [
    {
      priority: 1,
      content:
        'MCP (Model Context Protocol) enables external tool integration. MCP servers provide additional tools discovered at runtime. Check config for configured MCP servers.',
    },
    {
      priority: 2,
      content:
        'MCP TOOLS: Dynamically discovered from configured servers. Each MCP server can provide multiple tools. Tools appear with server prefix (e.g., mcp_server_tool_name).',
    },
    {
      priority: 3,
      content:
        'Configure MCP servers in settings. Supports stdio, HTTP, WebSocket transports. MCP enables unlimited extensibility with third-party tool servers.',
    },
  ],

  // Plugin capabilities
  capabilities: {
    canReadFiles: true,
    canWriteFiles: false,
    canExecuteCommands: true,
    canAccessNetwork: true,
    canUseStorage: true,
    canUsePrompts: true,
  },

  hooks: {
    onLoad: async (context) => {
      context.logger.info('MCP Tools plugin loaded');
    },

    onEnable: async (context) => {
      context.logger.info('MCP Tools plugin enabled');
    },
  },
};

export default mcpToolsPlugin;
