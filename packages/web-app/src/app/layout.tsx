/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Metadata } from 'next';
import './globals.css';
import '@ollama-code/webui/styles.css';

export const metadata: Metadata = {
  title: 'Ollama Code - AI-Powered Code Assistant',
  description: 'A powerful AI coding assistant with local LLM support through Ollama',
  keywords: ['ollama', 'ai', 'code', 'assistant', 'llm', 'local'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased dark">
        {children}
      </body>
    </html>
  );
}
