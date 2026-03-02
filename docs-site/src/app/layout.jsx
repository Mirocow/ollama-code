import 'nextra-theme-docs/style.css';

export const metadata = {
  title: 'Ollama Code - AI Coding Assistant',
  description:
    'Open Source AI Coding Assistant for developers. Work with local AI models privately and securely.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Ollama Code - AI Coding Assistant" />
        <meta
          property="og:description"
          content="Open Source AI Coding Assistant for developers"
        />
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
