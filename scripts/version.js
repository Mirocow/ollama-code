/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A script to handle versioning and ensure all related changes are in a single, atomic commit.

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// 1. Get the version from the command line arguments.
const versionType = process.argv[2];
if (!versionType) {
  console.error('Error: No version specified.');
  console.error(
    'Usage: npm run version <version> (e.g., 1.2.3 or patch|minor|major|prerelease)',
  );
  process.exit(1);
}

// 2. Bump the version in the root and all workspace package.json files.
run(
  `npx pnpm version ${versionType} --no-git-tag-version --allow-same-version`,
);

// 3. Get all workspaces and filter out the one we don't want to version.
// We intend to maintain sdk version independently.
const workspacesToExclude = ['@ollama-code/sdk'];
let lsOutput;
try {
  lsOutput = JSON.parse(execSync('npx pnpm ls --json --depth=0').toString());
} catch (e) {
  // `pnpm ls` can exit with a non-zero status code if there are issues
  // with dependencies, but it will still produce the JSON output we need.
  // We'll try to parse the stdout from the error object.
  if (e.stdout) {
    console.warn(
      'Warning: `pnpm ls` exited with a non-zero status code. Attempting to proceed with the output.',
    );
    try {
      lsOutput = JSON.parse(e.stdout.toString());
    } catch (parseError) {
      console.error(
        'Error: Failed to parse JSON from `pnpm ls` output even after `pnpm ls` failed.',
      );
      console.error('pnpm ls stderr:', e.stderr.toString());
      console.error('Parse error:', parseError);
      process.exit(1);
    }
  } else {
    console.error('Error: `pnpm ls` failed with no output.');
    console.error(e.stderr?.toString() || e);
    process.exit(1);
  }
}
const allWorkspaces = Object.keys(lsOutput.dependencies || {});
const workspacesToVersion = allWorkspaces.filter(
  (wsName) => !workspacesToExclude.includes(wsName),
);

for (const workspaceName of workspacesToVersion) {
  run(
    `npx pnpm --filter ${workspaceName} version ${versionType} --no-git-tag-version --allow-same-version`,
  );
}

// 4. Get the new version number from the root package.json
const rootPackageJsonPath = resolve(process.cwd(), 'package.json');
const newVersion = readJson(rootPackageJsonPath).version;

// 5. Update the sandboxImageUri in the root package.json
const rootPackageJson = readJson(rootPackageJsonPath);
if (rootPackageJson.config?.sandboxImageUri) {
  rootPackageJson.config.sandboxImageUri =
    rootPackageJson.config.sandboxImageUri.replace(/:.*$/, `:${newVersion}`);
  console.log(`Updated sandboxImageUri in root to use version ${newVersion}`);
  writeJson(rootPackageJsonPath, rootPackageJson);
}

// 6. Update the sandboxImageUri in the cli package.json
const cliPackageJsonPath = resolve(process.cwd(), 'packages/cli/package.json');
const cliPackageJson = readJson(cliPackageJsonPath);
if (cliPackageJson.config?.sandboxImageUri) {
  cliPackageJson.config.sandboxImageUri =
    cliPackageJson.config.sandboxImageUri.replace(/:.*$/, `:${newVersion}`);
  console.log(
    `Updated sandboxImageUri in cli package to use version ${newVersion}`,
  );
  writeJson(cliPackageJsonPath, cliPackageJson);
}

// 7. Run `pnpm install` to update pnpm-lock.yaml.
run('npx pnpm install');

console.log(`Successfully bumped versions to v${newVersion}.`);
