import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: 'Ollama Code - AI Coding Assistant',
  description: 'Open Source AI Coding Assistant for developers.',
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/ollama-code/favicon.png" type="image/png" />
      </head>
      <body>
        <Layout
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/mirocow/ollama-code"
          footer={<Footer>MIT © {new Date().getFullYear()}</Footer>}
          navbar={<Navbar logo={<span>🦙 Ollama Code</span>} />}
          sidebar={{ defaultMenuCollapseLevel: 2 }}
          search={false}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
