import nextra from 'nextra';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repoName = process.env.REPO_NAME || 'ollama-code';

const withNextra = nextra({
  defaultShowCopyCode: true,
  theme: 'nextra-theme-docs',
  themeConfig: './src/app/layout.jsx',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  basePath: isGitHubPages ? `/${repoName}` : '',
  images: isGitHubPages ? { unoptimized: true } : undefined,
  trailingSlash: true,
};

export default withNextra(nextConfig);
