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
 * 3. Copy native module binaries to locations where bundled code can find them
 */

import {
  symlinkSync,
  existsSync,
  lstatSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
} from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
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
  // React - must be external to avoid hook errors with ink
  'react',
  'react-dom',
  'react-reconciler',
  'scheduler',
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
    return null;
  }

  console.log(`  Found at: ${moduleDir}`);

  const success = rebuildWithNpm(moduleDir, moduleName);
  return success ? moduleDir : null;
}

// ============================================================================
// Native Binary Copy Functions
// ============================================================================

/**
 * Find compiled .node files in a module directory
 */
function findNodeBinaries(moduleDir) {
  const binaries = [];
  const searchDirs = [
    'build/Release',
    'build/Debug',
    'build/default',
    'prebuilds',
    'lib/binding',
  ];

  for (const subDir of searchDirs) {
    const dir = resolve(moduleDir, subDir);
    if (existsSync(dir)) {
      try {
        const entries = readdirSync(dir, {
          withFileTypes: true,
          recursive: true,
        });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.node')) {
            binaries.push(resolve(entry.path || dir, entry.name));
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }

  return binaries;
}

/**
 * Copy native module binaries to project root for bundled code to find them
 */
function copyNativeBinaries(moduleName, moduleDir) {
  console.log(`\nCopying native binaries for ${moduleName}...`);

  const binaries = findNodeBinaries(moduleDir);

  if (binaries.length === 0) {
    console.warn(`⚠ No .node binaries found in ${moduleDir}`);
    return false;
  }

  console.log(
    `  Found binaries: ${binaries.map((b) => basename(b)).join(', ')}`,
  );

  let copied = 0;

  for (const binary of binaries) {
    const relativePath = binary.substring(moduleDir.length);
    const targetPath = resolve('.' + relativePath);

    try {
      // Ensure target directory exists
      const targetDir = dirname(targetPath);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      copyFileSync(binary, targetPath);
      console.log(`  ✓ Copied ${basename(binary)} to ${targetPath}`);
      copied++;
    } catch (error) {
      console.warn(`  ✗ Failed to copy ${basename(binary)}: ${error.message}`);
    }
  }

  // Also copy to lib/binding/node-vNNN-platform-arch/ for bindings module
  const nodeVersion = process.versions.modules;
  const platform = process.platform;
  const arch = process.arch;
  const bindingDir = `lib/binding/node-v${nodeVersion}-${platform}-${arch}`;

  if (!existsSync(bindingDir)) {
    mkdirSync(bindingDir, { recursive: true });
  }

  for (const binary of binaries) {
    const targetPath = resolve(bindingDir, basename(binary));
    try {
      copyFileSync(binary, targetPath);
      console.log(`  ✓ Copied ${basename(binary)} to ${targetPath}`);
      copied++;
    } catch (error) {
      console.warn(`  ✗ Failed to copy to binding dir: ${error.message}`);
    }
  }

  return copied > 0;
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
const rebuiltModules = [];

for (const moduleName of NATIVE_MODULES) {
  const moduleDir = rebuildNativeModule(moduleName);
  if (moduleDir) {
    rebuildSuccess++;
    rebuiltModules.push({ name: moduleName, dir: moduleDir });
  } else {
    rebuildFail++;
  }
}

console.log(
  `\nNative modules: ${rebuildSuccess} rebuilt, ${rebuildFail} failed`,
);

// Step 3: Copy native binaries to locations where bundled code can find them
console.log('\nStep 3: Copying native binaries...\n');

for (const { name, dir } of rebuiltModules) {
  copyNativeBinaries(name, dir);
}

// Summary
console.log('\n=== Postinstall Complete ===');
if (rebuildFail > 0) {
  console.log('\n⚠ Some native modules could not be rebuilt.');
  console.log('  This may cause runtime errors. Try:');
  console.log('  pnpm rebuild hnswlib-node');
}
