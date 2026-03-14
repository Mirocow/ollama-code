/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type declarations for importing .md files as text
 * Used by esbuild with loader: { '.md': 'text' }
 */
declare module '*.md' {
  const content: string;
  export default content;
}
