/**
 * Extension Uninstallation Handler
 *
 * Called before the extension is uninstalled.
 */

export async function handle(event, context) {
  const { extensionName, logger } = context;

  logger.info(`Uninstalling ${extensionName}`);

  try {
    // Example: Clean up resources
    logger.info('Cleaning up extension resources...');

    // Example: Remove created files/directories
    logger.info('Removing extension files...');

    // Example: Notify dependent extensions
    logger.info('Checking for dependent extensions...');

    // Example: Export user data if needed
    logger.info('Exporting user data...');

    logger.info('Extension uninstalled successfully');

    return {
      success: true,
      message: `${extensionName} uninstalled successfully`,
    };
  } catch (error) {
    logger.error('Uninstallation failed:', error);

    return {
      success: false,
      message: `Uninstallation failed: ${error.message}`,
      error,
    };
  }
}

export default { handle };
