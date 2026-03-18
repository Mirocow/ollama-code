/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@ollama-code/webui', '@ollama-code/ollama-code-core'],

  // Disable TypeScript checking during build (handled separately)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Experimental features
  experimental: {
    // Enable Server Actions for future use
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Server external packages - native modules that should not be bundled
  serverExternalPackages: [
    'keytar',
    'node-pty',
    '@lydell/node-pty',
    '@lydell/node-pty-darwin-x64',
    '@lydell/node-pty-darwin-arm64',
    '@lydell/node-pty-linux-x64',
    '@lydell/node-pty-win32-x64',
    '@lydell/node-pty-win32-arm64',
  ],

  // Webpack configuration for handling ESM modules and native modules
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };

    // Exclude native modules from the bundle
    // These modules should only be used on the server side
    const nativeModules = [
      'node-pty',
      '@lydell/node-pty',
      '@lydell/node-pty-darwin-x64',
      '@lydell/node-pty-darwin-arm64',
      '@lydell/node-pty-linux-x64',
      '@lydell/node-pty-win32-x64',
      '@lydell/node-pty-win32-arm64',
      'keytar',
    ];

    // Completely ignore native modules via alias (both client and server)
    // Setting to false tells webpack to return an empty module
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    nativeModules.forEach((mod) => {
      config.resolve.alias[mod] = false;
    });

    return config;
  },

  // Disable Turbopack for production builds due to native module issues
  // Turbopack doesn't support native Node.js modules
  // Set empty config to indicate we're intentionally using webpack
  turbopack: {},

  // Allow cross-origin requests in development
  allowedDevOrigins: ['localhost', '.z.ai', 'chat.z.ai'],
};

export default nextConfig;
