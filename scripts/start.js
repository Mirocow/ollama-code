/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law_or_agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { spawn, execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

// Parse command line arguments
const args = process.argv.slice(2);
const hasDebugFlag = args.includes('--debug') || args.includes('-d');
const hasInspectFlag = args.includes('--inspect') || args.includes('-i');

// Remove debug/inspect flags from args if present
const filteredArgs = args.filter(
  (arg) =>
    arg !== '--debug' && arg !== '-d' && arg !== '--inspect' && arg !== '-i',
);

// check build status, write warnings to file for app to display if needed
execSync('node ./scripts/check-build-status.js', {
  stdio: 'inherit',
  cwd: root,
});

const nodeArgs = [];
let sandboxCommand = undefined;
try {
  sandboxCommand = execSync('node scripts/sandbox_command.js', {
    cwd: root,
  })
    .toString()
    .trim();
} catch {
  // ignore
}

// Only add --inspect-brk if explicitly requested with --inspect flag or INSPECT env
// DEBUG env alone just enables logging, not the inspector
const shouldInspect = hasInspectFlag || process.env.INSPECT === '1';
if (shouldInspect && !sandboxCommand) {
  if (process.env.SANDBOX) {
    const port = process.env.DEBUG_PORT || '9229';
    nodeArgs.push(`--inspect-brk=0.0.0.0:${port}`);
  } else {
    nodeArgs.push('--inspect-brk');
  }
}

nodeArgs.push(join(root, 'packages', 'cli'));
nodeArgs.push(...filteredArgs);

const env = {
  ...process.env,
  CLI_VERSION: pkg.version,
  DEV: 'true',
};

// Enable debug logging if --debug flag is present or DEBUG env is set
if (process.env.DEBUG || hasDebugFlag) {
  // If this is not set, the debugger will pause on the outer process rather
  // than the relaunched process making it harder to debug.
  env.OLLAMA_CODE_NO_RELAUNCH = 'true';
  // Enable debug log file
  env.OLLAMA_CODE_DEBUG_LOG_FILE = '1';
  console.log(
    '[DEBUG] Debug logging enabled. Logs will be saved to ~/.ollama-code/debug/',
  );
}
// Use process.cwd() to inherit the working directory from launch.json cwd setting
// This allows debugging from a specific directory (e.g., .todo)
const workingDir = process.env.OLLAMA_WORKING_DIR || process.cwd();
const child = spawn('node', nodeArgs, {
  stdio: 'inherit',
  env,
  cwd: workingDir,
});

child.on('close', (code) => {
  process.exit(code);
});
