#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Postinstall script to:
 * 1. Create symlinks for packages that are bundled but need runtime access
 * 2. Rebuild native modules for the current Node.js version
 */

import {
  symlinkSync,
  existsSync,
  lstatSync,
  readdirSync,
  mkdirSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';

// ============================================================================
// Configuration
// ============================================================================

const PACKAGES_TO_LINK = [
  // Ink/gradient dependencies
  'ink-gradient',
  'gradient-string',
  'tinygradient',
  // HNSWLib native module and dependencies
  'hnswlib-node',
  '@llm-tools/embedjs-hnswlib',
  'bindings',
  'node-pre-gyp',
  '@mapbox/node-pre-gyp',
];

const NATIVE_MODULES = ['hnswlib-node'];

// ============================================================================
// Symlink Functions
// ============================================================================

function findPnpmPackage(packageName) {
  const pnpmDir = resolve('node_modules/.pnpm');
  if (!existsSync(pnpmDir)) {
    return null;
  }

  // Handle scoped packages: @scope/name -> @scope+name@version
  const pnpmName = packageName.replace('/', '+');

  const entries = readdirSync(pnpmDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith(`${pnpmName}@`)) {
      const packagePath = resolve(
        pnpmDir,
        entry.name,
        'node_modules',
        packageName,
      );
      if (existsSync(packagePath)) {
        return packagePath;
      }
    }
  }
  return null;
}

function createSymlink(packageName) {
  const targetPath = resolve('node_modules', packageName);

  // Skip if already exists (symlink or directory)
  if (
    existsSync(targetPath) ||
    lstatSync(targetPath, { throwIfNoEntry: false })
  ) {
    console.log(`✓ ${packageName} already linked`);
    return true;
  }

  // Find package in pnpm structure
  const sourcePath = findPnpmPackage(packageName);
  if (!sourcePath) {
    console.log(`⚠ ${packageName} not found in pnpm, skipping`);
    return false;
  }

  try {
    // Ensure parent directory exists (for scoped packages like @scope/name)
    const parentDir = dirname(targetPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    symlinkSync(sourcePath, targetPath, 'junction');
    console.log(`✓ Created symlink for ${packageName}`);
    return true;
  } catch (error) {
    console.error(
      `✗ Failed to create symlink for ${packageName}:`,
      error.message,
    );
    return false;
  }
}

// ============================================================================
// Native Module Rebuild Functions
// ============================================================================

function findPnpmModuleDir(moduleName) {
  const pnpmDir = resolve('node_modules/.pnpm');

  if (!existsSync(pnpmDir)) {
    return null;
  }

  // Pattern: node_modules/.pnpm/hnswlib-node@3.0.0/node_modules/hnswlib-node
  try {
    const entries = readdirSync(pnpmDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(`${moduleName}@`)) {
        const moduleDir = resolve(
          pnpmDir,
          entry.name,
          'node_modules',
          moduleName,
        );
        if (existsSync(moduleDir)) {
          return moduleDir;
        }
      }
    }
  } catch (error) {
    console.warn(`Error reading pnpm directory: ${error.message}`);
  }

  return null;
}

function rebuildWithNpm(moduleDir, moduleName) {
  console.log(`  Rebuilding ${moduleName} with npm...`);

  try {
    execSync('npm rebuild', {
      stdio: 'inherit',
      cwd: moduleDir,
      timeout: 120000,
    });
    console.log(`✓ Successfully rebuilt ${moduleName}`);
    return true;
  } catch (error) {
    console.warn(`  npm rebuild failed: ${error.message}`);
    return false;
  }
}

function rebuildNativeModule(moduleName) {
  console.log(`\nRebuilding native module: ${moduleName}`);

  const moduleDir = findPnpmModuleDir(moduleName);

  if (!moduleDir) {
    console.warn(`⚠ ${moduleName} not found in pnpm structure`);
    return false;
  }

  console.log(`  Found at: ${moduleDir}`);

  return rebuildWithNpm(moduleDir, moduleName);
}

// ============================================================================
// Main
// ============================================================================

console.log('=== Postinstall Setup ===\n');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}\n`);

// Step 1: Create symlinks
console.log('Step 1: Creating symlinks for bundled packages...\n');

let linkSuccess = 0;
let linkSkipped = 0;

for (const packageName of PACKAGES_TO_LINK) {
  if (createSymlink(packageName)) {
    linkSuccess++;
  } else {
    linkSkipped++;
  }
}

console.log(`\nSymlinks: ${linkSuccess} linked, ${linkSkipped} skipped`);

// Step 2: Rebuild native modules
console.log('\nStep 2: Rebuilding native modules...\n');

let rebuildSuccess = 0;
let rebuildFail = 0;

for (const moduleName of NATIVE_MODULES) {
  if (rebuildNativeModule(moduleName)) {
    rebuildSuccess++;
  } else {
    rebuildFail++;
  }
}

console.log(
  `\nNative modules: ${rebuildSuccess} rebuilt, ${rebuildFail} failed`,
);

// Summary
console.log('\n=== Postinstall Complete ===');
if (rebuildFail > 0) {
  console.log('\n⚠ Some native modules could not be rebuilt.');
  console.log('  This may cause runtime errors. Try:');
  console.log('  pnpm rebuild hnswlib-node');
}
