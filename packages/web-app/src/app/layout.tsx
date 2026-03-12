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
  description:
    'A powerful AI coding assistant with local LLM support through Ollama',
  keywords: ['ollama', 'ai', 'code', 'assistant', 'llm', 'local'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = 'dark';
                  var settings = localStorage.getItem('ollama-code-settings');
                  if (settings) {
                    var parsed = JSON.parse(settings);
                    if (parsed.theme) theme = parsed.theme;
                  }
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.toggle('dark', isDark);
                  document.documentElement.classList.toggle('light', !isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased dark">{children}</body>
    </html>
  );
}
