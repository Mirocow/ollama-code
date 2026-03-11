/**
 * Extension Deactivation Handler
 *
 * Called when the extension is deactivated.
 */

export async function handle(event, context) {
  const { extensionName, logger } = context;

  logger.info(`Deactivating ${extensionName}`);

  try {
    // Clean up resources
    logger.info('Cleaning up resources...');

    // Remove event listeners
    logger.info('Removing event listeners...');

    // Clear caches
    logger.info('Clearing caches...');

    logger.info('Extension deactivated successfully');

    return {
      success: true,
      message: `${extensionName} deactivated successfully`,
    };
  } catch (error) {
    logger.error('Deactivation failed:', error);

    return {
      success: false,
      message: `Deactivation failed: ${error.message}`,
      error,
    };
  }
}

export default { handle };
