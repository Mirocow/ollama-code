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

    // For server-side, use empty mock for native modules that aren't available
    // For client-side, completely ignore these modules
    if (!isServer) {
      // Client-side: completely ignore native modules
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      nativeModules.forEach((mod) => {
        config.resolve.alias[mod] = false;
      });
    } else {
      // Server-side: mark as external to be resolved at runtime
      // This allows the modules to be loaded if available, or fail gracefully
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          ...nativeModules.map((mod) => ({
            [mod]: `commonjs ${mod}`,
          })),
        );
      }
    }

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
