/**
 * Sample Tool Handler
 *
 * This is an example tool handler that demonstrates the ExtensionToolHandler interface.
 * It processes a message and returns it with additional context.
 */

/**
 * Executes the sample tool with the given parameters.
 *
 * @param {Object} params - The validated tool parameters
 * @param {string} params.message - The message to process
 * @param {boolean} [params.uppercase=false] - Whether to convert to uppercase
 * @param {number} [params.repeat=1] - Number of times to repeat
 * @param {Object} context - The execution context
 * @returns {Promise<Object>} The tool result
 */
export async function execute(params, context) {
  const { message, uppercase = false, repeat = 1 } = params;
  const { extensionVersion, logger } = context;

  // Log the execution
  logger?.info('Executing sample tool', {
    message: message.substring(0, 50),
    uppercase,
    repeat,
  });

  // Process the message
  let processedMessage = message;

  if (uppercase) {
    processedMessage = processedMessage.toUpperCase();
  }

  // Build result with repetition
  const result = Array(repeat).fill(processedMessage).join('\n');

  // Build the response
  const response = {
    originalMessage: message,
    processedMessage: result,
    metadata: {
      processedAt: new Date().toISOString(),
      extensionVersion,
      transformed: uppercase,
      repetitions: repeat,
      characterCount: result.length,
    },
  };

  return {
    llmContent: JSON.stringify(response, null, 2),
    returnDisplay: `Processed message: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}" (${uppercase ? 'UPPERCASE' : 'original'}, repeated ${repeat}x)`,
  };
}

/**
 * Validates the tool parameters before execution.
 *
 * @param {Object} params - The raw parameters to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validate(params) {
  if (!params.message) {
    return 'Message parameter is required';
  }

  if (typeof params.message !== 'string') {
    return 'Message must be a string';
  }

  if (params.message.length > 10000) {
    return 'Message is too long (max 10000 characters)';
  }

  if (params.repeat !== undefined) {
    if (
      typeof params.repeat !== 'number' ||
      params.repeat < 1 ||
      params.repeat > 10
    ) {
      return 'Repeat must be a number between 1 and 10';
    }
  }

  return null;
}

/**
 * Returns a description of what the tool will do.
 *
 * @param {Object} params - The tool parameters
 * @returns {string} Markdown description
 */
export function getDescription(params) {
  const { message, uppercase, repeat } = params;
  const transform = uppercase ? 'convert to uppercase' : 'keep original case';
  const repeatText = repeat > 1 ? `repeated ${repeat} times` : '';

  return `Process message: "${message.substring(0, 50)}..." - ${transform} ${repeatText}`.trim();
}

export default {
  execute,
  validate,
  getDescription,
};
