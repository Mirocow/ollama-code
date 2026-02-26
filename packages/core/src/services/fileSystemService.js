/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs/promises';
import * as path from 'node:path';
import { globSync } from 'glob';
/**
 * Supported file encodings for new files.
 */
export const FileEncoding = {
    UTF8: 'utf-8',
    UTF8_BOM: 'utf-8-bom',
};
/**
 * Detects if a buffer has UTF-8 BOM (Byte Order Mark).
 * UTF-8 BOM is the byte sequence EF BB BF.
 *
 * @param buffer - The buffer to check
 * @returns True if the buffer starts with UTF-8 BOM
 */
function hasUTF8BOM(buffer) {
    return (buffer.length >= 3 &&
        buffer[0] === 0xef &&
        buffer[1] === 0xbb &&
        buffer[2] === 0xbf);
}
/**
 * Standard file system implementation
 */
export class StandardFileSystemService {
    async readTextFile(filePath) {
        return fs.readFile(filePath, FileEncoding.UTF8);
    }
    async writeTextFile(filePath, content, options) {
        const bom = options?.bom ?? false;
        if (bom) {
            // Prepend UTF-8 BOM (EF BB BF)
            // If content already starts with BOM character, strip it first to avoid double BOM
            const normalizedContent = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
            const bomBuffer = Buffer.from([0xef, 0xbb, 0xbf]);
            const contentBuffer = Buffer.from(normalizedContent, 'utf-8');
            await fs.writeFile(filePath, Buffer.concat([bomBuffer, contentBuffer]));
        }
        else {
            await fs.writeFile(filePath, content, 'utf-8');
        }
    }
    async detectFileBOM(filePath) {
        let fd;
        try {
            // Read only the first 3 bytes to check for BOM
            fd = await fs.open(filePath, 'r');
            const buffer = Buffer.alloc(3);
            const { bytesRead } = await fd.read(buffer, 0, 3, 0);
            if (bytesRead < 3) {
                return false;
            }
            return hasUTF8BOM(buffer);
        }
        catch {
            // File doesn't exist or can't be read - treat as no BOM
            return false;
        }
        finally {
            await fd?.close();
        }
    }
    findFiles(fileName, searchPaths) {
        return searchPaths.flatMap((searchPath) => {
            const pattern = path.posix.join(searchPath, '**', fileName);
            return globSync(pattern, {
                nodir: true,
                absolute: true,
            });
        });
    }
}
//# sourceMappingURL=fileSystemService.js.map