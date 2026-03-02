export default {
  logo: (
    <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>
      <span style={{ marginRight: '0.5rem' }}>🦙</span>
      <span style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Ollama Code
      </span>
    </span>
  ),
  project: {
    link: 'https://github.com/mirocow/ollama-code',
  },
  docsRepositoryBase: 'https://github.com/mirocow/ollama-code/tree/main/docs-site/content',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Ollama Code'
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content="Ollama Code - AI Coding Assistant" />
      <meta property="og:description" content="Open Source AI Coding Assistant for developers. Work with local AI models privately." />
      <link rel="icon" href="/ollama-code/favicon.png" type="image/png" />
    </>
  ),
  primaryHue: 260,
  primarySaturation: 80,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  search: {
    placeholder: 'Search documentation...',
  },
  footer: {
    text: (
      <span>
        Apache 2.0 © {new Date().getFullYear()} Ollama Code Team
      </span>
    ),
  },
};
