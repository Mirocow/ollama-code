/**
 * Extension Installation Handler
 *
 * Called after the extension is installed.
 */

export async function handle(event, context) {
  const { extensionName, extensionVersion, extensionPath, logger, config } =
    context;

  logger.info(`Installing ${extensionName} v${extensionVersion}`);
  logger.debug('Installation path:', extensionPath);

  try {
    // Example: Create necessary directories
    logger.info('Creating extension directories...');

    // Example: Check for dependencies
    logger.info('Checking dependencies...');

    // Example: Prompt for initial configuration
    if (!config.api_key) {
      logger.warn('API key not configured. Some features may not work.');
    }

    // Example: Run migrations if updating
    logger.info('Running setup tasks...');

    logger.info('Extension installed successfully');

    return {
      success: true,
      message: `${extensionName} v${extensionVersion} installed successfully`,
    };
  } catch (error) {
    logger.error('Installation failed:', error);

    return {
      success: false,
      message: `Installation failed: ${error.message}`,
      error,
    };
  }
}

export default { handle };
