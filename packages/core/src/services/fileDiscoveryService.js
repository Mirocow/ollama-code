/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GitIgnoreParser } from '../utils/gitIgnoreParser.js';
import { OllamaCodeIgnoreParser } from '../utils/ollamaIgnoreParser.js';
import { isGitRepository } from '../utils/gitUtils.js';
import * as path from 'node:path';
export class FileDiscoveryService {
    gitIgnoreFilter = null;
    ollamaCodeIgnoreFilter = null;
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
        if (isGitRepository(this.projectRoot)) {
            this.gitIgnoreFilter = new GitIgnoreParser(this.projectRoot);
        }
        this.ollamaCodeIgnoreFilter = new OllamaCodeIgnoreParser(this.projectRoot);
    }
    /**
     * Filters a list of file paths based on git ignore rules
     */
    filterFiles(filePaths, options = {
        respectGitIgnore: true,
        respectOllamaCodeIgnore: true,
    }) {
        return filePaths.filter((filePath) => {
            if (options.respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
                return false;
            }
            if (options.respectOllamaCodeIgnore &&
                this.shouldOllamaCodeIgnoreFile(filePath)) {
                return false;
            }
            return true;
        });
    }
    /**
     * Filters a list of file paths based on git ignore rules and returns a report
     * with counts of ignored files.
     */
    filterFilesWithReport(filePaths, opts = {
        respectGitIgnore: true,
        respectOllamaCodeIgnore: true,
    }) {
        const filteredPaths = [];
        let gitIgnoredCount = 0;
        let ollamaCodeIgnoredCount = 0;
        for (const filePath of filePaths) {
            if (opts.respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
                gitIgnoredCount++;
                continue;
            }
            if (opts.respectOllamaCodeIgnore &&
                this.shouldOllamaCodeIgnoreFile(filePath)) {
                ollamaCodeIgnoredCount++;
                continue;
            }
            filteredPaths.push(filePath);
        }
        return {
            filteredPaths,
            gitIgnoredCount,
            ollamaCodeIgnoredCount,
        };
    }
    /**
     * Checks if a single file should be git-ignored
     */
    shouldGitIgnoreFile(filePath) {
        if (this.gitIgnoreFilter) {
            return this.gitIgnoreFilter.isIgnored(filePath);
        }
        return false;
    }
    /**
     * Checks if a single file should be ollama-code-ignored
     */
    shouldOllamaCodeIgnoreFile(filePath) {
        if (this.ollamaCodeIgnoreFilter) {
            return this.ollamaCodeIgnoreFilter.isIgnored(filePath);
        }
        return false;
    }
    /**
     * Unified method to check if a file should be ignored based on filtering options
     */
    shouldIgnoreFile(filePath, options = {}) {
        const { respectGitIgnore = true, respectOllamaCodeIgnore = true, } = options;
        if (respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
            return true;
        }
        if (respectOllamaCodeIgnore && this.shouldOllamaCodeIgnoreFile(filePath)) {
            return true;
        }
        return false;
    }
    /**
     * Returns loaded patterns from .ollama-codeignore
     */
    getOllamaCodeIgnorePatterns() {
        return this.ollamaCodeIgnoreFilter?.getPatterns() ?? [];
    }
}
//# sourceMappingURL=fileDiscoveryService.js.map