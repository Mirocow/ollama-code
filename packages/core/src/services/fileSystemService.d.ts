/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Supported file encodings for new files.
 */
export declare const FileEncoding: {
    readonly UTF8: "utf-8";
    readonly UTF8_BOM: "utf-8-bom";
};
/**
 * Type for file encoding values.
 */
export type FileEncodingType = (typeof FileEncoding)[keyof typeof FileEncoding];
/**
 * Interface for file system operations that may be delegated to different implementations
 */
export interface FileSystemService {
    /**
     * Read text content from a file
     *
     * @param filePath - The path to the file to read
     * @returns The file content as a string
     */
    readTextFile(filePath: string): Promise<string>;
    /**
     * Write text content to a file
     *
     * @param filePath - The path to the file to write
     * @param content - The content to write
     * @param options - Optional write options including whether to add BOM
     */
    writeTextFile(filePath: string, content: string, options?: WriteTextFileOptions): Promise<void>;
    /**
     * Detects if a file has UTF-8 BOM (Byte Order Mark).
     *
     * @param filePath - The path to the file to check
     * @returns True if the file has BOM, false otherwise
     */
    detectFileBOM(filePath: string): Promise<boolean>;
    /**
     * Finds files with a given name within specified search paths.
     *
     * @param fileName - The name of the file to find.
     * @param searchPaths - An array of directory paths to search within.
     * @returns An array of absolute paths to the found files.
     */
    findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
/**
 * Options for writing text files
 */
export interface WriteTextFileOptions {
    /**
     * Whether to write the file with UTF-8 BOM.
     * If true, EF BB BF will be prepended to the content.
     * @default false
     */
    bom?: boolean;
}
/**
 * Standard file system implementation
 */
export declare class StandardFileSystemService implements FileSystemService {
    readTextFile(filePath: string): Promise<string>;
    writeTextFile(filePath: string, content: string, options?: WriteTextFileOptions): Promise<void>;
    detectFileBOM(filePath: string): Promise<boolean>;
    findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
