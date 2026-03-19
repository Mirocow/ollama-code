/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Project Detection Utilities
 *
 * Consolidated implementation for finding project root directories.
 * Supports multiple project markers and caching for performance.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { createDebugLogger } from './debugLogger.js';

const logger = createDebugLogger('PROJECT_DETECTION');

// ============================================================================
// Constants
// ============================================================================

/**
 * Default cache TTL for project root (1 minute)
 */
const DEFAULT_CACHE_TTL_MS = 60000;

/**
 * Project markers used to detect project root
 * Ordered by specificity (more specific first)
 */
export const PROJECT_MARKERS = [
  '.git',
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'settings.gradle',
  'composer.json',
  '.ollama-code',
] as const;

export type ProjectMarker = (typeof PROJECT_MARKERS)[number];

/**
 * Project type detected from markers
 */
export type ProjectType =
  | 'node'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'php'
  | 'unknown';

/**
 * Mapping from marker file to project type
 */
const MARKER_TO_TYPE: Record<string, ProjectType> = {
  'package.json': 'node',
  'pyproject.toml': 'python',
  'requirements.txt': 'python',
  'setup.py': 'python',
  'go.mod': 'go',
  'Cargo.toml': 'rust',
  'pom.xml': 'java',
  'build.gradle': 'java',
  'composer.json': 'php',
};

// ============================================================================
// Cache
// ============================================================================

interface ProjectRootCache {
  root: string | null;
  timestamp: number;
  startDir: string;
}

let cache: ProjectRootCache | null = null;
let cacheTtlMs = DEFAULT_CACHE_TTL_MS;

/**
 * Configure cache TTL (primarily for testing)
 */
export function setCacheTtl(ttlMs: number): void {
  cacheTtlMs = ttlMs;
}

/**
 * Clear the project root cache
 */
export function clearProjectRootCache(): void {
  cache = null;
  logger.debug('Project root cache cleared');
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Find the project root directory by searching for project markers.
 *
 * Walks up the directory tree from startDir looking for any file or directory
 * in PROJECT_MARKERS. Returns the first directory containing a marker.
 *
 * @param startDir - Directory to start searching from (defaults to cwd)
 * @param options - Optional configuration
 * @returns Project root path or null if not found
 */
export async function findProjectRoot(
  startDir: string = process.cwd(),
  options?: {
    /** Custom markers to search for (defaults to PROJECT_MARKERS) */
    markers?: readonly string[];
    /** Whether to use cache (defaults to true) */
    useCache?: boolean;
    /** Stop at this directory (defaults to homedir) */
    stopAt?: string;
  },
): Promise<string | null> {
  const markers = options?.markers ?? PROJECT_MARKERS;
  const useCache = options?.useCache ?? true;
  const stopAt = options?.stopAt ?? homedir();

  // Check cache
  if (useCache && cache) {
    const now = Date.now();
    if (
      now - cache.timestamp < cacheTtlMs &&
      cache.startDir === startDir
    ) {
      logger.debug(`Cache hit for startDir: ${startDir}`);
      return cache.root;
    }
  }

  let currentDir = path.resolve(startDir);
  const rootDir = stopAt;

  while (currentDir !== rootDir && currentDir !== '/') {
    for (const marker of markers) {
      const markerPath = path.join(currentDir, marker);
      try {
        await fs.access(markerPath);
        
        // Update cache
        cache = {
          root: currentDir,
          timestamp: Date.now(),
          startDir,
        };
        
        logger.debug(
          `Project root found: ${currentDir} (marker: ${marker})`,
        );
        return currentDir;
      } catch {
        // Marker not found, continue searching
      }
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root
      break;
    }
    currentDir = parentDir;
  }

  // Not found - cache the negative result
  cache = {
    root: null,
    timestamp: Date.now(),
    startDir,
  };

  logger.debug(`No project root found from: ${startDir}`);
  return null;
}

/**
 * Find the project root directory, with fallback.
 *
 * Same as findProjectRoot, but returns startDir if no project root is found.
 *
 * @param startDir - Directory to start searching from
 * @returns Project root path (or startDir if not found)
 */
export async function findProjectRootOrFallback(
  startDir: string = process.cwd(),
): Promise<string> {
  const root = await findProjectRoot(startDir);
  return root ?? path.resolve(startDir);
}

/**
 * Detect the project type based on marker files.
 *
 * @param projectRoot - The project root directory
 * @returns Detected project type
 */
export async function detectProjectType(
  projectRoot: string,
): Promise<ProjectType> {
  for (const [marker, type] of Object.entries(MARKER_TO_TYPE)) {
    try {
      await fs.access(path.join(projectRoot, marker));
      return type;
    } catch {
      // Continue checking
    }
  }
  return 'unknown';
}

/**
 * Get project information including root, type, and name.
 */
export async function getProjectInfo(
  startDir: string = process.cwd(),
): Promise<{
  root: string | null;
  type: ProjectType;
  name: string;
}> {
  const root = await findProjectRoot(startDir);
  const type = root ? await detectProjectType(root) : 'unknown';
  const name = root ? path.basename(root) : 'unknown';

  return { root, type, name };
}

/**
 * Check if a directory is within a project.
 *
 * @param dir - Directory to check
 * @returns True if the directory is within a project (has a project root)
 */
export async function isWithinProject(
  dir: string = process.cwd(),
): Promise<boolean> {
  const root = await findProjectRoot(dir);
  return root !== null;
}
