/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getFolderStructure } from './getFolderStructure.js';
/**
 * Generates a string describing the current workspace directories and their structures.
 * @param {Config} config - The runtime configuration and services.
 * @returns {Promise<string>} A promise that resolves to the directory context string.
 */
export async function getDirectoryContextString(config) {
    const workspaceContext = config.getWorkspaceContext();
    const workspaceDirectories = workspaceContext.getDirectories();
    const folderStructures = await Promise.all(workspaceDirectories.map((dir) => getFolderStructure(dir, {
        fileService: config.getFileService(),
    })));
    const folderStructure = folderStructures.join('\n');
    let workingDirPreamble;
    if (workspaceDirectories.length === 1) {
        workingDirPreamble = `I'm currently working in the directory: ${workspaceDirectories[0]}`;
    }
    else {
        const dirList = workspaceDirectories.map((dir) => `  - ${dir}`).join('\n');
        workingDirPreamble = `I'm currently working in the following directories:\n${dirList}`;
    }
    return `${workingDirPreamble}
Here is the folder structure of the current working directories:

${folderStructure}`;
}
/**
 * Retrieves environment-related information to be included in the chat context.
 * This includes the current working directory, date, operating system, and folder structure.
 * @param {Config} config - The runtime configuration and services.
 * @returns A promise that resolves to an array of `Part` objects containing environment information.
 */
export async function getEnvironmentContext(config) {
    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const platform = process.platform;
    const directoryContext = await getDirectoryContextString(config);
    const context = `
This is the Qwen Code. We are setting up the context for our chat.
Today's date is ${today} (formatted according to the user's locale).
My operating system is: ${platform}
${directoryContext}
        `.trim();
    return [{ text: context }];
}
export async function getInitialChatHistory(config, extraHistory) {
    if (config.getSkipStartupContext()) {
        return extraHistory ? [...extraHistory] : [];
    }
    const envParts = await getEnvironmentContext(config);
    const envContextString = envParts.map((part) => part.text || '').join('\n\n');
    return [
        {
            role: 'user',
            parts: [{ text: envContextString }],
        },
        {
            role: 'model',
            parts: [{ text: 'Got it. Thanks for the context!' }],
        },
        ...(extraHistory ?? []),
    ];
}
//# sourceMappingURL=environmentContext.js.map