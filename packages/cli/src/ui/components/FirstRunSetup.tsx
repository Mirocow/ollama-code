/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';

interface FirstRunSetupProps {
  onSubmit: (config: {
    baseUrl: string;
    model: string;
  }) => Promise<void>;
  onCancel: () => void;
}

type InputField = 'baseUrl' | 'model';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

export function FirstRunSetup({
  onSubmit,
  onCancel,
}: FirstRunSetupProps): React.JSX.Element {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [currentField, setCurrentField] = useState<InputField>('baseUrl');
  const [currentValue, setCurrentValue] = useState(baseUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields: InputField[] = ['baseUrl', 'model'];
  const fieldValues: Record<InputField, string> = {
    baseUrl,
    model,
  };
  const fieldSetters: Record<InputField, (val: string) => void> = {
    baseUrl: setBaseUrl,
    model: setModel,
  };

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onCancel();
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
          setCurrentField(fields[currentIndex + 1]);
          setCurrentValue(fieldValues[fields[currentIndex + 1]]);
        }
      }

      if (key.name === 'tab' || key.name === 'down') {
        // Save current and move to next
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const nextIndex = (currentIndex + 1) % fields.length;
        setCurrentField(fields[nextIndex]);
        setCurrentValue(fieldValues[fields[nextIndex]]);
      }

      if (key.name === 'up') {
        // Save current and move to previous
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const prevIndex = (currentIndex - 1 + fields.length) % fields.length;
        setCurrentField(fields[prevIndex]);
        setCurrentValue(fieldValues[fields[prevIndex]]);
      }

      if (key.name === 'backspace') {
        setCurrentValue(currentValue.slice(0, -1));
      } else if (key.name === 'delete') {
        setCurrentValue('');
      } else if (key.sequence && key.sequence.length === 1) {
        setCurrentValue(currentValue + key.sequence);
      }
    },
    { isActive: !isSubmitting },
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setError(null);

    const finalBaseUrl = currentField === 'baseUrl' ? currentValue : baseUrl;
    const finalModel = currentField === 'model' ? currentValue : model;

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
    try {
      await onSubmit({
        baseUrl: finalBaseUrl.trim(),
        model: finalModel.trim(),
      });
    } catch (err) {
      setError(t('Failed to configure: {{message}}', { message: String(err) }));
      setIsSubmitting(false);
    }
  };

  const renderField = (
    field: InputField,
    label: string,
    value: string,
    isCurrent: boolean,
    placeholder?: string,
    helpText?: string,
  ) => (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text
          bold={isCurrent}
          color={isCurrent ? theme.text.accent : theme.text.secondary}
        >
          {isCurrent ? '❯ ' : '  '}
          {label}
          {': '}
        </Text>
        <Text color={theme.text.primary}>
          {isCurrent ? `${value}|` : (value || placeholder)}
        </Text>
      </Box>
      {helpText && isCurrent && (
        <Box paddingLeft={2}>
          <Text color={theme.text.secondary} dimColor>
            {helpText}
          </Text>
        </Box>
      )}
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={theme.text.accent}>
          {t('Welcome to Ollama Code!')}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.text.secondary}>
          {t('First-time setup: Configure your Ollama connection')}
        </Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor={theme.border.default} padding={1}>
        <Box marginBottom={1}>
          <Text bold>{t('Configure Ollama Connection')}</Text>
        </Box>

        {renderField(
          'baseUrl',
          t('Server URL (OLLAMA_HOST)'),
          currentField === 'baseUrl' ? currentValue : baseUrl,
          currentField === 'baseUrl',
          DEFAULT_BASE_URL,
          t('Ollama server URL (default: http://localhost:11434)'),
        )}

        {renderField(
          'model',
          t('Model (OLLAMA_MODEL)'),
          currentField === 'model' ? currentValue : model,
          currentField === 'model',
          DEFAULT_MODEL,
          t('Model to use (e.g., llama3.2, codellama, mistral)'),
        )}

        {error && (
          <Box marginTop={1}>
            <Text color={theme.status.error}>{error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color={theme.text.secondary} dimColor>
            {t('Use Tab/↑↓ to navigate, Enter to submit, Esc to cancel')}
          </Text>
        </Box>

        {isSubmitting && (
          <Box marginTop={1}>
            <Text color={theme.text.accent}>{t('Saving configuration...')}</Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.text.secondary} dimColor>
          {t('Make sure Ollama is installed and running. Visit: https://ollama.ai')}
        </Text>
      </Box>
    </Box>
  );
}
