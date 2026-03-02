import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Banner, Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: 'Ollama Code - AI Coding Assistant',
  description:
    'Open Source AI Coding Assistant for developers. Work with local AI models privately and securely.',
};

const banner = (
  <Banner storageKey="ollama-code-release">
    🎉 Ollama Code v0.11.0 is released! —{' '}
    <a href="./users/quickstart" style={{ color: '#fff', textDecoration: 'underline' }}>
      Get started →
    </a>
  </Banner>
);

const navbar = (
  <Navbar
    logo={
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🦙</span>
        <span style={{ fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Ollama Code
        </span>
      </div>
    }
    projectLink="https://github.com/mirocow/ollama-code"
  />
);

const footer = (
  <Footer>
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        Made with ❤️ by the Ollama Code Community
      </div>
      <div style={{ opacity: 0.7 }}>
        Apache 2.0 © {new Date().getFullYear()} Ollama Code Team
      </div>
    </div>
  </Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Ollama Code - AI Coding Assistant" />
        <meta
          property="og:description"
          content="Open Source AI Coding Assistant for developers. Work with local AI models privately."
        />
        <meta
          property="og:image"
          content="https://mirocow.github.io/ollama-code/og-image.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ollama Code - AI Coding Assistant" />
        <meta name="twitter:description" content="Open Source AI Coding Assistant for developers" />
        <link rel="icon" href="/ollama-code/favicon.png" type="image/png" />
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
          editLink="Edit this page on GitHub →"
          feedback={{ content: 'Question? Give us feedback →', labels: 'feedback' }}
          navigation={{
            prev: true,
            next: true,
          }}
          toc={{
            title: 'On This Page',
            scrollToTop: true,
          }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
