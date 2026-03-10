#!/usr/bin/env node

/**
 * Debug launcher script - runs ollama-code with --inspect flag
 * This allows attaching VS Code debugger to a running process.
 *
 * Usage:
 *   node scripts/debug-launch.js                    # Start fresh
 *   node scripts/debug-launch.js --resume           # Resume with picker
 *   node scripts/debug-launch.js --resume <id>      # Resume specific session
 *   node scripts/debug-launch.js --port 9230        # Custom port
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse args
const args = process.argv.slice(2);
let port = 9229;
const nodeArgs = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  } else {
    nodeArgs.push(args[i]);
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Debug Mode Enabled                        ║
╠══════════════════════════════════════════════════════════════╣
║  Inspector running on: ws://127.0.0.1:${port}                   ║
║                                                              ║
║  To attach from VS Code:                                     ║
║  1. Press F1                                                 ║
║  2. Select "Debug: Select and Start Debugging"               ║
║  3. Choose "Attach to Running Process (${port})"                ║
║                                                              ║
║  Or use the "Attach to Running Process (${port})" launch config ║
╚══════════════════════════════════════════════════════════════╝
`);

// Set environment
const env = {
  ...process.env,
  DEBUG: '1',
  OLLAMA_CODE_NO_RELAUNCH: 'true',
  //NODE_OPTIONS: `--inspect=${port}`,
};

// Spawn the main process
const child = spawn(
  process.execPath,
  [`--inspect=${port}`, join(__dirname, 'launch.js'), ...nodeArgs],
  {
    cwd: join(__dirname, '..'),
    env,
    stdio: 'inherit',
    shell: false,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
