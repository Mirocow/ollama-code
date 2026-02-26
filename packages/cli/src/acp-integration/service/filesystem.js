/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ACP_ERROR_CODES } from '../errorCodes.js';
/**
 * ACP client-based implementation of FileSystemService
 */
export class AcpFileSystemService {
    client;
    sessionId;
    capabilities;
    fallback;
    constructor(client, sessionId, capabilities, fallback) {
        this.client = client;
        this.sessionId = sessionId;
        this.capabilities = capabilities;
        this.fallback = fallback;
    }
    async readTextFile(filePath) {
        if (!this.capabilities.readTextFile) {
            return this.fallback.readTextFile(filePath);
        }
        let response;
        try {
            response = await this.client.readTextFile({
                path: filePath,
                sessionId: this.sessionId,
                line: null,
                limit: null,
            });
        }
        catch (error) {
            const errorCode = typeof error === 'object' && error !== null && 'code' in error
                ? error.code
                : undefined;
            if (errorCode === ACP_ERROR_CODES.RESOURCE_NOT_FOUND) {
                const err = new Error(`File not found: ${filePath}`);
                err.code = 'ENOENT';
                err.errno = -2;
                err.path = filePath;
                throw err;
            }
            throw error;
        }
        return response.content;
    }
    async writeTextFile(filePath, content, options) {
        if (!this.capabilities.writeTextFile) {
            return this.fallback.writeTextFile(filePath, content, options);
        }
        // Prepend BOM character if requested
        const finalContent = options?.bom ? '\uFEFF' + content : content;
        await this.client.writeTextFile({
            path: filePath,
            content: finalContent,
            sessionId: this.sessionId,
        });
    }
    async detectFileBOM(filePath) {
        // Try to detect BOM through ACP client first by reading first line
        if (this.capabilities.readTextFile) {
            try {
                const response = await this.client.readTextFile({
                    path: filePath,
                    sessionId: this.sessionId,
                    line: null,
                    limit: 1,
                });
                // Check if content starts with BOM character (U+FEFF)
                // Use codePointAt for better Unicode support and check content length first
                return (response.content.length > 0 &&
                    response.content.codePointAt(0) === 0xfeff);
            }
            catch {
                // Fall through to fallback if ACP read fails
            }
        }
        // Fall back to local filesystem detection
        return this.fallback.detectFileBOM(filePath);
    }
    findFiles(fileName, searchPaths) {
        return this.fallback.findFiles(fileName, searchPaths);
    }
}
//# sourceMappingURL=filesystem.js.map