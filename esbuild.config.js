/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { writeFileSync, rmSync } from 'node:fs';

let esbuild;
try {
  esbuild = (await import('esbuild')).default;
} catch (_error) {
  console.warn('esbuild not available, skipping bundle step');
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require(path.resolve(__dirname, 'package.json'));

// Clean dist directory (cross-platform)
rmSync(path.resolve(__dirname, 'dist'), { recursive: true, force: true });

const external = [
  // Native modules - node-pty
  '@lydell/node-pty',
  'node-pty',
  '@lydell/node-pty-darwin-arm64',
  '@lydell/node-pty-darwin-x64',
  '@lydell/node-pty-linux-x64',
  '@lydell/node-pty-win32-arm64',
  '@lydell/node-pty-win32-x64',
  // Native modules - clipboard
  '@teddyzhu/clipboard',
  '@teddyzhu/clipboard-darwin-arm64',
  '@teddyzhu/clipboard-darwin-x64',
  '@teddyzhu/clipboard-linux-x64-gnu',
  '@teddyzhu/clipboard-linux-arm64-gnu',
  '@teddyzhu/clipboard-win32-x64-msvc',
  '@teddyzhu/clipboard-win32-arm64-msvc',
  // HNSWLib native module and dependencies
  'hnswlib-node',
  '@llm-tools/embedjs-hnswlib',
  'bindings',
  'node-pre-gyp',
  '@mapbox/node-pre-gyp',
  // React ecosystem - CRITICAL: must be external to avoid "Invalid hook call" error
  // ink uses React from node_modules, so bundling React causes two React instances
  'react',
  'react-dom',
  'react-dom/client',
  'react-reconciler',
  'scheduler',
  'react-is',
  'prop-types',
  // Ink CLI framework - uses React hooks
  'ink',
  'ink-spinner',
  'ink-text-input',
  'ink-select-input',
  'ansi-escapes',
  'ansi-styles',
  'chalk',
  'cli-boxes',
  'cli-cursor',
  'cli-spinners',
  'indent-string',
  'is-ci',
  'log-update',
  'patch-console',
  'pretty-format',
  'signal-exit',
  'slice-ansi',
  'string-width',
  'strip-ansi',
  'widest-line',
  'wrap-ansi',
  'yocto-spinner',
  'yocto-queue',
  // Gradient string - uses chalk internally, causes conflicts when bundled
  'gradient-string',
];

esbuild
  .build({
    entryPoints: ['packages/cli/index.ts'],
    bundle: true,
    outfile: 'dist/cli.js',
    platform: 'node',
    format: 'esm',
    target: 'node20',
    external,
    packages: 'bundle',
    inject: [path.resolve(__dirname, 'scripts/esbuild-shims.js')],
    banner: {
      js: `"use strict";`,
    },
    // JSX configuration - use automatic runtime for React 17+
    // This tells esbuild to import React functions from 'react' package
    jsx: 'automatic',
    jsxImportSource: 'react',
    alias: {
      'is-in-ci': path.resolve(
        __dirname,
        'packages/cli/src/patches/is-in-ci.ts',
      ),
      // Alias core package to source files (not dist) for proper .md embedding
      '@ollama-code/ollama-code-core': path.resolve(
        __dirname,
        'packages/core/src/index.ts',
      ),
    },
    define: {
      'process.env.CLI_VERSION': JSON.stringify(pkg.version),
      // Make global available for compatibility
      global: 'globalThis',
    },
    loader: {
      '.node': 'file',
      '.md': 'text', // Embed markdown files as strings
    },
    metafile: true,
    write: true,
    keepNames: true,
  })
  .then(({ metafile }) => {
    if (process.env.DEV === 'true') {
      writeFileSync('./dist/esbuild.json', JSON.stringify(metafile, null, 2));
    }
    console.log('Build complete: dist/cli.js');
  })
  .catch((error) => {
    console.error('esbuild build failed:', error);
    process.exitCode = 1;
  });
