/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Core Service Layer for Web-App
 *
 * Provides server-side access to Core functionality:
 * - SkillManager
 * - SubagentManager
 * - ExtensionManager
 * - ToolRegistry
 * - Config
 * - MCP Servers
 */

import type {
  // Config
  Config,

  // Managers
  SkillManager,
  SubagentManager,

  // Tools
  ToolRegistry} from '@ollama-code/ollama-code-core';
import {
  Storage,
  makeFakeConfig,
  ExtensionManager,

  // Types
  type SkillConfig,
  type SubagentConfig,
  type Extension,
  type SkillLevel,
  type SubagentLevel,
  type CreateSubagentOptions,

  // Utils
  createDebugLogger,
} from '@ollama-code/ollama-code-core';

const debugLogger = createDebugLogger('CORE_SERVICE');

// ============================================================================
// Types
// ============================================================================

export interface CoreServiceConfig {
  /** Working directory for project context */
  workspaceDir: string;
  /** Ollama API URL */
  ollamaUrl: string;
  /** Whether workspace is trusted */
  isWorkspaceTrusted?: boolean;
}

export interface SkillInfo {
  name: string;
  description: string;
  level: SkillLevel;
  path: string;
}

export interface AgentInfo {
  name: string;
  description: string;
  model?: string;
  tools?: string[];
  level: SubagentLevel;
  path: string;
}

export interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
  tools: string[];
  skills: SkillInfo[];
  agents: AgentInfo[];
}

export interface ToolInfo {
  name: string;
  description: string;
  source: 'builtin' | 'extension' | 'mcp';
  inputSchema?: Record<string, unknown>;
}

export interface MCPServerInfo {
  name: string;
  status: 'running' | 'stopped' | 'error';
  tools: string[];
}

// ============================================================================
// Core Service Singleton
// ============================================================================

let coreServiceInstance: CoreService | null = null;

/**
 * Core Service - Provides access to all Core functionality
 */
export class CoreService {
  private config: Config | null = null;
  private skillManager: SkillManager | null = null;
  private subagentManager: SubagentManager | null = null;
  private extensionManager: ExtensionManager | null = null;
  private toolRegistry: ToolRegistry | null = null;
  private storage: Storage | null = null;
  private initialized = false;

  constructor(private options: CoreServiceConfig) {}

  /**
   * Initialize all core components
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    debugLogger.info('Initializing Core Service...');

    try {
      // Initialize storage
      this.storage = new Storage(this.options.workspaceDir);

      // Create config (using makeFakeConfig for web-app context)
      this.config = makeFakeConfig({
        model: 'llama3.2',
        cwd: this.options.workspaceDir,
      });

      // Get managers from config
      this.skillManager = this.config.getSkillManager();
      this.subagentManager = this.config.getSubagentManager();
      this.toolRegistry = this.config.getToolRegistry();

      // Initialize extension manager
      this.extensionManager = new ExtensionManager({
        workspaceDir: this.options.workspaceDir,
        isWorkspaceTrusted: this.options.isWorkspaceTrusted ?? true,
        config: this.config,
      });

      await this.extensionManager.refreshCache();

      this.initialized = true;
      debugLogger.info('Core Service initialized successfully');
    } catch (error) {
      debugLogger.error('Failed to initialize Core Service:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error('CoreService not initialized. Call initialize() first.');
    }
  }

  // ==========================================================================
  // Skills API
  // ==========================================================================

  /**
   * List all available skills
   */
  async listSkills(): Promise<SkillInfo[]> {
    this.ensureInitialized();
    const skills = await this.skillManager!.listSkills();

    return skills.map((skill) => ({
      name: skill.name,
      description: skill.description || '',
      level: skill.level,
      path: skill.filePath || '',
    }));
  }

  /**
   * Get a specific skill by name
   */
  async getSkill(name: string): Promise<SkillConfig | null> {
    this.ensureInitialized();
    return this.skillManager!.loadSkill(name);
  }

  // ==========================================================================
  // Agents/Subagents API
  // ==========================================================================

  /**
   * List all available subagents
   */
  async listAgents(): Promise<AgentInfo[]> {
    this.ensureInitialized();
    const agents = await this.subagentManager!.listSubagents();

    return agents.map((agent) => ({
      name: agent.name,
      description: agent.description || '',
      model: agent.modelConfig?.model,
      tools: agent.tools,
      level: agent.level,
      path: agent.filePath || '',
    }));
  }

  /**
   * Get a specific subagent by name
   */
  async getAgent(name: string): Promise<SubagentConfig | null> {
    this.ensureInitialized();
    return this.subagentManager!.loadSubagent(name);
  }

  /**
   * Create a new subagent
   */
  async createAgent(
    config: Partial<SubagentConfig>,
  ): Promise<void> {
    this.ensureInitialized();

    const fullConfig: SubagentConfig = {
      name: config.name || 'new-agent',
      description: config.description || '',
      systemPrompt: config.systemPrompt || '',
      level: 'user',
      tools: config.tools,
      modelConfig: config.modelConfig,
      runConfig: config.runConfig,
    };

    const options: CreateSubagentOptions = {
      level: 'user',
    };

    return this.subagentManager!.createSubagent(fullConfig, options);
  }

  /**
   * Update an existing subagent
   */
  async updateAgent(
    name: string,
    updates: Partial<SubagentConfig>,
  ): Promise<void> {
    this.ensureInitialized();
    return this.subagentManager!.updateSubagent(name, updates);
  }

  /**
   * Delete a subagent
   */
  async deleteAgent(name: string): Promise<void> {
    this.ensureInitialized();
    return this.subagentManager!.deleteSubagent(name);
  }

  // ==========================================================================
  // Extensions API
  // ==========================================================================

  /**
   * List all extensions
   */
  async listExtensions(): Promise<ExtensionInfo[]> {
    this.ensureInitialized();
    const extensions = this.extensionManager!.getLoadedExtensions();

    return extensions.map((ext) => ({
      id: ext.id,
      name: ext.name,
      version: ext.version,
      description: ext.config.name,
      enabled: ext.isActive,
      tools: Object.keys(ext.mcpServers || {}),
      skills:
        ext.skills?.map((s) => ({
          name: s.name,
          description: s.description || '',
          level: 'extension' as SkillLevel,
          path: ext.path,
        })) || [],
      agents:
        ext.agents?.map((a) => ({
          name: a.name,
          description: a.description || '',
          model: a.modelConfig?.model,
          tools: a.tools,
          level: 'extension' as SubagentLevel,
          path: ext.path,
        })) || [],
    }));
  }

  /**
   * Enable an extension
   */
  async enableExtension(name: string): Promise<void> {
    this.ensureInitialized();
    const { SettingScope } = await import('@ollama-code/ollama-code-core');
    return this.extensionManager!.enableExtension(name, SettingScope.User);
  }

  /**
   * Disable an extension
   */
  async disableExtension(name: string): Promise<void> {
    this.ensureInitialized();
    const { SettingScope } = await import('@ollama-code/ollama-code-core');
    return this.extensionManager!.disableExtension(name, SettingScope.User);
  }

  /**
   * Install an extension
   */
  async installExtension(
    source: string,
    type: 'git' | 'local' = 'local',
  ): Promise<Extension> {
    this.ensureInitialized();
    return this.extensionManager!.installExtension({
      source,
      type,
      originSource: 'OllamaCode',
    });
  }

  /**
   * Uninstall an extension
   */
  async uninstallExtension(name: string): Promise<void> {
    this.ensureInitialized();
    return this.extensionManager!.uninstallExtension(name, false);
  }

  // ==========================================================================
  // Tools API
  // ==========================================================================

  /**
   * List all available tools
   */
  async listTools(): Promise<ToolInfo[]> {
    this.ensureInitialized();
    const tools = this.toolRegistry!.getAllTools();

    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description || tool.displayName || '',
      source: this.detectToolSource(tool.name),
      inputSchema: tool.parameterSchema as Record<string, unknown> | undefined,
    }));
  }

  // ==========================================================================
  // MCP Servers API
  // ==========================================================================

  /**
   * List MCP servers
   */
  async listMCPServers(): Promise<MCPServerInfo[]> {
    this.ensureInitialized();
    const servers = this.config!.getMcpServers();

    if (!servers) {
      return [];
    }

    return Object.entries(servers).map(([name, _serverConfig]) => ({
      name,
      status: 'stopped' as const,
      tools: [],
    }));
  }

  /**
   * Restart an MCP server
   */
  async restartMCPServer(_name: string): Promise<void> {
    this.ensureInitialized();
    this.toolRegistry!.restartMcpServers();
    debugLogger.info('Restarted MCP servers');
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Detect tool source
   */
  private detectToolSource(name: string): 'builtin' | 'extension' | 'mcp' {
    // MCP tools typically have a prefix like "mcp__"
    if (name.startsWith('mcp__')) return 'mcp';
    // Check if tool is from builtin plugins
    if (this.isBuiltinTool(name)) return 'builtin';
    return 'extension';
  }

  /**
   * Check if tool is builtin
   */
  private isBuiltinTool(name: string): boolean {
    const builtinTools = [
      'read_file',
      'write_file',
      'edit_file',
      'list_directory',
      'glob',
      'grep',
      'execute_shell',
      'web_search',
      'web_fetch',
      'task',
      'skill',
    ];
    return builtinTools.includes(name);
  }

  /**
   * Refresh all caches
   */
  async refresh(): Promise<void> {
    this.ensureInitialized();
    await this.extensionManager!.refreshCache();
    await this.skillManager!.refreshCache();
    await this.subagentManager!.refreshCache();
  }

  // ==========================================================================
  // Config & ToolRegistry Access
  // ==========================================================================

  /**
   * Get the Config instance
   */
  getConfig(): Config {
    this.ensureInitialized();
    return this.config!;
  }

  /**
   * Get the ToolRegistry instance
   */
  getToolRegistry(): ToolRegistry {
    this.ensureInitialized();
    return this.toolRegistry!;
  }

  /**
   * Get the SkillManager instance
   */
  getSkillManager(): SkillManager {
    this.ensureInitialized();
    return this.skillManager!;
  }

  /**
   * Get the SubagentManager instance
   */
  getSubagentManager(): SubagentManager {
    this.ensureInitialized();
    return this.subagentManager!;
  }

  /**
   * Get the ExtensionManager instance
   */
  getExtensionManager(): ExtensionManager {
    this.ensureInitialized();
    return this.extensionManager!;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    debugLogger.info('Disposing Core Service...');
    this.config = null;
    this.skillManager = null;
    this.subagentManager = null;
    this.extensionManager = null;
    this.toolRegistry = null;
    this.storage = null;
    this.initialized = false;
  }
}

// ============================================================================
// Singleton Functions
// ============================================================================

/**
 * Get the core service singleton
 */
export function getCoreService(): CoreService {
  if (!coreServiceInstance) {
    // Default configuration
    coreServiceInstance = new CoreService({
      workspaceDir: process.cwd(),
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      isWorkspaceTrusted: true,
    });
  }
  return coreServiceInstance;
}

/**
 * Initialize the core service singleton
 */
export async function initializeCoreService(
  options: CoreServiceConfig,
): Promise<CoreService> {
  if (coreServiceInstance) {
    await coreServiceInstance.dispose();
  }

  coreServiceInstance = new CoreService(options);
  await coreServiceInstance.initialize();
  return coreServiceInstance;
}

/**
 * Reset the core service singleton
 */
export function resetCoreService(): void {
  if (coreServiceInstance) {
    coreServiceInstance.dispose().catch((error) => {
      debugLogger.error('Error disposing core service:', error);
    });
    coreServiceInstance = null;
  }
}
