#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Entry point for ollama-code CLI
import { main } from './src/ollama.js';

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
