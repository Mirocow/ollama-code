/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';
/**
 * Defines the Zod schema for a Markdown command definition file.
 * The frontmatter contains optional metadata, and the body is the prompt.
 */
export declare const MarkdownCommandDefSchema: z.ZodObject<{
    frontmatter: z.ZodOptional<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
    }, {
        description?: string | undefined;
    }>>;
    prompt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    prompt: string;
    frontmatter?: {
        description?: string | undefined;
    } | undefined;
}, {
    prompt: string;
    frontmatter?: {
        description?: string | undefined;
    } | undefined;
}>;
export type MarkdownCommandDef = z.infer<typeof MarkdownCommandDefSchema>;
/**
 * Parses a Markdown command file with optional YAML frontmatter.
 * @param content The file content
 * @returns Parsed command definition with frontmatter and prompt
 */
export declare function parseMarkdownCommand(content: string): MarkdownCommandDef;
