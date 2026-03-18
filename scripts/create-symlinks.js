#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Postinstall script to create symlinks for packages that are bundled
 * but still need to be available at runtime due to dynamic imports.
 */

import {
  symlinkSync,
  existsSync,
  lstatSync,
  readdirSync,
  mkdirSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';

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

console.log('Creating symlinks for bundled packages...\n');

let success = 0;
let skipped = 0;

for (const packageName of PACKAGES_TO_LINK) {
  if (createSymlink(packageName)) {
    success++;
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${success} linked, ${skipped} skipped`);
