import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Banner, Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: 'Ollama Code - AI Coding Assistant',
  description:
    'Open Source AI Coding Assistant for developers. Work with local AI models privately.',
};

const banner = (
  <Banner storageKey="ollama-code-release">
    Ollama Code v0.11.0 is released! 🚀
  </Banner>
);

const navbar = (
  <Navbar
    logo={<b>🦙 Ollama Code</b>}
    projectLink="https://github.com/mirocow/ollama-code"
  />
);

const footer = (
  <Footer>Apache 2.0 {new Date().getFullYear()} © Ollama Code Team.</Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Ollama Code - AI Coding Assistant" />
        <meta
          property="og:description"
          content="Open Source AI Coding Assistant for developers"
        />
        <meta
          property="og:image"
          content="https://mirocow.github.io/ollama-code/og-image.png"
        />
      </Head>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/mirocow/ollama-code/tree/main/docs"
          sidebar={{ defaultMenuCollapseLevel: 9999 }}
          footer={footer}
          search={false}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
