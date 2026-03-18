/**
 * Mock for native modules that may not be available during build or in web-app context
 *
 * This mock provides empty implementations for:
 * - keytar (secure credential storage)
 * - node-pty (pseudo-terminal)
 *
 * These modules are only needed in the CLI context and should not be
 * loaded during Next.js build or in the web-app runtime.
 */

// keytar mock - all methods return empty/null values
const keytarMock = {
  getPassword: async () => null,
  setPassword: async () => {},
  deletePassword: async () => false,
  findCredentials: async () => [],
};

// node-pty mock
const ptyMock = {
  spawn: () => {
    throw new Error('node-pty is not available in web-app context');
  },
};

// Default export for keytar (most common usage)
export default keytarMock;

// Named exports for compatibility
export const getPassword = keytarMock.getPassword;
export const setPassword = keytarMock.setPassword;
export const deletePassword = keytarMock.deletePassword;
export const findCredentials = keytarMock.findCredentials;

// For node-pty compatibility
export const spawn = ptyMock.spawn;
