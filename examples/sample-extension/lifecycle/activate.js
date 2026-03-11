/**
 * Extension Activation Handler
 *
 * Called when the extension is activated.
 */

export async function handle(event, context) {
  const { extensionName, extensionVersion, logger, config } = context;

  logger.info(`Activating ${extensionName} v${extensionVersion}`);
  logger.debug('Configuration:', config);

  // Perform activation tasks
  try {
    // Example: Initialize resources
    logger.info('Initializing extension resources...');

    // Example: Register event listeners
    logger.info('Registering event listeners...');

    // Example: Validate configuration
    if (config.api_key) {
      logger.info('API key configured, validating...');
      // Validate API key here
    }

    logger.info('Extension activated successfully');

    return {
      success: true,
      message: `${extensionName} v${extensionVersion} activated successfully`,
    };
  } catch (error) {
    logger.error('Activation failed:', error);

    return {
      success: false,
      message: `Activation failed: ${error.message}`,
      error,
    };
  }
}

export default { handle };
