/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { Box, Text } from 'ink';
import { DEFAULT_OLLAMA_MODEL } from '@ollama-code/ollama-code-core';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';

interface OllamaConfigInputProps {
  onSubmit: (config: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
  }) => Promise<void>;
  onCancel: () => void;
  defaultBaseUrl?: string;
  defaultModel?: string;
}

type InputField = 'baseUrl' | 'model' | 'apiKey';

/**
 * Check Ollama server connection and get available models
 */
async function checkOllamaConnection(
  baseUrl: string,
): Promise<{ success: boolean; models: string[]; error?: string }> {
  try {
    // Normalize URL - remove /v1 suffix if present
    const normalizedUrl = baseUrl.replace(/\/v1\/?$/, '');

    const response = await fetch(`${normalizedUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        models: [],
        error: `Server returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const models = (data.models || []).map((m) => m.name);

    return { success: true, models };
  } catch (err) {
    return {
      success: false,
      models: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function OllamaConfigInput({
  onSubmit,
  onCancel,
  defaultBaseUrl = 'http://localhost:11434',
  defaultModel,
}: OllamaConfigInputProps): React.JSX.Element {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [model, setModel] = useState(defaultModel || DEFAULT_OLLAMA_MODEL);
  const [apiKey, setApiKey] = useState('');
  const [currentField, setCurrentField] = useState<InputField>('baseUrl');
  const [currentValue, setCurrentValue] = useState(baseUrl);
  const [cursorPos, setCursorPos] = useState(baseUrl.length);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const fields: InputField[] = ['baseUrl', 'model', 'apiKey'];
  const fieldValues: Record<InputField, string> = {
    baseUrl,
    model,
    apiKey,
  };
  const fieldSetters: Record<InputField, (val: string) => void> = {
    baseUrl: setBaseUrl,
    model: setModel,
    apiKey: setApiKey,
  };

  // Check connection when baseUrl changes
  const checkConnection = async (url: string) => {
    setConnectionStatus(t('Checking connection...'));
    const result = await checkOllamaConnection(url);
    if (result.success) {
      if (result.models.length > 0) {
        setConnectionStatus(
          t('✓ Connected. Available models: {{models}}', {
            models:
              result.models.slice(0, 5).join(', ') +
              (result.models.length > 5 ? '...' : ''),
          }),
        );
      } else {
        setConnectionStatus(
          t(
            '✓ Connected. No models found. Pull a model first: ollama pull <model>',
          ),
        );
      }
    } else {
      setConnectionStatus(
        t('✗ Connection failed: {{error}}', {
          error: result.error || 'Unknown error',
        }),
      );
    }
  };

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onCancel();
        return;
      }

      // Handle paste (Ctrl+V)
      if (key.paste && key.sequence) {
        const newValue =
          currentValue.slice(0, cursorPos) +
          key.sequence +
          currentValue.slice(cursorPos);
        setCurrentValue(newValue);
        setCursorPos(cursorPos + key.sequence.length);
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        // Save current field value and move to next or submit
        fieldSetters[currentField](currentValue);

        const currentIndex = fields.indexOf(currentField);
        if (currentIndex === fields.length - 1) {
          // Last field, submit
          handleSubmit();
        } else {
          // Move to next field
          const nextField = fields[currentIndex + 1];
          setCurrentField(nextField);
          setCurrentValue(fieldValues[nextField]);
          setCursorPos(fieldValues[nextField].length);

          // Check connection when moving away from baseUrl
          if (currentField === 'baseUrl') {
            checkConnection(currentValue);
          }
        }
        return;
      }

      if (key.name === 'tab' || key.name === 'down') {
        // Save current and move to next
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const nextIndex = (currentIndex + 1) % fields.length;
        const nextField = fields[nextIndex];
        setCurrentField(nextField);
        setCurrentValue(fieldValues[nextField]);
        setCursorPos(fieldValues[nextField].length);

        // Check connection when moving away from baseUrl
        if (
          currentField === 'baseUrl' &&
          currentValue !== fieldValues[nextField]
        ) {
          checkConnection(currentValue);
        }
        return;
      }

      if (key.name === 'up') {
        // Save current and move to previous
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const prevIndex = (currentIndex - 1 + fields.length) % fields.length;
        const prevField = fields[prevIndex];
        setCurrentField(prevField);
        setCurrentValue(fieldValues[prevField]);
        setCursorPos(fieldValues[prevField].length);
        return;
      }

      // Cursor navigation
      if (key.name === 'left') {
        if (cursorPos > 0) {
          setCursorPos(cursorPos - 1);
        }
        return;
      }

      if (key.name === 'right') {
        if (cursorPos < currentValue.length) {
          setCursorPos(cursorPos + 1);
        }
        return;
      }

      if (key.name === 'home' || (key.ctrl && key.name === 'a')) {
        setCursorPos(0);
        return;
      }

      if (key.name === 'end' || (key.ctrl && key.name === 'e')) {
        setCursorPos(currentValue.length);
        return;
      }

      if (key.name === 'backspace') {
        if (cursorPos > 0) {
          const newValue =
            currentValue.slice(0, cursorPos - 1) +
            currentValue.slice(cursorPos);
          setCurrentValue(newValue);
          setCursorPos(cursorPos - 1);
        }
        return;
      }

      if (key.name === 'delete') {
        if (cursorPos < currentValue.length) {
          const newValue =
            currentValue.slice(0, cursorPos) +
            currentValue.slice(cursorPos + 1);
          setCurrentValue(newValue);
        }
        return;
      }

      // Regular character input
      if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
        const newValue =
          currentValue.slice(0, cursorPos) +
          key.sequence +
          currentValue.slice(cursorPos);
        setCurrentValue(newValue);
        setCursorPos(cursorPos + 1);
      }
    },
    { isActive: !isSubmitting },
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setError(null);

    const finalBaseUrl = currentField === 'baseUrl' ? currentValue : baseUrl;
    const finalModel = currentField === 'model' ? currentValue : model;
    const finalApiKey = currentField === 'apiKey' ? currentValue : apiKey;

    // Validate baseUrl
    if (!finalBaseUrl.trim()) {
      setError(t('Base URL is required'));
      return;
    }

    // Validate model
    if (!finalModel.trim()) {
      setError(t('Model name is required'));
      return;
    }

    setIsSubmitting(true);
    setConnectionStatus(t('Connecting to Ollama...'));

    // Check connection before submitting
    const result = await checkOllamaConnection(finalBaseUrl);
    if (!result.success) {
      setError(
        t('Cannot connect to Ollama: {{error}}', {
          error: result.error || 'Unknown error',
        }),
      );
      setConnectionStatus(null);
      setIsSubmitting(false);
      return;
    }

    // Check if model exists (warn but allow to proceed)
    const modelBaseName = finalModel.split(':')[0]; // Remove :tag if present
    const modelExists = result.models.some(
      (m) => m === finalModel || m.startsWith(`${modelBaseName}:`),
    );

    if (!modelExists && result.models.length > 0) {
      setError(
        t(
          'Model "{{model}}" not found. Available: {{models}}. Run "ollama pull {{model}}" to download.',
          { model: finalModel, models: result.models.slice(0, 5).join(', ') },
        ),
      );
      setConnectionStatus(null);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        baseUrl: finalBaseUrl.trim(),
        model: finalModel.trim(),
        apiKey: finalApiKey.trim() || undefined,
      });
    } catch (err) {
      setError(t('Failed to configure: {{message}}', { message: String(err) }));
      setIsSubmitting(false);
    }
  };

  const renderField = (
    _field: InputField,
    label: string,
    value: string,
    isCurrent: boolean,
    placeholder: string,
    cursorPosition: number,
  ) => {
    let displayValue: string;
    if (isCurrent) {
      const beforeCursor = value.slice(0, cursorPosition);
      const afterCursor = value.slice(cursorPosition);
      displayValue = `${beforeCursor}█${afterCursor}`;
    } else {
      displayValue = value || placeholder;
    }

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text
            bold={isCurrent}
            color={isCurrent ? theme.text.accent : theme.text.secondary}
          >
            {label}
          </Text>
        </Box>
        <Box
          borderStyle="round"
          borderColor={isCurrent ? theme.text.accent : theme.border.default}
          paddingX={1}
        >
          <Text color={isCurrent ? theme.text.primary : theme.text.secondary}>
            {displayValue}
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>{t('Configure Ollama Connection')}</Text>
      </Box>

      {renderField(
        'baseUrl',
        t('Server URL'),
        currentField === 'baseUrl' ? currentValue : baseUrl,
        currentField === 'baseUrl',
        'http://localhost:11434',
        currentField === 'baseUrl' ? cursorPos : baseUrl.length,
      )}

      {renderField(
        'model',
        t('Model'),
        currentField === 'model' ? currentValue : model,
        currentField === 'model',
        DEFAULT_OLLAMA_MODEL,
        currentField === 'model' ? cursorPos : model.length,
      )}

      {renderField(
        'apiKey',
        t('API Key (optional)'),
        currentField === 'apiKey' ? currentValue : apiKey,
        currentField === 'apiKey',
        '',
        currentField === 'apiKey' ? cursorPos : apiKey.length,
      )}

      {connectionStatus && (
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>{connectionStatus}</Text>
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color={theme.status.error}>{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.text.secondary} dimColor>
          {t('←→: move • Tab/↑↓: switch • Enter: confirm • Esc: cancel')}
        </Text>
      </Box>

      {isSubmitting && (
        <Box marginTop={1}>
          <Text color={theme.text.accent}>{t('Saving configuration...')}</Text>
        </Box>
      )}
    </Box>
  );
}
