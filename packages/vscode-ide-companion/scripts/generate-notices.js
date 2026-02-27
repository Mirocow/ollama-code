/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'),
);
const packagePath = path.join(projectRoot, 'packages', 'vscode-ide-companion');
const noticeFilePath = path.join(packagePath, 'NOTICES.txt');

async function getDependencyLicense(depName, depVersion) {
  let depPackageJsonPath;
  let licenseContent = 'License text not found.';
  let repositoryUrl = 'No repository found';

  try {
    depPackageJsonPath = path.join(
      projectRoot,
      'node_modules',
      depName,
      'package.json',
    );
    if (!(await fs.stat(depPackageJsonPath).catch(() => false))) {
      depPackageJsonPath = path.join(
        packagePath,
        'node_modules',
        depName,
        'package.json',
      );
    }

    const depPackageJsonContent = await fs.readFile(
      depPackageJsonPath,
      'utf-8',
    );
    const depPackageJson = JSON.parse(depPackageJsonContent);

    repositoryUrl = depPackageJson.repository?.url || repositoryUrl;

    const packageDir = path.dirname(depPackageJsonPath);
    const licenseFileCandidates = [
      depPackageJson.licenseFile,
      'LICENSE',
      'LICENSE.md',
      'LICENSE.txt',
      'LICENSE-MIT.txt',
      'license.md',
      'license',
    ].filter(Boolean);

    let licenseFile;
    for (const candidate of licenseFileCandidates) {
      const potentialFile = path.join(packageDir, candidate);
      if (await fs.stat(potentialFile).catch(() => false)) {
        licenseFile = potentialFile;
        break;
      }
    }

    if (licenseFile) {
      try {
        licenseContent = await fs.readFile(licenseFile, 'utf-8');
      } catch (e) {
        console.warn(
          `Warning: Failed to read license file for ${depName}: ${e.message}`,
        );
      }
    } else {
      console.warn(`Warning: Could not find license file for ${depName}`);
    }
  } catch (e) {
    console.warn(
      `Warning: Could not find package.json for ${depName}: ${e.message}`,
    );
  }

  return {
    name: depName,
    version: depVersion,
    repository: repositoryUrl,
    license: licenseContent,
  };
}

function collectDependencies(packageName, packageLock, dependenciesMap) {
  if (dependenciesMap.has(packageName)) {
    return;
  }

  const packageInfo = packageLock.packages[`node_modules/${packageName}`];
  if (!packageInfo) {
    console.warn(
      `Warning: Could not find package info for ${packageName} in package-lock.json.`,
    );
    return;
  }

  dependenciesMap.set(packageName, packageInfo.version);

  if (packageInfo.dependencies) {
    for (const depName of Object.keys(packageInfo.dependencies)) {
      collectDependencies(depName, packageLock, dependenciesMap);
    }
  }
}

/**
 * Collect dependencies from pnpm-lock.yaml (simplified approach)
 * Just reads direct dependencies from package.json and node_modules
 */
async function collectDependenciesFromPnpm(packageJson, allDependencies) {
  const directDependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  const allDeps = [...directDependencies, ...devDependencies];

  for (const depName of allDeps) {
    if (allDependencies.has(depName)) continue;

    // Try to get version from node_modules
    try {
      const depPackageJsonPath = path.join(
        projectRoot,
        'node_modules',
        depName,
        'package.json',
      );
      const content = await fs.readFile(depPackageJsonPath, 'utf-8');
      const depJson = JSON.parse(content);
      allDependencies.set(depName, depJson.version);
    } catch {
      // Try in package's node_modules
      try {
        const depPackageJsonPath = path.join(
          packagePath,
          'node_modules',
          depName,
          'package.json',
        );
        const content = await fs.readFile(depPackageJsonPath, 'utf-8');
        const depJson = JSON.parse(content);
        allDependencies.set(depName, depJson.version);
      } catch {
        console.warn(`Warning: Could not find version for ${depName}`);
        allDependencies.set(depName, 'unknown');
      }
    }
  }
}

async function main() {
  try {
    const packageJsonPath = path.join(packagePath, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    const allDependencies = new Map();

    // Check for pnpm-lock.yaml first, then package-lock.json
    const pnpmLockPath = path.join(projectRoot, 'pnpm-lock.yaml');
    const npmLockPath = path.join(projectRoot, 'package-lock.json');

    const hasPnpm = await fs.stat(pnpmLockPath).catch(() => false);
    const hasNpm = await fs.stat(npmLockPath).catch(() => false);

    if (hasNpm) {
      // Use npm package-lock.json
      const packageLockJsonContent = await fs.readFile(npmLockPath, 'utf-8');
      const packageLockJson = JSON.parse(packageLockJsonContent);
      const directDependencies = Object.keys(packageJson.dependencies || {});

      for (const depName of directDependencies) {
        collectDependencies(depName, packageLockJson, allDependencies);
      }
    } else if (hasPnpm) {
      // Use pnpm - read from node_modules directly
      await collectDependenciesFromPnpm(packageJson, allDependencies);
    } else {
      // No lock file - just create empty notices
      console.warn('Warning: No lock file found, creating minimal NOTICES.txt');
      await fs.writeFile(
        noticeFilePath,
        'This file contains third-party software notices and license terms.\n\n' +
          'No lock file found. Run pnpm install or npm install first.\n',
      );
      console.log(`NOTICES.txt generated at ${noticeFilePath}`);
      return;
    }

    const dependencyEntries = Array.from(allDependencies.entries());

    const licensePromises = dependencyEntries.map(([depName, depVersion]) =>
      getDependencyLicense(depName, depVersion),
    );

    const dependencyLicenses = await Promise.all(licensePromises);

    let noticeText =
      'This file contains third-party software notices and license terms.\n\n';

    for (const dep of dependencyLicenses) {
      noticeText +=
        '============================================================\n';
      noticeText += `${dep.name}@${dep.version}\n`;
      noticeText += `(${dep.repository})\n\n`;
      noticeText += `${dep.license}\n\n`;
    }

    await fs.writeFile(noticeFilePath, noticeText);
    console.log(`NOTICES.txt generated at ${noticeFilePath}`);
  } catch (error) {
    console.error('Error generating NOTICES.txt:', error);
    // Create a fallback empty notices file instead of failing
    try {
      await fs.writeFile(
        noticeFilePath,
        'This file contains third-party software notices and license terms.\n\n' +
          'Notices could not be generated automatically.\n',
      );
      console.log(`Fallback NOTICES.txt generated at ${noticeFilePath}`);
    } catch {
      process.exit(1);
    }
  }
}

main().catch(console.error);
