#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Postinstall script for @ollama-code/core
 * Rebuilds native modules for the current Node.js version
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const nativeModules = ['hnswlib-node'];

function rebuildNativeModule(moduleName) {
  try {
    // Try to rebuild the native module
    execSync(`npm rebuild ${moduleName}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log(`✓ Rebuilt ${moduleName} for Node.js ${process.version}`);
  } catch (error) {
    console.warn(`⚠ Could not rebuild ${moduleName}: ${error.message}`);
    console.warn(
      `  The module may need to be rebuilt manually with: npm rebuild ${moduleName}`,
    );
  }
}

// Check if we're in a pnpm environment
const isPnpm = existsSync('node_modules/.pnpm');

if (isPnpm) {
  // For pnpm, navigate to the module directory and rebuild
  for (const moduleName of nativeModules) {
    const pnpmPath = `node_modules/.pnpm/${moduleName}@*/node_modules/${moduleName}`;
    try {
      const glob = await import('glob');
      const dirs = glob.globSync(pnpmPath);
      if (dirs.length > 0) {
        for (const dir of dirs) {
          try {
            execSync('npm rebuild', {
              stdio: 'inherit',
              cwd: dir,
            });
            console.log(`✓ Rebuilt ${moduleName} at ${dir}`);
          } catch {
            // Fallback to global rebuild
            rebuildNativeModule(moduleName);
          }
        }
      } else {
        // Module not found in pnpm structure, try global rebuild
        rebuildNativeModule(moduleName);
      }
    } catch {
      // glob not available, try direct rebuild
      rebuildNativeModule(moduleName);
    }
  }
} else {
  // For npm/yarn, rebuild directly
  for (const moduleName of nativeModules) {
    rebuildNativeModule(moduleName);
  }
}

console.log('✓ @ollama-code/core postinstall complete');
