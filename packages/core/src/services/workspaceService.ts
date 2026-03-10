/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workspace Management Service
 *
 * Manages multiple project workspaces with:
 * - Project detection and registration
 * - Workspace switching
 * - Per-workspace settings and history
 * - Session management per workspace
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('workspace');

/**
 * Workspace configuration
 */
export interface WorkspaceConfig {
  /** Unique workspace ID */
  id: string;
  /** Workspace name */
  name: string;
  /** Project root path */
  rootPath: string;
  /** Created timestamp */
  createdAt: number;
  /** Last accessed timestamp */
  lastAccessedAt: number;
  /** Git branch when last accessed */
  lastBranch?: string;
  /** Model last used */
  lastModel?: string;
  /** Total sessions in this workspace */
  totalSessions: number;
  /** Is trusted workspace */
  isTrusted: boolean;
  /** Custom settings */
  settings: Record<string, unknown>;
  /** Tags for organization */
  tags: string[];
}

/**
 * Workspace session summary
 */
export interface WorkspaceSession {
  /** Session ID */
  sessionId: string;
  /** Timestamp */
  timestamp: number;
  /** Model used */
  model: string;
  /** Tokens used */
  tokens: number;
  /** Duration in ms */
  duration: number;
}

/**
 * Workspace statistics
 */
export interface WorkspaceStats {
  /** Total workspaces */
  totalWorkspaces: number;
  /** Total sessions across all workspaces */
  totalSessions: number;
  /** Most active workspace */
  mostActiveWorkspace: string;
  /** Workspaces by tag */
  byTag: Record<string, number>;
  /** Recent workspaces */
  recent: WorkspaceConfig[];
}

/**
 * Workspace service configuration
 */
export interface WorkspaceServiceConfig {
  /** Maximum recent workspaces to keep */
  maxRecentWorkspaces: number;
  /** Workspace storage file name */
  storageFileName: string;
  /** Auto-detect workspaces */
  autoDetect: boolean;
}

const DEFAULT_CONFIG: WorkspaceServiceConfig = {
  maxRecentWorkspaces: 20,
  storageFileName: 'workspaces.json',
  autoDetect: true,
};

/**
 * Workspace Management Service
 */
export class WorkspaceService {
  private config: WorkspaceServiceConfig;
  private storagePath: string;
  private workspaces: Map<string, WorkspaceConfig> = new Map();
  private currentWorkspaceId: string | null = null;

  constructor(config: Partial<WorkspaceServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storagePath = path.join(
      os.homedir(),
      '.ollama-code',
      this.config.storageFileName,
    );
    this.loadWorkspaces();
  }

  /**
   * Load workspaces from disk
   */
  private loadWorkspaces(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const content = fs.readFileSync(this.storagePath, 'utf-8');
        const data = JSON.parse(content);
        const workspaces = data.workspaces || [];
        
        for (const ws of workspaces) {
          this.workspaces.set(ws.id, ws);
        }
        
        logger.debug('Loaded workspaces', { count: this.workspaces.size });
      }
    } catch (error) {
      logger.warn('Failed to load workspaces', { error: String(error) });
    }
  }

  /**
   * Save workspaces to disk
   */
  private saveWorkspaces(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        version: 1,
        updatedAt: new Date().toISOString(),
        workspaces: Array.from(this.workspaces.values()),
      };

      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
      logger.debug('Saved workspaces', { count: this.workspaces.size });
    } catch (error) {
      logger.error('Failed to save workspaces', error as Error);
    }
  }

  /**
   * Generate unique workspace ID
   */
  private generateId(): string {
    return `ws_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get workspace ID from path
   */
  private getWorkspaceIdFromPath(rootPath: string): string {
    // Create a stable ID based on path hash
    const normalized = path.resolve(rootPath).toLowerCase();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `ws_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Register or update a workspace
   */
  registerWorkspace(
    rootPath: string,
    options: {
      name?: string;
      isTrusted?: boolean;
      tags?: string[];
    } = {},
  ): WorkspaceConfig {
    const resolvedPath = path.resolve(rootPath);
    const id = this.getWorkspaceIdFromPath(resolvedPath);
    
    // Check if workspace already exists
    const existing = this.workspaces.get(id);
    if (existing) {
      // Update last accessed
      existing.lastAccessedAt = Date.now();
      
      // Try to get current branch
      try {
        existing.lastBranch = execSync('git branch --show-current', {
          cwd: resolvedPath,
          encoding: 'utf-8',
        }).trim();
      } catch {
        // Not a git repo
      }
      
      this.saveWorkspaces();
      this.currentWorkspaceId = id;
      return existing;
    }

    // Create new workspace
    const workspaceName = options.name || path.basename(resolvedPath);
    const workspace: WorkspaceConfig = {
      id,
      name: workspaceName,
      rootPath: resolvedPath,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      totalSessions: 0,
      isTrusted: options.isTrusted ?? false,
      settings: {},
      tags: options.tags || [],
    };

    // Try to get git branch
    try {
      workspace.lastBranch = execSync('git branch --show-current', {
        cwd: resolvedPath,
        encoding: 'utf-8',
      }).trim();
    } catch {
      // Not a git repo
    }

    this.workspaces.set(id, workspace);
    this.currentWorkspaceId = id;
    this.saveWorkspaces();

    logger.info('Registered workspace', { name: workspaceName, path: resolvedPath });
    return workspace;
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): WorkspaceConfig | null {
    if (!this.currentWorkspaceId) return null;
    return this.workspaces.get(this.currentWorkspaceId) || null;
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id: string): WorkspaceConfig | null {
    return this.workspaces.get(id) || null;
  }

  /**
   * Get workspace by path
   */
  getWorkspaceByPath(rootPath: string): WorkspaceConfig | null {
    const id = this.getWorkspaceIdFromPath(rootPath);
    return this.workspaces.get(id) || null;
  }

  /**
   * Switch to a workspace
   */
  switchWorkspace(id: string): WorkspaceConfig | null {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      logger.warn('Workspace not found', { id });
      return null;
    }

    // Check if path still exists
    if (!fs.existsSync(workspace.rootPath)) {
      logger.warn('Workspace path no longer exists', { path: workspace.rootPath });
      return null;
    }

    workspace.lastAccessedAt = Date.now();
    this.currentWorkspaceId = id;
    this.saveWorkspaces();

    logger.info('Switched to workspace', { name: workspace.name });
    return workspace;
  }

  /**
   * List all workspaces
   */
  listWorkspaces(): WorkspaceConfig[] {
    return Array.from(this.workspaces.values())
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
  }

  /**
   * Get recent workspaces
   */
  getRecentWorkspaces(limit: number = 10): WorkspaceConfig[] {
    return this.listWorkspaces().slice(0, limit);
  }

  /**
   * Update workspace settings
   */
  updateWorkspaceSettings(
    id: string,
    settings: Record<string, unknown>,
  ): boolean {
    const workspace = this.workspaces.get(id);
    if (!workspace) return false;

    workspace.settings = { ...workspace.settings, ...settings };
    this.saveWorkspaces();
    return true;
  }

  /**
   * Add tag to workspace
   */
  addTag(id: string, tag: string): boolean {
    const workspace = this.workspaces.get(id);
    if (!workspace) return false;

    if (!workspace.tags.includes(tag)) {
      workspace.tags.push(tag);
      this.saveWorkspaces();
    }
    return true;
  }

  /**
   * Remove tag from workspace
   */
  removeTag(id: string, tag: string): boolean {
    const workspace = this.workspaces.get(id);
    if (!workspace) return false;

    workspace.tags = workspace.tags.filter(t => t !== tag);
    this.saveWorkspaces();
    return true;
  }

  /**
   * Increment session count for workspace
   */
  incrementSessionCount(id: string): void {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.totalSessions++;
      this.saveWorkspaces();
    }
  }

  /**
   * Delete a workspace
   */
  deleteWorkspace(id: string): boolean {
    const deleted = this.workspaces.delete(id);
    if (deleted) {
      this.saveWorkspaces();
      logger.info('Deleted workspace', { id });
    }
    return deleted;
  }

  /**
   * Get workspace statistics
   */
  getStats(): WorkspaceStats {
    const workspaces = this.listWorkspaces();
    const totalSessions = workspaces.reduce((sum, ws) => sum + ws.totalSessions, 0);
    
    // Most active workspace
    const mostActive = workspaces.reduce(
      (max, ws) => (ws.totalSessions > (max?.totalSessions || 0) ? ws : max),
      workspaces[0],
    );

    // By tag
    const byTag: Record<string, number> = {};
    for (const ws of workspaces) {
      for (const tag of ws.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
    }

    return {
      totalWorkspaces: workspaces.length,
      totalSessions,
      mostActiveWorkspace: mostActive?.name || 'none',
      byTag,
      recent: workspaces.slice(0, 10),
    };
  }

  /**
   * Rename a workspace
   */
  renameWorkspace(id: string, newName: string): boolean {
    const workspace = this.workspaces.get(id);
    if (!workspace) return false;

    workspace.name = newName;
    this.saveWorkspaces();
    logger.info('Renamed workspace', { id, newName });
    return true;
  }

  /**
   * Set workspace trust status
   */
  setTrusted(id: string, trusted: boolean): boolean {
    const workspace = this.workspaces.get(id);
    if (!workspace) return false;

    workspace.isTrusted = trusted;
    this.saveWorkspaces();
    logger.info('Updated workspace trust', { id, trusted });
    return true;
  }

  /**
   * Find workspaces by tag
   */
  findByTag(tag: string): WorkspaceConfig[] {
    return this.listWorkspaces().filter(ws => ws.tags.includes(tag));
  }

  /**
   * Find workspaces by name pattern
   */
  findByName(pattern: string): WorkspaceConfig[] {
    const regex = new RegExp(pattern, 'i');
    return this.listWorkspaces().filter(ws => regex.test(ws.name));
  }

  /**
   * Clean up non-existent workspace paths
   */
  cleanup(): number {
    let removed = 0;
    const toRemove: string[] = [];

    for (const [id, ws] of this.workspaces) {
      if (!fs.existsSync(ws.rootPath)) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.workspaces.delete(id);
      removed++;
    }

    if (removed > 0) {
      this.saveWorkspaces();
      logger.info('Cleaned up workspaces', { removed });
    }

    return removed;
  }

  /**
   * Export workspace data
   */
  exportWorkspace(id: string): string | null {
    const workspace = this.workspaces.get(id);
    if (!workspace) return null;

    return JSON.stringify(workspace, null, 2);
  }

  /**
   * Import workspace data
   */
  importWorkspace(data: string): WorkspaceConfig | null {
    try {
      const workspace = JSON.parse(data) as WorkspaceConfig;
      
      // Validate required fields
      if (!workspace.id || !workspace.rootPath || !workspace.name) {
        return null;
      }

      // Check if path exists
      if (!fs.existsSync(workspace.rootPath)) {
        return null;
      }

      // Generate new ID to avoid conflicts
      workspace.id = this.generateId();
      workspace.createdAt = Date.now();
      workspace.lastAccessedAt = Date.now();

      this.workspaces.set(workspace.id, workspace);
      this.saveWorkspaces();

      logger.info('Imported workspace', { name: workspace.name });
      return workspace;
    } catch {
      return null;
    }
  }

  /**
   * Get workspace storage path
   */
  getWorkspaceStoragePath(id: string): string {
    return path.join(
      os.homedir(),
      '.ollama-code',
      'workspaces',
      id,
    );
  }

  /**
   * Format workspace for display
   */
  static formatWorkspace(workspace: WorkspaceConfig, isCurrent: boolean = false): string {
    const marker = isCurrent ? '→ ' : '  ';
    const trusted = workspace.isTrusted ? '✓' : '○';
    const sessions = workspace.totalSessions > 0 ? ` (${workspace.totalSessions} sessions)` : '';
    const branch = workspace.lastBranch ? ` [${workspace.lastBranch}]` : '';
    
    return `${marker}${trusted} ${workspace.name}${branch}${sessions}`;
  }
}

// Singleton instance
let workspaceServiceInstance: WorkspaceService | null = null;

export function getWorkspaceService(): WorkspaceService {
  if (!workspaceServiceInstance) {
    workspaceServiceInstance = new WorkspaceService();
  }
  return workspaceServiceInstance;
}

export function resetWorkspaceService(): void {
  workspaceServiceInstance = null;
}
